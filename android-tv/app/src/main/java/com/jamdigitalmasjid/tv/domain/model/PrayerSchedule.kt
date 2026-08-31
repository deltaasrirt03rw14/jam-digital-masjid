package com.jamdigitalmasjid.tv.domain.model

data class PrayerSchedule(
    val date: String,
    val imsak: String?,
    val subuh: String,
    val syuruq: String?,
    val dzuhur: String,
    val ashar: String,
    val maghrib: String,
    val isya: String,
    val sourceProvider: String,
    val isOfflineCache: Boolean,
    val isStale: Boolean
)
