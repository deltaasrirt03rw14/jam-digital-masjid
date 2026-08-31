package com.jamdigitalmasjid.tv.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(
    entities = [
        PrayerScheduleEntity::class,
        SyncedMosqueConfigEntity::class,
        SyncedContentEntity::class,
        SyncedMediaEntity::class,
        SyncedEventEntity::class
    ],
    version = 4,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun prayerScheduleDao(): PrayerScheduleDao
    abstract fun syncedMosqueConfigDao(): SyncedMosqueConfigDao
    abstract fun syncedContentDao(): SyncedContentDao
    abstract fun syncedMediaDao(): SyncedMediaDao
    abstract fun syncedEventDao(): SyncedEventDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        /**
         * MIGRATION_1_2: Drops old prayer_schedules (no composite PK) and recreates with
         * composite PK (mosqueId + date). Implemented in TASK-003.
         */
        val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("CREATE TABLE IF NOT EXISTS `prayer_schedules_new` (`mosqueId` TEXT NOT NULL, `date` TEXT NOT NULL, `imsak` TEXT, `subuh` TEXT NOT NULL, `syuruq` TEXT, `dzuhur` TEXT NOT NULL, `ashar` TEXT NOT NULL, `maghrib` TEXT NOT NULL, `isya` TEXT NOT NULL, `sourceProvider` TEXT NOT NULL, `lastSyncAt` INTEGER NOT NULL, PRIMARY KEY(`mosqueId`, `date`))")
                db.execSQL("DROP TABLE `prayer_schedules`")
                db.execSQL("ALTER TABLE `prayer_schedules_new` RENAME TO `prayer_schedules`")
            }
        }

        /**
         * MIGRATION_2_3: Adds 4 new sync tables (TASK-005 Phase B).
         * ADDITIVE only — prayer_schedules table is NOT touched.
         */
        val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    """CREATE TABLE IF NOT EXISTS `synced_mosque_config` (
                        `mosqueId` TEXT NOT NULL,
                        `name` TEXT NOT NULL,
                        `address` TEXT,
                        `timezone` TEXT,
                        `latitude` REAL,
                        `longitude` REAL,
                        `configVersion` INTEGER NOT NULL,
                        `lastSyncAt` INTEGER NOT NULL,
                        PRIMARY KEY(`mosqueId`)
                    )""".trimIndent()
                )
                db.execSQL(
                    """CREATE TABLE IF NOT EXISTS `synced_contents` (
                        `id` TEXT NOT NULL,
                        `mosqueId` TEXT NOT NULL,
                        `title` TEXT NOT NULL,
                        `type` TEXT NOT NULL,
                        `status` TEXT NOT NULL,
                        `scheduling` TEXT,
                        `updatedAt` TEXT,
                        `lastSyncAt` INTEGER NOT NULL,
                        PRIMARY KEY(`id`)
                    )""".trimIndent()
                )
                db.execSQL(
                    """CREATE TABLE IF NOT EXISTS `synced_media` (
                        `id` TEXT NOT NULL,
                        `mosqueId` TEXT NOT NULL,
                        `filename` TEXT NOT NULL,
                        `mimeType` TEXT NOT NULL,
                        `url` TEXT NOT NULL,
                        `size` INTEGER,
                        `updatedAt` TEXT,
                        `lastSyncAt` INTEGER NOT NULL,
                        PRIMARY KEY(`id`)
                    )""".trimIndent()
                )
                db.execSQL(
                    """CREATE TABLE IF NOT EXISTS `synced_events` (
                        `id` TEXT NOT NULL,
                        `mosqueId` TEXT NOT NULL,
                        `title` TEXT NOT NULL,
                        `description` TEXT,
                        `startTime` TEXT NOT NULL,
                        `endTime` TEXT,
                        `updatedAt` TEXT,
                        `lastSyncAt` INTEGER NOT NULL,
                        PRIMARY KEY(`id`)
                    )""".trimIndent()
                )
            }
        }

        /**
         * MIGRATION_3_4: Add contentData column to synced_contents
         */
        val MIGRATION_3_4 = object : Migration(3, 4) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE `synced_contents` ADD COLUMN `contentData` TEXT")
            }
        }

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "jam_digital_masjid_database"
                )
                    .addMigrations(MIGRATION_1_2, MIGRATION_2_3, MIGRATION_3_4)
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
