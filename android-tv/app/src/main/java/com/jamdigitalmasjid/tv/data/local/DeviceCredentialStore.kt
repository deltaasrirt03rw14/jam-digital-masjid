package com.jamdigitalmasjid.tv.data.local

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.util.UUID

interface DeviceCredentialStore {
    suspend fun getOrCreateDeviceId(): String
    val apiKeyFlow: Flow<String?>
    suspend fun getApiKey(): String?
    suspend fun saveApiKey(apiKey: String, mosqueId: String? = null)
    suspend fun clearApiKey()
}

class DeviceCredentialStoreImpl(
    private val dataStore: DataStore<Preferences>
) : DeviceCredentialStore {

    companion object {
        val KEY_DEVICE_ID = stringPreferencesKey("device_uuid")
        val KEY_API_KEY = stringPreferencesKey("device_api_key")
    }

    override suspend fun getOrCreateDeviceId(): String {
        val currentId = dataStore.data.first()[KEY_DEVICE_ID]
        if (currentId != null) {
            return currentId
        }

        val newId = UUID.randomUUID().toString()
        dataStore.edit { prefs ->
            prefs[KEY_DEVICE_ID] = newId
        }
        return newId
    }

    override val apiKeyFlow: Flow<String?> = dataStore.data.map { prefs ->
        prefs[KEY_API_KEY]
    }

    override suspend fun getApiKey(): String? {
        return dataStore.data.first()[KEY_API_KEY]
    }

    override suspend fun saveApiKey(apiKey: String, mosqueId: String?) {
        dataStore.edit { prefs ->
            prefs[KEY_API_KEY] = apiKey
            if (mosqueId != null) {
                prefs[stringPreferencesKey("mosque_id")] = mosqueId
            }
        }
    }

    override suspend fun clearApiKey() {
        dataStore.edit { prefs ->
            prefs.remove(KEY_API_KEY)
            prefs.remove(stringPreferencesKey("mosque_id"))
        }
    }
}
