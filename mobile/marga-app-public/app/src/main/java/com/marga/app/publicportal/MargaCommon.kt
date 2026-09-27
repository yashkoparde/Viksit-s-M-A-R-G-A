package com.marga.app.publicportal

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.gson.annotations.SerializedName
import kotlinx.coroutines.delay
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query
import java.util.concurrent.TimeUnit

// Executive Studio Palette: Deep obsidian, neutral slate, purposeful accents
val StudioBackground = Color(0xFF090A0F)
val StudioCard = Color(0xFF11141E)
val StudioCardBorder = Color(0xFF1E2333)
val StudioCardHover = Color(0xFF161B28)

val TextPrimary = Color(0xFFF1F5F9)
val TextSecondary = Color(0xFFCBD5E1)
val TextTertiary = Color(0xFF94A3B8)

val AccentPrimary = Color(0xFF38BDF8)     // Calm Sky Blue (Parliamentary / Union)
val AccentSuccess = Color(0xFF10B981)     // Verified Emerald (Collector / Execution)
val AccentWarning = Color(0xFFF59E0B)     // Amber Notice (Delay)
val AccentCritical = Color(0xFFF43F5E)    // Alert Rose (Bottleneck)

// Standard Data Models
data class WorkItem(
    @SerializedName("workId") val workId: String? = null,
    @SerializedName("rawId") val rawId: String? = null,
    @SerializedName("description") val description: String? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("category") val category: String? = null,
    @SerializedName("mpName") val mpName: String? = null,
    @SerializedName("constituency") val constituency: String? = null,
    @SerializedName("district") val district: String? = null,
    @SerializedName("state") val state: String? = null,
    @SerializedName("recommendedAmount") val recommendedAmount: Double? = 0.0,
    @SerializedName("sanctionedAmount") val sanctionedAmount: Double? = 0.0,
    @SerializedName("disbursedAmount") val disbursedAmount: Double? = 0.0,
    @SerializedName("expenditureAmount") val expenditureAmount: Double? = 0.0,
    @SerializedName("status") val status: String? = "RECOMMENDED",
    @SerializedName("physicalProgress") val physicalProgress: Double? = 0.0,
    @SerializedName("financialProgress") val financialProgress: Double? = 0.0,
    @SerializedName("department") val department: String? = null,
    @SerializedName("implementingAgency") val implementingAgency: String? = null,
    @SerializedName("daysInCurrentStage") val daysInCurrentStage: Int? = 15,
    @SerializedName("latitude") val latitude: Double? = null,
    @SerializedName("longitude") val longitude: Double? = null,
    @SerializedName("riskScore") val riskScore: Int? = null,
    @SerializedName("riskBand") val riskBand: String? = null,
    @SerializedName("rootCauseIssue") val rootCauseIssue: String? = null,
    @SerializedName("scStTag") val scStTag: String? = "General"
) {
    val displayTitle: String get() = description ?: name ?: "Public Work Project"
    val safeId: String get() = workId ?: rawId ?: "WRK"
    val costLakhs: Double get() = sanctionedAmount ?: recommendedAmount ?: 25.0
    val progress: Double get() = physicalProgress ?: 0.0
    val isDelayed: Boolean get() = status?.contains("DELAY", ignoreCase = true) == true || (riskScore ?: 0) >= 70
}

data class WorksResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("total") val total: Int,
    @SerializedName("count") val count: Int,
    @SerializedName("data") val data: List<WorkItem>
)

data class MPSummary(
    @SerializedName("mpId") val mpId: String? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("mpName") val mpName: String? = null,
    @SerializedName("constituency") val constituency: String? = null,
    @SerializedName("state") val state: String? = null,
    @SerializedName("house") val house: String? = null,
    @SerializedName("allocatedAmount") val allocatedAmount: Double? = 50000000.0,
    @SerializedName("totalExpenditure") val totalExpenditure: Double? = 0.0,
    @SerializedName("unspentAmount") val unspentAmount: Double? = 0.0,
    @SerializedName("utilizationRate") val utilizationRate: Double? = 0.0,
    @SerializedName("completedWorks") val completedWorks: Int? = 0,
    @SerializedName("recommendedWorks") val recommendedWorks: Int? = 0,
    @SerializedName("tier") val tier: String? = null
)

data class MPsResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("count") val count: Int,
    @SerializedName("data") val data: List<MPSummary>
)

data class DAReviewRequest(
    val workId: String,
    val feasible: Boolean,
    val estimatedTimeMonths: Int,
    val prohibited: Boolean,
    val remarks: String,
    val reviewedBy: String
)

data class InspectionRequest(
    val workId: String,
    val iaId: String,
    val progressPercentage: Double,
    val remarks: String,
    val reportingPeriod: String = "30-Day Cycle"
)

data class RecommendWorkRequest(
    val description: String,
    val category: String,
    val recommendedAmount: Double,
    val constituency: String,
    val state: String,
    val mpName: String,
    val department: String = "Public Works Department",
    val scStTag: String = "SC"
)

data class GenericResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String? = null
)

interface MargaApi {
    @GET("api/works")
    suspend fun getWorks(
        @Query("search") search: String? = null,
        @Query("status") status: String? = null,
        @Query("mpName") mpName: String? = null,
        @Query("district") district: String? = null,
        @Query("state") state: String? = null,
        @Query("limit") limit: Int = 100
    ): Response<WorksResponse>

    @GET("api/mps")
    suspend fun getMPs(
        @Query("search") search: String? = null,
        @Query("state") state: String? = null,
        @Query("limit") limit: Int = 50
    ): Response<MPsResponse>

    @POST("api/works")
    suspend fun recommendWork(@Body body: RecommendWorkRequest): Response<GenericResponse>

    @POST("api/da-reviews")
    suspend fun submitDAReview(@Body body: DAReviewRequest): Response<GenericResponse>

    @POST("api/inspections")
    suspend fun submitInspection(@Body body: InspectionRequest): Response<GenericResponse>
}

object NetworkClient {
    var baseUrl = "http://10.0.2.2:5000/"

    val api: MargaApi by lazy {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        }
        val client = OkHttpClient.Builder()
            .addInterceptor(logging)
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .build()

        Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(MargaApi::class.java)
    }
}

/**
 * Clean, cinematic opening splash screen with calm typography,
 * smooth breathing emblem, and seamless fade into the stakeholder dashboard.
 */
@Composable
fun CinematicOpeningScreen(
    appName: String,
    roleSubtitle: String,
    accentColor: Color = AccentPrimary,
    onComplete: () -> Unit
) {
    var startAnimation by remember { mutableStateOf(false) }
    val alphaAnim = animateFloatAsState(
        targetValue = if (startAnimation) 1f else 0f,
        animationSpec = tween(durationMillis = 900, easing = FastOutSlowInEasing),
        label = "Alpha"
    )
    val scaleAnim = animateFloatAsState(
        targetValue = if (startAnimation) 1f else 0.94f,
        animationSpec = tween(durationMillis = 900, easing = FastOutSlowInEasing),
        label = "Scale"
    )

    LaunchedEffect(Unit) {
        startAnimation = true
        delay(1400)
        onComplete()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(StudioBackground),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier
                .scale(scaleAnim.value)
                .alpha(alphaAnim.value)
                .padding(32.dp)
        ) {
            // Official MARGA Civic Infrastructure Emblem
            Box(
                modifier = Modifier
                    .size(76.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(StudioCard),
                contentAlignment = Alignment.Center
            ) {
                androidx.compose.foundation.Image(
                    painter = androidx.compose.ui.res.painterResource(id = com.marga.app.publicportal.R.drawable.marga_logo),
                    contentDescription = "MARGA Logo",
                    modifier = Modifier.size(60.dp)
                )
            }

            Spacer(Modifier.height(4.dp))

            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    appName,
                    color = TextPrimary,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp
                )
                Text(
                    roleSubtitle,
                    color = TextSecondary,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            Spacer(Modifier.height(18.dp))

            // Minimal, calm loading bar
            Box(
                modifier = Modifier
                    .width(120.dp)
                    .height(2.dp)
                    .clip(RoundedCornerShape(1.dp))
                    .background(StudioCardBorder)
            ) {
                val progress by animateFloatAsState(
                    targetValue = if (startAnimation) 1f else 0f,
                    animationSpec = tween(1200, easing = LinearOutSlowInEasing),
                    label = "Progress"
                )
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(progress)
                        .background(accentColor)
                )
            }
        }
    }
}
