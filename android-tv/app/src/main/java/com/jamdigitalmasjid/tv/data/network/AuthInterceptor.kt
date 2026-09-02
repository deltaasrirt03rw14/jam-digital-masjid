package com.jamdigitalmasjid.tv.data.network

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.stringPreferencesKey
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(private val dataStore: DataStore<Preferences>) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        
        // We use runBlocking here because Interceptor is synchronous.
        // In a real app, you might want a more sophisticated token manager, 
        // but this works for a simple offline-first architecture.
        val apiKey = runBlocking {
            dataStore.data.first()[stringPreferencesKey("device_api_key")]
        }
        val deviceId = runBlocking {
            dataStore.data.first()[stringPreferencesKey("device_uuid")]
        }

        val requestBuilder = request.newBuilder()
        if (apiKey != null) {
            requestBuilder.header("Authorization", "Bearer $apiKey")
        }
        if (deviceId != null) {
            requestBuilder.header("X-Device-Id", deviceId)
        }
        
        val authenticatedRequest = requestBuilder.build()

        return chain.proceed(authenticatedRequest)
    }
}
