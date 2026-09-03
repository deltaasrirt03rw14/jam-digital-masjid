package com.jamdigitalmasjid.tv.domain.engine

import android.util.Log
import com.jamdigitalmasjid.tv.data.local.AppDatabase
import com.jamdigitalmasjid.tv.data.repository.MediaDownloadManager
import com.jamdigitalmasjid.tv.data.repository.DownloadState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import com.google.gson.Gson
import com.google.gson.JsonObject

enum class PlaybackType {
    IMAGE,
    VIDEO,
    TEXT
}

data class PlaybackContent(
    val id: String,
    val title: String,
    val type: PlaybackType,
    val mediaFile: java.io.File?,
    val durationMs: Long = 10000L, // default 10 seconds for images
    val textContent: String? = null,
    val slot: Int = 1
)

class ContentSelector(
    private val database: AppDatabase,
    private val mediaDownloadManager: MediaDownloadManager
) {
    companion object {
        private const val TAG = "ContentSelector"
    }

    private val gson = Gson()

    suspend fun getPlayableContents(): List<PlaybackContent> = withContext(Dispatchers.IO) {
        val activeContents = database.syncedContentDao().getAllActiveContents()
        
        // Ensure downloads are started if needed and get statuses
        val mediaStatuses = mediaDownloadManager.syncMediaFiles().associateBy { it.mediaId }
        
        val playable = mutableListOf<PlaybackContent>()

        for (content in activeContents) {
            val isEligible = evaluateSchedule(content.scheduling)
            if (!isEligible) continue

            val type = try {
                PlaybackType.valueOf(content.type.uppercase())
            } catch (e: Exception) {
                Log.w(TAG, "Unknown content type: ${content.type}")
                continue
            }

            var mediaId: String? = null
            var durationMs: Long = 10000L
            var textBody: String? = null
            var slot: Int = 1

            if (!content.contentData.isNullOrBlank()) {
                try {
                    val json = gson.fromJson(content.contentData, JsonObject::class.java)
                    if (json.has("media_id") && !json.get("media_id").isJsonNull) {
                        mediaId = json.get("media_id").asString
                    }
                    if (json.has("duration") && !json.get("duration").isJsonNull) {
                        durationMs = json.get("duration").asLong * 1000L
                    }
                    if (json.has("text") && !json.get("text").isJsonNull) {
                        textBody = json.get("text").asString
                    }
                    if (json.has("slot") && !json.get("slot").isJsonNull) {
                        slot = json.get("slot").asInt
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Failed to parse contentData for ${content.id}: ${e.message}")
                }
            }

            if (type == PlaybackType.IMAGE || type == PlaybackType.VIDEO) {
                if (mediaId.isNullOrBlank()) {
                    Log.w(TAG, "Content ${content.id} missing media_id")
                    continue
                }

                val status = mediaStatuses[mediaId]
                if (status != null && status.state == DownloadState.READY && status.localFile != null) {
                    playable.add(
                        PlaybackContent(
                            id = content.id,
                            title = content.title,
                            type = type,
                            mediaFile = status.localFile,
                            durationMs = durationMs,
                            slot = slot
                        )
                    )
                } else {
                    Log.w(TAG, "Content ${content.id} skipped, media $mediaId not ready")
                }
            } else if (type == PlaybackType.TEXT) {
                playable.add(
                    PlaybackContent(
                        id = content.id,
                        title = content.title,
                        type = type,
                        mediaFile = null,
                        durationMs = durationMs,
                        textContent = textBody,
                        slot = slot
                    )
                )
            }
        }

        playable.sortedWith(compareBy({ it.id }))
    }

    /**
     * Evaluates whether a content item is eligible to be played based on its scheduling field.
     *
     * Scheduling format (as stored in [SyncedContentEntity.scheduling]):
     *   - `null` or empty → always active
     *   - `"YYYY-MM-DD/YYYY-MM-DD"` → ISO-8601 date range (inclusive start, inclusive end)
     *     Example: "2026-09-01/2026-09-30" means active from Sept 1 to Sept 30.
     *
     * If the scheduling string is present but cannot be parsed, the content defaults to active
     * to prevent accidentally hiding content due to an unexpected format.
     *
     * Uses SimpleDateFormat (API 21+ compatible) since minSdk=21.
     */
    private fun evaluateSchedule(scheduling: String?): Boolean {
        if (scheduling.isNullOrBlank()) return true

        return try {
            val parts = scheduling.split("/")
            if (parts.size != 2) {
                Log.w(TAG, "Unrecognised scheduling format (expected YYYY-MM-DD/YYYY-MM-DD): $scheduling — defaulting to active")
                return true
            }

            val sdf = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
            sdf.isLenient = false

            // Normalise: strip time portion from today to allow date-only comparison
            val todayCal = java.util.Calendar.getInstance().apply {
                set(java.util.Calendar.HOUR_OF_DAY, 0)
                set(java.util.Calendar.MINUTE, 0)
                set(java.util.Calendar.SECOND, 0)
                set(java.util.Calendar.MILLISECOND, 0)
            }
            val todayNorm = todayCal.time

            val startDate = sdf.parse(parts[0].trim()) ?: return true
            val endDateRaw = sdf.parse(parts[1].trim()) ?: return true

            // End date: extend to end of day for inclusive comparison
            val endCal = java.util.Calendar.getInstance().apply {
                time = endDateRaw
                set(java.util.Calendar.HOUR_OF_DAY, 23)
                set(java.util.Calendar.MINUTE, 59)
                set(java.util.Calendar.SECOND, 59)
                set(java.util.Calendar.MILLISECOND, 999)
            }
            val endDate = endCal.time

            val isActive = !todayNorm.before(startDate) && !todayNorm.after(endDate)
            if (!isActive) {
                Log.d(TAG, "Content excluded by schedule: today=$todayNorm range=$startDate/$endDate")
            }
            isActive
        } catch (e: Exception) {
            Log.w(TAG, "Failed to parse scheduling '$scheduling' — defaulting to active: ${e.message}")
            true // Fail-open: don't hide content due to parse errors
        }
    }
}
