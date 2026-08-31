package com.jamdigitalmasjid.tv.domain.engine

import com.jamdigitalmasjid.tv.data.local.AppDatabase
import com.jamdigitalmasjid.tv.data.local.SyncedContentDao
import com.jamdigitalmasjid.tv.data.local.SyncedContentEntity
import com.jamdigitalmasjid.tv.data.repository.DownloadState
import com.jamdigitalmasjid.tv.data.repository.MediaDownloadManager
import com.jamdigitalmasjid.tv.data.repository.MediaDownloadStatus
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import java.io.File

@OptIn(ExperimentalCoroutinesApi::class)
class ContentSelectorTest {

    private lateinit var contentSelector: ContentSelector
    private val database: AppDatabase = mock()
    private val contentDao: SyncedContentDao = mock()
    private val downloadManager: MediaDownloadManager = mock()

    @Before
    fun setup() {
        whenever(database.syncedContentDao()).thenReturn(contentDao)
        contentSelector = ContentSelector(database, downloadManager)
    }

    @Test
    fun `getPlayableContents should return only contents with READY media for image and video`() = runTest {
        val contents = listOf(
            SyncedContentEntity("1", "m1", "Content 1", "IMAGE", "ACTIVE", null, """{"media_id":"media1","duration":15}""", null, 0),
            SyncedContentEntity("2", "m1", "Content 2", "VIDEO", "ACTIVE", null, """{"media_id":"media2"}""", null, 0),
            SyncedContentEntity("3", "m1", "Content 3", "TEXT", "ACTIVE", null, """{"text":"Hello"}""", null, 0)
        )
        whenever(contentDao.getAllActiveContents()).thenReturn(contents)

        val statuses = listOf(
            MediaDownloadStatus("media1", DownloadState.READY, File("path1"), "url1"),
            MediaDownloadStatus("media2", DownloadState.DOWNLOADING, null, "url2")
        )
        whenever(downloadManager.syncMediaFiles()).thenReturn(statuses)

        val playable = contentSelector.getPlayableContents()

        assertEquals(2, playable.size)
        
        // Content 1 is IMAGE and media is READY
        val p1 = playable.find { it.id == "1" }
        assertNotNull(p1)
        assertEquals(PlaybackType.IMAGE, p1?.type)
        assertEquals(15000L, p1?.durationMs)
        
        // Content 2 is VIDEO but media is DOWNLOADING -> should be skipped
        val p2 = playable.find { it.id == "2" }
        assertEquals(null, p2)

        // Content 3 is TEXT, doesn't need media
        val p3 = playable.find { it.id == "3" }
        assertNotNull(p3)
        assertEquals(PlaybackType.TEXT, p3?.type)
        assertEquals("Hello", p3?.textContent)
    }

    @Test
    fun `getPlayableContents should evaluate scheduling correctly`() = runTest {
        val sdf = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
        val today = sdf.format(java.util.Date())
        val tomorrow = sdf.format(java.util.Date(System.currentTimeMillis() + 86400000L))
        val yesterday = sdf.format(java.util.Date(System.currentTimeMillis() - 86400000L))

        val contents = listOf(
            // 1. No schedule -> Playable
            SyncedContentEntity("1", "m1", "No Schedule", "TEXT", "ACTIVE", null, """{"text":"A"}""", null, 0),
            
            // 2. Schedule includes today -> Playable
            SyncedContentEntity("2", "m1", "Current", "TEXT", "ACTIVE", "$yesterday/$tomorrow", """{"text":"B"}""", null, 0),
            
            // 3. Schedule expired -> Not Playable
            SyncedContentEntity("3", "m1", "Expired", "TEXT", "ACTIVE", "2000-01-01/$yesterday", """{"text":"C"}""", null, 0),
            
            // 4. Schedule future -> Not Playable
            SyncedContentEntity("4", "m1", "Future", "TEXT", "ACTIVE", "$tomorrow/2099-12-31", """{"text":"D"}""", null, 0),

            // 5. Malformed schedule -> Playable (fail-open)
            SyncedContentEntity("5", "m1", "Malformed", "TEXT", "ACTIVE", "invalid-date-format", """{"text":"E"}""", null, 0)
        )
        whenever(contentDao.getAllActiveContents()).thenReturn(contents)
        whenever(downloadManager.syncMediaFiles()).thenReturn(emptyList()) // No media needed for TEXT

        val playable = contentSelector.getPlayableContents()

        // Should return 1, 2, 5
        assertEquals(3, playable.size)
        assertNotNull(playable.find { it.id == "1" })
        assertNotNull(playable.find { it.id == "2" })
        assertNotNull(playable.find { it.id == "5" })
    }
}
