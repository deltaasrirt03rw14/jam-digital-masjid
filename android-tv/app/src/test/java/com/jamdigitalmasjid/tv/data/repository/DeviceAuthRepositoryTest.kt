package com.jamdigitalmasjid.tv.data.repository

import com.jamdigitalmasjid.tv.data.local.DeviceCredentialStore
import com.jamdigitalmasjid.tv.data.network.JdmApiService
import com.jamdigitalmasjid.tv.data.network.PairDeviceRequestDto
import com.jamdigitalmasjid.tv.data.network.PairDeviceResponseDto
import com.jamdigitalmasjid.tv.domain.statemachine.DeviceAuthState
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import retrofit2.Response

@ExperimentalCoroutinesApi
class DeviceAuthRepositoryTest {

    private lateinit var credentialStore: DeviceCredentialStore
    private lateinit var apiService: JdmApiService
    private lateinit var repository: DeviceAuthRepository

    private val deviceId = "test-device-uuid"
    private val apiKey = "test-api-key"

    @Before
    fun setup() {
        credentialStore = mock()
        apiService = mock()
        repository = DeviceAuthRepository(credentialStore, apiService)
    }

    @Test
    fun `initialize - no API key - state is Unpaired`() = runTest {
        whenever(credentialStore.getOrCreateDeviceId()).thenReturn(deviceId)
        whenever(credentialStore.getApiKey()).thenReturn(null)

        repository.initialize()

        val state = repository.authState.value
        assertTrue(state is DeviceAuthState.Unpaired)
        assertEquals(deviceId, (state as DeviceAuthState.Unpaired).deviceId)
    }

    @Test
    fun `initialize - with API key - state is Authenticated`() = runTest {
        whenever(credentialStore.getOrCreateDeviceId()).thenReturn(deviceId)
        whenever(credentialStore.getApiKey()).thenReturn(apiKey)

        repository.initialize()

        val state = repository.authState.value
        assertTrue(state is DeviceAuthState.Authenticated)
        assertEquals(deviceId, (state as DeviceAuthState.Authenticated).deviceId)
    }

    @Test
    fun `pairDevice - valid PIN - saves credential and sets Authenticated`() = runTest {
        whenever(credentialStore.getOrCreateDeviceId()).thenReturn(deviceId)
        val response = Response.success(PairDeviceResponseDto(apiKey, "mosque-1"))
        whenever(apiService.pairDevice(any())).thenReturn(response)

        repository.pairDevice("123456")

        verify(credentialStore).saveApiKey(apiKey, "mosque-1")
        val state = repository.authState.value
        assertTrue(state is DeviceAuthState.Authenticated)
        assertEquals(deviceId, (state as DeviceAuthState.Authenticated).deviceId)
    }

    @Test
    fun `pairDevice - invalid PIN - returns Error and doesn't save credential`() = runTest {
        whenever(credentialStore.getOrCreateDeviceId()).thenReturn(deviceId)
        val response = Response.error<PairDeviceResponseDto>(400, "Invalid PIN".toResponseBody())
        whenever(apiService.pairDevice(any())).thenReturn(response)

        repository.pairDevice("999999")

        verify(credentialStore, never()).saveApiKey(any(), any())
        val state = repository.authState.value
        assertTrue(state is DeviceAuthState.Error)
        assertEquals("Invalid or expired PIN", (state as DeviceAuthState.Error).message)
    }

    @Test
    fun `clearCredentials - clears API key and sets Unpaired`() = runTest {
        whenever(credentialStore.getOrCreateDeviceId()).thenReturn(deviceId)
        
        repository.clearCredentials()

        verify(credentialStore).clearApiKey()
        val state = repository.authState.value
        assertTrue(state is DeviceAuthState.Unpaired)
    }
}
