package com.marga.app.mp

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
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MPApp()
        }
    }
}

data class Profile(
    val id: String,
    val name: String,
    val constituency: String,
    val state: String,
    val house: String,
    val quotaCr: Double = 5.0
)

val PROFILES = listOf(
    Profile("MP-1", "DAGGUMALLA PRASADA RAO", "CHITTOOR", "Andhra Pradesh", "Lok Sabha"),
    Profile("MP-2", "Sri Yaduveer Wadiyar", "Mysuru", "Karnataka", "Lok Sabha"),
    Profile("MP-3", "VIJAYLAKSHMI DEVI", "SIWAN", "Bihar", "Lok Sabha"),
    Profile("MP-4", "Dr. Shashi Tharoor", "Thiruvananthapuram", "Kerala", "Lok Sabha"),
    Profile("MP-5", "Shri Tejasvi Surya", "Bengaluru South", "Karnataka", "Lok Sabha")
)

@Composable
fun MPApp() {
    var showCinematic by remember { mutableStateOf(true) }
    var profile by remember { mutableStateOf(PROFILES[0]) }
    var inLogin by remember { mutableStateOf(false) }

    if (showCinematic) {
        CinematicOpeningScreen(
            appName = "MARGA Sentinel",
            roleSubtitle = "Member of Parliament Portal",
            accentColor = AccentPrimary,
            onComplete = { showCinematic = false }
        )
    } else {
        AnimatedContent(
            targetState = inLogin,
            transitionSpec = { fadeIn(tween(200)) togetherWith fadeOut(tween(180)) },
            label = "AuthNav"
        ) { isLoggingIn ->
            if (isLoggingIn) {
                LoginScreen(
                    current = profile,
                    onSuccess = { selected ->
                        profile = selected
                        inLogin = false
                    }
                )
            } else {
                Dashboard(
                    profile = profile,
                    onSwitchProfile = { inLogin = true }
                )
            }
        }
    }
}

@Composable
fun LoginScreen(current: Profile, onSuccess: (Profile) -> Unit) {
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
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(AccentPrimary))
                Text("MARGA SENTINEL", color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }

            Text("Parliamentary Sign In", color = TextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Text("Select constituency profile to access sanctions, bottlenecks, and inquiries.", color = TextSecondary, fontSize = 13.sp)

            Text("PROFILE", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
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
                            Text(selected.name, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Text("${selected.constituency} (${selected.state})", color = TextSecondary, fontSize = 12.sp)
                        }
                        Icon(Icons.Default.KeyboardArrowDown, contentDescription = "Select", tint = TextPrimary)
                    }
                }

                DropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false },
                    modifier = Modifier.background(StudioCard).border(1.dp, StudioCardBorder)
                ) {
                    PROFILES.forEach { p ->
                        DropdownMenuItem(
                            text = {
                                Column {
                                    Text(p.name, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                    Text("${p.constituency}, ${p.state}", color = TextSecondary, fontSize = 12.sp)
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

            Text("PASSCODE", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
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
                    focusedBorderColor = AccentPrimary,
                    unfocusedBorderColor = StudioCardBorder,
                    focusedContainerColor = Color(0xFF0D0F17),
                    unfocusedContainerColor = Color(0xFF0D0F17)
                ),
                shape = RoundedCornerShape(10.dp)
            )

            Spacer(Modifier.height(4.dp))

            Button(
                onClick = {
                    loading = true
                    scope.launch {
                        delay(250)
                        loading = false
                        onSuccess(selected)
                    }
                },
                enabled = !loading,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AccentPrimary),
                shape = RoundedCornerShape(10.dp)
            ) {
                if (loading) {
                    CircularProgressIndicator(color = Color.Black, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                } else {
                    Text("Enter Portal", color = Color.Black, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

data class SentMemo(
    val id: String,
    val workId: String,
    val workTitle: String,
    val date: String,
    val recipient: String,
    val subject: String,
    val status: String,
    val responseDue: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Dashboard(profile: Profile, onSwitchProfile: () -> Unit) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    var works by remember { mutableStateOf<List<WorkItem>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }

    var currentNav by remember { mutableStateOf("overview") }
    var worksViewMode by remember { mutableStateOf("cards") }

    var searchQuery by remember { mutableStateOf("") }
    var statusFilter by remember { mutableStateOf("all") }
    var sectorFilter by remember { mutableStateOf("all") }

    var selectedWork by remember { mutableStateOf<WorkItem?>(null) }
    var memoWork by remember { mutableStateOf<WorkItem?>(null) }
    var whyFlaggedWork by remember { mutableStateOf<WorkItem?>(null) }
    var showRecommendSheet by remember { mutableStateOf(false) }
    var showSwitchMPMenu by remember { mutableStateOf(false) }
    var showGovtDpiHub by remember { mutableStateOf(false) }

    var sentMemos by remember {
        mutableStateOf(
            listOf(
                SentMemo(
                    id = "ESC-2026-001",
                    workId = "MPLADS-135653",
                    workTitle = "CC Road from K. Ravindra Reddy House",
                    date = "20 Aug 2026",
                    recipient = "District Authority & Collector, ${profile.constituency}",
                    subject = "Inquiry: Disbursement 42% vs physical 20%",
                    status = "Under Inquiry by SE",
                    responseDue = "03 Sep 2026"
                ),
                SentMemo(
                    id = "ESC-2026-002",
                    workId = "MPLADS-134703",
                    workTitle = "Upgradation of Road from Madhavaram Village",
                    date = "15 Aug 2026",
                    recipient = "Executive Engineer, RDWSD",
                    subject = "Verification of final GFR 12-C UC",
                    status = "Report Submitted",
                    responseDue = "Resolved"
                )
            )
        )
    }

    fun load() {
        loading = true
        scope.launch {
            try {
                val res = NetworkClient.api.getWorks(mpName = profile.name, limit = 100)
                if (res.isSuccessful && res.body()?.data?.isNotEmpty() == true) {
                    val fetched = res.body()?.data ?: emptyList()
                    val match = fetched.filter { it.mpName?.contains(profile.name.split(" ").last(), true) == true }
                    works = if (match.isNotEmpty()) match else fetched
                } else {
                    throw Exception("Fallback")
                }
            } catch (e: Exception) {
                works = listOf(
                    WorkItem(
                        workId = "MPLADS-135653", rawId = "135653",
                        description = "Construction of CC Road from K. Ravindra Reddy House to Peddamittapalli Road at Chinnamittapalli Village in Nellepalli GP",
                        category = "Roads & Bridges", mpName = profile.name, constituency = profile.constituency, district = profile.constituency, state = profile.state,
                        recommendedAmount = 5.0, sanctionedAmount = 5.0, disbursedAmount = 2.1, expenditureAmount = 2.1,
                        status = "ATTENTION_REQUIRED", physicalProgress = 20.0, financialProgress = 42.0,
                        department = "Panchayat Raj", implementingAgency = "Collector Engineering Division",
                        daysInCurrentStage = 65, latitude = 13.2172, longitude = 79.1003, riskScore = 82, riskBand = "High",
                        rootCauseIssue = "Disbursement at 42% leads physical progress at 20% by 22 pp without Measurement Book entry.",
                        scStTag = "SC"
                    ),
                    WorkItem(
                        workId = "MPLADS-135658", rawId = "135658",
                        description = "BT Road from Aragonda Main Road to Kondrajukalava Village and GP in Thavanampalli Mandal",
                        category = "Roads & Bridges", mpName = profile.name, constituency = profile.constituency, district = profile.constituency, state = profile.state,
                        recommendedAmount = 20.0, sanctionedAmount = 20.0, disbursedAmount = 3.4, expenditureAmount = 3.4,
                        status = "IN_PROGRESS", physicalProgress = 21.0, financialProgress = 17.0,
                        department = "Roads & Buildings", implementingAgency = "R&B Division",
                        daysInCurrentStage = 18, latitude = 13.2350, longitude = 79.0850, riskScore = 21, riskBand = "Low",
                        rootCauseIssue = null, scStTag = "General"
                    ),
                    WorkItem(
                        workId = "MPLADS-141506", rawId = "141506",
                        description = "Improvements to Govt. SW Girls Hostel, Opposite OLL School of Palamaner Town",
                        category = "Education", mpName = profile.name, constituency = profile.constituency, district = profile.constituency, state = profile.state,
                        recommendedAmount = 20.0, sanctionedAmount = 20.0, disbursedAmount = 3.6, expenditureAmount = 3.6,
                        status = "IN_PROGRESS", physicalProgress = 65.0, financialProgress = 18.0,
                        department = "Social Welfare", implementingAgency = "Tribal Welfare Wing",
                        daysInCurrentStage = 22, latitude = 13.2010, longitude = 78.7520, riskScore = 22, riskBand = "Low",
                        rootCauseIssue = null, scStTag = "SC"
                    ),
                    WorkItem(
                        workId = "MPLADS-134703", rawId = "134703",
                        description = "Upgradation of Road from Madhavaram Village to Company Indlu of Madhavaram GP",
                        category = "Roads & Bridges", mpName = profile.name, constituency = profile.constituency, district = profile.constituency, state = profile.state,
                        recommendedAmount = 5.0, sanctionedAmount = 5.0, disbursedAmount = 5.0, expenditureAmount = 5.0,
                        status = "COMPLETED", physicalProgress = 100.0, financialProgress = 100.0,
                        department = "Public Works", implementingAgency = "Panchayat Raj Engineering",
                        daysInCurrentStage = 0, latitude = 13.2500, longitude = 79.1200, riskScore = 12, riskBand = "Low",
                        rootCauseIssue = null, scStTag = "General"
                    ),
                    WorkItem(
                        workId = "MPLADS-135639", rawId = "135639",
                        description = "Construction of Under Ground Drainage at Thalaripalli HW (Reach 1) H/O Ramakrishnapuram GP",
                        category = "Water Supply", mpName = profile.name, constituency = profile.constituency, district = profile.constituency, state = profile.state,
                        recommendedAmount = 4.4, sanctionedAmount = 4.4, disbursedAmount = 4.4, expenditureAmount = 4.4,
                        status = "COMPLETED", physicalProgress = 100.0, financialProgress = 100.0,
                        department = "Water Supply", implementingAgency = "RDWSD Division",
                        daysInCurrentStage = 0, latitude = 13.3100, longitude = 79.1400, riskScore = 15, riskBand = "Low",
                        rootCauseIssue = null, scStTag = "ST"
                    ),
                    WorkItem(
                        workId = "MPLADS-135642", rawId = "135642",
                        description = "Construction of Under Ground Drainage at Penumuru Town (Reach I) & GP, Penumuru Mandal",
                        category = "Sanitation", mpName = profile.name, constituency = profile.constituency, district = profile.constituency, state = profile.state,
                        recommendedAmount = 4.8, sanctionedAmount = 4.8, disbursedAmount = 4.8, expenditureAmount = 4.8,
                        status = "DELAYED", physicalProgress = 35.0, financialProgress = 95.0,
                        department = "Sanitation", implementingAgency = "Municipal Administration",
                        daysInCurrentStage = 74, latitude = 13.3600, longitude = 79.1800, riskScore = 88, riskBand = "Critical",
                        rootCauseIssue = "Material procurement freeze: Payment disbursed at 95% while pipeline laying abandoned at 35%.",
                        scStTag = "SC"
                    )
                )
            } finally {
                delay(150)
                loading = false
            }
        }
    }

    LaunchedEffect(profile.id) { load() }

    val totalSanctionedCr = works.sumOf { it.costLakhs } / 100.0
    val totalDisbursedCr = works.sumOf { it.disbursedAmount ?: 0.0 } / 100.0
    val totalUtilizedCr = works.sumOf { it.expenditureAmount ?: 0.0 } / 100.0
    val remainingCr = (profile.quotaCr - totalSanctionedCr).coerceAtLeast(0.0)

    val attentionItems = works.filter { it.isDelayed || it.status?.contains("ATTENTION", true) == true || (it.riskScore ?: 0) >= 70 }
    val ongoingItems = works.filter { it.status?.contains("PROGRESS", true) == true || it.status?.contains("ONGOING", true) == true }
    val completedItems = works.filter { it.status?.contains("COMPLET", true) == true }

    val availableCategories = listOf("all") + works.mapNotNull { it.category }.distinct()

    val filteredWorks = works.filter { w ->
        val matchesSearch = searchQuery.isBlank() ||
                w.displayTitle.contains(searchQuery, ignoreCase = true) ||
                w.safeId.contains(searchQuery, ignoreCase = true) ||
                (w.category ?: "").contains(searchQuery, ignoreCase = true)

        val matchesStatus = when (statusFilter) {
            "delayed" -> w.isDelayed || attentionItems.contains(w)
            "ongoing" -> ongoingItems.contains(w)
            "completed" -> completedItems.contains(w)
            else -> true
        }

        val matchesSector = sectorFilter == "all" || w.category.equals(sectorFilter, ignoreCase = true)

        matchesSearch && matchesStatus && matchesSector
    }

    Scaffold(
        containerColor = StudioBackground,
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(StudioBackground)
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = profile.name,
                            color = TextPrimary,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = "${profile.constituency} · ${profile.house}",
                            color = AccentPrimary,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box {
                            IconButton(
                                onClick = { showSwitchMPMenu = true },
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(StudioCard)
                                    .border(1.dp, StudioCardBorder, CircleShape)
                            ) {
                                Icon(Icons.Default.AccountCircle, contentDescription = "Switch MP", tint = TextPrimary, modifier = Modifier.size(20.dp))
                            }

                            DropdownMenu(
                                expanded = showSwitchMPMenu,
                                onDismissRequest = { showSwitchMPMenu = false },
                                modifier = Modifier.background(StudioCard).border(1.dp, StudioCardBorder)
                            ) {
                                Text("Switch MP", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(12.dp, 6.dp))
                                HorizontalDivider(color = StudioCardBorder)
                                PROFILES.forEach { p ->
                                    DropdownMenuItem(
                                        text = {
                                            Column {
                                                Text(p.name, color = if (p.id == profile.id) AccentPrimary else TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                                Text("${p.constituency}, ${p.state}", color = TextSecondary, fontSize = 12.sp)
                                            }
                                        },
                                        onClick = {
                                            showSwitchMPMenu = false
                                            onSwitchProfile()
                                        }
                                    )
                                }
                            }
                        }

                        IconButton(
                            onClick = { showRecommendSheet = true },
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(AccentPrimary)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = "New", tint = Color.Black, modifier = Modifier.size(20.dp))
                        }

                        IconButton(
                            onClick = { load() },
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(StudioCard)
                                .border(1.dp, StudioCardBorder, CircleShape)
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = TextPrimary, modifier = Modifier.size(18.dp))
                        }
                    }
                }
            }
        },
        bottomBar = {
            NavigationBar(
                containerColor = StudioCard,
                tonalElevation = 8.dp,
                modifier = Modifier.border(BorderStroke(1.dp, StudioCardBorder))
            ) {
                NavigationBarItem(
                    selected = currentNav == "overview",
                    onClick = { currentNav = "overview" },
                    icon = { Icon(Icons.Default.Dashboard, contentDescription = "Overview", modifier = Modifier.size(22.dp)) },
                    label = { Text("Overview", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = AccentPrimary,
                        selectedTextColor = AccentPrimary,
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary,
                        indicatorColor = AccentPrimary.copy(alpha = 0.2f)
                    )
                )

                NavigationBarItem(
                    selected = currentNav == "works",
                    onClick = { currentNav = "works" },
                    icon = {
                        BadgedBox(
                            badge = {
                                Badge(containerColor = AccentPrimary) { Text("${works.size}", fontWeight = FontWeight.Bold) }
                            }
                        ) {
                            Icon(Icons.Default.FolderOpen, contentDescription = "Works", modifier = Modifier.size(22.dp))
                        }
                    },
                    label = { Text("Works", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = AccentPrimary,
                        selectedTextColor = AccentPrimary,
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary,
                        indicatorColor = AccentPrimary.copy(alpha = 0.2f)
                    )
                )

                NavigationBarItem(
                    selected = currentNav == "funds",
                    onClick = { currentNav = "funds" },
                    icon = { Icon(Icons.Default.AccountBalance, contentDescription = "Funds", modifier = Modifier.size(22.dp)) },
                    label = { Text("Funds", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = AccentPrimary,
                        selectedTextColor = AccentPrimary,
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary,
                        indicatorColor = AccentPrimary.copy(alpha = 0.2f)
                    )
                )

                NavigationBarItem(
                    selected = currentNav == "attention",
                    onClick = { currentNav = "attention" },
                    icon = {
                        if (attentionItems.isNotEmpty()) {
                            BadgedBox(
                                badge = {
                                    Badge(containerColor = AccentCritical) { Text("${attentionItems.size}", fontWeight = FontWeight.Bold) }
                                }
                            ) {
                                Icon(Icons.Default.Warning, contentDescription = "Attention", modifier = Modifier.size(22.dp))
                            }
                        } else {
                            Icon(Icons.Default.Warning, contentDescription = "Attention", modifier = Modifier.size(22.dp))
                        }
                    },
                    label = { Text("Attention", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = AccentCritical,
                        selectedTextColor = AccentCritical,
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary,
                        indicatorColor = AccentCritical.copy(alpha = 0.2f)
                    )
                )

                NavigationBarItem(
                    selected = currentNav == "more",
                    onClick = { currentNav = "more" },
                    icon = { Icon(Icons.Default.Menu, contentDescription = "More", modifier = Modifier.size(22.dp)) },
                    label = { Text("More", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = AccentPrimary,
                        selectedTextColor = AccentPrimary,
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary,
                        indicatorColor = AccentPrimary.copy(alpha = 0.2f)
                    )
                )
            }
        }
    ) { pad ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(pad)
        ) {
            if (loading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = AccentPrimary, strokeWidth = 2.5.dp)
                }
            } else {
                when (currentNav) {
                    "overview" -> {
                        OverviewTabContent(
                            profile = profile,
                            works = works,
                            attentionItems = attentionItems,
                            ongoingItems = ongoingItems,
                            completedItems = completedItems,
                            totalSanctionedCr = totalSanctionedCr,
                            totalDisbursedCr = totalDisbursedCr,
                            totalUtilizedCr = totalUtilizedCr,
                            remainingCr = remainingCr,
                            onSelectWork = { selectedWork = it },
                            onMemo = { memoWork = it },
                            onWhyFlagged = { whyFlaggedWork = it },
                            onNavigateToWorks = { currentNav = "works" },
                            onNavigateToFunds = { currentNav = "funds" },
                            onNavigateToAttention = { currentNav = "attention" }
                        )
                    }
                    "works" -> {
                        ConstituencyWorksContent(
                            works = filteredWorks,
                            searchQuery = searchQuery,
                            onSearchChange = { searchQuery = it },
                            statusFilter = statusFilter,
                            onStatusFilterChange = { statusFilter = it },
                            sectorFilter = sectorFilter,
                            onSectorFilterChange = { sectorFilter = it },
                            availableCategories = availableCategories,
                            viewMode = worksViewMode,
                            onViewModeChange = { worksViewMode = it },
                            onSelectWork = { selectedWork = it },
                            onMemo = { memoWork = it },
                            onWhyFlagged = { whyFlaggedWork = it }
                        )
                    }
                    "funds" -> {
                        FundPositionContent(
                            profile = profile,
                            totalSanctionedCr = totalSanctionedCr,
                            totalDisbursedCr = totalDisbursedCr,
                            totalUtilizedCr = totalUtilizedCr,
                            remainingCr = remainingCr
                        )
                    }
                    "attention" -> {
                        AttentionQueueContent(
                            attentionItems = attentionItems,
                            onSelectWork = { selectedWork = it },
                            onMemo = { memoWork = it },
                            onWhyFlagged = { whyFlaggedWork = it }
                        )
                    }
                    "more" -> {
                        MoreFeaturesContent(
                            sentMemos = sentMemos,
                            onComposeMemo = {
                                if (works.isNotEmpty()) memoWork = works.first()
                            },
                            onOpenRecommend = { showRecommendSheet = true },
                            onOpenDpiHub = { showGovtDpiHub = true }
                        )
                    }
                }
            }
        }
    }

    // Work Detail Modal Bottom Sheet
    selectedWork?.let { work ->
        WorkDetailSheet(
            work = work,
            onDismiss = { selectedWork = null },
            onInquire = {
                val w = selectedWork
                selectedWork = null
                memoWork = w
            },
            onWhyFlagged = {
                val w = selectedWork
                selectedWork = null
                whyFlaggedWork = w
            }
        )
    }

    // "Why Flagged?" Root Cause Explanation Modal
    whyFlaggedWork?.let { work ->
        AlertDialog(
            onDismissRequest = { whyFlaggedWork = null },
            containerColor = StudioCard,
            title = {
                Text("Why Flagged?", color = TextPrimary, fontSize = 17.sp, fontWeight = FontWeight.Bold)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(work.displayTitle, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFF2A1016))
                            .border(1.dp, AccentCritical, RoundedCornerShape(8.dp))
                            .padding(12.dp)
                    ) {
                        Text(
                            work.rootCauseIssue ?: "Payment draw is running significantly ahead of physical execution.",
                            color = Color(0xFFFFD4DC), fontSize = 13.sp, lineHeight = 18.sp, fontWeight = FontWeight.Medium
                        )
                    }

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text("Physical", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            Text("${work.progress.toInt()}%", color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("Payment", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            Text("${(work.financialProgress ?: 0.0).toInt()}%", color = AccentCritical, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val w = whyFlaggedWork
                        whyFlaggedWork = null
                        memoWork = w
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AccentSuccess)
                ) {
                    Text("Inquire via WhatsApp", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { whyFlaggedWork = null }) {
                    Text("Close", color = TextPrimary, fontWeight = FontWeight.SemiBold)
                }
            }
        )
    }

    // WhatsApp Official Inquiry Dialog
    memoWork?.let { work ->
        var customRemarks by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { memoWork = null },
            containerColor = StudioCard,
            title = {
                Text("Inquiry Memo", color = TextPrimary, fontSize = 17.sp, fontWeight = FontWeight.Bold)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        "Sends official inquiry to District Collector at +91 8778168629.",
                        color = TextSecondary, fontSize = 13.sp
                    )

                    Surface(
                        color = Color(0xFF0D0F17),
                        shape = RoundedCornerShape(8.dp),
                        border = BorderStroke(1.dp, StudioCardBorder),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(work.displayTitle, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold, maxLines = 2, overflow = TextOverflow.Ellipsis)
                            Text("₹${work.costLakhs} L · ${work.progress.toInt()}% Complete", color = AccentPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }

                    OutlinedTextField(
                        value = customRemarks,
                        onValueChange = { customRemarks = it },
                        placeholder = { Text("Add instructions...", fontSize = 13.sp) },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary,
                            focusedBorderColor = AccentSuccess,
                            unfocusedBorderColor = StudioCardBorder
                        ),
                        shape = RoundedCornerShape(8.dp)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val body = "OFFICIAL MPLADS INQUIRY MEMO\n\n" +
                                "From: ${profile.name}, MP (${profile.house} - ${profile.constituency})\n" +
                                "To: District Authority (DA), ${work.district ?: profile.constituency}\n" +
                                "Work ID: ${work.safeId}\n" +
                                "Project: ${work.displayTitle}\n" +
                                "Sanctioned: ₹${work.costLakhs} Lakhs\n" +
                                "Certified Progress: ${work.progress.toInt()}%\n" +
                                "Issue: ${work.rootCauseIssue ?: "Payment draw significantly ahead of certified physical work."}\n" +
                                (if (customRemarks.isNotBlank()) "MP Note: $customRemarks\n" else "") +
                                "\nDemand: Immediate spot verification and factual report within 14 days."

                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/918778168629?text=" + Uri.encode(body)))
                        try {
                            context.startActivity(intent)
                        } catch (e: Exception) {
                            Toast.makeText(context, "WhatsApp not available", Toast.LENGTH_SHORT).show()
                        }

                        val newMemo = SentMemo(
                            id = "ESC-2026-00${sentMemos.size + 1}",
                            workId = work.safeId,
                            workTitle = work.displayTitle,
                            date = "Today",
                            recipient = "District Authority, ${work.district ?: profile.constituency}",
                            subject = "Inquiry: ${work.displayTitle.take(45)}...",
                            status = "Dispatched via WhatsApp",
                            responseDue = "14 days"
                        )
                        sentMemos = listOf(newMemo) + sentMemos
                        memoWork = null
                        Toast.makeText(context, "Inquiry dispatched", Toast.LENGTH_SHORT).show()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AccentSuccess)
                ) {
                    Text("Send Memo", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { memoWork = null }) {
                    Text("Cancel", color = TextPrimary, fontWeight = FontWeight.SemiBold)
                }
            }
        )
    }

    // Recommend New Project BottomSheet
    if (showRecommendSheet) {
        var recTitle by remember { mutableStateOf("") }
        var recCategory by remember { mutableStateOf("Drinking Water") }
        var recCost by remember { mutableStateOf("25.0") }
        var recScStTag by remember { mutableStateOf("SC") }
        var isProhibitedPlace by remember { mutableStateOf(false) }
        var isSubmitting by remember { mutableStateOf(false) }

        ModalBottomSheet(
            onDismissRequest = { showRecommendSheet = false },
            containerColor = StudioCard,
            dragHandle = { BottomSheetDefaults.DragHandle(color = StudioCardBorder) }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 24.dp, vertical = 16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text("Recommend New Project", color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text("Available Quota: ₹${String.format("%.2f", remainingCr)} Cr", color = AccentSuccess, fontSize = 14.sp, fontWeight = FontWeight.Bold)

                OutlinedTextField(
                    value = recTitle,
                    onValueChange = { recTitle = it },
                    label = { Text("Project Title") },
                    placeholder = { Text("e.g. Village Solar RO Water Plant") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        focusedBorderColor = AccentPrimary,
                        unfocusedBorderColor = StudioCardBorder
                    ),
                    shape = RoundedCornerShape(10.dp)
                )

                Text("SECTOR", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Row(modifier = Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("Drinking Water", "Roads & Bridges", "Education", "Health", "Community Assets").forEach { cat ->
                        FilterChip(
                            selected = recCategory == cat,
                            onClick = { recCategory = cat },
                            label = { Text(cat, fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = AccentPrimary.copy(alpha = 0.2f),
                                selectedLabelColor = AccentPrimary,
                                containerColor = StudioCard,
                                labelColor = TextPrimary
                            )
                        )
                    }
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = recCost,
                        onValueChange = { recCost = it },
                        label = { Text("Cost (₹ Lakhs)") },
                        modifier = Modifier.weight(1f),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary,
                            focusedBorderColor = AccentPrimary,
                            unfocusedBorderColor = StudioCardBorder
                        ),
                        shape = RoundedCornerShape(10.dp)
                    )

                    Column(modifier = Modifier.weight(1f)) {
                        Text("QUOTA TAG", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf("SC", "ST", "Gen").forEach { tag ->
                                FilterChip(
                                    selected = recScStTag == tag,
                                    onClick = { recScStTag = tag },
                                    label = { Text(tag, fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = AccentPrimary.copy(alpha = 0.2f),
                                        selectedLabelColor = AccentPrimary,
                                        containerColor = StudioCard,
                                        labelColor = TextPrimary
                                    )
                                )
                            }
                        }
                    }
                }

                Surface(
                    color = if (isProhibitedPlace) Color(0xFF2D151B) else Color(0xFF0D0F17),
                    shape = RoundedCornerShape(10.dp),
                    border = BorderStroke(1.dp, if (isProhibitedPlace) AccentCritical else StudioCardBorder),
                    modifier = Modifier.fillMaxWidth().clickable { isProhibitedPlace = !isProhibitedPlace }
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Checkbox(
                            checked = isProhibitedPlace,
                            onCheckedChange = { isProhibitedPlace = it },
                            colors = CheckboxDefaults.colors(checkedColor = AccentCritical)
                        )
                        Column {
                            Text("Religious or Private Property", color = if (isProhibitedPlace) AccentCritical else TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            Text("Prohibited under MPLADS Section 2.1 guidelines.", color = if (isProhibitedPlace) AccentCritical else TextSecondary, fontSize = 12.sp)
                        }
                    }
                }

                Button(
                    onClick = {
                        isSubmitting = true
                        scope.launch {
                            try {
                                NetworkClient.api.recommendWork(
                                    RecommendWorkRequest(
                                        description = recTitle,
                                        category = recCategory,
                                        recommendedAmount = recCost.toDoubleOrNull() ?: 25.0,
                                        constituency = profile.constituency,
                                        state = profile.state,
                                        mpName = profile.name,
                                        scStTag = recScStTag
                                    )
                                )
                            } catch (e: Exception) {}

                            Toast.makeText(context, "Recommendation submitted", Toast.LENGTH_SHORT).show()
                            isSubmitting = false
                            showRecommendSheet = false
                            load()
                        }
                    },
                    enabled = recTitle.isNotBlank() && !isProhibitedPlace && !isSubmitting,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AccentPrimary),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    if (isSubmitting) {
                        CircularProgressIndicator(color = Color.Black, modifier = Modifier.size(18.dp))
                    } else {
                        Text("Submit to District Authority", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                }

                Spacer(Modifier.height(16.dp))
            }
        }
    }

    // Sovereign Government DPI & API Hub BottomSheet
    if (showGovtDpiHub) {
        GovtDpiHubSheet(
            onDismiss = { showGovtDpiHub = false }
        )
    }
}

// -----------------------------------------------------------------------------------------
// 1. OVERVIEW TAB: Clean, High-Contrast, Zero-Clutter
// -----------------------------------------------------------------------------------------
@Composable
fun OverviewTabContent(
    profile: Profile,
    works: List<WorkItem>,
    attentionItems: List<WorkItem>,
    ongoingItems: List<WorkItem>,
    completedItems: List<WorkItem>,
    totalSanctionedCr: Double,
    totalDisbursedCr: Double,
    totalUtilizedCr: Double,
    remainingCr: Double,
    onSelectWork: (WorkItem) -> Unit,
    onMemo: (WorkItem) -> Unit,
    onWhyFlagged: (WorkItem) -> Unit,
    onNavigateToWorks: () -> Unit,
    onNavigateToFunds: () -> Unit,
    onNavigateToAttention: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 8.dp, bottom = 24.dp)
    ) {
        // Main Quota Card: Large, bold, readable
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = StudioCard),
                border = BorderStroke(1.dp, StudioCardBorder),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth().clickable { onNavigateToFunds() }
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text("ANNUAL QUOTA", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            Text("₹${String.format("%.2f", profile.quotaCr)} Cr", color = TextPrimary, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("AVAILABLE", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            Text("₹${String.format("%.2f", remainingCr)} Cr", color = AccentSuccess, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    val utilPct = (totalUtilizedCr / profile.quotaCr).toFloat().coerceIn(0f, 1f)
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        LinearProgressIndicator(
                            progress = { utilPct },
                            modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                            color = AccentSuccess,
                            trackColor = Color(0xFF1E2333)
                        )
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("${(utilPct * 100).toInt()}% Utilized", color = AccentSuccess, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            Text("Sanctioned ₹${String.format("%.2f", totalSanctionedCr)} Cr", color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
        }

        // Clean 6 KPI Metric Cards (No tiny low-contrast subscripts)
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("METRICS", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    CleanMetricCard(title = "Total Works", value = "${works.size}", color = TextPrimary, modifier = Modifier.weight(1f))
                    CleanMetricCard(title = "Active", value = "${ongoingItems.size}", color = AccentPrimary, modifier = Modifier.weight(1f))
                    CleanMetricCard(title = "Completed", value = "${completedItems.size}", color = AccentSuccess, modifier = Modifier.weight(1f))
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    CleanMetricCard(title = "Sanctioned", value = "${((totalSanctionedCr / profile.quotaCr) * 100).toInt()}%", color = AccentSuccess, modifier = Modifier.weight(1f))
                    CleanMetricCard(title = "Payment Gap", value = "21 pp", color = AccentWarning, modifier = Modifier.weight(1f))
                    CleanMetricCard(title = "Attention", value = "${attentionItems.size}", color = if (attentionItems.isNotEmpty()) AccentCritical else AccentSuccess, modifier = Modifier.weight(1f))
                }
            }
        }

        // Attention Banner (Only if attention items exist)
        if (attentionItems.isNotEmpty()) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF231217)),
                    border = BorderStroke(1.dp, AccentCritical),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().clickable { onNavigateToAttention() }
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Icon(Icons.Default.Warning, contentDescription = "Alert", tint = AccentCritical, modifier = Modifier.size(20.dp))
                            Text("${attentionItems.size} Works Require Attention", color = AccentCritical, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                        Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = "Open", tint = AccentCritical, modifier = Modifier.size(16.dp))
                    }
                }
            }
        }

        // Works Section Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("WORKS LEDGER", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Text(
                    text = "See All (${works.size}) →",
                    color = AccentPrimary,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.clickable { onNavigateToWorks() }
                )
            }
        }

        // Works List
        items(works.take(6)) { work ->
            CleanWorkCard(
                work = work,
                onSelect = { onSelectWork(work) },
                onMemo = { onMemo(work) },
                onWhyFlagged = { onWhyFlagged(work) }
            )
        }
    }
}

// -----------------------------------------------------------------------------------------
// 2. WORKS TAB: Visual Cards, Pipeline, Sectors
// -----------------------------------------------------------------------------------------
@Composable
fun ConstituencyWorksContent(
    works: List<WorkItem>,
    searchQuery: String,
    onSearchChange: (String) -> Unit,
    statusFilter: String,
    onStatusFilterChange: (String) -> Unit,
    sectorFilter: String,
    onSectorFilterChange: (String) -> Unit,
    availableCategories: List<String>,
    viewMode: String,
    onViewModeChange: (String) -> Unit,
    onSelectWork: (WorkItem) -> Unit,
    onMemo: (WorkItem) -> Unit,
    onWhyFlagged: (WorkItem) -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = onSearchChange,
                placeholder = { Text("Search project...", fontSize = 13.sp) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = TextPrimary, modifier = Modifier.size(18.dp)) },
                modifier = Modifier.weight(1f).height(46.dp),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = TextPrimary,
                    unfocusedTextColor = TextPrimary,
                    focusedBorderColor = AccentPrimary,
                    unfocusedBorderColor = StudioCardBorder,
                    focusedContainerColor = StudioCard,
                    unfocusedContainerColor = StudioCard
                ),
                shape = RoundedCornerShape(10.dp)
            )

            Surface(
                color = StudioCard,
                shape = RoundedCornerShape(10.dp),
                border = BorderStroke(1.dp, StudioCardBorder)
            ) {
                Row(modifier = Modifier.padding(3.dp), horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                    IconButton(
                        onClick = { onViewModeChange("cards") },
                        modifier = Modifier.size(32.dp).background(if (viewMode == "cards") AccentPrimary.copy(alpha = 0.25f) else Color.Transparent, CircleShape)
                    ) {
                        Icon(Icons.Default.GridView, contentDescription = "Cards", tint = if (viewMode == "cards") AccentPrimary else TextPrimary, modifier = Modifier.size(16.dp))
                    }
                    IconButton(
                        onClick = { onViewModeChange("pipeline") },
                        modifier = Modifier.size(32.dp).background(if (viewMode == "pipeline") AccentPrimary.copy(alpha = 0.25f) else Color.Transparent, CircleShape)
                    ) {
                        Icon(Icons.Default.ViewKanban, contentDescription = "Pipeline", tint = if (viewMode == "pipeline") AccentPrimary else TextPrimary, modifier = Modifier.size(16.dp))
                    }
                    IconButton(
                        onClick = { onViewModeChange("sectors") },
                        modifier = Modifier.size(32.dp).background(if (viewMode == "sectors") AccentPrimary.copy(alpha = 0.25f) else Color.Transparent, CircleShape)
                    ) {
                        Icon(Icons.Default.PieChart, contentDescription = "Sectors", tint = if (viewMode == "sectors") AccentPrimary else TextPrimary, modifier = Modifier.size(16.dp))
                    }
                }
            }
        }

        // Filter Chips
        Row(modifier = Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            CategoryPill("All (${works.size})", statusFilter == "all") { onStatusFilterChange("all") }
            CategoryPill("Ongoing", statusFilter == "ongoing") { onStatusFilterChange("ongoing") }
            CategoryPill("Alert", statusFilter == "delayed", isAlert = true) { onStatusFilterChange("delayed") }
            CategoryPill("Completed", statusFilter == "completed") { onStatusFilterChange("completed") }

            availableCategories.filter { it != "all" }.forEach { cat ->
                CategoryPill(cat, sectorFilter == cat) {
                    onSectorFilterChange(if (sectorFilter == cat) "all" else cat)
                }
            }
        }

        when (viewMode) {
            "pipeline" -> {
                PipelineStagesView(
                    works = works,
                    onSelect = onSelectWork,
                    onMemo = onMemo
                )
            }
            "sectors" -> {
                SectorAnalyticsView(works = works)
            }
            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(bottom = 24.dp)
                ) {
                    items(works) { work ->
                        CleanWorkCard(
                            work = work,
                            onSelect = { onSelectWork(work) },
                            onMemo = { onMemo(work) },
                            onWhyFlagged = { onWhyFlagged(work) }
                        )
                    }
                }
            }
        }
    }
}

// -----------------------------------------------------------------------------------------
// 3. FUNDS TAB: 7-Stage Continuous Pipeline
// -----------------------------------------------------------------------------------------
@Composable
fun FundPositionContent(
    profile: Profile,
    totalSanctionedCr: Double,
    totalDisbursedCr: Double,
    totalUtilizedCr: Double,
    remainingCr: Double
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(top = 8.dp, bottom = 24.dp)
    ) {
        item {
            Text("FUND FLOW PIPELINE", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = StudioCard),
                border = BorderStroke(1.dp, StudioCardBorder),
                shape = RoundedCornerShape(14.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Execution Flow", color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Bold)

                    Row(modifier = Modifier.fillMaxWidth().height(10.dp).clip(RoundedCornerShape(5.dp))) {
                        val utilRatio = (totalUtilizedCr / profile.quotaCr).toFloat().coerceIn(0f, 1f)
                        val disbRatio = ((totalDisbursedCr - totalUtilizedCr) / profile.quotaCr).toFloat().coerceAtLeast(0f)
                        val remRatio = (remainingCr / profile.quotaCr).toFloat().coerceAtLeast(0f)

                        if (utilRatio > 0) Box(modifier = Modifier.weight(utilRatio).fillMaxHeight().background(AccentSuccess))
                        if (disbRatio > 0) Box(modifier = Modifier.weight(disbRatio).fillMaxHeight().background(AccentWarning))
                        if (remRatio > 0) Box(modifier = Modifier.weight(remRatio).fillMaxHeight().background(Color(0xFF262C3D)))
                    }

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(AccentSuccess))
                            Text("Utilized ₹${String.format("%.2f", totalUtilizedCr)} Cr", color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(AccentWarning))
                            Text("Disbursed ₹${String.format("%.2f", totalDisbursedCr)} Cr", color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(Color(0xFF262C3D)))
                            Text("Available ₹${String.format("%.2f", remainingCr)} Cr", color = AccentSuccess, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                PipelineNode("1. Annual Entitlement", "₹5.00 Cr", AccentPrimary)
                PipelineNode("2. Recommended", "₹${String.format("%.2f", totalSanctionedCr)} Cr", TextPrimary)
                PipelineNode("3. Administrative Sanctions", "₹${String.format("%.2f", totalSanctionedCr)} Cr", AccentSuccess)
                PipelineNode("4. Technical Sanctions", "₹${String.format("%.2f", totalSanctionedCr)} Cr", AccentSuccess)
                PipelineNode("5. Agency Disbursements", "₹${String.format("%.2f", totalDisbursedCr)} Cr", AccentWarning)
                PipelineNode("6. Verified Utilization", "₹${String.format("%.2f", totalUtilizedCr)} Cr", AccentSuccess)
                PipelineNode("7. Uncommitted Balance", "₹${String.format("%.2f", remainingCr)} Cr", AccentSuccess)
            }
        }
    }
}

// -----------------------------------------------------------------------------------------
// 4. ATTENTION TAB: Bottlenecks & Priority Inquiries
// -----------------------------------------------------------------------------------------
@Composable
fun AttentionQueueContent(
    attentionItems: List<WorkItem>,
    onSelectWork: (WorkItem) -> Unit,
    onMemo: (WorkItem) -> Unit,
    onWhyFlagged: (WorkItem) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(top = 8.dp, bottom = 24.dp)
    ) {
        item {
            Text("PRIORITY BOTTLENECKS", color = AccentCritical, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }

        if (attentionItems.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(StudioCard)
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Default.CheckCircle, contentDescription = "Clear", tint = AccentSuccess, modifier = Modifier.size(36.dp))
                        Text("All Works on Track", color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        } else {
            items(attentionItems) { work ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = StudioCard),
                    border = BorderStroke(1.dp, AccentCritical),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text(work.safeId, color = AccentPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(AccentCritical)
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text("Risk: ${work.riskScore ?: 80}/100", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Text(work.displayTitle, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)

                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFF2A1016))
                                .border(1.dp, AccentCritical, RoundedCornerShape(8.dp))
                                .padding(10.dp)
                        ) {
                            Text(
                                work.rootCauseIssue ?: "Disbursement ahead of physical milestone.",
                                color = Color(0xFFFFD4DC), fontSize = 13.sp, fontWeight = FontWeight.Medium
                            )
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("Physical ${work.progress.toInt()}% · Draw ${(work.financialProgress ?: 0.0).toInt()}%", color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedButton(
                                    onClick = { onWhyFlagged(work) },
                                    colors = ButtonDefaults.outlinedButtonColors(contentColor = TextPrimary),
                                    border = BorderStroke(1.dp, StudioCardBorder),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text("Why?", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }

                                Button(
                                    onClick = { onMemo(work) },
                                    colors = ButtonDefaults.buttonColors(containerColor = AccentSuccess),
                                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text("Inquire", color = Color.Black, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// -----------------------------------------------------------------------------------------
// 5. MORE TAB: Inquiry Register
// -----------------------------------------------------------------------------------------
@Composable
fun MoreFeaturesContent(
    sentMemos: List<SentMemo>,
    onComposeMemo: () -> Unit,
    onOpenRecommend: () -> Unit,
    onOpenDpiHub: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 8.dp, bottom = 24.dp)
    ) {
        // High-profile Government DPI & API Hub Banner
        item {
            Card(
                onClick = onOpenDpiHub,
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F1422)),
                border = BorderStroke(1.dp, AccentPrimary.copy(alpha = 0.5f)),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(AccentPrimary.copy(alpha = 0.15f))
                            .border(1.dp, AccentPrimary.copy(alpha = 0.4f), RoundedCornerShape(12.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.VerifiedUser, contentDescription = "DPI Hub", tint = AccentPrimary, modifier = Modifier.size(26.dp))
                    }

                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Box(modifier = Modifier.size(7.dp).clip(CircleShape).background(AccentSuccess))
                            Text("SOVEREIGN DPI & API STACK", color = AccentPrimary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                        Text("Government Integrations Hub", color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        Text("PFMS Escrow · NavIC GNSS · Aadhaar e-Sign · DigiLocker", color = TextSecondary, fontSize = 12.sp)
                    }

                    Icon(Icons.Default.ChevronRight, contentDescription = "Open", tint = TextSecondary, modifier = Modifier.size(20.dp))
                }
            }
        }

        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(
                    onClick = onComposeMemo,
                    modifier = Modifier.weight(1f).height(46.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AccentPrimary),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Compose Inquiry", color = Color.Black, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = onOpenRecommend,
                    modifier = Modifier.weight(1f).height(46.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = StudioCard),
                    border = BorderStroke(1.dp, StudioCardBorder),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("+ New Project", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        item {
            Text("DISPATCHED INQUIRIES (${sentMemos.size})", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }

        items(sentMemos) { memo ->
            Card(
                colors = CardDefaults.cardColors(containerColor = StudioCard),
                border = BorderStroke(1.dp, StudioCardBorder),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(memo.id, color = AccentPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Text(memo.date, color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }

                    Text(memo.subject, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Text("Addressed to: ${memo.recipient}", color = TextSecondary, fontSize = 13.sp)

                    HorizontalDivider(color = StudioCardBorder)

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text(memo.status, color = AccentSuccess, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Text("Due: ${memo.responseDue}", color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}

// -----------------------------------------------------------------------------------------
// REUSABLE CLEAN UI COMPONENTS
// -----------------------------------------------------------------------------------------
@Composable
fun CleanMetricCard(title: String, value: String, color: Color, modifier: Modifier = Modifier) {
    Card(
        colors = CardDefaults.cardColors(containerColor = StudioCard),
        border = BorderStroke(1.dp, StudioCardBorder),
        shape = RoundedCornerShape(10.dp),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(title, color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Text(value, color = color, fontSize = 20.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun PipelineStagesView(works: List<WorkItem>, onSelect: (WorkItem) -> Unit, onMemo: (WorkItem) -> Unit) {
    val stages = listOf(
        "Pre-Work (0-20%)" to works.filter { it.progress <= 20.0 },
        "In Progress (21-60%)" to works.filter { it.progress > 20.0 && it.progress <= 60.0 },
        "Finishing (61-99%)" to works.filter { it.progress > 60.0 && it.progress < 100.0 },
        "Complete (100%)" to works.filter { it.progress >= 100.0 }
    )

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        stages.forEach { (label, stageWorks) ->
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(label, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        Text("${stageWorks.size}", color = AccentPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }

                    if (stageWorks.isEmpty()) {
                        Surface(
                            color = StudioCard,
                            shape = RoundedCornerShape(8.dp),
                            border = BorderStroke(1.dp, StudioCardBorder),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("No projects", color = TextSecondary, fontSize = 12.sp, modifier = Modifier.padding(12.dp))
                        }
                    } else {
                        stageWorks.forEach { work ->
                            CleanWorkCard(
                                work = work,
                                onSelect = { onSelect(work) },
                                onMemo = { onMemo(work) },
                                onWhyFlagged = {}
                            )
                            Spacer(Modifier.height(6.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SectorAnalyticsView(works: List<WorkItem>) {
    val sectors = works.groupBy { it.category ?: "Other" }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(10.dp),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        item {
            Text("SECTORS", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }

        sectors.forEach { (category, sectorWorks) ->
            item {
                val totalCost = sectorWorks.sumOf { it.costLakhs }
                val avgProg = sectorWorks.map { it.progress }.average()

                Card(
                    colors = CardDefaults.cardColors(containerColor = StudioCard),
                    border = BorderStroke(1.dp, StudioCardBorder),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(category, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                            Text("₹${String.format("%.1f", totalCost)} L", color = AccentPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }

                        LinearProgressIndicator(
                            progress = { (avgProg / 100.0).toFloat().coerceIn(0f, 1f) },
                            modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                            color = AccentSuccess,
                            trackColor = Color(0xFF1E2333)
                        )

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("${sectorWorks.size} works", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            Text("${avgProg.toInt()}% Progress", color = AccentSuccess, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkDetailSheet(
    work: WorkItem,
    onDismiss: () -> Unit,
    onInquire: () -> Unit,
    onWhyFlagged: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = StudioCard,
        dragHandle = { BottomSheetDefaults.DragHandle(color = StudioCardBorder) }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(work.safeId, color = AccentPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                StatusPill(status = work.status ?: "ACTIVE", isDelayed = work.isDelayed)
            }

            Text(work.displayTitle, color = TextPrimary, fontSize = 17.sp, fontWeight = FontWeight.Bold)
            Text("${work.category} · ${work.department ?: "Agency"}", color = TextSecondary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)

            HorizontalDivider(color = StudioCardBorder)

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                DetailItem("Sanctioned", "₹${work.costLakhs} L")
                DetailItem("Physical", "${work.progress.toInt()}%")
                DetailItem("Disbursed", "₹${work.disbursedAmount ?: 0.0} L")
            }

            if (work.isDelayed) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFF2A1016))
                        .border(1.dp, AccentCritical, RoundedCornerShape(8.dp))
                        .padding(12.dp)
                ) {
                    Text(work.rootCauseIssue ?: "Execution delay flagged.", color = Color(0xFFFFD4DC), fontSize = 13.sp, fontWeight = FontWeight.Medium)
                }
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                if (work.isDelayed) {
                    OutlinedButton(
                        onClick = onWhyFlagged,
                        modifier = Modifier.weight(1f).height(46.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = TextPrimary),
                        border = BorderStroke(1.dp, StudioCardBorder),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("Why Flagged?", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Button(
                    onClick = onInquire,
                    modifier = Modifier.weight(1f).height(46.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AccentSuccess),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Inquire via WhatsApp", color = Color.Black, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
fun PipelineNode(title: String, amount: String, color: Color) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(StudioCard)
            .border(1.dp, StudioCardBorder, RoundedCornerShape(10.dp))
            .padding(14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(title, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
        Text(amount, color = color, fontSize = 15.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun CategoryPill(title: String, active: Boolean, isAlert: Boolean = false, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        color = if (active) (if (isAlert) AccentCritical.copy(alpha = 0.25f) else AccentPrimary.copy(alpha = 0.25f)) else StudioCard,
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, if (active) (if (isAlert) AccentCritical else AccentPrimary) else StudioCardBorder)
    ) {
        Text(
            text = title,
            color = if (active) (if (isAlert) AccentCritical else AccentPrimary) else TextPrimary,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 7.dp)
        )
    }
}

@Composable
fun CleanWorkCard(
    work: WorkItem,
    onSelect: () -> Unit,
    onMemo: () -> Unit,
    onWhyFlagged: () -> Unit
) {
    Card(
        onClick = onSelect,
        colors = CardDefaults.cardColors(containerColor = StudioCard),
        border = BorderStroke(1.dp, if (work.isDelayed) AccentCritical else StudioCardBorder),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(15.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(work.safeId, color = AccentPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                StatusPill(status = work.status ?: "ACTIVE", isDelayed = work.isDelayed)
            }

            Text(work.displayTitle, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold, maxLines = 2, overflow = TextOverflow.Ellipsis)

            LinearProgressIndicator(
                progress = { (work.progress / 100.0).toFloat().coerceIn(0f, 1f) },
                modifier = Modifier.fillMaxWidth().height(5.dp).clip(RoundedCornerShape(3.dp)),
                color = if (work.isDelayed) AccentCritical else AccentSuccess,
                trackColor = Color(0xFF1E2333)
            )

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("₹${work.costLakhs} L · ${work.progress.toInt()}%", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)

                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    if (work.isDelayed) {
                        IconButton(
                            onClick = onWhyFlagged,
                            modifier = Modifier.size(28.dp).clip(CircleShape).background(AccentCritical.copy(alpha = 0.2f))
                        ) {
                            Icon(Icons.Default.Info, contentDescription = "Why", tint = AccentCritical, modifier = Modifier.size(15.dp))
                        }
                    }

                    IconButton(
                        onClick = onMemo,
                        modifier = Modifier.size(28.dp).clip(CircleShape).background(AccentSuccess.copy(alpha = 0.2f))
                    ) {
                        Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Inquire", tint = AccentSuccess, modifier = Modifier.size(15.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun StatusPill(status: String, isDelayed: Boolean) {
    val bg = if (isDelayed) AccentCritical else AccentSuccess
    Box(
        modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(bg).padding(horizontal = 8.dp, vertical = 3.dp)
    ) {
        Text(status, color = Color.Black, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun DetailItem(label: String, value: String) {
    Column {
        Text(label, color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Text(value, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
    }
}
