package com.jamdigitalmasjid.tv.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jamdigitalmasjid.tv.domain.engine.ContentSelector
import com.jamdigitalmasjid.tv.domain.engine.PlaybackContent
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface PlaybackState {
    object Idle : PlaybackState
    object Loading : PlaybackState
    data class Playing(val content: PlaybackContent) : PlaybackState
    data class Error(val message: String) : PlaybackState
}

class PlaybackViewModel(
    private val contentSelector: ContentSelector
) : ViewModel() {

    private val _playbackState = MutableStateFlow<PlaybackState>(PlaybackState.Idle)
    val playbackState: StateFlow<PlaybackState> = _playbackState.asStateFlow()

    private var rotationJob: Job? = null
    private var isPaused = false

    fun startPlaybackRotation() {
        if (rotationJob?.isActive == true) return
        
        rotationJob = viewModelScope.launch {
            while (true) {
                if (isPaused) {
                    delay(1000)
                    continue
                }

                _playbackState.value = PlaybackState.Loading
                try {
                    val contents = contentSelector.getPlayableContents()
                    
                    if (contents.isEmpty()) {
                        _playbackState.value = PlaybackState.Idle
                        delay(5000) // check again in 5 seconds
                        continue
                    }

                    // Rotate through contents
                    for (content in contents) {
                        if (isPaused) break // stop current rotation if paused

                        _playbackState.value = PlaybackState.Playing(content)
                        // If it's video, durationMs is not strict, but we can set a fallback timeout
                        // Wait, for videos we'll wait for ExoPlayer to signal completion.
                        // How to do that? 
                        // The UI can call `onContentFinished()` when video ends.
                        // So we just wait indefinitely until `onContentFinished` or delay for images.
                        
                        if (content.type == com.jamdigitalmasjid.tv.domain.engine.PlaybackType.VIDEO) {
                            // Video will signal completion. Just wait.
                            // We use a custom flag or suspend fun to wait.
                            waitForCompletion()
                        } else {
                            delay(content.durationMs)
                        }
                    }
                } catch (e: Exception) {
                    _playbackState.value = PlaybackState.Error(e.message ?: "Unknown error")
                    delay(5000)
                }
            }
        }
    }

    private var completionContinuation: (() -> Unit)? = null
    private var isWaitingForCompletion = false

    private suspend fun waitForCompletion() {
        isWaitingForCompletion = true
        while (isWaitingForCompletion && !isPaused) {
            delay(100)
        }
    }

    fun onContentFinished() {
        isWaitingForCompletion = false
    }

    fun pausePlayback() {
        isPaused = true
        _playbackState.value = PlaybackState.Idle
    }

    fun resumePlayback() {
        isPaused = false
    }

    fun reloadContents() {
        // Force a restart of the rotation to pick up new contents
        rotationJob?.cancel()
        startPlaybackRotation()
    }
}

class PlaybackViewModelFactory(
    private val contentSelector: ContentSelector
) : androidx.lifecycle.ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(PlaybackViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return PlaybackViewModel(contentSelector) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
