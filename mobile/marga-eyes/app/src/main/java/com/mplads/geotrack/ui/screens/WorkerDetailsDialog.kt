package com.mplads.geotrack.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.mplads.geotrack.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkerDetailsDialog(
    initialWorkerName: String,
    initialWorkId: String,
    initialDescription: String,
    onConfirm: (String, String, String) -> Unit,
    onDismiss: () -> Unit
) {
    var workerName by remember { mutableStateOf(initialWorkerName) }
    var workId by remember { mutableStateOf(initialWorkId) }
    var description by remember { mutableStateOf(initialDescription) }
    var errorMessage by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Zinc900),
            border = androidx.compose.foundation.BorderStroke(1.dp, Zinc800),
            shape = RoundedCornerShape(20.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Header Icon & Title
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(Emerald500.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Badge,
                            contentDescription = null,
                            tint = Emerald400,
                            modifier = Modifier.size(22.dp)
                        )
                    }

                    Column {
                        Text(
                            text = "Inspector Details",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = White
                        )
                        Text(
                            text = "Set Officer Name, Work ID & Site Notes",
                            fontSize = 12.sp,
                            color = Zinc400
                        )
                    }
                }

                HorizontalDivider(color = Zinc800)

                // 1. Worker Name Field
                OutlinedTextField(
                    value = workerName,
                    onValueChange = {
                        workerName = it
                        errorMessage = ""
                    },
                    label = { Text("Officer / Inspector Name") },
                    placeholder = { Text("e.g. Rahul Shirol") },
                    leadingIcon = {
                        Icon(Icons.Default.Person, contentDescription = null, tint = Emerald400)
                    },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Emerald400,
                        unfocusedBorderColor = Zinc800,
                        focusedLabelColor = Emerald400,
                        unfocusedLabelColor = Zinc400
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                // 2. Work ID Field
                OutlinedTextField(
                    value = workId,
                    onValueChange = {
                        workId = it
                        errorMessage = ""
                    },
                    label = { Text("Work / Project ID") },
                    placeholder = { Text("e.g. WRK-2026-8942") },
                    leadingIcon = {
                        Icon(Icons.Default.Assignment, contentDescription = null, tint = Emerald400)
                    },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Emerald400,
                        unfocusedBorderColor = Zinc800,
                        focusedLabelColor = Emerald400,
                        unfocusedLabelColor = Zinc400
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                // 3. Work Description Field (Below Work ID & Name)
                OutlinedTextField(
                    value = description,
                    onValueChange = {
                        description = it
                        errorMessage = ""
                    },
                    label = { Text("Work / Site Description") },
                    placeholder = { Text("e.g. Road repair & drainage inspection") },
                    leadingIcon = {
                        Icon(Icons.Default.Notes, contentDescription = null, tint = Emerald400)
                    },
                    singleLine = false,
                    maxLines = 2,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Emerald400,
                        unfocusedBorderColor = Zinc800,
                        focusedLabelColor = Emerald400,
                        unfocusedLabelColor = Zinc400
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                if (errorMessage.isNotEmpty()) {
                    Text(
                        text = errorMessage,
                        color = Rose500,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }

                // Action Buttons
                Button(
                    onClick = {
                        if (workerName.trim().isEmpty() || workId.trim().isEmpty()) {
                            errorMessage = "Please fill in Officer Name and Work ID."
                        } else {
                            onConfirm(workerName.trim(), workId.trim(), description.trim())
                        }
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Emerald500,
                        contentColor = Black
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                ) {
                    Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = "Save & Continue to Camera", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
            }
        }
    }
}
