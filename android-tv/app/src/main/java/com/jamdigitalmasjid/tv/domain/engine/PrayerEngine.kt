package com.jamdigitalmasjid.tv.domain.engine

import com.jamdigitalmasjid.tv.domain.model.PrayerSchedule
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

enum class PrayerType {
    IMSAK, SUBUH, SYURUQ, DZUHUR, ASHAR, MAGHRIB, ISYA
}

data class PrayerTime(
    val type: PrayerType,
    val timeInMillis: Long,
    val timeString: String
)

data class PrayerEngineResult(
    val currentPrayer: PrayerTime?,
    val nextPrayer: PrayerTime?,
    val countdownMillis: Long,
    val isNextDay: Boolean = false,
    val todaySchedule: PrayerSchedule
)

class PrayerEngine {
    private val timeFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())

    fun calculate(todaySchedule: PrayerSchedule, tomorrowSchedule: PrayerSchedule?, currentTimeMillis: Long, mosqueTimezone: String = "Asia/Jakarta"): PrayerEngineResult {
        val todayTimes = getPrayerTimesList(todaySchedule, mosqueTimezone)
        
        var currentPrayer: PrayerTime? = null
        var nextPrayer: PrayerTime? = null
        var isNextDay = false
        
        for (i in todayTimes.indices) {
            val pt = todayTimes[i]
            if (currentTimeMillis >= pt.timeInMillis) {
                currentPrayer = pt
            } else {
                nextPrayer = pt
                break
            }
        }
        
        // If current time is past Isya today, next prayer is tomorrow's first prayer
        if (nextPrayer == null && tomorrowSchedule != null) {
            val tomorrowTimes = getPrayerTimesList(tomorrowSchedule, mosqueTimezone)
            if (tomorrowTimes.isNotEmpty()) {
                nextPrayer = tomorrowTimes.first()
                isNextDay = true
            }
        }
        
        val countdown = nextPrayer?.timeInMillis?.minus(currentTimeMillis)?.coerceAtLeast(0L) ?: 0L

        return PrayerEngineResult(
            currentPrayer = currentPrayer,
            nextPrayer = nextPrayer,
            countdownMillis = countdown,
            isNextDay = isNextDay,
            todaySchedule = todaySchedule
        )
    }

    fun getPrayerTimesList(schedule: PrayerSchedule, mosqueTimezone: String = "Asia/Jakarta"): List<PrayerTime> {
        val list = mutableListOf<PrayerTime>()
        val dateStr = schedule.date // "YYYY-MM-DD"
        
        val format = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
        format.timeZone = java.util.TimeZone.getTimeZone(mosqueTimezone)
        
        val addPrayer = { type: PrayerType, timeStr: String? ->
            if (timeStr != null) {
                // timeStr from DB is expected to be "HH:mm:ss" or "HH:mm"
                val fullTimeStr = "$dateStr $timeStr"
                try {
                    val dateObj = format.parse(if (timeStr.length == 5) "$fullTimeStr:00" else fullTimeStr)
                    if (dateObj != null) {
                        list.add(PrayerTime(type, dateObj.time, timeStr))
                    }
                } catch (e: Exception) {
                    // Ignore parse error for missing/invalid times
                }
            }
        }

        addPrayer(PrayerType.IMSAK, schedule.imsak)
        addPrayer(PrayerType.SUBUH, schedule.subuh)
        addPrayer(PrayerType.SYURUQ, schedule.syuruq)
        addPrayer(PrayerType.DZUHUR, schedule.dzuhur)
        addPrayer(PrayerType.ASHAR, schedule.ashar)
        addPrayer(PrayerType.MAGHRIB, schedule.maghrib)
        addPrayer(PrayerType.ISYA, schedule.isya)

        return list.sortedBy { it.timeInMillis }
    }
}
