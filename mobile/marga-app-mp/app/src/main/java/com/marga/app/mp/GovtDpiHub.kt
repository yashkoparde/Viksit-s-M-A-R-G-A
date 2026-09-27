package com.marga.app.mp

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

enum class DpiSyncState {
    IDLE, CONNECTING, VERIFYING, SYNCED, SECURE_LOCKED
}

data class GovtDpiService(
    val id: String,
    val name: String,
    val ministry: String,
    val protocol: String,
    val icon: ImageVector,
    val statusText: String,
    val latencyMs: Int,
    val description: String,
    val securityStandard: String,
    var state: DpiSyncState = DpiSyncState.SYNCED
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GovtDpiHubSheet(
    onDismiss: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var selectedService by remember { mutableStateOf<GovtDpiService?>(null) }
    var actionInProgress by remember { mutableStateOf(false) }
    var actionResult by remember { mutableStateOf<String?>(null) }

    val services = remember {
        mutableStateListOf(
            GovtDpiService(
                id = "PFMS",
                name = "PFMS / SNA 2.0 Direct Escrow",
                ministry = "Ministry of Finance (CGA)",
                protocol = "mTLS Class-3 PKI Gateway",
                icon = Icons.Default.AccountBalance,
                statusText = "LIVE (SNA Single Nodal Active)",
                latencyMs = 42,
                description = "Automates zero-leakage contractor milestone transfers directly from MoSPI Single Nodal Account (SNA) via PFMS API upon dual-sign consensus.",
                securityStandard = "Cert-In Audited · 256-bit AES · IT Act Sec 43A"
            ),
            GovtDpiService(
                id = "NAVIC",
                name = "ISRO NavIC & Bhuvan Geo-Sync",
                ministry = "Department of Space / ISRO",
                protocol = "L5 / S-Band Sovereign GNSS NMEA",
                icon = Icons.Default.LocationOn,
                statusText = "7 SATELLITES LOCKED (±1.8m accuracy)",
                latencyMs = 18,
                description = "Hardware-level spatial geofencing ensuring photo shutters unlock only within 15 meters of sanctioned GIS boundaries without mock-location spoofing.",
                securityStandard = "ISRO NavIC Standard Positioning Service (SPS)"
            ),
            GovtDpiService(
                id = "UIDAI",
                name = "Aadhaar e-Sign Non-Repudiation",
                ministry = "MeitY / UIDAI Controller of Certifying Auth",
                protocol = "e-Sign 3.0 Biometric / OTP API",
                icon = Icons.Default.VerifiedUser,
                statusText = "AUTHENTICATED (UIDAI CIDR)",
                latencyMs = 85,
                description = "Enforces legal non-repudiation for MP project nominations and District Collector sanction orders under Section 3A of the IT Act (2000).",
                securityStandard = "UIDAI Aadhaar Act 2016 · CCA Licensed"
            ),
            GovtDpiService(
                id = "DIGILOCKER",
                name = "DigiLocker Verifiable Credentials",
                ministry = "National e-Governance Division (NeGD)",
                protocol = "W3C VC / OID4VCI REST Spec",
                icon = Icons.Default.Description,
                statusText = "ISSUING NODE READY",
                latencyMs = 54,
                description = "Issues cryptographic, machine-readable Administrative Sanctions (AS) and GFR-12C Utilization Certificates to district institutional repositories.",
                securityStandard = "W3C Verifiable Credentials · NeGD Certified"
            ),
            GovtDpiService(
                id = "GATISHAKTI",
                name = "PM GatiShakti National Master Plan",
                ministry = "Ministry of Commerce & Industry (DPIIT)",
                protocol = "OGC GeoJSON Spatial Layer Feed",
                icon = Icons.Default.ShareLocation,
                statusText = "SYNCHRONIZED (District GIS Layer)",
                latencyMs = 64,
                description = "Pushes hyper-local village asset boundaries directly into India's National Infrastructure Master Plan to eliminate duplicate works.",
                securityStandard = "BISAG-N Sovereign GIS Spatial Standard"
            ),
            GovtDpiService(
                id = "CPGRAMS",
                name = "CPGRAMS Citizen Grievance Portal",
                ministry = "Department of Administrative Reforms (DARPG)",
                protocol = "REST Webhook SLA V3",
                icon = Icons.Default.Warning,
                statusText = "CONNECTED (District Collector Queue)",
                latencyMs = 38,
                description = "Automatically escalates crowd-verified citizen defect reports (>3 nearby residents) directly to the District Collector's grievance docket.",
                securityStandard = "DARPG Central Grievance Directive 2024"
            )
        )
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = StudioCard,
        dragHandle = { BottomSheetDefaults.DragHandle(color = StudioCardBorder) }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(AccentSuccess)
                        )
                        Text("GOVERNMENT DPI & API HUB", color = AccentPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    Text("Sovereign Digital Stack", color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                }

                Surface(
                    color = AccentSuccess.copy(alpha = 0.15f),
                    border = BorderStroke(1.dp, AccentSuccess.copy(alpha = 0.4f)),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        "6/6 CONNECTED",
                        color = AccentSuccess,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                    )
                }
            }

            Text(
                "MARGA natively interfaces with India's core Digital Public Infrastructure (DPI) to automate fund transfers, satellite proof, biometric validation, and grievance escalations.",
                color = TextSecondary,
                fontSize = 13.sp,
                lineHeight = 18.sp
            )

            HorizontalDivider(color = StudioCardBorder)

            // Service Cards
            services.forEach { s ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = if (selectedService?.id == s.id) StudioCardHover else StudioCard),
                    border = BorderStroke(1.dp, if (selectedService?.id == s.id) AccentPrimary else StudioCardBorder),
                    shape = RoundedCornerShape(12.dp),
                    onClick = {
                        selectedService = s
                        actionResult = null
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(Color(0xFF161B28))
                                .border(1.dp, StudioCardBorder, RoundedCornerShape(10.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(s.icon, contentDescription = s.name, tint = AccentPrimary, modifier = Modifier.size(22.dp))
                        }

                        Column(modifier = Modifier.weight(1f)) {
                            Text(s.name, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Text(s.ministry, color = TextSecondary, fontSize = 12.sp)
                            Spacer(Modifier.height(2.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                                Text(s.statusText, color = AccentSuccess, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                Text("· ${s.latencyMs}ms", color = TextTertiary, fontSize = 11.sp)
                            }
                        }

                        Icon(Icons.Default.ChevronRight, contentDescription = "Open", tint = TextSecondary, modifier = Modifier.size(18.dp))
                    }
                }
            }

            Spacer(Modifier.height(16.dp))
        }
    }

    // Detail & Live Test Dialog
    selectedService?.let { s ->
        AlertDialog(
            onDismissRequest = { selectedService = null },
            containerColor = StudioCard,
            title = {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Icon(s.icon, contentDescription = null, tint = AccentPrimary, modifier = Modifier.size(24.dp))
                    Column {
                        Text(s.id, color = AccentPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Text(s.name, color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    }
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(s.description, color = TextSecondary, fontSize = 13.sp, lineHeight = 18.sp)

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFF141926))
                            .border(1.dp, StudioCardBorder, RoundedCornerShape(8.dp))
                            .padding(12.dp)
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text("TECHNICAL PROTOCOL SPECIFICATION", color = AccentPrimary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            Text("Protocol: ${s.protocol}", color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            Text("Compliance: ${s.securityStandard}", color = TextSecondary, fontSize = 12.sp)
                            Text("Sovereign Authority: ${s.ministry}", color = TextTertiary, fontSize = 11.sp)
                        }
                    }

                    if (actionInProgress) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            CircularProgressIndicator(color = AccentPrimary, strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
                            Text("Executing sovereign handshake ping...", color = TextSecondary, fontSize = 12.sp)
                        }
                    }

                    actionResult?.let { res ->
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFF0D251C))
                                .border(1.dp, AccentSuccess, RoundedCornerShape(8.dp))
                                .padding(10.dp)
                        ) {
                            Text(res, color = Color(0xFFD1FAE5), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        actionInProgress = true
                        actionResult = null
                        scope.launch {
                            delay(600)
                            actionInProgress = false
                            actionResult = "Handshake 200 OK: Secured mTLS session active with ${s.id} gateway (${s.latencyMs}ms)."
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AccentPrimary)
                ) {
                    Text("Ping Live Endpoint", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedService = null }) {
                    Text("Close", color = TextPrimary, fontWeight = FontWeight.SemiBold)
                }
            }
        )
    }
}
