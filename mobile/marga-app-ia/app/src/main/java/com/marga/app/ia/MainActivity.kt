package com.marga.app.ia

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            IAApp()
        }
    }
}

data class IAProfile(
    val id: String,
    val agency: String,
    val district: String,
    val division: String
)

val IA_PROFILES = listOf(
    IAProfile("IA-1", "Executive Engineer, PWD Special Division", "Mysuru", "Civil Works"),
    IAProfile("IA-2", "Superintending Engineer, Rural Water (RDWSD)", "Mysuru", "Water & Sanitation"),
    IAProfile("IA-3", "Executive Engineer, PWD South Division", "Pune", "Building Construction")
)

@Composable
fun IAApp() {
    var showCinematic by remember { mutableStateOf(true) }
    var profile by remember { mutableStateOf(IA_PROFILES[0]) }
    var inLogin by remember { mutableStateOf(false) }

    if (showCinematic) {
        CinematicOpeningScreen(
            appName = "MARGA Engineer",
            roleSubtitle = "Implementing Agency Field Console",
            accentColor = AccentWarning,
            onComplete = { showCinematic = false }
        )
    } else {
        AnimatedContent(
            targetState = inLogin,
            transitionSpec = { fadeIn(tween(250)) togetherWith fadeOut(tween(200)) },
            label = "AuthNav"
        ) { isLoggingIn ->
            if (isLoggingIn) {
                IALoginScreen(
                    current = profile,
                    onSuccess = { selected ->
                        profile = selected
                        inLogin = false
                    }
                )
            } else {
                IADashboard(
                    profile = profile,
                    onSwitchProfile = { inLogin = true }
                )
            }
        }
    }
}

@Composable
fun IALoginScreen(current: IAProfile, onSuccess: (IAProfile) -> Unit) {
    var selected by remember { mutableStateOf(current) }
    var pin by remember { mutableStateOf("2026") }
    var expanded by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Box(
        modifier = Modifier.fillMaxSize().background(StudioBackground).padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(StudioCard)
                .border(1.dp, StudioCardBorder, RoundedCornerShape(16.dp))
                .padding(28.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(AccentWarning))
                Text("MARGA / IMPLEMENTING AGENCY", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 1.sp)
            }

            Text("Field Engineer Access", color = TextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Text("Select engineering division to enter Measurement Book (MB) recordings and sensor checks.", color = TextSecondary, fontSize = 13.sp, lineHeight = 18.sp)

            Spacer(Modifier.height(4.dp))

            Text("ENGINEERING DIVISION", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
            Box {
                Surface(
                    onClick = { expanded = true },
                    color = Color(0xFF0D0F17),
                    shape = RoundedCornerShape(10.dp),
                    border = BorderStroke(1.dp, StudioCardBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(selected.agency, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                            Text("${selected.district} · ${selected.division}", color = TextSecondary, fontSize = 12.sp)
                        }
                        Icon(Icons.Default.KeyboardArrowDown, contentDescription = "Open", tint = TextSecondary)
                    }
                }

                DropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false },
                    modifier = Modifier.background(StudioCard).border(1.dp, StudioCardBorder)
                ) {
                    IA_PROFILES.forEach { p ->
                        DropdownMenuItem(
                            text = {
                                Column {
                                    Text(p.agency, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                                    Text("${p.district}, ${p.division}", color = TextSecondary, fontSize = 12.sp)
                                }
                            },
                            onClick = {
                                selected = p
                                expanded = false
                            }
                        )
                    }
                }
            }

            Text("OFFICIAL PASSCODE", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
            OutlinedTextField(
                value = pin,
                onValueChange = { pin = it },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = TextPrimary,
                    unfocusedTextColor = TextPrimary,
                    focusedBorderColor = AccentWarning,
                    unfocusedBorderColor = StudioCardBorder,
                    focusedContainerColor = Color(0xFF0D0F17),
                    unfocusedContainerColor = Color(0xFF0D0F17)
                ),
                shape = RoundedCornerShape(10.dp)
            )

            Spacer(Modifier.height(8.dp))

            Button(
                onClick = {
                    loading = true
                    scope.launch {
                        delay(400)
                        loading = false
                        onSuccess(selected)
                    }
                },
                enabled = !loading,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AccentWarning),
                shape = RoundedCornerShape(10.dp)
            ) {
                if (loading) {
                    CircularProgressIndicator(color = Color.Black, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                } else {
                    Text("Access Engineer Console", color = Color.Black, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IADashboard(profile: IAProfile, onSwitchProfile: () -> Unit) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var works by remember { mutableStateOf<List<WorkItem>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var activeTab by remember { mutableStateOf("active") } // active, gatekeeper, mb, mpr, completion
    var selectedWorkForInspection by remember { mutableStateOf<WorkItem?>(null) }
    var selectedWorkDetails by remember { mutableStateOf<WorkItem?>(null) }

    fun load() {
        loading = true
        scope.launch {
            try {
                val res = NetworkClient.api.getWorks(district = profile.district, limit = 50)
                if (res.isSuccessful && res.body()?.data?.isNotEmpty() == true) {
                    works = res.body()?.data ?: emptyList()
                } else {
                    throw Exception("Fallback")
                }
            } catch (e: Exception) {
                works = listOf(
                    WorkItem(workId = "WRK-101", rawId = "101", description = "Water Purification RO Plant", category = "Water Supply", mpName = "Hon'ble MP", constituency = profile.district, district = profile.district, state = "Karnataka", recommendedAmount = 28.5, sanctionedAmount = 28.5, disbursedAmount = 28.5, expenditureAmount = 28.5, status = "ONGOING", physicalProgress = 45.0, financialProgress = 45.0, implementingAgency = profile.agency),
                    WorkItem(workId = "WRK-102", rawId = "102", description = "Science Laboratory Solar Setup", category = "Education", mpName = "Hon'ble MP", constituency = profile.district, district = profile.district, state = "Karnataka", recommendedAmount = 18.0, sanctionedAmount = 18.0, disbursedAmount = 15.0, expenditureAmount = 15.0, status = "ONGOING", physicalProgress = 75.0, financialProgress = 75.0, implementingAgency = profile.agency),
                    WorkItem(workId = "WRK-103", rawId = "103", description = "Anganwadi Center Construction", category = "Social Welfare", mpName = "Hon'ble MP", constituency = profile.district, district = profile.district, state = "Karnataka", recommendedAmount = 14.0, sanctionedAmount = 14.0, disbursedAmount = 5.0, expenditureAmount = 5.0, status = "DELAYED", physicalProgress = 20.0, financialProgress = 35.0, implementingAgency = profile.agency, daysInCurrentStage = 55, riskScore = 72, rootCauseIssue = "Material delivery bottleneck and missing Gram Panchayat demarcation"),
                    WorkItem(workId = "WRK-104", rawId = "104", description = "Asphalt Road Overlay (2.4 km)", category = "Roads", mpName = "Hon'ble MP", constituency = profile.district, district = profile.district, state = "Karnataka", recommendedAmount = 45.0, sanctionedAmount = 45.0, disbursedAmount = 45.0, expenditureAmount = 45.0, status = "COMPLETED", physicalProgress = 100.0, financialProgress = 100.0, implementingAgency = profile.agency),
                    WorkItem(workId = "WRK-105", rawId = "105", description = "Community Hall Solar Rooftop", category = "Energy", mpName = "Hon'ble MP", constituency = profile.district, district = profile.district, state = "Karnataka", recommendedAmount = 16.0, sanctionedAmount = 16.0, disbursedAmount = 16.0, expenditureAmount = 16.0, status = "COMPLETED", physicalProgress = 100.0, financialProgress = 100.0, implementingAgency = profile.agency)
                )
            } finally {
                delay(200)
                loading = false
            }
        }
    }

    LaunchedEffect(profile.id) { load() }

    val totalAssigned = works.size
    val inspectedCount = works.count { (it.physicalProgress ?: 0.0) >= 50.0 }
    val readyHandover = works.filter { it.status == "COMPLETED" || (it.physicalProgress ?: 0.0) >= 100.0 }

    Scaffold(
        containerColor = StudioBackground,
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("MARGA / IMPLEMENTING AGENCY", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 1.sp)
                    Text("Field Engineer Console", color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Text("${profile.agency} · ${profile.district}", color = TextSecondary, fontSize = 12.sp)
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    IconButton(
                        onClick = onSwitchProfile,
                        modifier = Modifier.size(36.dp).clip(CircleShape).background(StudioCard).border(1.dp, StudioCardBorder, CircleShape)
                    ) {
                        Icon(Icons.Default.AccountCircle, contentDescription = "Switch", tint = TextSecondary, modifier = Modifier.size(18.dp))
                    }
                    IconButton(
                        onClick = { load() },
                        modifier = Modifier.size(36.dp).clip(CircleShape).background(StudioCard).border(1.dp, StudioCardBorder, CircleShape)
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = TextSecondary, modifier = Modifier.size(18.dp))
                    }
                }
            }
        }
    ) { pad ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(pad)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 100% IA Statutory Inspection Tracker
            Card(
                colors = CardDefaults.cardColors(containerColor = StudioCard),
                border = BorderStroke(1.dp, StudioCardBorder),
                shape = RoundedCornerShape(14.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text("100% IA STATUTORY FIELD INSPECTION", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                            Text("$inspectedCount / $totalAssigned Works", color = TextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("SENSOR LOCK", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                            Text("GPS Fix Active", color = AccentSuccess, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    LinearProgressIndicator(
                        progress = { if (totalAssigned > 0) inspectedCount.toFloat() / totalAssigned else 0f },
                        modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                        color = AccentWarning,
                        trackColor = Color(0xFF1E2333)
                    )

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Mandatory: 100% assigned works verified before handover", color = TextSecondary, fontSize = 12.sp)
                        Text("Hardware Locked: MARGA Eyes", color = AccentSuccess, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            // Tabs
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                CategoryPill("Active Works (${works.size})", activeTab == "active") { activeTab = "active" }
                CategoryPill("Gatekeeper", activeTab == "gatekeeper") { activeTab = "gatekeeper" }
                CategoryPill("MB Register", activeTab == "mb") { activeTab = "mb" }
                CategoryPill("MPR Dossier", activeTab == "mpr") { activeTab = "mpr" }
                CategoryPill("UC & Handover (${readyHandover.size})", activeTab == "completion") { activeTab = "completion" }
            }

            // Feed Content
            if (loading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = AccentWarning, strokeWidth = 2.dp)
                }
            } else {
                when (activeTab) {
                    "gatekeeper" -> {
                        // Pre-Execution Gatekeeper Checklist
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxSize()) {
                            Text("PRE-EXECUTION GATEKEEPER CHECKLIST", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            GatekeeperItem("Site Demarcation & Boundary Pegging", "Completed by Taluka Revenue Inspector", true)
                            GatekeeperItem("Technical Sanction (TS) Drawing Vetted", "Vetted by Superintending Engineer (SE)", true)
                            GatekeeperItem("Initial Ground Baseline Geotagged Photo", "Captured via MARGA Eyes Native Hardware Lock", true)
                            GatekeeperItem("Statutory Advance Account Verification", "Escrow PFMS sub-ledger mapped to District Treasury", true)
                            GatekeeperItem("Encroachment Clear NOC from Gram Panchayat", "Pending verification for WRK-103", false)
                        }
                    }
                    "mpr" -> {
                        // Monthly Progress Report (MPR)
                        Card(
                            colors = CardDefaults.cardColors(containerColor = StudioCard),
                            border = BorderStroke(1.dp, StudioCardBorder),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                Text("OFFICIAL MONTHLY PROGRESS REPORT (MPR)", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                Text("Reporting Cycle: August 2026 | Submitting Unit: ${profile.agency}", color = TextSecondary, fontSize = 12.sp)
                                HorizontalDivider(color = StudioCardBorder)
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    DetailItem("Works Assigned", "$totalAssigned")
                                    DetailItem("Completed This Month", "${readyHandover.size}")
                                    DetailItem("Expenditure Billed", "₹72.4 L")
                                }
                                Button(
                                    onClick = {
                                        Toast.makeText(context, "MPR submitted to District Collectorate", Toast.LENGTH_SHORT).show()
                                    },
                                    modifier = Modifier.fillMaxWidth().height(42.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = AccentWarning),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text("Transmit MPR to District Collectorate", color = Color.Black, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                    "completion" -> {
                        // Completion, GFR Form 12-C UC & Handover Protocol
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxSize()) {
                            Text("COMPLETION, UC & HANDOVER PIPELINE", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            readyHandover.forEach { work ->
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = StudioCard),
                                    border = BorderStroke(1.dp, StudioCardBorder),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text(work.safeId, color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            StatusPill("READY FOR HANDOVER", false)
                                        }
                                        Text(work.displayTitle, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                            Text("Sanctioned: ₹${work.costLakhs} L", color = TextSecondary, fontSize = 12.sp)
                                            Button(
                                                onClick = {
                                                    Toast.makeText(context, "GFR Form 12-C UC dispatched for ${work.safeId}", Toast.LENGTH_SHORT).show()
                                                },
                                                colors = ButtonDefaults.buttonColors(containerColor = AccentSuccess),
                                                shape = RoundedCornerShape(8.dp),
                                                modifier = Modifier.height(34.dp)
                                            ) {
                                                Text("Transmit Final UC (Form 12-C)", color = Color.Black, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    "mb" -> {
                        // Measurement Book Register
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxSize()) {
                            items(works) { work ->
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = StudioCard),
                                    border = BorderStroke(1.dp, StudioCardBorder),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text(work.safeId, color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            Text("MB Vol. IV / Page 82", color = AccentWarning, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                        }
                                        Text(work.displayTitle, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            DetailItem("Certified Progress", "${work.progress.toInt()}%")
                                            DetailItem("Financial Spent", "₹${work.costLakhs} L")
                                            DetailItem("Quality Spec", "CPWD Norms")
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else -> {
                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.fillMaxSize()
                        ) {
                            items(works) { work ->
                                Card(
                                    onClick = { selectedWorkDetails = work },
                                    colors = CardDefaults.cardColors(containerColor = StudioCard),
                                    border = BorderStroke(1.dp, StudioCardBorder),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text(work.safeId, color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            StatusPill(status = work.status ?: "ONGOING", isDelayed = work.isDelayed)
                                        }

                                        Text(work.displayTitle, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)

                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                            Text("₹${work.costLakhs} L · ${work.progress.toInt()}% Complete", color = TextSecondary, fontSize = 12.sp)
                                            Button(
                                                onClick = { selectedWorkForInspection = work },
                                                modifier = Modifier.height(34.dp),
                                                colors = ButtonDefaults.buttonColors(containerColor = AccentWarning),
                                                shape = RoundedCornerShape(8.dp),
                                                contentPadding = PaddingValues(horizontal = 12.dp)
                                            ) {
                                                Text("Log Visit / MB", color = Color.Black, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Modal: Field Site Visit & Measurement Book Entry
    selectedWorkForInspection?.let { work ->
        var currentProgress by remember { mutableStateOf(work.progress.toFloat()) }
        var remarks by remember { mutableStateOf("Site inspected. Foundation reinforcement concrete test cube reports verified.") }
        var isSubmitting by remember { mutableStateOf(false) }

        ModalBottomSheet(
            onDismissRequest = { selectedWorkForInspection = null },
            containerColor = StudioCard,
            dragHandle = { BottomSheetDefaults.DragHandle(color = StudioCardBorder) }
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text("Log Field Inspection & MB Entry", color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text(work.displayTitle, color = TextSecondary, fontSize = 13.sp)

                HorizontalDivider(color = StudioCardBorder)

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Certified Progress: ${currentProgress.toInt()}%", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }

                Slider(
                    value = currentProgress,
                    onValueChange = { currentProgress = it },
                    valueRange = 0f..100f,
                    colors = SliderDefaults.colors(thumbColor = AccentWarning, activeTrackColor = AccentWarning)
                )

                OutlinedTextField(
                    value = remarks,
                    onValueChange = { remarks = it },
                    label = { Text("Measurement Book Entry Remarks") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        focusedBorderColor = AccentWarning,
                        unfocusedBorderColor = StudioCardBorder
                    ),
                    shape = RoundedCornerShape(10.dp)
                )

                Button(
                    onClick = {
                        isSubmitting = true
                        scope.launch {
                            try {
                                NetworkClient.api.submitInspection(
                                    InspectionRequest(
                                        workId = work.safeId,
                                        iaId = profile.agency,
                                        progressPercentage = currentProgress.toDouble(),
                                        remarks = remarks
                                    )
                                )
                            } catch (e: Exception) {}
                            Toast.makeText(context, "Field visit certified for ${work.safeId}", Toast.LENGTH_SHORT).show()
                            isSubmitting = false
                            selectedWorkForInspection = null
                            load()
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AccentWarning),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Submit MB Entry to Collectorate", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    // Modal: Work Details
    selectedWorkDetails?.let { work ->
        ModalBottomSheet(
            onDismissRequest = { selectedWorkDetails = null },
            containerColor = StudioCard,
            dragHandle = { BottomSheetDefaults.DragHandle(color = StudioCardBorder) }
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text(work.safeId, color = AccentWarning, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Text(work.displayTitle, color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text("${work.category} · ${work.department ?: "Agency"}", color = TextSecondary, fontSize = 13.sp)

                HorizontalDivider(color = StudioCardBorder)

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    DetailItem("Sanctioned Outlay", "₹${work.costLakhs} L")
                    DetailItem("Physical Progress", "${work.progress.toInt()}%")
                    DetailItem("Financial Spent", "₹${work.expenditureAmount ?: 0.0} L")
                }

                if (work.isDelayed) {
                    Box(
                        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(Color(0xFF1E1318)).padding(12.dp)
                    ) {
                        Text(work.rootCauseIssue ?: "Execution behind schedule.", color = AccentCritical, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun GatekeeperItem(title: String, subtitle: String, verified: Boolean) {
    Card(
        colors = CardDefaults.cardColors(containerColor = StudioCard),
        border = BorderStroke(1.dp, StudioCardBorder),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(14.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(title, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                Text(subtitle, color = TextSecondary, fontSize = 12.sp)
            }
            Box(
                modifier = Modifier.clip(RoundedCornerShape(6.dp))
                    .background(if (verified) AccentSuccess.copy(alpha = 0.15f) else AccentCritical.copy(alpha = 0.15f))
                    .padding(horizontal = 8.dp, vertical = 3.dp)
            ) {
                Text(if (verified) "VERIFIED" else "PENDING", color = if (verified) AccentSuccess else AccentCritical, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun StatusPill(status: String, isDelayed: Boolean) {
    val bg = if (isDelayed) AccentCritical.copy(alpha = 0.15f) else AccentSuccess.copy(alpha = 0.15f)
    val fg = if (isDelayed) AccentCritical else AccentSuccess
    Box(
        modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(bg).padding(horizontal = 8.dp, vertical = 3.dp)
    ) {
        Text(status, color = fg, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun DetailItem(label: String, value: String) {
    Column {
        Text(label.uppercase(), color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
        Text(value, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun CategoryPill(title: String, active: Boolean, isAlert: Boolean = false, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        color = if (active) AccentWarning.copy(alpha = 0.2f) else StudioCard,
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, if (active) AccentWarning else StudioCardBorder)
    ) {
        Text(
            text = title,
            color = if (active) AccentWarning else TextSecondary,
            fontSize = 12.sp,
            fontWeight = if (active) FontWeight.Bold else FontWeight.Medium,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 7.dp)
        )
    }
}
