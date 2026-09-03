package com.jamdigitalmasjid.tv.domain.statemachine

import com.jamdigitalmasjid.tv.domain.engine.PrayerEngine
import com.jamdigitalmasjid.tv.domain.engine.PrayerEngineResult
import com.jamdigitalmasjid.tv.domain.engine.PrayerType
import com.jamdigitalmasjid.tv.domain.model.PrayerSchedule

enum class PrayerState {
    NORMAL,
    PRE_ADHAN,
    ADHAN,
    IQOMAH,
    PRAYER_MODE,
    OFFLINE,
    STALE_DATA,
    FALLBACK
}

data class StateMachineResult(
    val activeState: PrayerState,
    val prayerEngineResult: PrayerEngineResult?,
    val isOffline: Boolean,
    val isStale: Boolean
)

class PrayerStateMachine(private val prayerEngine: PrayerEngine) {
    companion object {
        // Configurables (usually would come from DataStore/Admin settings)
        const val PRE_ADHAN_DURATION_MS = 2 * 60 * 1000L // 2 minutes before
        const val ADHAN_DURATION_MS = 4 * 60 * 1000L // 4 minutes
        const val IQOMAH_COUNTDOWN_MS = 10 * 60 * 1000L // 10 minutes wait
        const val PRAYER_MODE_DURATION_MS = 15 * 60 * 1000L // 15 minutes screen off
    }

    fun evaluateState(
        todaySchedule: PrayerSchedule?,
        tomorrowSchedule: PrayerSchedule?,
        currentTimeMillis: Long,
        timezone: String = "Asia/Jakarta"
    ): StateMachineResult {
        if (todaySchedule == null) {
            return StateMachineResult(PrayerState.FALLBACK, null, isOffline = true, isStale = false)
        }

        val engineResult = prayerEngine.calculate(todaySchedule, tomorrowSchedule, currentTimeMillis, timezone)
        
        var baseState = PrayerState.NORMAL

        // Determine if we are in an event window based on currentPrayer and nextPrayer
        val next = engineResult.nextPrayer
        val current = engineResult.currentPrayer

        if (next != null) {
            val timeToNext = next.timeInMillis - currentTimeMillis
            if (timeToNext in 0..PRE_ADHAN_DURATION_MS && isMainPrayer(next.type)) {
                baseState = PrayerState.PRE_ADHAN
            }
        }

        if (current != null && isMainPrayer(current.type)) {
            val timeSinceCurrent = currentTimeMillis - current.timeInMillis
            when {
                timeSinceCurrent in 0..ADHAN_DURATION_MS -> {
                    baseState = PrayerState.ADHAN
                }
                timeSinceCurrent in (ADHAN_DURATION_MS + 1)..(ADHAN_DURATION_MS + IQOMAH_COUNTDOWN_MS) -> {
                    baseState = PrayerState.IQOMAH
                }
                timeSinceCurrent in (ADHAN_DURATION_MS + IQOMAH_COUNTDOWN_MS + 1)..(ADHAN_DURATION_MS + IQOMAH_COUNTDOWN_MS + PRAYER_MODE_DURATION_MS) -> {
                    baseState = PrayerState.PRAYER_MODE
                }
            }
        }

        // Apply fallback/stale/offline over the base state if it's normal.
        // If it's Adhan, we still want to show Adhan even if offline!
        // We use composite states in the UI, but the "activeState" represents the primary UI rendering mode.
        val finalState = when {
            baseState != PrayerState.NORMAL -> baseState // Priority to prayer events
            todaySchedule.isStale -> PrayerState.STALE_DATA
            todaySchedule.isOfflineCache -> PrayerState.OFFLINE
            else -> PrayerState.NORMAL
        }

        return StateMachineResult(
            activeState = finalState,
            prayerEngineResult = engineResult,
            isOffline = todaySchedule.isOfflineCache,
            isStale = todaySchedule.isStale
        )
    }

    private fun isMainPrayer(type: PrayerType): Boolean {
        return type in listOf(
            PrayerType.SUBUH,
            PrayerType.DZUHUR,
            PrayerType.ASHAR,
            PrayerType.MAGHRIB,
            PrayerType.ISYA
        )
    }
}
