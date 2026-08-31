package com.jamdigitalmasjid.tv.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Persists the mosque configuration from the Sync API response.
 * One row per mosque (keyed by mosque UUID from backend).
 */
@Entity(tableName = "synced_mosque_config")
data class SyncedMosqueConfigEntity(
    @PrimaryKey val mosqueId: String,
    val name: String,
    val address: String?,
    val timezone: String?,
    val latitude: Double?,
    val longitude: Double?,
    val configVersion: Int,
    val lastSyncAt: Long
)

/**
 * Persists content items from the Sync API response.
 * Keyed by backend content UUID.
 */
@Entity(tableName = "synced_contents")
data class SyncedContentEntity(
    @PrimaryKey val id: String,
    val mosqueId: String,
    val title: String,
    val type: String,
    val status: String,
    val scheduling: String?,
    val contentData: String?,
    val updatedAt: String?,
    val lastSyncAt: Long
)

/**
 * Persists media metadata from the Sync API response.
 * No actual file storage — metadata only.
 */
@Entity(tableName = "synced_media")
data class SyncedMediaEntity(
    @PrimaryKey val id: String,
    val mosqueId: String,
    val filename: String,
    val mimeType: String,
    val url: String,
    val size: Int?,
    val updatedAt: String?,
    val lastSyncAt: Long
)

/**
 * Persists event items from the Sync API response.
 */
@Entity(tableName = "synced_events")
data class SyncedEventEntity(
    @PrimaryKey val id: String,
    val mosqueId: String,
    val title: String,
    val description: String?,
    val startTime: String,
    val endTime: String?,
    val updatedAt: String?,
    val lastSyncAt: Long
)
