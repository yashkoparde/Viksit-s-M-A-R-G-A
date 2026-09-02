package com.mplads.geotrack.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.mplads.geotrack.data.model.CapturedPhotoData
import com.mplads.geotrack.ui.theme.*
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PhotoPreviewScreen(
    photoData: CapturedPhotoData,
    onRetake: () -> Unit,
    onSave: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Review Photo",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = White
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onRetake) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = Zinc400
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Black)
            )
        },
        bottomBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Zinc950)
                    .padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Retake Button
                OutlinedButton(
                    onClick = onRetake,
                    modifier = Modifier
                        .weight(1f)
                        .height(52.dp),
                    shape = RoundedCornerShape(14.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Zinc700),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = Zinc900,
                        contentColor = Zinc400
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = "Retake", fontWeight = FontWeight.Medium)
                }

                // Save Photo Button
                Button(
                    onClick = onSave,
                    modifier = Modifier
                        .weight(1f)
                        .height(52.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Emerald500,
                        contentColor = Black
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = "Save Photo", fontWeight = FontWeight.Bold)
                }
            }
        },
        containerColor = Black
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Photo View Box
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(4f / 3f)
                    .clip(RoundedCornerShape(18.dp))
                    .background(Zinc950)
                    .border(1.dp, Zinc800, RoundedCornerShape(18.dp))
            ) {
                AsyncImage(
                    model = photoData.imageUri,
                    contentDescription = "Captured Geotag Preview",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            }

            // Metadata Details Card
            Card(
                colors = CardDefaults.cardColors(containerColor = Zinc900.copy(alpha = 0.9f)),
                border = androidx.compose.foundation.BorderStroke(1.dp, Zinc800),
                shape = RoundedCornerShape(18.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (!photoData.workerName.isNull_or_empty()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = "Officer & Work ID", color = Zinc400, fontSize = 12.sp)
                            Text(
                                text = "${photoData.workerName} | ${photoData.workId ?: ""}",
                                color = Amber400,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                    if (!photoData.description.isNull_or_empty()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = "Site Description", color = Zinc400, fontSize = 12.sp)
                            Text(
                                text = photoData.description ?: "",
                                color = Zinc300,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                    if (!photoData.placeName.isNull_or_empty()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = "Place", color = Zinc400, fontSize = 12.sp)
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Place,
                                    contentDescription = null,
                                    tint = Emerald400,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = photoData.placeName ?: "",
                                    color = Emerald400,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "Coordinates", color = Zinc400, fontSize = 12.sp)
                        Text(
                            text = String.format(Locale.US, "%.6f, %.6f", photoData.latitude, photoData.longitude),
                            color = White,
                            fontSize = 12.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "GPS Accuracy", color = Zinc400, fontSize = 12.sp)
                        Text(
                            text = "±${photoData.accuracy.toInt()} meters",
                            color = Emerald400,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    HorizontalDivider(color = Zinc800, thickness = 1.dp)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "Captured", color = Zinc400, fontSize = 12.sp)
                        Text(
                            text = "${photoData.dateFormatted} • ${photoData.timeFormatted}",
                            color = Zinc400,
                            fontSize = 12.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }
        }
    }
}

private fun String?.isNull_or_empty(): Boolean {
    return this == null || this.trim().isEmpty()
}
