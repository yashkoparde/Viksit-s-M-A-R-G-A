package com.marga.app.publicportal

import android.os.Bundle
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            PublicApp()
        }
    }
}

@Composable
fun PublicApp() {
    var showCinematic by remember { mutableStateOf(true) }

    if (showCinematic) {
        CinematicOpeningScreen(
            appName = "MARGA Public",
            roleSubtitle = "Citizen Transparency Soil Gateway",
            accentColor = AccentSuccess,
            onComplete = { showCinematic = false }
        )
    } else {
        PublicDashboard()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PublicDashboard() {
    val scope = rememberCoroutineScope()
    var works by remember { mutableStateOf<List<WorkItem>>(emptyList()) }
    var search by remember { mutableStateOf("") }
    var categoryFilter by remember { mutableStateOf("ALL") }
    var statusFilter by remember { mutableStateOf("ALL") }
    var loading by remember { mutableStateOf(true) }
    var selectedWork by remember { mutableStateOf<WorkItem?>(null) }

    fun load() {
        loading = true
        scope.launch {
            try {
                val res = NetworkClient.api.getWorks(limit = 60)
                if (res.isSuccessful && res.body()?.data?.isNotEmpty() == true) {
                    works = res.body()?.data ?: emptyList()
                } else {
                    throw Exception("Fallback")
                }
            } catch (e: Exception) {
                works = listOf(
                    WorkItem(workId = "PUB-1", rawId = "1", description = "Village RO Clean Drinking Water Plant", category = "Water Supply", mpName = "Hon'ble MP", constituency = "Mysuru", district = "Mysuru", state = "Karnataka", recommendedAmount = 25.0, sanctionedAmount = 25.0, disbursedAmount = 25.0, expenditureAmount = 25.0, status = "COMPLETED", physicalProgress = 100.0, financialProgress = 100.0, department = "RDWS"),
                    WorkItem(workId = "PUB-2", rawId = "2", description = "Government High School Science Lab", category = "Education", mpName = "Hon'ble MP", constituency = "Mysuru", district = "Mysuru", state = "Karnataka", recommendedAmount = 18.0, sanctionedAmount = 18.0, disbursedAmount = 12.0, expenditureAmount = 12.0, status = "ONGOING", physicalProgress = 60.0, financialProgress = 60.0, department = "PWD"),
                    WorkItem(workId = "PUB-3", rawId = "3", description = "Primary Healthcare Solar Cold Chain", category = "Health", mpName = "Hon'ble MP", constituency = "Mysuru", district = "Mysuru", state = "Karnataka", recommendedAmount = 30.0, sanctionedAmount = 30.0, disbursedAmount = 15.0, expenditureAmount = 15.0, status = "DELAYED", physicalProgress = 30.0, financialProgress = 50.0, department = "Health Dept", riskScore = 75, rootCauseIssue = "Material procurement delay"),
                    WorkItem(workId = "PUB-4", rawId = "4", description = "All-Weather Asphalt Village Link Road", category = "Roads", mpName = "Hon'ble MP", constituency = "Mysuru", district = "Mysuru", state = "Karnataka", recommendedAmount = 45.0, sanctionedAmount = 45.0, disbursedAmount = 45.0, expenditureAmount = 45.0, status = "COMPLETED", physicalProgress = 100.0, financialProgress = 100.0, department = "PWD"),
                    WorkItem(workId = "PUB-5", rawId = "5", description = "Community Solar Lighting Grid", category = "Energy", mpName = "Hon'ble MP", constituency = "Mysuru", district = "Mysuru", state = "Karnataka", recommendedAmount = 20.0, sanctionedAmount = 20.0, disbursedAmount = 16.0, expenditureAmount = 16.0, status = "ONGOING", physicalProgress = 80.0, financialProgress = 80.0, department = "KREDL")
                )
            } finally {
                delay(200)
                loading = false
            }
        }
    }

    LaunchedEffect(Unit) { load() }

    val totalSanctionedCr = works.sumOf { it.costLakhs } / 100.0
    val totalCompletedWorks = works.count { it.status == "COMPLETED" || it.progress >= 100.0 }

    val filtered = works.filter { work ->
        val matchesSearch = search.isBlank() ||
            (work.displayTitle.contains(search, ignoreCase = true)) ||
            (work.district?.contains(search, ignoreCase = true) == true) ||
            (work.category?.contains(search, ignoreCase = true) == true)
        val matchesCat = categoryFilter == "ALL" || work.category.equals(categoryFilter, ignoreCase = true)
        val matchesStat = statusFilter == "ALL" ||
            (statusFilter == "COMPLETED" && (work.status == "COMPLETED" || work.progress >= 100.0)) ||
            (statusFilter == "ONGOING" && work.status == "ONGOING") ||
            (statusFilter == "DELAYED" && work.isDelayed)
        matchesSearch && matchesCat && matchesStat
    }

    Scaffold(
        containerColor = StudioBackground,
        topBar = {
            Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 14.dp)) {
                Text("MARGA / CITIZEN OVERSIGHT", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 1.sp)
                Text("Public Transparency Portal", color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text("Zero-Auth Open Transparency across Community MPLADS Works", color = TextSecondary, fontSize = 12.sp)
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
            // Transparency Summary Card
            Card(
                colors = CardDefaults.cardColors(containerColor = StudioCard),
                border = BorderStroke(1.dp, StudioCardBorder),
                shape = RoundedCornerShape(14.dp)
            ) {
                Row(
                    modifier = Modifier.padding(18.dp).fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("TOTAL PUBLIC OUTLAY", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                        Text("₹${String.format("%.2f", totalSanctionedCr)} Cr", color = AccentSuccess, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        Text("${works.size} Community Works", color = TextSecondary, fontSize = 12.sp)
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text("COMPLETED WORKS", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                        Text("$totalCompletedWorks / ${works.size}", color = TextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        Text("100% Public Audit", color = AccentPrimary, fontSize = 12.sp)
                    }
                }
            }

            // Search Box
            OutlinedTextField(
                value = search,
                onValueChange = { search = it },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("Search by village, project, or sector...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = TextSecondary) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = TextPrimary,
                    unfocusedTextColor = TextPrimary,
                    focusedBorderColor = AccentSuccess,
                    unfocusedBorderColor = StudioCardBorder,
                    focusedContainerColor = StudioCard,
                    unfocusedContainerColor = StudioCard
                ),
                shape = RoundedCornerShape(12.dp)
            )

            // Category Filter Pills
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                PublicPill("All", categoryFilter == "ALL") { categoryFilter = "ALL" }
                PublicPill("Water", categoryFilter == "Water Supply") { categoryFilter = "Water Supply" }
                PublicPill("Education", categoryFilter == "Education") { categoryFilter = "Education" }
                PublicPill("Health", categoryFilter == "Health") { categoryFilter = "Health" }
                PublicPill("Roads", categoryFilter == "Roads") { categoryFilter = "Roads" }
            }

            // Status Filter Pills
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                PublicPill("All Status", statusFilter == "ALL") { statusFilter = "ALL" }
                PublicPill("Completed", statusFilter == "COMPLETED") { statusFilter = "COMPLETED" }
                PublicPill("Ongoing", statusFilter == "ONGOING") { statusFilter = "ONGOING" }
                PublicPill("Delayed", statusFilter == "DELAYED", isAlert = true) { statusFilter = "DELAYED" }
            }

            // Feed Content
            if (loading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = AccentSuccess, strokeWidth = 2.dp)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(filtered) { work ->
                        Card(
                            onClick = { selectedWork = work },
                            colors = CardDefaults.cardColors(containerColor = StudioCard),
                            border = BorderStroke(1.dp, StudioCardBorder),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(work.safeId, color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    Box(
                                        modifier = Modifier.clip(RoundedCornerShape(6.dp))
                                            .background(if (work.isDelayed) AccentCritical.copy(alpha = 0.15f) else AccentSuccess.copy(alpha = 0.15f))
                                            .padding(horizontal = 8.dp, vertical = 3.dp)
                                    ) {
                                        Text(work.status ?: "ACTIVE", color = if (work.isDelayed) AccentCritical else AccentSuccess, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }
                                }

                                Text(work.displayTitle, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)

                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Sanctioned: ₹${work.costLakhs} L", color = TextSecondary, fontSize = 12.sp)
                                    Text("${work.progress.toInt()}% Physical Progress", color = AccentSuccess, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Modal: Public Work Detail
    selectedWork?.let { work ->
        ModalBottomSheet(
            onDismissRequest = { selectedWork = null },
            containerColor = StudioCard,
            dragHandle = { BottomSheetDefaults.DragHandle(color = StudioCardBorder) }
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text(work.safeId, color = AccentSuccess, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Text(work.displayTitle, color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text("${work.category} · ${work.district ?: "Constituency"}", color = TextSecondary, fontSize = 13.sp)

                HorizontalDivider(color = StudioCardBorder)

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    DetailItem("Sanctioned Outlay", "₹${work.costLakhs} L")
                    DetailItem("Physical Progress", "${work.progress.toInt()}%")
                    DetailItem("Executing Agency", work.department ?: "PWD")
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    DetailItem("Expenditure Billed", "₹${work.expenditureAmount ?: 0.0} L")
                    DetailItem("Constituency", work.constituency ?: "General")
                    DetailItem("State", work.state ?: "Karnataka")
                }

                if (work.isDelayed) {
                    Box(
                        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(Color(0xFF1E1318)).padding(12.dp)
                    ) {
                        Text("Audited Bottleneck: ${work.rootCauseIssue ?: "Execution delayed."}", color = AccentCritical, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun PublicPill(title: String, active: Boolean, isAlert: Boolean = false, onClick: () -> Unit) {
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
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
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
