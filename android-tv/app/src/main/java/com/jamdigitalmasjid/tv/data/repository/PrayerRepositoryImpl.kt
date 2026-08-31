package com.jamdigitalmasjid.tv.data.repository

import android.util.Log
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.stringPreferencesKey
import com.jamdigitalmasjid.tv.data.local.PrayerScheduleDao
import com.jamdigitalmasjid.tv.data.local.PrayerScheduleEntity
import com.jamdigitalmasjid.tv.data.network.JdmApiService
import com.jamdigitalmasjid.tv.domain.model.PrayerSchedule
import kotlinx.coroutines.flow.first
import java.net.UnknownHostException
import java.net.ConnectException

class PrayerRepositoryImpl(
    private val apiService: JdmApiService,
    private val prayerScheduleDao: PrayerScheduleDao,
    private val dataStore: DataStore<Preferences>
) {
    companion object {
        private const val STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000L // 24 hours
    }

    suspend fun getPrayerSchedule(date: String): PrayerSchedule? {
        val mosqueId = getMosqueId()
        if (mosqueId == null) {
            Log.e("PrayerRepository", "Mosque ID is not configured in DataStore.")
            return null
        }

        // Priority 1: Backend
        try {
            val response = apiService.getPrayerSchedule(mosqueId, date)
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    val entity = PrayerScheduleEntity(
                        mosqueId = mosqueId,
                        date = body.date,
                        imsak = body.imsak,
                        subuh = body.subuh,
                        syuruq = body.syuruq,
                        dzuhur = body.dzuhur,
                        ashar = body.ashar,
                        maghrib = body.maghrib,
                        isya = body.isya,
                        sourceProvider = body.source.provider,
                        lastSyncAt = System.currentTimeMillis()
                    )
                    prayerScheduleDao.insertSchedule(entity)
                    return mapToDomain(entity, isOfflineCache = false)
                }
            } else if (response.code() == 401 || response.code() == 403) {
                Log.e("PrayerRepository", "Auth Error: ${response.code()}")
                // Do not pretend it's a generic offline error if it's an auth error.
                // Depending on requirements, we might want to throw an AuthException.
            }
        } catch (e: Exception) {
            // Includes UnknownHostException, ConnectException, SocketTimeoutException
            Log.w("PrayerRepository", "Failed to fetch from backend: ${e.message}")
        }

        // Priority 2: Room Cache
        val cachedEntity = prayerScheduleDao.getScheduleByDate(mosqueId, date)
        if (cachedEntity != null) {
            return mapToDomain(cachedEntity, isOfflineCache = true)
        }

        // Priority 3: Fallback calculation
        // Handled at the Engine/ViewModel level if repository returns null
        return null
    }

    private fun mapToDomain(entity: PrayerScheduleEntity, isOfflineCache: Boolean): PrayerSchedule {
        val now = System.currentTimeMillis()
        val isStale = (now - entity.lastSyncAt) > STALE_THRESHOLD_MS

        return PrayerSchedule(
            date = entity.date,
            imsak = entity.imsak,
            subuh = entity.subuh,
            syuruq = entity.syuruq,
            dzuhur = entity.dzuhur,
            ashar = entity.ashar,
            maghrib = entity.maghrib,
            isya = entity.isya,
            sourceProvider = entity.sourceProvider,
            isOfflineCache = isOfflineCache,
            isStale = isStale
        )
    }

    private suspend fun getMosqueId(): String? {
        val preferences = dataStore.data.first()
        return preferences[stringPreferencesKey("mosque_id")]
    }
}
