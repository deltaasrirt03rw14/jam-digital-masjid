package com.jamdigitalmasjid.tv.data.local

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.mutablePreferencesOf
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

@ExperimentalCoroutinesApi
class DeviceCredentialStoreTest {

    private lateinit var dataStore: DataStore<Preferences>
    private lateinit var store: DeviceCredentialStoreImpl

    private fun createFakeDataStore(): DataStore<Preferences> {
        return object : DataStore<Preferences> {
            val flow = MutableStateFlow<Preferences>(mutablePreferencesOf())
            override val data: kotlinx.coroutines.flow.Flow<Preferences> = flow
            override suspend fun updateData(transform: suspend (t: Preferences) -> Preferences): Preferences {
                val newPrefs = transform(flow.value)
                flow.value = newPrefs
                return newPrefs
            }
        }
    }

    @Before
    fun setup() {
        dataStore = createFakeDataStore()
        store = DeviceCredentialStoreImpl(dataStore)
    }

    @Test
    fun `getOrCreateDeviceId - generates UUID on first launch`() = runTest {
        val deviceId = store.getOrCreateDeviceId()
        assertNotNull(deviceId)
        assertNotEquals("", deviceId)
    }

    @Test
    fun `getOrCreateDeviceId - returns existing UUID on subsequent calls`() = runTest {
        val firstId = store.getOrCreateDeviceId()
        val secondId = store.getOrCreateDeviceId()
        assertEquals(firstId, secondId)
    }

    @Test
    fun `saveApiKey and getApiKey - works correctly`() = runTest {
        assertNull(store.getApiKey())
        
        store.saveApiKey("secret-api-key")
        assertEquals("secret-api-key", store.getApiKey())
    }

    @Test
    fun `clearApiKey - removes api key but keeps device id`() = runTest {
        val deviceId = store.getOrCreateDeviceId()
        store.saveApiKey("secret-api-key")
        
        store.clearApiKey()
        
        assertNull(store.getApiKey())
        assertEquals(deviceId, store.getOrCreateDeviceId())
    }
}
