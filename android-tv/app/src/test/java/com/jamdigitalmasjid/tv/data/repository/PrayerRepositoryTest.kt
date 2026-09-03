package com.jamdigitalmasjid.tv.data.repository

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.mutablePreferencesOf
import androidx.datastore.preferences.core.stringPreferencesKey
import com.jamdigitalmasjid.tv.data.local.PrayerScheduleDao
import com.jamdigitalmasjid.tv.data.local.PrayerScheduleEntity
import com.jamdigitalmasjid.tv.data.network.JdmApiService
import com.jamdigitalmasjid.tv.data.network.PrayerScheduleDto
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.mockito.Mockito.*
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import retrofit2.Response

@ExperimentalCoroutinesApi
class PrayerRepositoryTest {

    @get:Rule
    val instantTaskExecutorRule = InstantTaskExecutorRule()

    private lateinit var apiService: JdmApiService
    private lateinit var prayerScheduleDao: PrayerScheduleDao
    private lateinit var dataStore: DataStore<Preferences>
    private lateinit var repository: PrayerRepositoryImpl

    @Before
    fun setup() {
        apiService = mock()
        prayerScheduleDao = mock()
        dataStore = mock()
        repository = PrayerRepositoryImpl(apiService, prayerScheduleDao, dataStore)
    }

    @Test
    fun `getPrayerSchedule returns from DB without hitting backend`() = runTest {
        val date = "2023-01-01"
        
        // Mock DataStore
        val prefs = mutablePreferencesOf(stringPreferencesKey("mosque_id") to "mosque-123")
        whenever(dataStore.data).thenReturn(flowOf(prefs))
        
        // Mock DB
        val entity = PrayerScheduleEntity(
            mosqueId = "mosque-123",
            date = date, imsak = "04:00", subuh = "04:10", syuruq = "05:30", dzuhur = "12:00",
            ashar = "15:00", maghrib = "18:00", isya = "19:00",
            sourceProvider = "myQuran", lastSyncAt = System.currentTimeMillis() - 3600000L // 1 hour ago
        )
        whenever(prayerScheduleDao.getScheduleByDate(any(), any())).thenReturn(entity)

        val result = repository.getPrayerSchedule(date)

        assertNotNull(result)
        assertEquals(true, result?.isOfflineCache)
        assertEquals(false, result?.isStale) // Not > 24 hours
        
        // Verify API was NOT called
        verifyNoInteractions(apiService)
    }

    @Test
    fun `fetchPrayerScheduleFromNetwork calls API and saves to DB`() = runTest {
        val date = "2023-01-01"
        
        // Mock DataStore
        val prefs = mutablePreferencesOf(stringPreferencesKey("mosque_id") to "mosque-123")
        whenever(dataStore.data).thenReturn(flowOf(prefs))

        // Mock API
        val dto = PrayerScheduleDto(
            date = date,
            imsak = "04:00", subuh = "04:10", syuruq = "05:30", dzuhur = "12:00",
            ashar = "15:00", maghrib = "18:00", isya = "19:00",
            sourceProvider = "myQuran"
        )
        whenever(apiService.getPrayerSchedule(any(), any())).thenReturn(Response.success(dto))

        repository.fetchPrayerScheduleFromNetwork(date)
        
        // Verify it was saved
        verify(prayerScheduleDao).insertSchedule(org.mockito.kotlin.any())
    }

    @Test
    fun `getPrayerSchedule marks as stale if DB cache is older than 24 hours`() = runTest {
        val date = "2023-01-01"
        
        // Mock DataStore
        val prefs = mutablePreferencesOf(stringPreferencesKey("mosque_id") to "mosque-123")
        whenever(dataStore.data).thenReturn(flowOf(prefs))

        // Mock DB fallback
        val entity = PrayerScheduleEntity(
            mosqueId = "mosque-123",
            date = date, imsak = "04:00", subuh = "04:10", syuruq = "05:30", dzuhur = "12:00",
            ashar = "15:00", maghrib = "18:00", isya = "19:00",
            sourceProvider = "myQuran", lastSyncAt = System.currentTimeMillis() - (48 * 3600000L) // 48 hours ago
        )
        whenever(prayerScheduleDao.getScheduleByDate(any(), any())).thenReturn(entity)

        val result = repository.getPrayerSchedule(date)

        assertNotNull(result)
        assertEquals(true, result?.isOfflineCache)
        assertEquals(true, result?.isStale) // > 24 hours
    }

    @Test
    fun `getPrayerSchedule isolates data by mosqueId`() = runTest {
        val date = "2023-01-01"
        
        // Mock DataStore configured for Mosque B
        val prefs = mutablePreferencesOf(stringPreferencesKey("mosque_id") to "mosque-B")
        whenever(dataStore.data).thenReturn(flowOf(prefs))

        // Mock DAO: it only returns data if queried with mosque-A
        whenever(prayerScheduleDao.getScheduleByDate(org.mockito.kotlin.eq("mosque-A"), any())).thenReturn(
            PrayerScheduleEntity(
                mosqueId = "mosque-A",
                date = date, imsak = "04:00", subuh = "04:10", syuruq = "05:30", dzuhur = "12:00",
                ashar = "15:00", maghrib = "18:00", isya = "19:00",
                sourceProvider = "myQuran", lastSyncAt = System.currentTimeMillis()
            )
        )
        whenever(prayerScheduleDao.getScheduleByDate(org.mockito.kotlin.eq("mosque-B"), any())).thenReturn(null)

        val result = repository.getPrayerSchedule(date)

        // Result should be null because Mosque B has no cache, and Mosque A's cache is isolated.
        assertNull(result)
    }
}
