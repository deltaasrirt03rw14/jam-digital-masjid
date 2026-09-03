package com.jamdigitalmasjid.tv.domain.statemachine

import com.jamdigitalmasjid.tv.domain.engine.PrayerEngine
import com.jamdigitalmasjid.tv.domain.model.PrayerSchedule
import org.junit.Assert.assertEquals
import org.junit.Test
import java.text.SimpleDateFormat
import java.util.Locale

class PrayerStateMachineTest {

    private val engine = PrayerEngine()
    private val stateMachine = PrayerStateMachine(engine)
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
    fun `NORMAL state when far from prayer`() {
        val currentMillis = dateFormat.parse("2023-01-01 11:00:00")!!.time
        val result = stateMachine.evaluateState(sampleSchedule, null, currentMillis)
        assertEquals(PrayerState.NORMAL, result.activeState)
    }

    @Test
    fun `PRE_ADHAN state 1 minute before Dzuhur`() {
        val currentMillis = dateFormat.parse("2023-01-01 11:59:00")!!.time
        val result = stateMachine.evaluateState(sampleSchedule, null, currentMillis)
        assertEquals(PrayerState.PRE_ADHAN, result.activeState)
    }

    @Test
    fun `ADHAN state right at Dzuhur`() {
        val currentMillis = dateFormat.parse("2023-01-01 12:00:00")!!.time
        val result = stateMachine.evaluateState(sampleSchedule, null, currentMillis)
        assertEquals(PrayerState.ADHAN, result.activeState)
    }

    @Test
    fun `IQOMAH state 5 minutes after Dzuhur`() {
        val currentMillis = dateFormat.parse("2023-01-01 12:05:00")!!.time
        val result = stateMachine.evaluateState(sampleSchedule, null, currentMillis)
        assertEquals(PrayerState.IQOMAH, result.activeState)
    }

    @Test
    fun `PRAYER_MODE state 15 minutes after Dzuhur`() {
        val currentMillis = dateFormat.parse("2023-01-01 12:15:00")!!.time
        val result = stateMachine.evaluateState(sampleSchedule, null, currentMillis)
        assertEquals(PrayerState.PRAYER_MODE, result.activeState)
    }

    @Test
    fun `FALLBACK state when schedule is null`() {
        val result = stateMachine.evaluateState(null, null, 0L)
        assertEquals(PrayerState.FALLBACK, result.activeState)
        assertEquals(true, result.isOffline)
    }
}
