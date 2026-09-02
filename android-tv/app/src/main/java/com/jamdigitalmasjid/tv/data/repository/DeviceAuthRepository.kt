package com.jamdigitalmasjid.tv.data.repository

import com.jamdigitalmasjid.tv.data.local.DeviceCredentialStore
import com.jamdigitalmasjid.tv.data.network.JdmApiService
import com.jamdigitalmasjid.tv.data.network.PairDeviceRequestDto
import com.jamdigitalmasjid.tv.domain.statemachine.DeviceAuthState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first

class DeviceAuthRepository(
    private val credentialStore: DeviceCredentialStore,
    private val apiService: JdmApiService
) {
    private val _authState = MutableStateFlow<DeviceAuthState>(DeviceAuthState.Loading)
    val authState: StateFlow<DeviceAuthState> = _authState.asStateFlow()

    suspend fun initialize() {
        val deviceId = credentialStore.getOrCreateDeviceId()
        val apiKey = credentialStore.getApiKey()

        if (apiKey != null) {
            _authState.value = DeviceAuthState.Authenticated(deviceId)
        } else {
            _authState.value = DeviceAuthState.Unpaired(deviceId)
        }
    }

    suspend fun pairDevice(pin: String, deviceName: String? = null) {
        val deviceId = credentialStore.getOrCreateDeviceId()
        _authState.value = DeviceAuthState.Pairing(deviceId)

        try {
            val response = apiService.pairDevice(
                PairDeviceRequestDto(
                    deviceIdentifier = deviceId,
                    token = pin,
                    deviceName = deviceName
                )
            )

            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    credentialStore.saveApiKey(body.apiKey, body.mosqueId)
                    _authState.value = DeviceAuthState.Authenticated(deviceId)
                } else {
                    _authState.value = DeviceAuthState.Error(deviceId, "Empty response from server")
                }
            } else {
                _authState.value = DeviceAuthState.Error(
                    deviceId,
                    when (response.code()) {
                        400 -> "Invalid or expired PIN"
                        409 -> "Device is already paired"
                        else -> "Pairing failed: ${response.code()}"
                    }
                )
            }
        } catch (e: Exception) {
            _authState.value = DeviceAuthState.Error(deviceId, "Network error: ${e.message}")
        }
    }

    suspend fun clearCredentials() {
        credentialStore.clearApiKey()
        val deviceId = credentialStore.getOrCreateDeviceId()
        _authState.value = DeviceAuthState.Unpaired(deviceId)
    }
}
