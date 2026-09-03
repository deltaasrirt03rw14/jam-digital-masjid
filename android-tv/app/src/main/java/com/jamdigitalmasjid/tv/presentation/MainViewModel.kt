package com.jamdigitalmasjid.tv.presentation

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jamdigitalmasjid.tv.data.repository.PrayerRepositoryImpl
import com.jamdigitalmasjid.tv.data.repository.SyncRepository
import com.jamdigitalmasjid.tv.data.repository.SyncResult
import com.jamdigitalmasjid.tv.data.repository.DeviceAuthRepository
import com.jamdigitalmasjid.tv.domain.statemachine.PrayerStateMachine
import com.jamdigitalmasjid.tv.domain.statemachine.StateMachineResult
import com.jamdigitalmasjid.tv.domain.statemachine.DeviceAuthState
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Represents the sync status exposed to the UI.
 */
sealed interface SyncStatus {
    object Idle : SyncStatus
    object Syncing : SyncStatus
    data class Success(val syncedAt: Long, val configVersion: Int?) : SyncStatus
    object NotModified : SyncStatus
    object Offline : SyncStatus
    data class Failed(val code: Int?, val message: String?) : SyncStatus
}

class MainViewModel(
    private val authRepository: DeviceAuthRepository,
    private val prayerRepository: PrayerRepositoryImpl,
    private val syncRepository: SyncRepository,
    private val prayerStateMachine: PrayerStateMachine
) : ViewModel() {

    companion object {
        private const val TAG = "MainViewModel"
        /**
         * Heartbeat interval per API Design Notes v1.0 — "Periodic (default 5 min)."
         */
        const val HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000L
    }

    val authState: StateFlow<DeviceAuthState> = authRepository.authState

    private val _uiState = MutableStateFlow<StateMachineResult?>(null)
    val uiState: StateFlow<StateMachineResult?> = _uiState.asStateFlow()

    private val _syncStatus = MutableStateFlow<SyncStatus>(SyncStatus.Idle)
    val syncStatus: StateFlow<SyncStatus> = _syncStatus.asStateFlow()
    
    val mosqueConfig = syncRepository.mosqueConfigFlow
    val runningText = syncRepository.runningTextFlow

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())

    init {
        viewModelScope.launch {
            authRepository.initialize()

            // Only start engine, sync, and heartbeat if authenticated. We observe authState.
            authState.collect { state ->
                if (state is DeviceAuthState.Authenticated) {
                    startEngine()
                    triggerSync()
                    startHeartbeat()
                    startPeriodicPrayerSync()
                }
            }
        }
    }

    fun pairDevice(pin: String) {
        viewModelScope.launch {
            authRepository.pairDevice(pin)
        }
    }

    private fun startEngine() {
        viewModelScope.launch {
            while (true) {
                // Ensure we don't run engine if auth is revoked during runtime
                if (authState.value !is DeviceAuthState.Authenticated) {
                    delay(1000L)
                    continue
                }

                val now = System.currentTimeMillis()
                
                // Get timezone from MosqueConfig, default to Asia/Jakarta
                val mosqueConfigEntity = syncRepository.getMosqueConfigFlow().first()
                val timezone = mosqueConfigEntity?.timezone ?: "Asia/Jakarta"
                
                // Use timezone to format dates correctly
                dateFormat.timeZone = java.util.TimeZone.getTimeZone(timezone)
                val dateStr = dateFormat.format(Date(now))
                val tomorrowStr = dateFormat.format(Date(now + 24 * 60 * 60 * 1000L))

                val schedule = prayerRepository.getPrayerSchedule(dateStr)
                val tomorrowSchedule = prayerRepository.getPrayerSchedule(tomorrowStr)

                val stateResult = prayerStateMachine.evaluateState(schedule, tomorrowSchedule, now, timezone)
                _uiState.value = stateResult

                delay(1000L)
            }
        }
    }

    /**
     * Sends periodic heartbeat to backend every [HEARTBEAT_INTERVAL_MS].
     *
     * Behavior:
     * - Starts when device is Authenticated.
     * - Stops when auth state transitions away from Authenticated (e.g. 401/403 → revoke).
     * - If backend returns syncRequired=true, triggers a sync immediately.
     * - Network failures are logged but do not crash or block the UI.
     * - Runs in viewModelScope; cancelled automatically when ViewModel is cleared.
     */
    private fun startHeartbeat() {
        viewModelScope.launch {
            while (true) {
                delay(HEARTBEAT_INTERVAL_MS)

                // Stop heartbeat if no longer authenticated
                val currentState = authState.value
                if (currentState !is DeviceAuthState.Authenticated) {
                    Log.d(TAG, "Heartbeat stopped: device no longer authenticated.")
                    break
                }

                try {
                    val syncRequired = syncRepository.sendHeartbeat(currentState.deviceId)
                    if (syncRequired) {
                        Log.i(TAG, "Heartbeat: syncRequired=true. Triggering sync.")
                        triggerSync()
                    } else {
                        Log.d(TAG, "Heartbeat OK — no sync needed.")
                    }
                } catch (e: Exception) {
                    // Heartbeat failures are non-blocking — device continues operating
                    Log.w(TAG, "Heartbeat network failure (non-blocking): ${e.message}")
                }
            }
        }
    }

    fun triggerSync() {
        if (authState.value !is DeviceAuthState.Authenticated) return

        viewModelScope.launch {
            _syncStatus.value = SyncStatus.Syncing
            
            // 1. Sync configuration/contents via SyncRepository
            val result = syncRepository.sync()
            
            // 2. Sync prayer schedule
            val todayStr = dateFormat.format(Date())
            val tomorrowStr = dateFormat.format(Date(System.currentTimeMillis() + 86400000L))
            prayerRepository.fetchPrayerScheduleFromNetwork(todayStr)
            prayerRepository.fetchPrayerScheduleFromNetwork(tomorrowStr)

            _syncStatus.value = when (result) {
                is SyncResult.Updated     -> SyncStatus.Success(result.syncedAt, result.configVersion)
                is SyncResult.NotModified -> SyncStatus.NotModified
                is SyncResult.Offline     -> SyncStatus.Offline
                is SyncResult.Error       -> SyncStatus.Failed(result.code, result.message)
            }
        }
    }
    private fun startPeriodicPrayerSync() {
        viewModelScope.launch {
            while (true) {
                // Sync every 3 hours
                delay(3 * 60 * 60 * 1000L)
                
                val currentState = authState.value
                if (currentState !is DeviceAuthState.Authenticated) {
                    break
                }
                
                Log.d(TAG, "Running periodic prayer schedule sync...")
                val todayStr = dateFormat.format(Date())
                val tomorrowStr = dateFormat.format(Date(System.currentTimeMillis() + 86400000L))
                prayerRepository.fetchPrayerScheduleFromNetwork(todayStr)
                prayerRepository.fetchPrayerScheduleFromNetwork(tomorrowStr)
            }
        }
    }
}

class MainViewModelFactory(
    private val authRepository: DeviceAuthRepository,
    private val prayerRepository: PrayerRepositoryImpl,
    private val syncRepository: SyncRepository,
    private val prayerStateMachine: PrayerStateMachine
) : androidx.lifecycle.ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(MainViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return MainViewModel(authRepository, prayerRepository, syncRepository, prayerStateMachine) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
