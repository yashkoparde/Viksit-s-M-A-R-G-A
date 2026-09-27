package com.mplads.geotrack.utils

import android.annotation.SuppressLint
import android.content.Context
import android.location.Address
import android.location.Geocoder
import android.location.Location
import android.location.LocationManager
import android.os.Build
import android.os.Looper
import com.google.android.gms.location.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import kotlin.coroutines.resume

data class LocationData(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
    val altitude: Double? = null,
    val placeName: String = "Locating..."
)

sealed class LocationState {
    object Waiting : LocationState()
    data class Locked(val data: LocationData) : LocationState()
    object PermissionDenied : LocationState()
    object ServiceDisabled : LocationState()
}

class LocationHelper(private val context: Context) {
    private val fusedLocationClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)

    @SuppressLint("MissingPermission")
    fun getLocationFlow(): Flow<LocationState> = callbackFlow {
        // 1. Immediately check last known location for fast startup lock
        fusedLocationClient.lastLocation.addOnSuccessListener { loc ->
            if (loc != null) {
                trySend(
                    LocationState.Locked(
                        LocationData(
                            latitude = loc.latitude,
                            longitude = loc.longitude,
                            accuracy = loc.accuracy,
                            altitude = loc.altitude,
                            placeName = "Locating..."
                        )
                    )
                )
            } else {
                // Check Android LocationManager last known location
                val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
                val gpsLoc = locationManager?.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                val netLoc = locationManager?.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
                val bestLoc = gpsLoc ?: netLoc

                if (bestLoc != null) {
                    trySend(
                        LocationState.Locked(
                            LocationData(
                                latitude = bestLoc.latitude,
                                longitude = bestLoc.longitude,
                                accuracy = bestLoc.accuracy,
                                altitude = bestLoc.altitude,
                                placeName = "Locating..."
                            )
                        )
                    )
                }
            }
        }

        // 2. Request high accuracy continuous updates
        val locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY, 2000L
        ).apply {
            setMinUpdateIntervalMillis(1000L)
            setWaitForAccurateLocation(false)
        }.build()

        val locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                for (location in result.locations) {
                    trySend(
                        LocationState.Locked(
                            LocationData(
                                latitude = location.latitude,
                                longitude = location.longitude,
                                accuracy = location.accuracy,
                                altitude = location.altitude,
                                placeName = "Locating..."
                            )
                        )
                    )
                }
            }
        }

        try {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                Looper.getMainLooper()
            )
        } catch (e: SecurityException) {
            trySend(LocationState.PermissionDenied)
        } catch (e: Exception) {
            trySend(LocationState.ServiceDisabled)
        }

        awaitClose {
            fusedLocationClient.removeLocationUpdates(locationCallback)
        }
    }

    suspend fun resolvePlaceName(latitude: Double, longitude: Double): String =
        withContext(Dispatchers.IO) {
            try {
                if (Geocoder.isPresent()) {
                    val geocoder = Geocoder(context, Locale.getDefault())

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        val placeFromCallback = suspendCancellableCoroutine<String?> { continuation ->
                            try {
                                geocoder.getFromLocation(latitude, longitude, 1) { addresses ->
                                    if (addresses.isNotEmpty() && continuation.isActive) {
                                        continuation.resume(formatAddress(addresses[0]))
                                    } else if (continuation.isActive) {
                                        continuation.resume(null)
                                    }
                                }
                            } catch (e: Exception) {
                                if (continuation.isActive) continuation.resume(null)
                            }
                        }

                        if (!placeFromCallback.isNull_or_empty()) {
                            return@withContext placeFromCallback!!
                        }
                    } else {
                        @Suppress("DEPRECATION")
                        val addresses = geocoder.getFromLocation(latitude, longitude, 1)
                        if (!addresses.isNullOrEmpty()) {
                            val place = formatAddress(addresses[0])
                            if (!place.isNull_or_empty()) return@withContext place
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }

            // Fallback HTTP reverse geocoding
            fetchOnlinePlaceName(latitude, longitude)
        }

    private fun fetchOnlinePlaceName(latitude: Double, longitude: Double): String {
        return try {
            val urlStr = "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=$latitude&longitude=$longitude&localityLanguage=en"
            val url = URL(urlStr)
            val connection = url.openConnection() as HttpURLConnection
            connection.connectTimeout = 3000
            connection.readTimeout = 3000
            connection.requestMethod = "GET"

            if (connection.responseCode == 200) {
                val reader = BufferedReader(InputStreamReader(connection.inputStream))
                val jsonText = reader.readText()
                reader.close()

                val locality = extractJsonValue(jsonText, "locality")
                    ?: extractJsonValue(jsonText, "city")
                val state = extractJsonValue(jsonText, "principalSubdivision")

                val parts = mutableListOf<String>()
                if (!locality.isNullOrEmpty()) parts.add(locality)
                if (!state.isNullOrEmpty() && !parts.contains(state)) parts.add(state)

                if (parts.isNotEmpty()) return parts.joinToString(", ")
            }
            String.format(Locale.US, "Lat %.4f°, Lon %.4f°", latitude, longitude)
        } catch (e: Exception) {
            String.format(Locale.US, "Lat %.4f°, Lon %.4f°", latitude, longitude)
        }
    }

    private fun extractJsonValue(json: String, key: String): String? {
        val pattern = "\"$key\":\\s*\"([^\"]+)\"".toRegex()
        val match = pattern.find(json)
        return match?.groupValues?.get(1)
    }

    private fun formatAddress(address: Address): String {
        val parts = mutableListOf<String>()

        val feature = address.featureName ?: address.thoroughfare ?: address.subLocality
        val locality = address.locality ?: address.subAdminArea
        val adminArea = address.adminArea

        if (!feature.isNullOrBlank() && feature != locality) parts.add(feature)
        if (!locality.isNullOrBlank()) parts.add(locality)
        if (!adminArea.isNullOrBlank() && !parts.contains(adminArea)) parts.add(adminArea)

        return if (parts.isNotEmpty()) parts.joinToString(", ") else ""
    }

    private fun String?.isNull_or_empty(): Boolean {
        return this == null || this.trim().isEmpty()
    }
}
