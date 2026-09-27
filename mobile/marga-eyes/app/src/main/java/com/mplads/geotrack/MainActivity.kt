package com.mplads.geotrack

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.mplads.geotrack.data.local.AppDatabase
import com.mplads.geotrack.data.model.CapturedPhotoData
import com.mplads.geotrack.data.model.GeoPhoto
import com.mplads.geotrack.data.repository.PhotoRepository
import com.mplads.geotrack.ui.navigation.Screen
import com.mplads.geotrack.ui.screens.*
import com.mplads.geotrack.ui.theme.*
import com.mplads.geotrack.utils.LocationHelper
import com.mplads.geotrack.utils.LocationState
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private lateinit var repository: PhotoRepository
    private lateinit var locationHelper: LocationHelper

    private var hasCameraPermission by mutableStateOf(false)
    private var hasLocationPermission by mutableStateOf(false)

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        hasCameraPermission = permissions[Manifest.permission.CAMERA] ?: false
        hasLocationPermission = (permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val database = AppDatabase.getDatabase(this)
        repository = PhotoRepository(database.geoPhotoDao(), applicationContext)
        locationHelper = LocationHelper(this)

        checkAndRequestPermissions()

        setContent {
            MPLADSGeoTrackTheme {
                var isSplashActive by remember { mutableStateOf(true) }

                if (isSplashActive) {
                    MargaEyesSplashScreen(
                        onSplashFinished = { isSplashActive = false }
                    )
                } else if (hasCameraPermission && hasLocationPermission) {
                    AppNavigation(repository = repository, locationHelper = locationHelper)
                } else {
                    PermissionRequestScreen()
                }
            }
        }
    }

    private fun checkAndRequestPermissions() {
        val cameraGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        val locationGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED

        hasCameraPermission = cameraGranted
        hasLocationPermission = locationGranted

        if (!cameraGranted || !locationGranted) {
            permissionLauncher.launch(
                arrayOf(
                    Manifest.permission.CAMERA,
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
        }
    }
}

@Composable
fun AppNavigation(
    repository: PhotoRepository,
    locationHelper: LocationHelper
) {
    val context = LocalContext.current
    val navController = rememberNavController()
    val scope = rememberCoroutineScope()

    val prefs = remember { context.getSharedPreferences("marga_eyes_prefs", Context.MODE_PRIVATE) }
    var savedWorkerName by remember { mutableStateOf(prefs.getString("worker_name", "") ?: "") }
    var savedWorkId by remember { mutableStateOf(prefs.getString("work_id", "") ?: "") }
    var savedDescription by remember { mutableStateOf(prefs.getString("work_description", "") ?: "") }
    var showWorkerDialog by remember { mutableStateOf(savedWorkerName.isEmpty() || savedWorkId.isEmpty()) }

    val photos by repository.allPhotos.collectAsState(initial = emptyList())
    val savedCount by repository.savedPhotosCount.collectAsState(initial = 0)

    val locationState by locationHelper.getLocationFlow().collectAsState(initial = LocationState.Waiting)

    var currentCaptureData by remember { mutableStateOf<CapturedPhotoData?>(null) }

    if (showWorkerDialog) {
        WorkerDetailsDialog(
            initialWorkerName = savedWorkerName,
            initialWorkId = savedWorkId,
            initialDescription = savedDescription,
            onConfirm = { name, id, desc ->
                savedWorkerName = name
                savedWorkId = id
                savedDescription = desc
                prefs.edit()
                    .putString("worker_name", name)
                    .putString("work_id", id)
                    .putString("work_description", desc)
                    .apply()
                showWorkerDialog = false
            },
            onDismiss = {
                if (savedWorkerName.isNotEmpty() && savedWorkId.isNotEmpty()) {
                    showWorkerDialog = false
                }
            }
        )
    }

    NavHost(navController = navController, startDestination = Screen.Camera.route) {
        composable(Screen.Camera.route) {
            CameraScreen(
                workerName = savedWorkerName,
                workId = savedWorkId,
                description = savedDescription,
                onEditWorkerDetails = { showWorkerDialog = true },
                onCaptureComplete = { photoData ->
                    currentCaptureData = photoData
                    navController.navigate(Screen.Preview.route)
                },
                onOpenGallery = { navController.navigate(Screen.Gallery.route) },
                savedPhotosCount = savedCount,
                locationState = locationState,
                onResolvePlaceName = { lat, lon -> locationHelper.resolvePlaceName(lat, lon) }
            )
        }

        composable(Screen.Preview.route) {
            currentCaptureData?.let { data ->
                PhotoPreviewScreen(
                    photoData = data,
                    onRetake = {
                        currentCaptureData = null
                        navController.popBackStack(Screen.Camera.route, inclusive = false)
                    },
                    onSave = {
                        scope.launch {
                            val newPhoto = GeoPhoto(
                                id = "photo_${System.currentTimeMillis()}",
                                imageUrl = data.imageUrl,
                                rawImageUrl = data.imageUrl,
                                watermarkedImageUrl = data.imageUrl,
                                hasVisibleOverlay = data.hasVisibleOverlay,
                                latitude = data.latitude,
                                longitude = data.longitude,
                                accuracy = data.accuracy,
                                placeName = data.placeName,
                                workerName = data.workerName,
                                workId = data.workId,
                                description = data.description,
                                dateFormatted = data.dateFormatted,
                                timeFormatted = data.timeFormatted,
                                capturedAt = data.capturedAt
                            )
                            repository.savePhoto(newPhoto)
                            android.widget.Toast.makeText(context, "Photo saved to Gallery", android.widget.Toast.LENGTH_SHORT).show()
                            currentCaptureData = null
                            navController.popBackStack(Screen.Camera.route, inclusive = false)
                        }
                    }
                )
            }
        }

        composable(Screen.Gallery.route) {
            PhotoGalleryScreen(
                photos = photos,
                onBack = { navController.popBackStack() },
                onDeletePhoto = { id ->
                    scope.launch { repository.deletePhoto(id) }
                }
            )
        }
    }
}

@Composable
fun PermissionRequestScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Black)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            CircularProgressIndicator(color = Emerald400)
            Text(
                text = "Grant Camera & Location permissions to start taking geotagged photos",
                color = White,
                fontSize = 14.sp
            )
        }
    }
}
