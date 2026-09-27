package com.marga.app.da

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
import androidx.compose.material.icons.automirrored.filled.*
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
            DAApp()
        }
    }
}

data class DAPortfolio(
    val id: String,
    val title: String,
    val district: String,
    val state: String,
    val quotaInspectionTarget: Int = 24
)

val DA_PROFILES = listOf(
    DAPortfolio("DA-1", "District Magistrate & Collector", "Mysuru", "Karnataka", 24),
    DAPortfolio("DA-2", "District Collector & Magistrate", "Pune", "Maharashtra", 32),
    DAPortfolio("DA-3", "District Collector", "Thiruvananthapuram", "Kerala", 18),
    DAPortfolio("DA-4", "District Magistrate", "Siwan", "Bihar", 22)
)

data class AgencyPerf(
    val name: String,
    val activeWorks: Int,
    val totalCr: Double,
    val delayedWorks: Int,
    val riskScore: Int
)

@Composable
fun DAApp() {
    var showCinematic by remember { mutableStateOf(true) }
    var profile by remember { mutableStateOf(DA_PROFILES[0]) }
    var inLogin by remember { mutableStateOf(false) }

    if (showCinematic) {
        CinematicOpeningScreen(
            appName = "MARGA Collector",
            roleSubtitle = "District Authority Operational Console",
            accentColor = AccentSuccess,
            onComplete = { showCinematic = false }
        )
    } else {
        AnimatedContent(
            targetState = inLogin,
            transitionSpec = { fadeIn(tween(250)) togetherWith fadeOut(tween(200)) },
            label = "AuthNav"
        ) { isLoggingIn ->
            if (isLoggingIn) {
                DALoginScreen(
                    current = profile,
                    onSuccess = { selected ->
                        profile = selected
                        inLogin = false
                    }
                )
            } else {
                DADashboard(
                    profile = profile,
                    onSwitchProfile = { inLogin = true }
                )
            }
        }
    }
}

@Composable
fun DALoginScreen(current: DAPortfolio, onSuccess: (DAPortfolio) -> Unit) {
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
                Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(AccentSuccess))
                Text("MARGA / DISTRICT AUTHORITY", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 1.sp)
            }

            Text("Collectorate Sign-In", color = TextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Text("Select District Magistrate jurisdiction to review statutory sanctions and inspect active works.", color = TextSecondary, fontSize = 13.sp, lineHeight = 18.sp)

            Spacer(Modifier.height(4.dp))

            Text("DISTRICT JURISDICTION", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
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
                            Text("${selected.district} District", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                            Text("${selected.title} · ${selected.state}", color = TextSecondary, fontSize = 12.sp)
                        }
                        Icon(Icons.Default.KeyboardArrowDown, contentDescription = "Open", tint = TextSecondary)
                    }
                }

                DropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false },
                    modifier = Modifier.background(StudioCard).border(1.dp, StudioCardBorder)
                ) {
                    DA_PROFILES.forEach { p ->
                        DropdownMenuItem(
                            text = {
                                Column {
                                    Text(p.district, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                                    Text("${p.district}, ${p.state}", color = TextSecondary, fontSize = 12.sp)
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
                    focusedBorderColor = AccentSuccess,
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
                colors = ButtonDefaults.buttonColors(containerColor = AccentSuccess),
                shape = RoundedCornerShape(10.dp)
            ) {
                if (loading) {
                    CircularProgressIndicator(color = Color.Black, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                } else {
                    Text("Access Collector Console", color = Color.Black, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DADashboard(profile: DAPortfolio, onSwitchProfile: () -> Unit) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var works by remember { mutableStateOf<List<WorkItem>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var activeTab by remember { mutableStateOf("action") } // action, inbox, tour, compliance, agencies, all
    var reviewModalWork by remember { mutableStateOf<WorkItem?>(null) }
    var selectedDetailWork by remember { mutableStateOf<WorkItem?>(null) }
    var showRejectDialog by remember { mutableStateOf(false) }
    var rejectionReason by remember { mutableStateOf("") }

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
                    WorkItem(workId = "REC-MYS-1", rawId = "1", description = "Elevated Water Reservoir (50 kL)", category = "Water Supply", mpName = "Hon'ble MP", constituency = profile.district, district = profile.district, state = profile.state, recommendedAmount = 35.0, sanctionedAmount = 35.0, disbursedAmount = 0.0, expenditureAmount = 0.0, status = "RECOMMENDED", physicalProgress = 0.0, financialProgress = 0.0, department = "Rural Drinking Water"),
                    WorkItem(workId = "REC-MYS-2", rawId = "2", description = "Smart Classrooms in 4 PU Colleges", category = "Education", mpName = "Hon'ble MP", constituency = profile.district, district = profile.district, state = profile.state, recommendedAmount = 24.0, sanctionedAmount = 24.0, disbursedAmount = 24.0, expenditureAmount = 24.0, status = "ONGOING", physicalProgress = 70.0, financialProgress = 70.0, department = "Public Works"),
                    WorkItem(workId = "REC-MYS-3", rawId = "3", description = "Emergency Trauma Care Bed Wing", category = "Health", mpName = "Hon'ble MP", constituency = profile.district, district = profile.district, state = profile.state, recommendedAmount = 40.0, sanctionedAmount = 40.0, disbursedAmount = 40.0, expenditureAmount = 40.0, status = "DELAYED", physicalProgress = 20.0, financialProgress = 45.0, department = "Health Dept", daysInCurrentStage = 65, riskScore = 78, rootCauseIssue = "Advance payment +25 pp ahead of certified physical milestone; SDO site visit overdue"),
                    WorkItem(workId = "REC-MYS-4", rawId = "4", description = "Solid Waste Bio-Digester Plant", category = "Sanitation", mpName = "Hon'ble MP", constituency = profile.district, district = profile.district, state = profile.state, recommendedAmount = 18.0, sanctionedAmount = 18.0, disbursedAmount = 18.0, expenditureAmount = 18.0, status = "COMPLETED", physicalProgress = 100.0, financialProgress = 100.0, department = "Zilla Panchayat"),
                    WorkItem(workId = "REC-MYS-5", rawId = "5", description = "Solar High-Mast Lighting System", category = "Energy", mpName = "Hon'ble MP", constituency = profile.district, district = profile.district, state = profile.state, recommendedAmount = 12.0, sanctionedAmount = 0.0, disbursedAmount = 0.0, expenditureAmount = 0.0, status = "RECOMMENDED", physicalProgress = 0.0, financialProgress = 0.0, department = "KREDL Division")
                )
            } finally {
                delay(200)
                loading = false
            }
        }
    }

    LaunchedEffect(profile.district) { load() }

    val pendingInbox = works.filter { it.status == "RECOMMENDED" || (it.sanctionedAmount ?: 0.0) == 0.0 }
    val delayedWorks = works.filter { it.isDelayed }
    val completedInspections = 18
    val quotaTarget = profile.quotaInspectionTarget

    val agencies = listOf(
        AgencyPerf("Public Works Division (PWD)", 14, 4.80, 2, 38),
        AgencyPerf("Rural Drinking Water (RDWSD)", 9, 3.10, 3, 72),
        AgencyPerf("Zilla Panchayat Engineering Wing", 11, 2.65, 0, 24),
        AgencyPerf("KREDL Renewable Division", 6, 1.20, 1, 40)
    )

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
                    Text("MARGA / DISTRICT AUTHORITY", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 1.sp)
                    Text("${profile.district} District", color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Text(profile.title, color = TextSecondary, fontSize = 12.sp)
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
            // Statutory 10% Inspection Quota Tracker (MPLADS Para 5.1)
            Card(
                colors = CardDefaults.cardColors(containerColor = StudioCard),
                border = BorderStroke(1.dp, StudioCardBorder),
                shape = RoundedCornerShape(14.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text("ANNUAL 10% STATUTORY INSPECTION QUOTA", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                            Text("$completedInspections / $quotaTarget Works", color = TextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("STATUTORY STATUS", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                            Text("75% Achieved", color = AccentSuccess, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    LinearProgressIndicator(
                        progress = { (completedInspections.toFloat() / quotaTarget).coerceIn(0f, 1f) },
                        modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                        color = AccentSuccess,
                        trackColor = Color(0xFF1E2333)
                    )

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Mandatory: DA physically inspects >=10% works annually", color = TextSecondary, fontSize = 12.sp)
                        Text("6 Sites Remaining", color = AccentWarning, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            // Quick Category Pills
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                CategoryPill("Requires Action (${delayedWorks.size})", activeTab == "action", isAlert = delayedWorks.isNotEmpty()) { activeTab = "action" }
                CategoryPill("Sanction Inbox (${pendingInbox.size})", activeTab == "inbox") { activeTab = "inbox" }
                CategoryPill("3-Day Tour", activeTab == "tour") { activeTab = "tour" }
                CategoryPill("Agencies (${agencies.size})", activeTab == "agencies") { activeTab = "agencies" }
                CategoryPill("All Works (${works.size})", activeTab == "all") { activeTab = "all" }
            }

            // Feed Content
            if (loading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = AccentSuccess, strokeWidth = 2.dp)
                }
            } else {
                when (activeTab) {
                    "action" -> {
                        // Requires Action Now Queue
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxSize()) {
                            Text("STATUTORY ORDERS PENDING COLLECTOR SIGN-OFF", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            delayedWorks.forEach { work ->
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = StudioCard),
                                    border = BorderStroke(1.dp, StudioCardBorder),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text(work.safeId, color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            StatusPill("DISCREPANCY DETECTED", true)
                                        }
                                        Text(work.displayTitle, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                                        Text(work.rootCauseIssue ?: "Milestone draw running ahead of physical execution.", color = AccentCritical, fontSize = 12.sp)

                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                            Text("Agency: ${work.department ?: "PWD"}", color = TextSecondary, fontSize = 12.sp)
                                            Button(
                                                onClick = {
                                                    Toast.makeText(context, "Show-Cause notice dispatched for ${work.safeId}", Toast.LENGTH_SHORT).show()
                                                },
                                                colors = ButtonDefaults.buttonColors(containerColor = AccentCritical),
                                                shape = RoundedCornerShape(8.dp),
                                                modifier = Modifier.height(34.dp)
                                            ) {
                                                Text("Issue Show-Cause", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    "tour" -> {
                        // 3-Day Inspection Tour Generator Feature
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxSize()) {
                            Text("OPTIMIZED 3-DAY GEOSPATIAL INSPECTION ROUTE", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            TourDayCard("Day 1: Rural Drinking Water Cluster", "4 Sites · 38 km route", listOf("Elevated Water Reservoir", "RO Water Unit #4"), AccentSuccess)
                            TourDayCard("Day 2: Primary Health & Education", "3 Sites · 42 km route", listOf("PU College Science Wing", "Maternity Sub-Center"), AccentPrimary)
                            TourDayCard("Day 3: Road Infrastructure & Sanitation", "5 Sites · 51 km route", listOf("Zilla Panchayat Waste Plant", "Asphalt Link Road"), AccentWarning)
                        }
                    }
                    "agencies" -> {
                        // Implementing Agency Concentration & Risk Scorecard
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxSize()) {
                            items(agencies) { agency ->
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = StudioCard),
                                    border = BorderStroke(1.dp, StudioCardBorder),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text(agency.name, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                            Text("Risk: ${agency.riskScore}/100", color = if (agency.riskScore > 50) AccentCritical else AccentSuccess, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        }
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            DetailItem("Active Works", "${agency.activeWorks}")
                                            DetailItem("Sanctioned", "₹${agency.totalCr} Cr")
                                            DetailItem("Delayed", "${agency.delayedWorks}")
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else -> {
                        val display = if (activeTab == "inbox") pendingInbox else works
                        if (display.isEmpty()) {
                            Box(modifier = Modifier.fillMaxSize().padding(32.dp), contentAlignment = Alignment.Center) {
                                Text("No pending sanctions in this queue.", color = TextSecondary, fontSize = 13.sp)
                            }
                        } else {
                            LazyColumn(
                                verticalArrangement = Arrangement.spacedBy(10.dp),
                                modifier = Modifier.fillMaxSize()
                            ) {
                                items(display) { work ->
                                    CleanDACard(
                                        work = work,
                                        onReview = { reviewModalWork = work },
                                        onDetail = { selectedDetailWork = work }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Modal: Formal Sanction Review (AS/TS)
    reviewModalWork?.let { work ->
        var feasible by remember { mutableStateOf(true) }
        var isSubmitting by remember { mutableStateOf(false) }

        ModalBottomSheet(
            onDismissRequest = { reviewModalWork = null },
            containerColor = StudioCard,
            dragHandle = { BottomSheetDefaults.DragHandle(color = StudioCardBorder) }
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text("Administrative Sanction Order", color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text(work.displayTitle, color = TextSecondary, fontSize = 14.sp)

                HorizontalDivider(color = StudioCardBorder)

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    DetailItem("Recommended", "₹${work.costLakhs} L")
                    DetailItem("Category", work.category ?: "General")
                    DetailItem("Department", work.department ?: "PWD")
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = feasible,
                        onCheckedChange = { feasible = it },
                        colors = CheckboxDefaults.colors(checkedColor = AccentSuccess)
                    )
                    Text("Technical & Financial Feasibility Verified (CPWD/State PWD Norms)", color = TextPrimary, fontSize = 13.sp)
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedButton(
                        onClick = {
                            showRejectDialog = true
                        },
                        modifier = Modifier.weight(1f).height(48.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = AccentCritical),
                        border = BorderStroke(1.dp, AccentCritical),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("Reject Order", fontWeight = FontWeight.Bold)
                    }

                    Button(
                        onClick = {
                            isSubmitting = true
                            scope.launch {
                                try {
                                    NetworkClient.api.submitDAReview(
                                        DAReviewRequest(
                                            workId = work.safeId,
                                            feasible = feasible,
                                            estimatedTimeMonths = 6,
                                            prohibited = false,
                                            remarks = "Administrative Sanction accorded under Section 3.1",
                                            reviewedBy = profile.title
                                        )
                                    )
                                } catch (e: Exception) {}
                                Toast.makeText(context, "Sanction Order Accorded for ${work.safeId}", Toast.LENGTH_SHORT).show()
                                isSubmitting = false
                                reviewModalWork = null
                                load()
                            }
                        },
                        modifier = Modifier.weight(2f).height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = AccentSuccess),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("Accord Sanction (AS)", color = Color.Black, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    // Modal: Work Detail Sheet
    selectedDetailWork?.let { work ->
        ModalBottomSheet(
            onDismissRequest = { selectedDetailWork = null },
            containerColor = StudioCard,
            dragHandle = { BottomSheetDefaults.DragHandle(color = StudioCardBorder) }
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text(work.safeId, color = AccentSuccess, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Text(work.displayTitle, color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text("${work.category} · ${work.department ?: "Agency"}", color = TextSecondary, fontSize = 13.sp)

                HorizontalDivider(color = StudioCardBorder)

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    DetailItem("Sanctioned Outlay", "₹${work.costLakhs} L")
                    DetailItem("Physical Progress", "${work.progress.toInt()}%")
                    DetailItem("Disbursed", "₹${work.disbursedAmount ?: 0.0} L")
                }

                if (work.isDelayed) {
                    Box(
                        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(Color(0xFF1E1318)).padding(12.dp)
                    ) {
                        Text(work.rootCauseIssue ?: "Delay flagged: site inspection required.", color = AccentCritical, fontSize = 12.sp)
                    }
                }
            }
        }
    }

    // Rejection Dialog
    if (showRejectDialog) {
        AlertDialog(
            onDismissRequest = { showRejectDialog = false },
            containerColor = StudioCard,
            title = { Text("Statutory Rejection Notice", color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Enter statutory guideline justification clause (MPLADS Para 2.1) to reject recommendation.", color = TextSecondary, fontSize = 12.sp)
                    OutlinedTextField(
                        value = rejectionReason,
                        onValueChange = { rejectionReason = it },
                        label = { Text("Justification Clause") },
                        placeholder = { Text("e.g. Prohibited works on private trust premises") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary,
                            focusedBorderColor = AccentCritical,
                            unfocusedBorderColor = StudioCardBorder
                        ),
                        shape = RoundedCornerShape(8.dp)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        Toast.makeText(context, "Recommendation rejected with official notice to MP office", Toast.LENGTH_SHORT).show()
                        showRejectDialog = false
                        reviewModalWork = null
                        load()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AccentCritical)
                ) {
                    Text("Confirm Rejection", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { showRejectDialog = false }) {
                    Text("Cancel", color = TextSecondary)
                }
            }
        )
    }
}

@Composable
fun TourDayCard(title: String, stats: String, sites: List<String>, accent: Color) {
    Card(
        colors = CardDefaults.cardColors(containerColor = StudioCard),
        border = BorderStroke(1.dp, StudioCardBorder),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(title, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                Text(stats, color = accent, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            }
            sites.forEach { site ->
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Box(modifier = Modifier.size(5.dp).clip(CircleShape).background(accent))
                    Text(site, color = TextSecondary, fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
fun CleanDACard(work: WorkItem, onReview: () -> Unit, onDetail: () -> Unit) {
    Card(
        onClick = onDetail,
        colors = CardDefaults.cardColors(containerColor = StudioCard),
        border = BorderStroke(1.dp, StudioCardBorder),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(work.safeId, color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Text("₹${work.costLakhs} L", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            }

            Text(work.displayTitle, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(work.department ?: "PWD", color = TextSecondary, fontSize = 12.sp)
                Button(
                    onClick = onReview,
                    modifier = Modifier.height(34.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AccentSuccess),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(horizontal = 14.dp)
                ) {
                    Text("Sanction (AS)", color = Color.Black, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun CategoryPill(title: String, active: Boolean, isAlert: Boolean = false, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        color = if (active) (if (isAlert) AccentCritical.copy(alpha = 0.2f) else AccentSuccess.copy(alpha = 0.2f)) else StudioCard,
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, if (active) (if (isAlert) AccentCritical else AccentSuccess) else StudioCardBorder)
    ) {
        Text(
            text = title,
            color = if (active) (if (isAlert) AccentCritical else AccentSuccess) else TextSecondary,
            fontSize = 12.sp,
            fontWeight = if (active) FontWeight.Bold else FontWeight.Medium,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 7.dp)
        )
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
        Text(value, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
    }
}
