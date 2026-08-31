package com.jamdigitalmasjid.tv.domain.fallback

import com.jamdigitalmasjid.tv.domain.model.PrayerSchedule

interface FallbackCalculationEngine {
    /**
     * Attempts to calculate the prayer schedule for the given date.
     * @param date Date string in format YYYY-MM-DD
     * @return PrayerSchedule if configuration is available, or null if configuration (lat, lon, etc) is missing.
     */
    fun calculateSchedule(date: String): PrayerSchedule?
}

class FallbackCalculationEngineImpl : FallbackCalculationEngine {
    override fun calculateSchedule(date: String): PrayerSchedule? {
        // LIMITATION REPORT:
        // Fallback calculation cannot be implemented yet because required configuration parameters
        // such as Latitude, Longitude, Madhhab, Calculation Method, and Timezone are missing 
        // from the repository specifications.
        // Returning null forces the state machine to enter FALLBACK failure state instead of 
        // silently returning fake/hardcoded location data.
        return null
    }
}
