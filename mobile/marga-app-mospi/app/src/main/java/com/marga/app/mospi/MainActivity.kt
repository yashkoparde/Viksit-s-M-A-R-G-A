package com.marga.app.mospi

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MoSPIApp()
        }
    }
}

data class DiscrepancyItem(
    val id: String,
    val district: String,
    val state: String,
    val issue: String,
    val reportedCr: Double,
    val projectLedgerCr: Double,
    val varianceCr: Double
)

@Composable
fun MoSPIApp() {
    var showCinematic by remember { mutableStateOf(true) }

    if (showCinematic) {
        CinematicOpeningScreen(
            appName = "MARGA MoSPI Apex",
            roleSubtitle = "Ministry of Statistics & Programme Implementation",
            accentColor = AccentPrimary,
            onComplete = { showCinematic = false }
        )
    } else {
        MoSPIDashboard()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MoSPIDashboard() {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var mps by remember { mutableStateOf<List<MPSummary>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var activeTab by remember { mutableStateOf("macro") } // macro, rankings, triage, integrity, systemic
    var selectedMPDetail by remember { mutableStateOf<MPSummary?>(null) }

    fun load() {
        loading = true
        scope.launch {
            try {
                val res = NetworkClient.api.getMPs(limit = 40)
                if (res.isSuccessful && res.body()?.data?.isNotEmpty() == true) {
                    mps = res.body()?.data ?: emptyList()
                } else {
                    throw Exception("Fallback")
                }
            } catch (e: Exception) {
                mps = listOf(
                    MPSummary(mpId = "MP-101", name = "Sri Yaduveer Wadiyar", constituency = "Mysuru", state = "Karnataka", house = "Lok Sabha", allocatedAmount = 50000000.0, totalExpenditure = 41200000.0, unspentAmount = 8800000.0, utilizationRate = 82.4, completedWorks = 34, recommendedWorks = 42),
                    MPSummary(mpId = "MP-102", name = "Dr. Shashi Tharoor", constituency = "Thiruvananthapuram", state = "Kerala", house = "Lok Sabha", allocatedAmount = 50000000.0, totalExpenditure = 38500000.0, unspentAmount = 11500000.0, utilizationRate = 77.0, completedWorks = 28, recommendedWorks = 36),
                    MPSummary(mpId = "MP-103", name = "Smt. Supriya Sule", constituency = "Baramati", state = "Maharashtra", house = "Lok Sabha", allocatedAmount = 50000000.0, totalExpenditure = 36200000.0, unspentAmount = 13800000.0, utilizationRate = 72.4, completedWorks = 31, recommendedWorks = 40),
                    MPSummary(mpId = "MP-104", name = "Sri Tejasvi Surya", constituency = "Bengaluru South", state = "Karnataka", house = "Lok Sabha", allocatedAmount = 50000000.0, totalExpenditure = 34100000.0, unspentAmount = 15900000.0, utilizationRate = 68.2, completedWorks = 22, recommendedWorks = 33),
                    MPSummary(mpId = "MP-105", name = "Dr. K. Keshava Rao", constituency = "Telangana", state = "Telangana", house = "Rajya Sabha", allocatedAmount = 50000000.0, totalExpenditure = 31500000.0, unspentAmount = 18500000.0, utilizationRate = 63.0, completedWorks = 19, recommendedWorks = 30)
                )
            } finally {
                delay(200)
                loading = false
            }
        }
    }

    LaunchedEffect(Unit) { load() }

    val discrepancies = listOf(
        DiscrepancyItem("DISC-01", "Pune", "Maharashtra", "Voucher Aggregation Gap: Reported expenditure exceeds sum of vetted vouchers", 32.4, 30.55, 1.85),
        DiscrepancyItem("DISC-02", "Gadchiroli", "Maharashtra", "Bank Interest Uncredited: Accrued interest on pool account pending return to CFI", 18.2, 17.75, 0.45),
        DiscrepancyItem("DISC-03", "Siwan", "Bihar", "Form 12-C Variance: Physical MB totals diverge from Form 12-C certified utilization", 24.6, 23.68, 0.92)
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
                    Text("GOVERNMENT OF INDIA", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 1.sp)
                    Text("MoSPI Apex Portal", color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Text("National MPLADS Monitoring Wing", color = TextSecondary, fontSize = 12.sp)
                }

                IconButton(
                    onClick = { load() },
                    modifier = Modifier.size(36.dp).clip(CircleShape).background(StudioCard).border(1.dp, StudioCardBorder, CircleShape)
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = TextSecondary, modifier = Modifier.size(18.dp))
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
            // National Macro Absorption KPI
            Card(
                colors = CardDefaults.cardColors(containerColor = StudioCard),
                border = BorderStroke(1.dp, StudioCardBorder),
                shape = RoundedCornerShape(14.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text("CENTRAL STATUTORY RELEASE (UNION POOL)", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                            Text("₹3,980.00 Cr", color = TextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("NATIONAL ABSORPTION", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                            Text("71.3%", color = AccentPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    LinearProgressIndicator(
                        progress = { 0.713f },
                        modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                        color = AccentPrimary,
                        trackColor = Color(0xFF1E2333)
                    )

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Certified Expenditure: ₹2,840.50 Cr", color = TextSecondary, fontSize = 12.sp)
                        Text("774 MPs · 780 Districts Monitored", color = TextSecondary, fontSize = 12.sp)
                    }
                }
            }

            // Tabs
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                CategoryPill("Macro Pulse", activeTab == "macro") { activeTab = "macro" }
                CategoryPill("MP Utilization (${mps.size})", activeTab == "rankings") { activeTab = "rankings" }
                CategoryPill("Pre-Audit Triage", activeTab == "triage") { activeTab = "triage" }
                CategoryPill("Integrity Reconcile", activeTab == "integrity") { activeTab = "integrity" }
                CategoryPill("Systemic Risk", activeTab == "systemic") { activeTab = "systemic" }
            }

            if (loading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = AccentPrimary, strokeWidth = 2.dp)
                }
            } else {
                when (activeTab) {
                    "macro" -> {
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxSize()) {
                            Text("STATE STATUTORY ABSORPTION TIERS", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            StateMacroCard("Karnataka", "28 MPs · ₹140.0 Cr", "82.4% Absorbed", AccentSuccess)
                            StateMacroCard("Maharashtra", "48 MPs · ₹240.0 Cr", "74.8% Absorbed", AccentPrimary)
                            StateMacroCard("Kerala", "20 MPs · ₹100.0 Cr", "77.0% Absorbed", AccentSuccess)
                            StateMacroCard("Bihar", "40 MPs · ₹200.0 Cr", "61.5% Absorbed", AccentWarning)
                            StateMacroCard("Uttar Pradesh", "111 MPs · ₹555.0 Cr", "51.2% Absorbed", AccentWarning)
                        }
                    }
                    "triage" -> {
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxSize()) {
                            Text("CAG / MINISTRY PRE-AUDIT TRIAGE", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            TriageCard(
                                "WRK-1042 · Community Hall",
                                "Pune (Maharashtra) · ₹65.0 L",
                                "Disbursement +42.8 pp ahead of physical milestone; 74 days stalled",
                                AccentCritical
                            ) {
                                Toast.makeText(context, "Referred WRK-1042 to CAG Audit Division", Toast.LENGTH_SHORT).show()
                            }
                            TriageCard(
                                "WRK-1044 · Science Block",
                                "Pune (Maharashtra) · ₹28.0 L",
                                "Vendor advance unadjusted beyond 60-day statutory threshold (GFR Rule 172)",
                                AccentWarning
                            ) {
                                Toast.makeText(context, "Treasury reconciliation notice issued", Toast.LENGTH_SHORT).show()
                            }
                            TriageCard(
                                "WRK-1051 · Rural Health Center",
                                "Siwan (Bihar) · ₹50.0 L",
                                "Disbursement processed without mandatory timestamped geotagged inspection photo",
                                AccentWarning
                            ) {
                                Toast.makeText(context, "Physical audit ordered", Toast.LENGTH_SHORT).show()
                            }
                        }
                    }
                    "integrity" -> {
                        // Data Integrity & Treasury Reconciliation Monitor
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxSize()) {
                            Text("TREASURY DISCREPANCY & RECONCILIATION MONITOR", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            discrepancies.forEach { disc ->
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = StudioCard),
                                    border = BorderStroke(1.dp, StudioCardBorder),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text("${disc.district}, ${disc.state}", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                            Text("Gap: ₹${disc.varianceCr} Cr", color = AccentCritical, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        }
                                        Text(disc.issue, color = TextSecondary, fontSize = 12.sp)
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                            Text("Reported: ₹${disc.reportedCr} Cr | Vouchers: ₹${disc.projectLedgerCr} Cr", color = TextSecondary, fontSize = 12.sp)
                                            Button(
                                                onClick = {
                                                    Toast.makeText(context, "Statutory freeze order dispatched to ${disc.district} Treasury", Toast.LENGTH_SHORT).show()
                                                },
                                                colors = ButtonDefaults.buttonColors(containerColor = AccentCritical),
                                                shape = RoundedCornerShape(8.dp),
                                                modifier = Modifier.height(32.dp)
                                            ) {
                                                Text("Freeze Release", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    "systemic" -> {
                        // Systemic Risk & Cartelization Detector
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxSize()) {
                            Text("SYSTEMIC ANOMALIES & COST OUTLIERS", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            SystemicCard("Category Cost Z-Score Outlier (+3.4σ)", "WRK-1042 Sanctioned at ₹2,031/sq.ft vs Regional Mean of ₹1,420 ± ₹180/sq.ft")
                            SystemicCard("Contractor Monopoly Concentration", "Single executing contractor holds 64% of civil works across 3 adjacent districts")
                            SystemicCard("Fiscal Year-End Sanction Clustering", "48% of total annual sanctions executed in final 10 days of fiscal year")
                        }
                    }
                    else -> {
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxSize()) {
                            items(mps) { mp ->
                                Card(
                                    onClick = { selectedMPDetail = mp },
                                    colors = CardDefaults.cardColors(containerColor = StudioCard),
                                    border = BorderStroke(1.dp, StudioCardBorder),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text(mp.name ?: "Hon'ble MP", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                            Text("${mp.utilizationRate?.toInt() ?: 0}%", color = AccentPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                        }
                                        Text("${mp.constituency} (${mp.state}) · ${mp.house}", color = TextSecondary, fontSize = 12.sp)
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            DetailItem("Allocated", "₹5.00 Cr")
                                            DetailItem("Spent", "₹${String.format("%.2f", (mp.totalExpenditure ?: 0.0) / 10000000.0)} Cr")
                                            DetailItem("Works", "${mp.completedWorks}/${mp.recommendedWorks}")
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

    // Modal: MP Portfolio Detail
    selectedMPDetail?.let { mp ->
        ModalBottomSheet(
            onDismissRequest = { selectedMPDetail = null },
            containerColor = StudioCard,
            dragHandle = { BottomSheetDefaults.DragHandle(color = StudioCardBorder) }
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text(mp.name ?: "Hon'ble MP", color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text("${mp.constituency} (${mp.state}) · ${mp.house}", color = TextSecondary, fontSize = 13.sp)

                HorizontalDivider(color = StudioCardBorder)

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    DetailItem("Allocated Quota", "₹5.00 Cr")
                    DetailItem("Total Spent", "₹${String.format("%.2f", (mp.totalExpenditure ?: 0.0) / 10000000.0)} Cr")
                    DetailItem("Unspent Balance", "₹${String.format("%.2f", (mp.unspentAmount ?: 0.0) / 10000000.0)} Cr")
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    DetailItem("Recommended Works", "${mp.recommendedWorks}")
                    DetailItem("Completed Works", "${mp.completedWorks}")
                    DetailItem("Utilization", "${mp.utilizationRate?.toInt() ?: 0}%")
                }
            }
        }
    }
}

@Composable
fun StateMacroCard(state: String, info: String, rate: String, accent: Color) {
    Card(
        colors = CardDefaults.cardColors(containerColor = StudioCard),
        border = BorderStroke(1.dp, StudioCardBorder),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(modifier = Modifier.padding(16.dp).fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column {
                Text(state, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                Text(info, color = TextSecondary, fontSize = 12.sp)
            }
            Text(rate, color = accent, fontSize = 14.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun TriageCard(title: String, location: String, issue: String, accent: Color, onAudit: () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = StudioCard),
        border = BorderStroke(1.dp, StudioCardBorder),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(title, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                Text(location, color = TextSecondary, fontSize = 12.sp)
            }
            Text(issue, color = accent, fontSize = 12.sp, lineHeight = 16.sp)
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                Button(
                    onClick = onAudit,
                    colors = ButtonDefaults.buttonColors(containerColor = AccentPrimary),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.height(32.dp)
                ) {
                    Text("Refer to CAG", color = Color.Black, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun SystemicCard(title: String, desc: String) {
    Card(
        colors = CardDefaults.cardColors(containerColor = StudioCard),
        border = BorderStroke(1.dp, StudioCardBorder),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(title, color = AccentWarning, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Text(desc, color = TextSecondary, fontSize = 12.sp, lineHeight = 16.sp)
        }
    }
}

@Composable
fun CategoryPill(title: String, active: Boolean, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        color = if (active) AccentPrimary.copy(alpha = 0.2f) else StudioCard,
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, if (active) AccentPrimary else StudioCardBorder)
    ) {
        Text(
            text = title,
            color = if (active) AccentPrimary else TextSecondary,
            fontSize = 12.sp,
            fontWeight = if (active) FontWeight.Bold else FontWeight.Medium,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 7.dp)
        )
    }
}

@Composable
fun DetailItem(label: String, value: String) {
    Column {
        Text(label.uppercase(), color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
        Text(value, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
    }
}
