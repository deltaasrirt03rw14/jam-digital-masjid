package com.jamdigitalmasjid.tv.domain.engine

import com.jamdigitalmasjid.tv.domain.model.PrayerSchedule
import org.junit.Assert.*
import org.junit.Test
import java.text.SimpleDateFormat
import java.util.Locale

class PrayerEngineTest {
    
    private val engine = PrayerEngine()
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).apply {
        timeZone = java.util.TimeZone.getTimeZone("Asia/Jakarta")
    }

    private val sampleSchedule = PrayerSchedule(
        date = "2023-01-01",
        imsak = "04:00",
        subuh = "04:10",
        syuruq = "05:30",
        dzuhur = "12:00",
        ashar = "15:00",
        maghrib = "18:00",
        isya = "19:00",
        sourceProvider = "myQuran",
        isOfflineCache = false,
        isStale = false
    )

    @Test
    fun `calculate before Imsak`() {
        val currentMillis = dateFormat.parse("2023-01-01 03:00:00")!!.time
        val result = engine.calculate(sampleSchedule, null, currentMillis)

        assertNull(result.currentPrayer)
        assertEquals(PrayerType.IMSAK, result.nextPrayer?.type)
        assertEquals(3600000L, result.countdownMillis) // 1 hour = 3600000 ms
    }

    @Test
    fun `calculate during Dzuhur`() {
        val currentMillis = dateFormat.parse("2023-01-01 13:00:00")!!.time
        val result = engine.calculate(sampleSchedule, null, currentMillis)

        assertEquals(PrayerType.DZUHUR, result.currentPrayer?.type)
        assertEquals(PrayerType.ASHAR, result.nextPrayer?.type)
        assertEquals(2 * 3600000L, result.countdownMillis) // 2 hours
    }

    @Test
    fun `calculate after Isya with tomorrow schedule`() {
        val tomorrowSchedule = sampleSchedule.copy(date = "2023-01-02", imsak = "04:05")
        val currentMillis = dateFormat.parse("2023-01-01 20:00:00")!!.time
        val result = engine.calculate(sampleSchedule, tomorrowSchedule, currentMillis)

        assertEquals(PrayerType.ISYA, result.currentPrayer?.type)
        assertEquals(PrayerType.IMSAK, result.nextPrayer?.type) // Next prayer is tomorrow's Imsak
        assertEquals(true, result.isNextDay)
        
        val tomorrowImsak = dateFormat.parse("2023-01-02 04:05:00")!!.time
        assertEquals(tomorrowImsak - currentMillis, result.countdownMillis)
    }

    @Test
    fun `calculate exact boundary Isya`() {
        val tomorrowSchedule = sampleSchedule.copy(date = "2023-01-02", imsak = "04:05")
        val currentMillis = dateFormat.parse("2023-01-01 19:00:00")!!.time
        val result = engine.calculate(sampleSchedule, tomorrowSchedule, currentMillis)

        assertEquals(PrayerType.ISYA, result.currentPrayer?.type)
        assertEquals(PrayerType.IMSAK, result.nextPrayer?.type)
    }

    @Test
    fun `calculate midnight rollover`() {
        val tomorrowSchedule = sampleSchedule.copy(date = "2023-01-02", imsak = "04:05")
        // Just before midnight
        val currentMillis = dateFormat.parse("2023-01-01 23:59:59")!!.time
        val result = engine.calculate(sampleSchedule, tomorrowSchedule, currentMillis)

        assertEquals(PrayerType.ISYA, result.currentPrayer?.type)
        assertEquals(PrayerType.IMSAK, result.nextPrayer?.type)
        assertEquals(true, result.isNextDay)
        
        val tomorrowImsak = dateFormat.parse("2023-01-02 04:05:00")!!.time
        assertEquals(tomorrowImsak - currentMillis, result.countdownMillis)
    }
}
