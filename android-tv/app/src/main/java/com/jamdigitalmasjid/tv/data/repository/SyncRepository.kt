package com.jamdigitalmasjid.tv.data.repository

import android.util.Log
import androidx.annotation.VisibleForTesting
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.room.withTransaction
import com.jamdigitalmasjid.tv.data.local.AppDatabase
import com.jamdigitalmasjid.tv.data.local.SyncedContentEntity
import com.jamdigitalmasjid.tv.data.local.SyncedEventEntity
import com.jamdigitalmasjid.tv.data.local.SyncedMediaEntity
import com.jamdigitalmasjid.tv.data.local.SyncedMosqueConfigEntity
import com.jamdigitalmasjid.tv.data.network.JdmApiService
import com.jamdigitalmasjid.tv.data.network.SyncResponseDto
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import java.io.IOException

@VisibleForTesting
var executeTransaction: suspend (AppDatabase, suspend () -> Unit) -> Unit = { db, block ->
    db.withTransaction { block() }
}

/**
 * Sealed result type for sync operations.
 */
sealed interface SyncResult {
    /** Backend returned 200 and data was persisted successfully. */
    data class Updated(val syncedAt: Long, val configVersion: Int) : SyncResult

    /** Backend returned 304 – local data is still current. */
    data class NotModified(val syncedAt: Long) : SyncResult

    /** No network available; local cache preserved. */
    data class Offline(val hasCachedData: Boolean) : SyncResult

    /** Backend returned an HTTP error; local cache preserved. */
    data class Error(val code: Int?, val message: String?) : SyncResult
}

/**
 * Sync repository implementing offline-first content sync.
 *
 * Architecture:
 *   Local DB = source of truth for UI
 *   Network sync = updater only
 *
 * DataStore keys managed here:
 *   DEVICE_IDENTIFIER_KEY  — paired device UUID (used in URL path)
 *   SYNC_ETAG_KEY          — last received ETag for If-None-Match
 *   SYNC_LAST_SUCCESS_KEY  — epoch millis of last successful sync
 */
class SyncRepository(
    private val apiService: JdmApiService,
    private val database: AppDatabase,
    private val dataStore: DataStore<Preferences>,
    private val authRepository: DeviceAuthRepository
) {
    val mosqueConfigFlow = database.syncedMosqueConfigDao().getMosqueConfigFlow()
    val runningTextFlow = database.syncedContentDao().getActiveTextContentsFlow()
    
    companion object {
        private const val TAG = "SyncRepository"

        // Must match DeviceCredentialStoreImpl.KEY_DEVICE_ID
        val DEVICE_IDENTIFIER_KEY = stringPreferencesKey("device_uuid")
        val SYNC_ETAG_KEY         = stringPreferencesKey("sync_etag")
        val SYNC_LAST_SUCCESS_KEY = longPreferencesKey("last_synced_at")

        /** Retry delays for transient network failures: 0s, 5s, 15s */
        private val RETRY_DELAYS_MS = listOf(0L, 5_000L, 15_000L)
    }

    /**
     * Perform sync with ETag conditional request support.
     *
     * Flow:
     *  1. Read device_identifier from DataStore. If missing → Offline (hasCachedData=false).
     *  2. Read stored ETag. Send If-None-Match if present.
     *  3. Handle 200 → persist atomically → update ETag.
     *  4. Handle 304 → keep local data unchanged.
     *  5. Handle 401/403 → clear credentials (device revoked).
     *  6. Handle IOException → return Offline.
     *  7. Handle other HTTP errors → return Error, do NOT clear local data.
     */
    /**
     * Perform sync with ETag conditional request and retry/backoff.
     *
     * Retry policy:
     * - Retries up to 3 times on IOException (transient network failures).
     * - Delays: 0s → 5s → 15s (exponential-ish backoff).
     * - 401/403 are NOT retried — device is revoked, credentials are cleared immediately.
     * - 304 is NOT retried — it is a successful no-change response.
     * - Non-transient HTTP errors (5xx, 4xx other than auth) are returned without retry.
     */
    suspend fun sync(): SyncResult {
        val prefs = dataStore.data.first()
        val deviceId = prefs[DEVICE_IDENTIFIER_KEY]

        if (deviceId.isNullOrBlank()) {
            Log.w(TAG, "Device identifier not set; cannot sync.")
            val hasCached = hasCachedData()
            return SyncResult.Offline(hasCachedData = hasCached)
        }

        val storedEtag = prefs[SYNC_ETAG_KEY]
        Log.d(TAG, "Starting sync for device=$deviceId etag=$storedEtag")

        // Retry loop for transient IOException failures
        var lastIoException: IOException? = null
        for ((attempt, delayMs) in RETRY_DELAYS_MS.withIndex()) {
            if (delayMs > 0) {
                Log.d(TAG, "Sync retry attempt $attempt — waiting ${delayMs}ms")
                delay(delayMs)
            }

            try {
                val response = apiService.getSyncData(
                    deviceId = deviceId,
                    etag = storedEtag
                )

                return when (response.code()) {
                    200 -> {
                        val body = response.body()
                        if (body == null) {
                            Log.e(TAG, "200 response with null body")
                            return SyncResult.Error(200, "Empty response body")
                        }
                        persistSyncData(body)

                        // ETag is only saved AFTER successful persistence.
                        val newEtag = response.headers()["ETag"]
                        val syncedAt = System.currentTimeMillis()
                        dataStore.edit { settings ->
                            if (!newEtag.isNullOrBlank()) settings[SYNC_ETAG_KEY] = newEtag
                            settings[SYNC_LAST_SUCCESS_KEY] = syncedAt
                        }
                        Log.i(TAG, "Sync 200 OK — configVersion=${body.mosque.config_version} etag=$newEtag")
                        SyncResult.Updated(syncedAt = syncedAt, configVersion = body.mosque.config_version)
                    }

                    304 -> {
                        // Local data is current. Nothing to persist. Do not retry.
                        val syncedAt = System.currentTimeMillis()
                        dataStore.edit { it[SYNC_LAST_SUCCESS_KEY] = syncedAt }
                        Log.i(TAG, "Sync 304 Not Modified — local data is current")
                        SyncResult.NotModified(syncedAt = syncedAt)
                    }

                    401, 403 -> {
                        // Auth error — do NOT retry. Clear credentials immediately.
                        Log.w(TAG, "Sync Unauthorized (${response.code()}). Device revoked or credential invalid.")
                        authRepository.clearCredentials()
                        SyncResult.Error(code = response.code(), message = "Unauthorized / Revoked")
                    }

                    else -> {
                        // HTTP error — do NOT touch local data. Do not retry HTTP errors.
                        val errorCode = response.code()
                        Log.e(TAG, "Sync HTTP error: $errorCode (attempt $attempt)")
                        SyncResult.Error(code = errorCode, message = response.message())
                    }
                }

            } catch (e: IOException) {
                lastIoException = e
                Log.w(TAG, "Sync network failure (attempt $attempt): ${e.message}")
                // Continue to next retry attempt
            } catch (e: Exception) {
                Log.e(TAG, "Sync unexpected error: ${e.message}")
                return SyncResult.Error(code = null, message = e.message)
            }
        }

        // All retry attempts exhausted due to IOException
        Log.w(TAG, "Sync failed after ${RETRY_DELAYS_MS.size} attempts: ${lastIoException?.message}")
        val hasCached = hasCachedData()
        return SyncResult.Offline(hasCachedData = hasCached)
    }

    /**
     * Sends a heartbeat ping to the backend.
     *
     * @param deviceId The device's UUID identifier.
     * @return `true` if backend signals syncRequired=true, `false` otherwise.
     * @throws IOException if the network is unavailable (caller handles gracefully).
     */
    suspend fun sendHeartbeat(deviceId: String): Boolean {
        Log.d(TAG, "Sending heartbeat for device=$deviceId")
        val response = apiService.sendHeartbeat(deviceId)
        return if (response.isSuccessful) {
            val body = response.body()
            val syncRequired = body?.syncRequired ?: false
            Log.d(TAG, "Heartbeat response: configVersion=${body?.configVersion} syncRequired=$syncRequired")
            syncRequired
        } else {
            Log.w(TAG, "Heartbeat HTTP error: ${response.code()}")
            false
        }
    }

    /**
     * Persist sync payload atomically using Room's withTransaction.
     * Replace strategy: delete existing rows for this mosque, insert fresh data.
     * PrayerScheduleEntity (separate table) is NEVER touched here.
     */
    private suspend fun persistSyncData(payload: SyncResponseDto) {
        val mosqueId = payload.mosque.id
        val now = System.currentTimeMillis()

        dataStore.edit { settings ->
            settings[stringPreferencesKey("mosque_id")] = mosqueId
        }

        executeTransaction(database) {
            // 1. Mosque config (upsert)
            database.syncedMosqueConfigDao().upsert(
                SyncedMosqueConfigEntity(
                    mosqueId = mosqueId,
                    name = payload.mosque.name,
                    address = payload.mosque.address,
                    timezone = payload.mosque.timezone,
                    latitude = payload.mosque.latitude,
                    longitude = payload.mosque.longitude,
                    configVersion = payload.mosque.config_version,
                    lastSyncAt = now
                )
            )

            // 2. Contents — full snapshot replace
            database.syncedContentDao().deleteAllForMosque(mosqueId)
            database.syncedContentDao().upsertAll(
                payload.contents.map { c ->
                    SyncedContentEntity(
                        id = c.id,
                        mosqueId = mosqueId,
                        title = c.title,
                        type = c.type,
                        status = c.status,
                        scheduling = c.scheduling,
                        contentData = c.content_data?.toString(),
                        updatedAt = c.updated_at,
                        lastSyncAt = now
                    )
                }
            )

            // 3. Media — full snapshot replace
            database.syncedMediaDao().deleteAllForMosque(mosqueId)
            database.syncedMediaDao().upsertAll(
                payload.media.map { m ->
                    SyncedMediaEntity(
                        id = m.id,
                        mosqueId = mosqueId,
                        filename = m.filename,
                        mimeType = m.mime_type,
                        url = m.url,
                        size = m.size,
                        updatedAt = m.updated_at,
                        lastSyncAt = now
                    )
                }
            )

            // 4. Events — full snapshot replace
            database.syncedEventDao().deleteAllForMosque(mosqueId)
            database.syncedEventDao().upsertAll(
                payload.events.map { e ->
                    SyncedEventEntity(
                        id = e.id,
                        mosqueId = mosqueId,
                        title = e.title,
                        description = e.description,
                        startTime = e.start_time,
                        endTime = e.end_time,
                        updatedAt = e.updated_at,
                        lastSyncAt = now
                    )
                }
            )
        }

        Log.d(TAG, "Persisted sync data for mosque=$mosqueId contents=${payload.contents.size} media=${payload.media.size} events=${payload.events.size}")
    }

    private suspend fun hasCachedData(): Boolean {
        val prefs = dataStore.data.first()
        // Check if we have any synced mosque config row (proxy for "has synced before")
        return prefs[SYNC_ETAG_KEY] != null
    }
}
