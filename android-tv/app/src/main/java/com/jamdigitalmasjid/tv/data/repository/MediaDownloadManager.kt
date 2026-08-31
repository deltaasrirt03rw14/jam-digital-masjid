package com.jamdigitalmasjid.tv.data.repository

import android.content.Context
import android.util.Log
import com.jamdigitalmasjid.tv.data.local.AppDatabase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import com.jamdigitalmasjid.tv.domain.statemachine.DeviceAuthState

enum class DownloadState {
    IDLE,
    DOWNLOADING,
    READY,
    FAILED
}

/**
 * Tracks the state of a media file in the local cache.
 */
data class MediaDownloadStatus(
    val mediaId: String,
    val state: DownloadState,
    val localFile: File?,
    val url: String
)

/**
 * Responsible for downloading synced media files to local storage safely.
 */
class MediaDownloadManager(
    private val context: Context,
    private val database: AppDatabase,
    private val authRepository: DeviceAuthRepository,
    private val okHttpClient: OkHttpClient // Reusing Retrofit's OkHttpClient
) {
    companion object {
        private const val TAG = "MediaDownloadManager"
        private const val CACHE_DIR_NAME = "media_cache"
    }

    private val mediaCacheDir: File
        get() = File(context.filesDir, CACHE_DIR_NAME).apply {
            if (!exists()) mkdirs()
        }

    /**
     * Examines all synced media and downloads any missing or stale files.
     * Removes orphaned files.
     */
    suspend fun syncMediaFiles(): List<MediaDownloadStatus> = withContext(Dispatchers.IO) {
        val allMedia = database.syncedMediaDao().getAllMedia()
        val statuses = mutableListOf<MediaDownloadStatus>()

        // 1. Download missing/stale files
        for (media in allMedia) {
            val extension = media.filename.substringAfterLast('.', "")
            val extSuffix = if (extension.isNotEmpty()) ".$extension" else ""
            val safeUpdatedAt = media.updatedAt?.replace(":", "-") ?: "0"
            val expectedFilename = "${media.id}_${safeUpdatedAt}$extSuffix"
            val targetFile = File(mediaCacheDir, expectedFilename)

            if (targetFile.exists() && targetFile.length() > 0) {
                // Already downloaded and ready
                statuses.add(MediaDownloadStatus(media.id, DownloadState.READY, targetFile, media.url))
            } else {
                // Needs download
                Log.d(TAG, "Downloading missing media ${media.id} from ${media.url}")
                val success = downloadFileSafe(media.url, targetFile)
                if (success) {
                    statuses.add(MediaDownloadStatus(media.id, DownloadState.READY, targetFile, media.url))
                } else {
                    statuses.add(MediaDownloadStatus(media.id, DownloadState.FAILED, null, media.url))
                }
            }
        }

        // 2. Cleanup orphaned files (files not in current synced media)
        cleanupOrphans(allMedia.map { media ->
            val extension = media.filename.substringAfterLast('.', "")
            val extSuffix = if (extension.isNotEmpty()) ".$extension" else ""
            val safeUpdatedAt = media.updatedAt?.replace(":", "-") ?: "0"
            "${media.id}_${safeUpdatedAt}$extSuffix"
        }.toSet())

        return@withContext statuses
    }

    /**
     * Downloads a file to a .tmp file first, then atomically renames it.
     */
    private suspend fun downloadFileSafe(url: String, targetFile: File): Boolean {
        val tmpFile = File(targetFile.absolutePath + ".tmp")
        try {
            val request = Request.Builder().url(url).build()
            val response = okHttpClient.newCall(request).execute()

            if (!response.isSuccessful) {
                Log.e(TAG, "Download failed for $url: ${response.code}")
                if (response.code == 401 || response.code == 403) {
                    authRepository.clearCredentials()
                }
                return false
            }

            response.body?.let { body ->
                FileOutputStream(tmpFile).use { fos ->
                    body.byteStream().use { input ->
                        input.copyTo(fos)
                    }
                }
            } ?: return false

            if (tmpFile.exists() && tmpFile.length() > 0) {
                if (tmpFile.renameTo(targetFile)) {
                    return true
                } else {
                    println("renameTo returned false! tmpFile=${tmpFile.absolutePath}, targetFile=${targetFile.absolutePath}")
                }
            } else {
                println("tmpFile doesn't exist or length is 0! exists=${tmpFile.exists()}, length=${tmpFile.length()}")
            }
        } catch (e: IOException) {
            println("Network error downloading $url: ${e.message}")
            e.printStackTrace()
            Log.e(TAG, "Network error downloading $url: ${e.message}")
        } catch (e: Exception) {
            println("Unexpected error downloading $url: ${e.message}")
            e.printStackTrace()
            Log.e(TAG, "Unexpected error downloading $url: ${e.message}")
        } finally {
            if (tmpFile.exists()) {
                tmpFile.delete()
            }
        }
        return false
    }

    private fun cleanupOrphans(validFilenames: Set<String>) {
        val files = mediaCacheDir.listFiles() ?: return
        for (file in files) {
            if (!file.name.endsWith(".tmp") && !validFilenames.contains(file.name)) {
                Log.d(TAG, "Cleaning up orphaned file: ${file.name}")
                file.delete()
            }
        }
    }
}
