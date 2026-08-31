package com.jamdigitalmasjid.tv.domain.statemachine

sealed class DeviceAuthState {
    data object Loading : DeviceAuthState()
    data class Unpaired(val deviceId: String) : DeviceAuthState()
    data class Pairing(val deviceId: String) : DeviceAuthState()
    data class Authenticated(val deviceId: String) : DeviceAuthState()
    data class Error(val deviceId: String, val message: String) : DeviceAuthState()
}
