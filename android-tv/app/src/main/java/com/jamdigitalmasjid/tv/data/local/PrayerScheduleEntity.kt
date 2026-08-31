package com.jamdigitalmasjid.tv.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "prayer_schedules", primaryKeys = ["mosqueId", "date"])
data class PrayerScheduleEntity(
    val mosqueId: String,
    val date: String, // YYYY-MM-DD
    val imsak: String?,
    val subuh: String,
    val syuruq: String?,
    val dzuhur: String,
    val ashar: String,
    val maghrib: String,
    val isya: String,
    val sourceProvider: String,
    val lastSyncAt: Long // Epoch timestamp in millis to determine if data is stale
)
