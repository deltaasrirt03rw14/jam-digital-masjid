package com.jamdigitalmasjid.tv.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface SyncedMosqueConfigDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entity: SyncedMosqueConfigEntity)

    @Query("SELECT * FROM synced_mosque_config WHERE mosqueId = :mosqueId")
    suspend fun getByMosqueId(mosqueId: String): SyncedMosqueConfigEntity?
}

@Dao
interface SyncedContentDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(entities: List<SyncedContentEntity>)

    @Query("DELETE FROM synced_contents WHERE mosqueId = :mosqueId")
    suspend fun deleteAllForMosque(mosqueId: String)

    @Query("SELECT * FROM synced_contents WHERE mosqueId = :mosqueId AND status = 'ACTIVE' ORDER BY title ASC")
    suspend fun getActiveContents(mosqueId: String): List<SyncedContentEntity>

    @Query("SELECT * FROM synced_contents WHERE status = 'ACTIVE' ORDER BY title ASC")
    suspend fun getAllActiveContents(): List<SyncedContentEntity>

    @Query("SELECT COUNT(*) FROM synced_contents WHERE mosqueId = :mosqueId")
    suspend fun countForMosque(mosqueId: String): Int
}

@Dao
interface SyncedMediaDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(entities: List<SyncedMediaEntity>)

    @Query("DELETE FROM synced_media WHERE mosqueId = :mosqueId")
    suspend fun deleteAllForMosque(mosqueId: String)

    @Query("SELECT * FROM synced_media WHERE mosqueId = :mosqueId ORDER BY filename ASC")
    suspend fun getAllForMosque(mosqueId: String): List<SyncedMediaEntity>

    @Query("SELECT * FROM synced_media ORDER BY filename ASC")
    suspend fun getAllMedia(): List<SyncedMediaEntity>
}

@Dao
interface SyncedEventDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(entities: List<SyncedEventEntity>)

    @Query("DELETE FROM synced_events WHERE mosqueId = :mosqueId")
    suspend fun deleteAllForMosque(mosqueId: String)

    @Query("SELECT * FROM synced_events WHERE mosqueId = :mosqueId ORDER BY startTime ASC")
    suspend fun getAllForMosque(mosqueId: String): List<SyncedEventEntity>
}
