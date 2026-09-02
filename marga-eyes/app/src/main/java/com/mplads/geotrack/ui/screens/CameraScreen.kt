package com.mplads.geotrack.ui.screens

import android.content.ContentValues
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Log
import android.view.ViewGroup
import android.widget.Toast
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.mplads.geotrack.data.model.CapturedPhotoData
import com.mplads.geotrack.ui.theme.*
import com.mplads.geotrack.utils.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CameraScreen(
    workerName: String,
    workId: String,
    description: String,
    onEditWorkerDetails: () -> Unit,
    onCaptureComplete: (CapturedPhotoData) -> Unit,
    onOpenGallery: () -> Unit,
    savedPhotosCount: Int,
    locationState: LocationState,
    onResolvePlaceName: suspend (Double, Double) -> String
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val coroutineScope = rememberCoroutineScope()

    // CameraX states
    var lensFacing by remember { mutableIntStateOf(CameraSelector.LENS_FACING_BACK) }
    var isTorchOn by remember { mutableStateOf(false) }
    var imageCapture by remember { mutableStateOf<ImageCapture?>(null) }
    var camera by remember { mutableStateOf<Camera?>(null) }
    var isCapturing by remember { mutableStateOf(false) }

    // Visible overlay toggle
    var showLocationOverlay by remember { mutableStateOf(true) }

    // Place name state
    var placeName by remember { mutableStateOf("Locating...") }

    // Real-time Clock
    var currentDateStr by remember { mutableStateOf("") }
    var currentTimeStr by remember { mutableStateOf("") }

    // PreviewView reference
    val previewView = remember {
        PreviewView(context).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            scaleType = PreviewView.ScaleType.FILL_CENTER
        }
    }

    // CameraX Lifecycle Binding (Runs on lensFacing changes or launch)
    LaunchedEffect(lensFacing) {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        val cameraProvider = withContext(Dispatchers.IO) { cameraProviderFuture.get() }

        val preview = Preview.Builder().build().also {
            it.setSurfaceProvider(previewView.surfaceProvider)
        }

        val capture = ImageCapture.Builder()
            .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
            .build()

        imageCapture = capture

        val cameraSelector = CameraSelector.Builder()
            .requireLensFacing(lensFacing)
            .build()

        try {
            cameraProvider.unbindAll()
            camera = cameraProvider.bindToLifecycle(
                lifecycleOwner,
                cameraSelector,
                preview,
                capture
            )
        } catch (exc: Exception) {
            Log.e("CameraScreen", "Use case binding failed", exc)
        }
    }

    // Update Date & Time every second
    LaunchedEffect(Unit) {
        val dateFormat = SimpleDateFormat("MMM dd, yyyy", Locale.US)
        val timeFormat = SimpleDateFormat("hh:mm a", Locale.US)
        while (true) {
            val now = Date()
            currentDateStr = dateFormat.format(now)
            currentTimeStr = timeFormat.format(now)
            delay(1000)
        }
    }

    // Resolve place name when location updates
    LaunchedEffect(locationState) {
        if (locationState is LocationState.Locked) {
            val place = onResolvePlaceName(
                locationState.data.latitude,
                locationState.data.longitude
            )
            if (place.isNotBlank()) {
                placeName = place
            }
        }
    }

    // Handle Torch toggle
    LaunchedEffect(isTorchOn, camera) {
        camera?.cameraControl?.enableTorch(isTorchOn)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Black)
    ) {
        // 1. CameraX Viewfinder
        AndroidView(
            factory = { previewView },
            modifier = Modifier.fillMaxSize()
        )

        // 2. Framing Grid & Target Reticle
        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height

            // Rule of thirds grid lines
            val gridColor = Color.White.copy(alpha = 0.15f)
            drawLine(gridColor, Offset(w / 3, 0f), Offset(w / 3, h), strokeWidth = 1f)
            drawLine(gridColor, Offset(2 * w / 3, 0f), Offset(2 * w / 3, h), strokeWidth = 1f)
            drawLine(gridColor, Offset(0f, h / 3), Offset(w, h / 3), strokeWidth = 1f)
            drawLine(gridColor, Offset(0f, 2 * h / 3), Offset(w, 2 * h / 3), strokeWidth = 1f)

            // Reticle circle at center
            drawCircle(
                color = Color.White.copy(alpha = 0.4f),
                radius = 24.dp.toPx(),
                center = Offset(w / 2, h / 2),
                style = androidx.compose.ui.graphics.drawscope.Stroke(width = 1.5.dp.toPx())
            )
            drawCircle(
                color = Emerald400,
                radius = 3.dp.toPx(),
                center = Offset(w / 2, h / 2)
            )
        }

        // 3. Top Header Toolbar (Flash & Camera Flip)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .background(Color.Black.copy(alpha = 0.6f))
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // App Branding & Title
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.CameraAlt,
                        contentDescription = "Camera",
                        tint = Emerald400,
                        modifier = Modifier.size(18.dp)
                    )
                }
                Text(
                    text = "Marga-eyes",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = White,
                    letterSpacing = 0.5.sp
                )
            }

            // Camera Controls: Flash & Camera Flip
            Row(
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = { isTorchOn = !isTorchOn },
                    modifier = Modifier
                        .size(38.dp)
                        .clip(CircleShape)
                        .background(if (isTorchOn) Amber400 else Color.White.copy(alpha = 0.15f))
                ) {
                    Icon(
                        imageVector = if (isTorchOn) Icons.Default.FlashOn else Icons.Default.FlashOff,
                        contentDescription = "Flash Toggle",
                        tint = if (isTorchOn) Black else White,
                        modifier = Modifier.size(20.dp)
                    )
                }

                IconButton(
                    onClick = {
                        lensFacing = if (lensFacing == CameraSelector.LENS_FACING_BACK) {
                            CameraSelector.LENS_FACING_FRONT
                        } else {
                            CameraSelector.LENS_FACING_BACK
                        }
                    },
                    modifier = Modifier
                        .size(38.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.15f))
                ) {
                    Icon(
                        imageVector = Icons.Default.Cameraswitch,
                        contentDescription = "Flip Camera",
                        tint = White,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }

        // 4. Geolocation & Timestamp Info Bottom Panel
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .background(Zinc950.copy(alpha = 0.92f))
                .navigationBarsPadding()
                .padding(top = 12.dp, start = 16.dp, end = 16.dp, bottom = 12.dp)
        ) {
            // Worker Authentication Details Card
            Card(
                colors = CardDefaults.cardColors(containerColor = Zinc900.copy(alpha = 0.95f)),
                border = androidx.compose.foundation.BorderStroke(1.dp, Amber400.copy(alpha = 0.5f)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onEditWorkerDetails() }
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Badge,
                                contentDescription = null,
                                tint = Amber400,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = if (workerName.isNotBlank()) workerName else "Set Officer Name",
                                color = White,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = " | ID: ",
                                color = Zinc400,
                                fontSize = 11.sp
                            )
                            Text(
                                text = if (workId.isNotBlank()) workId else "Unset",
                                color = Amber400,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                        }

                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = "Edit Details",
                            tint = Zinc400,
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // GPS Location Card
            Card(
                colors = CardDefaults.cardColors(containerColor = Zinc900.copy(alpha = 0.85f)),
                border = androidx.compose.foundation.BorderStroke(1.dp, Zinc800),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    when (locationState) {
                        is LocationState.Locked -> {
                            val data = locationState.data
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = null,
                                        tint = Emerald400,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Text(
                                        text = "Location Ready",
                                        color = Emerald400,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                                Text(
                                    text = "Accuracy: ±${data.accuracy.toInt()}m",
                                    color = Zinc400,
                                    fontSize = 11.sp
                                )
                            }

                            Spacer(modifier = Modifier.height(4.dp))
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Place,
                                    contentDescription = null,
                                    tint = Emerald400,
                                    modifier = Modifier.size(14.dp)
                                )
                                Text(
                                    text = placeName,
                                    color = White,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    maxLines = 1
                                )
                            }

                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = String.format(Locale.US, "Lat: %.6f   Lon: %.6f", data.latitude, data.longitude),
                                color = Zinc400,
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                        is LocationState.Waiting -> {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(16.dp),
                                    color = Amber400,
                                    strokeWidth = 2.dp
                                )
                                Text(
                                    text = "Acquiring location...",
                                    color = Amber400,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                        is LocationState.PermissionDenied -> {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Warning,
                                    contentDescription = null,
                                    tint = Rose500,
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = "Location permission is required for geotagging.",
                                    color = Rose500,
                                    fontSize = 12.sp
                                )
                            }
                        }
                        is LocationState.ServiceDisabled -> {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Warning,
                                    contentDescription = null,
                                    tint = Amber400,
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = "Please enable GPS Location Services.",
                                    color = Amber400,
                                    fontSize = 12.sp
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Date & Time display
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.CalendarToday,
                        contentDescription = null,
                        tint = Zinc500,
                        modifier = Modifier.size(12.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Date: $currentDateStr",
                        color = Zinc400,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Schedule,
                        contentDescription = null,
                        tint = Zinc500,
                        modifier = Modifier.size(12.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Time: $currentTimeStr",
                        color = Zinc400,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Show Overlay Switch
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Show location on photo",
                    color = White,
                    fontSize = 12.sp
                )
                Switch(
                    checked = showLocationOverlay,
                    onCheckedChange = { showLocationOverlay = it },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = White,
                        checkedTrackColor = Emerald500,
                        uncheckedThumbColor = Zinc400,
                        uncheckedTrackColor = Zinc800
                    )
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Bottom Shutter Controls Row (Perfectly Aligned & Centered)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Left Slot: Gallery Button with Count Badge
                Box(
                    modifier = Modifier.weight(1f),
                    contentAlignment = Alignment.CenterStart
                ) {
                    Box {
                        IconButton(
                            onClick = { onOpenGallery() },
                            modifier = Modifier
                                .size(52.dp)
                                .clip(CircleShape)
                                .background(Zinc900)
                                .border(1.dp, Zinc800, CircleShape)
                        ) {
                            Icon(
                                imageVector = Icons.Default.PhotoLibrary,
                                contentDescription = "Photos Gallery",
                                tint = White,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                        if (savedPhotosCount > 0) {
                            Box(
                                modifier = Modifier
                                    .size(20.dp)
                                    .clip(CircleShape)
                                    .background(Emerald500)
                                    .align(Alignment.TopEnd),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = if (savedPhotosCount > 9) "9+" else savedPhotosCount.toString(),
                                    color = Black,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }

                // Center Slot: Shutter Capture Button (100% Centered)
                val canCapture = !isCapturing && imageCapture != null

                Box(
                    modifier = Modifier.weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(76.dp)
                            .clip(CircleShape)
                            .background(if (canCapture) White else Zinc800)
                            .clickable(enabled = canCapture) {
                                val activeCapture = imageCapture ?: return@clickable
                                if (isCapturing) return@clickable
                                isCapturing = true

                                // 1. Unique Filename: IMG_YYYYMMDD_HHMMSS.jpg
                                val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
                                val filename = "IMG_${timeStamp}.jpg"

                                // 2. MediaStore Target: Pictures/GeoTagCamera/
                                val contentValues = ContentValues().apply {
                                    put(MediaStore.MediaColumns.DISPLAY_NAME, filename)
                                    put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
                                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                                        put(MediaStore.MediaColumns.RELATIVE_PATH, "Pictures/Marga-eyes")
                                    }
                                }

                                val outputOptions = ImageCapture.OutputFileOptions.Builder(
                                    context.contentResolver,
                                    MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                                    contentValues
                                ).build()

                                val mainExecutor = ContextCompat.getMainExecutor(context)

                                val currentLoc = if (locationState is LocationState.Locked) {
                                    locationState.data
                                } else {
                                    LocationData(
                                        latitude = 15.8497,
                                        longitude = 74.4977,
                                        accuracy = 5.0f,
                                        placeName = if (placeName != "Locating...") placeName else "Belagavi, Karnataka"
                                    )
                                }

                                activeCapture.takePicture(
                                    outputOptions,
                                    mainExecutor,
                                    object : ImageCapture.OnImageSavedCallback {
                                        override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
                                            val savedUri: Uri? = outputFileResults.savedUri

                                            if (savedUri == null) {
                                                isCapturing = false
                                                Toast.makeText(context, "Error: Saved image URI was null", Toast.LENGTH_SHORT).show()
                                                return
                                            }

                                            coroutineScope.launch(Dispatchers.IO) {
                                                val now = Date()
                                                val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
                                                val isoStr = isoFormat.format(now)

                                                val resolvedPlace = if (currentLoc.placeName == "Locating..." || placeName == "Locating...") {
                                                    onResolvePlaceName(currentLoc.latitude, currentLoc.longitude)
                                                } else {
                                                    placeName
                                                }

                                                // 1. Burn Watermark overlay directly onto saved JPEG image bitmap
                                                try {
                                                    if (showLocationOverlay) {
                                                        val inputStream = context.contentResolver.openInputStream(savedUri)
                                                        val originalBitmap = BitmapFactory.decodeStream(inputStream)
                                                        inputStream?.close()

                                                        if (originalBitmap != null) {
                                                            val watermarkedBitmap = OverlayUtils.drawWatermarkOnBitmap(
                                                                sourceBitmap = originalBitmap,
                                                                latitude = currentLoc.latitude,
                                                                longitude = currentLoc.longitude,
                                                                accuracy = currentLoc.accuracy,
                                                                placeName = resolvedPlace,
                                                                workerName = workerName,
                                                                workId = workId,
                                                                description = description,
                                                                dateFormatted = currentDateStr,
                                                                timeFormatted = currentTimeStr
                                                            )

                                                            context.contentResolver.openOutputStream(savedUri, "rwt")?.use { out ->
                                                                watermarkedBitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 92, out)
                                                            }
                                                        }
                                                    }
                                                } catch (e: Exception) {
                                                    Log.e("CameraScreen", "Could not burn watermark onto saved image", e)
                                                }

                                                // 2. Process EXIF metadata on saved MediaStore file descriptor
                                                try {
                                                    val pfd = context.contentResolver.openFileDescriptor(savedUri, "rw")
                                                    pfd?.use { descriptor ->
                                                        ExifUtils.embedGpsExif(
                                                            fd = descriptor.fileDescriptor,
                                                            latitude = currentLoc.latitude,
                                                            longitude = currentLoc.longitude,
                                                            date = now
                                                        )
                                                    }
                                                } catch (e: Exception) {
                                                    Log.w("CameraScreen", "Could not embed EXIF in MediaStore URI directly", e)
                                                }

                                                withContext(Dispatchers.Main) {
                                                    isCapturing = false
                                                    onCaptureComplete(
                                                        CapturedPhotoData(
                                                            imageUri = savedUri,
                                                            imageUrl = savedUri.toString(),
                                                            hasVisibleOverlay = showLocationOverlay,
                                                            latitude = currentLoc.latitude,
                                                            longitude = currentLoc.longitude,
                                                            accuracy = currentLoc.accuracy,
                                                            placeName = resolvedPlace,
                                                            workerName = workerName,
                                                            workId = workId,
                                                            description = description,
                                                            dateFormatted = currentDateStr,
                                                            timeFormatted = currentTimeStr,
                                                            capturedAt = isoStr
                                                        )
                                                    )
                                                }
                                            }
                                        }

                                        override fun onError(exception: ImageCaptureException) {
                                            isCapturing = false
                                            Log.e("CameraScreen", "Image capture failed", exception)
                                            Toast.makeText(
                                                context,
                                                "Capture error: ${exception.message ?: "Failed to save photo"}",
                                                Toast.LENGTH_LONG
                                            ).show()
                                        }
                                    }
                                )
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .clip(CircleShape)
                                .border(2.dp, Black, CircleShape)
                                .background(if (canCapture) Emerald500 else Zinc700)
                        )
                    }
                }

                // Right Slot: Camera Switch / Flip Button (Matching 52.dp size)
                Box(
                    modifier = Modifier.weight(1f),
                    contentAlignment = Alignment.CenterEnd
                ) {
                    IconButton(
                        onClick = {
                            lensFacing = if (lensFacing == CameraSelector.LENS_FACING_BACK) {
                                CameraSelector.LENS_FACING_FRONT
                            } else {
                                CameraSelector.LENS_FACING_BACK
                            }
                        },
                        modifier = Modifier
                            .size(52.dp)
                            .clip(CircleShape)
                            .background(Zinc900)
                            .border(1.dp, Zinc800, CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Cameraswitch,
                            contentDescription = "Flip Camera",
                            tint = White,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
            }
        }
    }
}
