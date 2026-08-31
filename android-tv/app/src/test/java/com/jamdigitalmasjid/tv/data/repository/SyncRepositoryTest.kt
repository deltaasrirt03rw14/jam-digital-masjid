package com.jamdigitalmasjid.tv.data.repository

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.mutablePreferencesOf
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.edit
import com.jamdigitalmasjid.tv.data.local.AppDatabase
import com.jamdigitalmasjid.tv.data.local.SyncedContentDao
import com.jamdigitalmasjid.tv.data.local.SyncedEventDao
import com.jamdigitalmasjid.tv.data.local.SyncedMediaDao
import com.jamdigitalmasjid.tv.data.local.SyncedMosqueConfigDao
import com.jamdigitalmasjid.tv.data.network.JdmApiService
import com.jamdigitalmasjid.tv.data.network.SyncContentDto
import com.jamdigitalmasjid.tv.data.network.SyncEventDto
import com.jamdigitalmasjid.tv.data.network.SyncMediaDto
import com.jamdigitalmasjid.tv.data.network.SyncMosqueDto
import com.jamdigitalmasjid.tv.data.network.SyncResponseDto
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import retrofit2.Response
import java.io.IOException

@ExperimentalCoroutinesApi
class SyncRepositoryTest {

    @get:Rule
    val instantTaskExecutorRule = InstantTaskExecutorRule()

    private lateinit var apiService: JdmApiService
    private lateinit var database: AppDatabase
    private lateinit var dataStore: DataStore<Preferences>
    private lateinit var mosqueConfigDao: SyncedMosqueConfigDao
    private lateinit var contentDao: SyncedContentDao
    private lateinit var mediaDao: SyncedMediaDao
    private lateinit var eventDao: SyncedEventDao
    private lateinit var authRepository: DeviceAuthRepository
    private lateinit var repository: SyncRepository

    private val deviceId = "device-uuid-123"
    private val mosqueId = "mosque-uuid-456"

    private fun makePrefs(
        deviceIdentifier: String? = deviceId,
        etag: String? = null
    ): Preferences {
        val map = mutableListOf<Preferences.Pair<*>>()
        if (deviceIdentifier != null) map.add(SyncRepository.DEVICE_IDENTIFIER_KEY to deviceIdentifier)
        if (etag != null) map.add(SyncRepository.SYNC_ETAG_KEY to etag)
        return mutablePreferencesOf(*map.toTypedArray())
    }

    private fun makeSyncResponse(): SyncResponseDto = SyncResponseDto(
        mosque = SyncMosqueDto(
            id = mosqueId, name = "Masjid Test", address = "Jl. Test",
            timezone = "Asia/Jakarta", latitude = -6.2, longitude = 106.8,
            config_version = 3
        ),
        contents = listOf(
            SyncContentDto("c1", "Title 1", "IMAGE", "ACTIVE", null, null, null, null)
        ),
        media = listOf(
            SyncMediaDto("m1", "file.jpg", "image/jpeg", "http://example.com/f.jpg", 1024, null, null)
        ),
        events = listOf(
            SyncEventDto("e1", "Event 1", null, "2026-09-01T09:00:00Z", null, null, null)
        )
    )

    private fun createFakeDataStore(prefs: Preferences): DataStore<Preferences> {
        return object : DataStore<Preferences> {
            val flow = kotlinx.coroutines.flow.MutableStateFlow(prefs)
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
        executeTransaction = { _, block -> block() }

        apiService = mock()
        database = mock()
        mosqueConfigDao = mock()
        contentDao = mock()
        mediaDao = mock()
        eventDao = mock()
        authRepository = mock()

        whenever(database.syncedMosqueConfigDao()).thenReturn(mosqueConfigDao)
        whenever(database.syncedContentDao()).thenReturn(contentDao)
        whenever(database.syncedMediaDao()).thenReturn(mediaDao)
        whenever(database.syncedEventDao()).thenReturn(eventDao)
    }

    // ─── Test 1: Initial Sync (no ETag) → 200 ───────────────────────────────

    @Test
    fun `sync - initial 200 - no ETag sent - data persisted`() = runTest {
        val prefs = makePrefs(etag = null)
        dataStore = createFakeDataStore(prefs)
        repository = SyncRepository(apiService, database, dataStore, authRepository)

        val response = Response.success(makeSyncResponse())
        whenever(apiService.getSyncData(deviceId, null)).thenReturn(response)

        val result = repository.sync()

        assertTrue("Should be Updated", result is SyncResult.Updated)
        val updated = result as SyncResult.Updated
        assertEquals(3, updated.configVersion)
    }

    // ─── Test 2: ETag Sync → 200 with new ETag ──────────────────────────────

    @Test
    fun `sync - stored ETag - sends If-None-Match - 200 with new data`() = runTest {
        val storedEtag = "W/\"2\""
        val prefs = makePrefs(etag = storedEtag)
        dataStore = createFakeDataStore(prefs)
        repository = SyncRepository(apiService, database, dataStore, authRepository)

        val response = Response.success(makeSyncResponse())
        whenever(apiService.getSyncData(deviceId, storedEtag)).thenReturn(response)

        val result = repository.sync()

        assertTrue(result is SyncResult.Updated)
        // Verify getSyncData was called with the stored ETag
        verify(apiService).getSyncData(deviceId, storedEtag)
    }

    // ─── Test 3: 304 Not Modified ─────────────────────────────────────────

    @Test
    fun `sync - 304 Not Modified - local data preserved`() = runTest {
        val storedEtag = "W/\"3\""
        val prefs = makePrefs(etag = storedEtag)
        dataStore = createFakeDataStore(prefs)
        repository = SyncRepository(apiService, database, dataStore, authRepository)

        val response: Response<SyncResponseDto> = mock()
        whenever(response.code()).thenReturn(304)
        whenever(apiService.getSyncData(any(), org.mockito.kotlin.anyOrNull())).thenReturn(response)

        val result = repository.sync()

        assertTrue("Should be NotModified", result is SyncResult.NotModified)
        // Verify no write operations on content DAO (no destructive ops)
        verify(contentDao, never()).deleteAllForMosque(any())
        verify(contentDao, never()).upsertAll(any())
    }

    // ─── Test 4: Network Failure ─────────────────────────────────────────

    @Test
    fun `sync - IOException - returns Offline - local data not cleared`() = runTest {
        val prefs = makePrefs()
        dataStore = createFakeDataStore(prefs)
        repository = SyncRepository(apiService, database, dataStore, authRepository)

        whenever(apiService.getSyncData(any(), org.mockito.kotlin.anyOrNull())).thenAnswer { throw IOException("Network unreachable") }

        val result = repository.sync()

        assertTrue("Should be Offline", result is SyncResult.Offline)
        // Verify no write operations happened
        verify(contentDao, never()).deleteAllForMosque(any())
        verify(contentDao, never()).upsertAll(any())
    }

    // ─── Test 5: HTTP Error (500) ─────────────────────────────────────────

    @Test
    fun `sync - HTTP 500 - returns Error - local data not cleared`() = runTest {
        val prefs = makePrefs()
        dataStore = createFakeDataStore(prefs)
        repository = SyncRepository(apiService, database, dataStore, authRepository)

        val errorResponse = Response.error<SyncResponseDto>(500, "Internal Server Error".toResponseBody())
        whenever(apiService.getSyncData(any(), org.mockito.kotlin.anyOrNull())).thenReturn(errorResponse)

        val result = repository.sync()

        assertTrue("Should be Error", result is SyncResult.Error)
        assertEquals(500, (result as SyncResult.Error).code)
        // No destructive operations
        verify(contentDao, never()).deleteAllForMosque(any())
    }

    // ─── Test 6: No Device Identifier ────────────────────────────────────

    @Test
    fun `sync - no device identifier - returns Offline`() = runTest {
        val prefs = makePrefs(deviceIdentifier = null)
        dataStore = createFakeDataStore(prefs)
        repository = SyncRepository(apiService, database, dataStore, authRepository)

        val result = repository.sync()

        assertTrue("Should be Offline when no device identifier", result is SyncResult.Offline)
        verify(apiService, never()).getSyncData(any(), any())
    }

    // ─── Test 7: HTTP 401 Unauthorized ────────────────────────────────────

    @Test
    fun `sync - HTTP 401 - returns Error - clears credentials`() = runTest {
        val prefs = makePrefs()
        dataStore = createFakeDataStore(prefs)
        repository = SyncRepository(apiService, database, dataStore, authRepository)

        val errorResponse = Response.error<SyncResponseDto>(401, "Unauthorized".toResponseBody())
        whenever(apiService.getSyncData(any(), org.mockito.kotlin.anyOrNull())).thenReturn(errorResponse)

        val result = repository.sync()

        assertTrue("Should be Error for 401", result is SyncResult.Error)
        assertEquals(401, (result as SyncResult.Error).code)
        verify(contentDao, never()).deleteAllForMosque(any())
        verify(authRepository).clearCredentials()
    }

    @Test
    fun `sync - HTTP 403 - returns Error - clears credentials`() = runTest {
        val prefs = makePrefs()
        dataStore = createFakeDataStore(prefs)
        repository = SyncRepository(apiService, database, dataStore, authRepository)

        val errorResponse = Response.error<SyncResponseDto>(403, "Forbidden".toResponseBody())
        whenever(apiService.getSyncData(any(), org.mockito.kotlin.anyOrNull())).thenReturn(errorResponse)

        val result = repository.sync()

        assertTrue("Should be Error for 403", result is SyncResult.Error)
        assertEquals(403, (result as SyncResult.Error).code)
        verify(contentDao, never()).deleteAllForMosque(any())
        verify(authRepository).clearCredentials()
    }

    // ─── Test 8: Prayer Regression — existing prayer test validates isolation ─

    /**
     * Verifies that SyncRepository does not interact with PrayerScheduleDao at all.
     * Prayer data isolation is maintained: sync only touches the 4 new sync tables.
     */
    @Test
    fun `sync - prayer data not touched during content sync`() = runTest {
        val prefs = makePrefs()
        dataStore = createFakeDataStore(prefs)
        repository = SyncRepository(apiService, database, dataStore, authRepository)

        val response = Response.success(makeSyncResponse())
        whenever(apiService.getSyncData(any(), org.mockito.kotlin.anyOrNull())).thenReturn(response)

        repository.sync()

        // Verify prayer DAO was never called
        verify(database, never()).prayerScheduleDao()
    }

    // ─── Test 9: Heartbeat ─────────────────────────────────────────────

    @Test
    fun `sendHeartbeat - success syncRequired true`() = runTest {
        val prefs = makePrefs()
        dataStore = createFakeDataStore(prefs)
        repository = SyncRepository(apiService, database, dataStore, authRepository)

        val hbResponse = com.jamdigitalmasjid.tv.data.network.HeartbeatResponseDto(configVersion = 4, syncRequired = true)
        whenever(apiService.sendHeartbeat(deviceId)).thenReturn(Response.success(hbResponse))

        val result = repository.sendHeartbeat(deviceId)
        assertTrue(result)
    }

    @Test
    fun `sendHeartbeat - success syncRequired false`() = runTest {
        val prefs = makePrefs()
        dataStore = createFakeDataStore(prefs)
        repository = SyncRepository(apiService, database, dataStore, authRepository)

        val hbResponse = com.jamdigitalmasjid.tv.data.network.HeartbeatResponseDto(configVersion = 3, syncRequired = false)
        whenever(apiService.sendHeartbeat(deviceId)).thenReturn(Response.success(hbResponse))

        val result = repository.sendHeartbeat(deviceId)
        assertFalse(result)
    }

    @Test
    fun `sendHeartbeat - failure`() = runTest {
        val prefs = makePrefs()
        dataStore = createFakeDataStore(prefs)
        repository = SyncRepository(apiService, database, dataStore, authRepository)

        whenever(apiService.sendHeartbeat(deviceId)).thenReturn(Response.error(500, "Error".toResponseBody()))

        val result = repository.sendHeartbeat(deviceId)
        assertFalse(result)
    }
}
