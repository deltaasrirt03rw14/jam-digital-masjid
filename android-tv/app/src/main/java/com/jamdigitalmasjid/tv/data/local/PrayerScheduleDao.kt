package com.jamdigitalmasjid.tv.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface PrayerScheduleDao {
    @Query("SELECT * FROM prayer_schedules WHERE mosqueId = :mosqueId AND date = :date")
    suspend fun getScheduleByDate(mosqueId: String, date: String): PrayerScheduleEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSchedule(schedule: PrayerScheduleEntity)

    @Query("DELETE FROM prayer_schedules WHERE mosqueId = :mosqueId AND date < :date")
    suspend fun deleteOldSchedules(mosqueId: String, date: String)
}
