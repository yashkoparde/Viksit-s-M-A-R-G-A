package com.marga.app.state

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
            StateApp()
        }
    }
}

data class DistrictBench(
    val name: String,
    val totalWorks: Int,
    val completedWorks: Int,
    val utilizationPct: Double,
    val unspentCr: Double,
    val pendingUCs: Int,
    val scStShortfallLakhs: Double = 0.0
)

@Composable
fun StateApp() {
    var showCinematic by remember { mutableStateOf(true) }

    if (showCinematic) {
        CinematicOpeningScreen(
            appName = "MARGA State Nodal",
            roleSubtitle = "Planning & Programme Monitoring Department",
            accentColor = Color(0xFFA855F7),
            onComplete = { showCinematic = false }
        )
    } else {
        StateDashboard()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StateDashboard() {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var stateName by remember { mutableStateOf("Karnataka") }
    var activeTab by remember { mutableStateOf("districts") } // districts, briefing, audit, scst, compliance
    var selectedDistrictDetail by remember { mutableStateOf<DistrictBench?>(null) }

    val districts = listOf(
        DistrictBench("Mysuru", 54, 42, 82.4, 8.8, 4, 0.0),
        DistrictBench("Bengaluru Urban", 62, 40, 71.0, 14.5, 9, 12.5),
        DistrictBench("Belagavi", 48, 32, 68.5, 15.2, 7, 24.0),
        DistrictBench("Dharwad", 36, 28, 77.8, 8.0, 3, 0.0),
        DistrictBench("Kalaburagi", 44, 25, 59.0, 20.4, 12, 38.0)
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
                    Text("GOVERNMENT OF KARNATAKA", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 1.sp)
                    Text("State Nodal Authority", color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Text("Planning, Monitoring & Statistics Dept", color = TextSecondary, fontSize = 12.sp)
                }

                Box(
                    modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(StudioCard).border(1.dp, StudioCardBorder, RoundedCornerShape(8.dp)).padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Text("28 MPs Monitored", color = Color(0xFFA855F7), fontSize = 12.sp, fontWeight = FontWeight.Bold)
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
            // State Portfolio Absorption Card
            Card(
                colors = CardDefaults.cardColors(containerColor = StudioCard),
                border = BorderStroke(1.dp, StudioCardBorder),
                shape = RoundedCornerShape(14.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text("STATE STATUTORY ALLOCATION (28 MPs)", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                            Text("₹140.00 Cr", color = TextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("STATE UTILIZATION", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                            Text("74.2%", color = Color(0xFFA855F7), fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    LinearProgressIndicator(
                        progress = { 0.742f },
                        modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                        color = Color(0xFFA855F7),
                        trackColor = Color(0xFF1E2333)
                    )

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("1% Independent Sample Audit: 28/31 Districts Complete", color = TextSecondary, fontSize = 12.sp)
                        Text("Certified Spent: ₹103.88 Cr", color = TextSecondary, fontSize = 12.sp)
                    }
                }
            }

            // Tabs
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                CategoryPill("Scorecard", activeTab == "districts") { activeTab = "districts" }
                CategoryPill("Chief Sec Briefing", activeTab == "briefing") { activeTab = "briefing" }
                CategoryPill("1% State Audit", activeTab == "audit") { activeTab = "audit" }
                CategoryPill("SC/ST Quotas", activeTab == "scst") { activeTab = "scst" }
                CategoryPill("Form 12-C UCs", activeTab == "compliance") { activeTab = "compliance" }
            }

            when (activeTab) {
                "briefing" -> {
                    // Chief Secretary Briefing Dossier
                    Card(
                        colors = CardDefaults.cardColors(containerColor = StudioCard),
                        border = BorderStroke(1.dp, StudioCardBorder),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text("STATE MPLADS MONITORING BRIEFING DOCKET", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Text("Prepared for: Chief Secretary, Government of Karnataka | Session: Quarterly State Level Review Committee", color = TextSecondary, fontSize = 12.sp)
                            HorizontalDivider(color = StudioCardBorder)
                            Text("1. Total Cumulative Fund Allocation: ₹140.00 Cr | 2. Certified Expenditure Draw: ₹103.88 Cr (74.2%) | 3. Pending Form 12-C UCs: 35 pending certificates | 4. Action: Direct Deputy Commissioners to clear unspent balances.", color = TextSecondary, fontSize = 12.sp, lineHeight = 18.sp)
                            Button(
                                onClick = {
                                    Toast.makeText(context, "Briefing Docket transmitted to Chief Secretary Secretariat", Toast.LENGTH_SHORT).show()
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFA855F7)),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth().height(42.dp)
                            ) {
                                Text("Dispatch Dossier to Chief Secretary Office", color = Color.White, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
                "audit" -> {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxSize()) {
                        Text("1% INDEPENDENT STATE SAMPLE VERIFICATION (CHIEF ENGINEERS)", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        AuditCard("Mysuru District", "3 Works Sampled", "100% Verified (Geo-tagged)", AccentSuccess)
                        AuditCard("Bengaluru Urban", "4 Works Sampled", "100% Verified", AccentSuccess)
                        AuditCard("Kalaburagi", "3 Works Sampled", "1 Discrepancy Noted in Foundation Depth", AccentCritical)
                        AuditCard("Belagavi", "4 Works Sampled", "Technical compliance certified", AccentSuccess)
                    }
                }
                "scst" -> {
                    // SC/ST Statutory Fund Earmarking Compliance (15% SC, 7.5% ST)
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxSize()) {
                        Text("STATUTORY SC/ST FUND ALLOCATION COMPLIANCE (PARA 2.11)", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        districts.forEach { d ->
                            Card(
                                colors = CardDefaults.cardColors(containerColor = StudioCard),
                                border = BorderStroke(1.dp, StudioCardBorder),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(16.dp).fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(d.name, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                        Text(if (d.scStShortfallLakhs > 0) "Shortfall: ₹${d.scStShortfallLakhs} Lakhs" else "Mandatory 22.5% quota fulfilled", color = if (d.scStShortfallLakhs > 0) AccentCritical else AccentSuccess, fontSize = 12.sp)
                                    }
                                    if (d.scStShortfallLakhs > 0) {
                                        Button(
                                            onClick = {
                                                Toast.makeText(context, "Statutory SC/ST directive issued to ${d.name}", Toast.LENGTH_SHORT).show()
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = AccentCritical),
                                            shape = RoundedCornerShape(8.dp),
                                            modifier = Modifier.height(32.dp)
                                        ) {
                                            Text("Issue Directive", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        }
                                    } else {
                                        Text("COMPLIANT", color = AccentSuccess, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }
                "compliance" -> {
                    // Form 12-C Utilization Certificates Backlog
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxSize()) {
                        Text("GFR FORM 12-C UTILISATION CERTIFICATE AGING", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        districts.forEach { d ->
                            Card(
                                colors = CardDefaults.cardColors(containerColor = StudioCard),
                                border = BorderStroke(1.dp, StudioCardBorder),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(16.dp).fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(d.name, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                        Text("${d.pendingUCs} Certificates Pending Reconciliation", color = TextSecondary, fontSize = 12.sp)
                                    }
                                    Text("₹${d.unspentCr} Cr Unspent", color = if (d.pendingUCs > 5) AccentWarning else TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
                else -> {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxSize()) {
                        items(districts) { d ->
                            Card(
                                onClick = { selectedDistrictDetail = d },
                                colors = CardDefaults.cardColors(containerColor = StudioCard),
                                border = BorderStroke(1.dp, StudioCardBorder),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text(d.name, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                                        Text("${d.utilizationPct}%", color = Color(0xFFA855F7), fontSize = 15.sp, fontWeight = FontWeight.Bold)
                                    }
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        DetailItem("Works Completed", "${d.completedWorks} / ${d.totalWorks}")
                                        DetailItem("Unspent Balance", "₹${d.unspentCr} Cr")
                                        DetailItem("Pending UCs", "${d.pendingUCs}")
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Modal: District Detailed Dossier
    selectedDistrictDetail?.let { d ->
        ModalBottomSheet(
            onDismissRequest = { selectedDistrictDetail = null },
            containerColor = StudioCard,
            dragHandle = { BottomSheetDefaults.DragHandle(color = StudioCardBorder) }
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text("${d.name} District Dossier", color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text("State Performance & Compliance Profile", color = TextSecondary, fontSize = 13.sp)

                HorizontalDivider(color = StudioCardBorder)

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    DetailItem("Total Works", "${d.totalWorks}")
                    DetailItem("Completed Works", "${d.completedWorks}")
                    DetailItem("Absorption %", "${d.utilizationPct}%")
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    DetailItem("Unspent Pool", "₹${d.unspentCr} Cr")
                    DetailItem("Pending Form 12-C", "${d.pendingUCs}")
                    DetailItem("SC/ST Shortfall", "₹${d.scStShortfallLakhs} L")
                }

                Button(
                    onClick = {
                        Toast.makeText(context, "State review summons dispatched to Deputy Commissioner of ${d.name}", Toast.LENGTH_SHORT).show()
                        selectedDistrictDetail = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFA855F7)),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth().height(46.dp)
                ) {
                    Text("Convene Review with Deputy Commissioner", color = Color.White, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun AuditCard(district: String, sample: String, status: String, accent: Color) {
    Card(
        colors = CardDefaults.cardColors(containerColor = StudioCard),
        border = BorderStroke(1.dp, StudioCardBorder),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(modifier = Modifier.padding(16.dp).fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column {
                Text(district, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                Text(sample, color = TextSecondary, fontSize = 12.sp)
            }
            Text(status, color = accent, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
fun CategoryPill(title: String, active: Boolean, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        color = if (active) Color(0xFFA855F7).copy(alpha = 0.2f) else StudioCard,
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, if (active) Color(0xFFA855F7) else StudioCardBorder)
    ) {
        Text(
            text = title,
            color = if (active) Color(0xFFA855F7) else TextSecondary,
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
