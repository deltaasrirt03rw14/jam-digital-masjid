package com.jamdigitalmasjid.tv.presentation.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.jamdigitalmasjid.tv.domain.statemachine.DeviceAuthState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PairingScreen(
    authState: DeviceAuthState,
    onPairClicked: (String) -> Unit
) {
    var pinInput by remember { mutableStateOf("") }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF121212)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(48.dp)
        ) {
            Text(
                text = "CONNECT THIS DEVICE",
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                letterSpacing = 2.sp
            )
            
            Spacer(modifier = Modifier.height(32.dp))

            // Device ID Display
            val deviceId = when (authState) {
                is DeviceAuthState.Unpaired -> authState.deviceId
                is DeviceAuthState.Pairing -> authState.deviceId
                is DeviceAuthState.Error -> authState.deviceId
                is DeviceAuthState.Authenticated -> authState.deviceId
                is DeviceAuthState.Loading -> "Loading..."
            }

            Text(
                text = "DEVICE ID",
                fontSize = 14.sp,
                color = Color.Gray,
                letterSpacing = 1.sp
            )
            Text(
                text = deviceId,
                fontSize = 18.sp,
                fontFamily = FontFamily.Monospace,
                color = Color.White,
                modifier = Modifier.padding(top = 8.dp)
            )

            Spacer(modifier = Modifier.height(48.dp))

            if (authState is DeviceAuthState.Pairing) {
                CircularProgressIndicator(color = Color.White)
                Spacer(modifier = Modifier.height(16.dp))
                Text("Pairing...", color = Color.White)
            } else {
                Text(
                    text = "Enter the 6-digit PIN from the Admin Dashboard",
                    fontSize = 18.sp,
                    color = Color.LightGray
                )
                
                Spacer(modifier = Modifier.height(24.dp))

                OutlinedTextField(
                    value = pinInput,
                    onValueChange = { if (it.length <= 6) pinInput = it.filter { char -> char.isDigit() } },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    textStyle = androidx.compose.ui.text.TextStyle(
                        fontSize = 32.sp,
                        letterSpacing = 12.sp,
                        textAlign = TextAlign.Center,
                        color = Color.White,
                        fontFamily = FontFamily.Monospace
                    ),
                    modifier = Modifier.width(300.dp),
                    colors = TextFieldDefaults.outlinedTextFieldColors(
                        focusedBorderColor = Color.White,
                        unfocusedBorderColor = Color.Gray,
                        cursorColor = Color.White
                    ),
                    singleLine = true,
                    placeholder = {
                        Text(
                            text = "------", 
                            fontSize = 32.sp, 
                            letterSpacing = 12.sp, 
                            color = Color.DarkGray,
                            modifier = Modifier.fillMaxSize(),
                            textAlign = TextAlign.Center
                        )
                    }
                )

                Spacer(modifier = Modifier.height(32.dp))

                Button(
                    onClick = { 
                        if (pinInput.length == 6) {
                            onPairClicked(pinInput)
                        }
                    },
                    enabled = pinInput.length == 6,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.White,
                        contentColor = Color.Black,
                        disabledContainerColor = Color.DarkGray,
                        disabledContentColor = Color.Gray
                    ),
                    modifier = Modifier.height(56.dp).width(200.dp)
                ) {
                    Text(text = "PAIR DEVICE", fontSize = 18.sp, fontWeight = FontWeight.Bold)
                }

                if (authState is DeviceAuthState.Error) {
                    Spacer(modifier = Modifier.height(24.dp))
                    Text(
                        text = authState.message,
                        color = Color(0xFFFF5252),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }
}
