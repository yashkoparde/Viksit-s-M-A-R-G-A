package com.mplads.geotrack.data.model

import android.net.Uri
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "geo_photos")
data class GeoPhoto(
    @PrimaryKey
    val id: String,
    val imageUrl: String,
    val rawImageUrl: String,
    val watermarkedImageUrl: String? = null,
    val hasVisibleOverlay: Boolean = true,
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
    val altitude: Double? = null,
    val placeName: String? = null,
    val workerName: String? = null,
    val workId: String? = null,
    val description: String? = null,
    val dateFormatted: String,
    val timeFormatted: String,
    val capturedAt: String // ISO 8601 timestamp
)

data class CapturedPhotoData(
    val imageUri: Uri,
    val imageUrl: String,
    val hasVisibleOverlay: Boolean,
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
    val placeName: String?,
    val workerName: String?,
    val workId: String?,
    val description: String?,
    val dateFormatted: String,
    val timeFormatted: String,
    val capturedAt: String
)
