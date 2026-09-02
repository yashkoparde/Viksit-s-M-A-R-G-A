package com.mplads.geotrack.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mplads.geotrack.ui.theme.*
import kotlinx.coroutines.delay
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun MargaEyesSplashScreen(
    onSplashFinished: () -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "eyeAnim")

    val rotationAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(6000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotation"
    )

    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.92f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    // Auto-advance splash after 2.4 seconds
    LaunchedEffect(Unit) {
        delay(2400)
        onSplashFinished()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Zinc950),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(vertical = 40.dp, horizontal = 24.dp)
        ) {
            // Official Badge Header
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(Zinc900)
                        .border(1.dp, Emerald500.copy(alpha = 0.3f), RoundedCornerShape(20.dp))
                        .padding(horizontal = 14.dp, vertical = 6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Shield,
                        contentDescription = null,
                        tint = Emerald400,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = "GOVERNMENT SURVEILLANCE",
                        color = White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.2.sp
                    )
                }

                Text(
                    text = "Official GeoTag Camera & Field Inspection Engine",
                    color = Zinc400,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Normal
                )
            }

            // Animated Human Eye Symbol
            Box(
                modifier = Modifier.size(200.dp),
                contentAlignment = Alignment.Center
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val center = Offset(size.width / 2, size.height / 2)

                    // Outer Eye Contour
                    val eyePath = Path().apply {
                        moveTo(center.x - 85.dp.toPx(), center.y)
                        cubicTo(
                            center.x - 35.dp.toPx(), center.y - 55.dp.toPx(),
                            center.x + 35.dp.toPx(), center.y - 55.dp.toPx(),
                            center.x + 85.dp.toPx(), center.y
                        )
                        cubicTo(
                            center.x + 35.dp.toPx(), center.y + 55.dp.toPx(),
                            center.x - 35.dp.toPx(), center.y + 55.dp.toPx(),
                            center.x - 85.dp.toPx(), center.y
                        )
                        close()
                    }

                    // Outer Eye Border
                    drawPath(
                        path = eyePath,
                        color = Emerald400,
                        style = Stroke(width = 2.5.dp.toPx())
                    )

                    // Rotating Iris Dial
                    rotate(rotationAngle, pivot = center) {
                        for (i in 0 until 8) {
                            val angle = Math.toRadians((i * 45).toDouble())
                            val r1 = 30.dp.toPx()
                            val r2 = 42.dp.toPx()
                            val p1 = Offset(center.x + r1 * cos(angle).toFloat(), center.y + r1 * sin(angle).toFloat())
                            val p2 = Offset(center.x + r2 * cos(angle).toFloat(), center.y + r2 * sin(angle).toFloat())

                            drawLine(
                                color = Emerald400.copy(alpha = 0.5f),
                                start = p1,
                                end = p2,
                                strokeWidth = 1.5.dp.toPx()
                            )
                        }
                    }

                    // Pupil Core
                    drawCircle(
                        color = Emerald400,
                        radius = 22.dp.toPx() * pulseScale,
                        center = center
                    )

                    // Pupil Reflection
                    drawCircle(
                        color = White,
                        radius = 4.dp.toPx(),
                        center = Offset(center.x - 6.dp.toPx(), center.y - 6.dp.toPx())
                    )
                }
            }

            // Clean Human Title & Subtitle
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = "Marga-eyes",
                    fontSize = 30.sp,
                    fontWeight = FontWeight.Bold,
                    color = White,
                    letterSpacing = 1.sp
                )

                Text(
                    text = "Road & Infrastructure Geo-Tracking",
                    fontSize = 13.sp,
                    color = Zinc400,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}
