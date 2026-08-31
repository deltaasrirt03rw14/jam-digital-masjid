package com.jamdigitalmasjid.tv.data.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

data class SourceMetadataDto(
    val provider: String,
    val reference: String?,
    val version: String?,
    val retrievedAt: String?,
    val validationStatus: String,
    val calculationMethod: String?
)

data class PrayerScheduleDto(
    val date: String,
    val imsak: String?,
    val subuh: String,
    val syuruq: String?,
    val dzuhur: String,
    val ashar: String,
    val maghrib: String,
    val isya: String,
    val source: SourceMetadataDto
)

// --- Sync DTOs ---

data class SyncMosqueDto(
    val id: String,
    val name: String,
    val address: String?,
    val timezone: String?,
    val latitude: Double?,
    val longitude: Double?,
    val config_version: Int
)

data class SyncContentDto(
    val id: String,
    val title: String,
    val type: String,       // IMAGE | VIDEO | TEXT
    val status: String,     // ACTIVE | INACTIVE
    val scheduling: String?,
    val content_data: com.google.gson.JsonElement?,
    val created_at: String?,
    val updated_at: String?
)

data class SyncMediaDto(
    val id: String,
    val filename: String,
    val mime_type: String,
    val url: String,
    val size: Int?,
    val created_at: String?,
    val updated_at: String?
)

data class SyncEventDto(
    val id: String,
    val title: String,
    val description: String?,
    val start_time: String,
    val end_time: String?,
    val created_at: String?,
    val updated_at: String?
)

data class SyncResponseDto(
    val mosque: SyncMosqueDto,
    val contents: List<SyncContentDto>,
    val media: List<SyncMediaDto>,
    val events: List<SyncEventDto>
)

data class PairDeviceRequestDto(
    val deviceIdentifier: String,
    val token: String,
    val deviceName: String? = null
)

data class PairDeviceResponseDto(
    val apiKey: String,
    val mosqueId: String
)

data class HeartbeatResponseDto(
    val configVersion: Int,
    val syncRequired: Boolean
)

interface JdmApiService {
    @POST("api/v1/devices/pair")
    suspend fun pairDevice(
        @Body request: PairDeviceRequestDto
    ): Response<PairDeviceResponseDto>

    @GET("api/v1/mosques/{mosqueId}/prayer-schedules")
    suspend fun getPrayerSchedule(
        @Path("mosqueId") mosqueId: String,
        @Query("date") date: String
    ): Response<PrayerScheduleDto>

    @GET("api/v1/devices/{deviceId}/sync")
    suspend fun getSyncData(
        @Path("deviceId") deviceId: String,
        @Header("If-None-Match") etag: String? = null
    ): Response<SyncResponseDto>

    @POST("api/v1/devices/{deviceId}/heartbeat")
    suspend fun sendHeartbeat(
        @Path("deviceId") deviceId: String
    ): Response<HeartbeatResponseDto>
}
