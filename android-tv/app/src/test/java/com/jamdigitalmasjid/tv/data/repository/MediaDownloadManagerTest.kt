package com.jamdigitalmasjid.tv.data.repository

import android.content.Context
import com.jamdigitalmasjid.tv.data.local.AppDatabase
import com.jamdigitalmasjid.tv.data.local.SyncedMediaDao
import com.jamdigitalmasjid.tv.data.local.SyncedMediaEntity
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import okhttp3.Call
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import java.io.File
import java.nio.file.Files

@OptIn(ExperimentalCoroutinesApi::class)
class MediaDownloadManagerTest {

    private lateinit var downloadManager: MediaDownloadManager
    private val context: Context = mock()
    private val database: AppDatabase = mock()
    private val authRepository: DeviceAuthRepository = mock()
    private val okHttpClient: OkHttpClient = mock()
    private val mediaDao: SyncedMediaDao = mock()
    private lateinit var mockFilesDir: File
    private lateinit var expectedCacheDir: File

    @Before
    fun setup() {
        mockFilesDir = Files.createTempDirectory("jdm_test").toFile()
        expectedCacheDir = File(mockFilesDir, "media_cache")
        
        whenever(context.filesDir).thenReturn(mockFilesDir)
        
        whenever(database.syncedMediaDao()).thenReturn(mediaDao)


        downloadManager = MediaDownloadManager(context, database, authRepository, okHttpClient)
    }

    @Test
    fun `syncMediaFiles should return READY for existing complete files`() = runTest {
        val media = SyncedMediaEntity("media1", "m1", "test.jpg", "image/jpeg", "http://example.com/url1", 1000, "2023-01-01T00:00:00", 0)
        whenever(mediaDao.getAllMedia()).thenReturn(listOf(media))

        val expectedFileName = "media1_2023-01-01T00-00-00.jpg"
        expectedCacheDir.mkdirs()
        val existingFile = File(expectedCacheDir, expectedFileName)
        existingFile.writeText("fake content")

        val result = downloadManager.syncMediaFiles()

        assertEquals(1, result.size)
        assertEquals("Expected READY, but got ${result[0].state}", DownloadState.READY, result[0].state)
        assertTrue(result[0].localFile?.exists() == true)
    }

    @Test
    fun `syncMediaFiles should download missing files`() = runTest {
        val media = SyncedMediaEntity("media2", "m1", "test.mp4", "video/mp4", "https://example.com/url2", 1000, "2023-01-01", 0)
        whenever(mediaDao.getAllMedia()).thenReturn(listOf(media))

        val call: Call = mock()
        val response = Response.Builder()
            .request(Request.Builder().url("https://example.com/url2").build())
            .protocol(Protocol.HTTP_1_1)
            .code(200)
            .message("OK")
            .body("video content".toResponseBody(null))
            .build()
        
        whenever(okHttpClient.newCall(any())).thenReturn(call)
        whenever(call.execute()).thenReturn(response)

        val result = downloadManager.syncMediaFiles()

        assertEquals(1, result.size)
        assertEquals("Expected READY, but got ${result[0].state}", DownloadState.READY, result[0].state)
        val file = result[0].localFile
        assertNotNull(file)
        assertTrue(file!!.exists())
        assertEquals("video content", file.readText())
    }
}
