package com.jamdigitalmasjid.tv.presentation.ui.playback

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.material3.Text
import com.jamdigitalmasjid.tv.domain.engine.PlaybackType
import com.jamdigitalmasjid.tv.presentation.PlaybackState
import com.jamdigitalmasjid.tv.presentation.PlaybackViewModel

@Composable
fun PlaybackEngineScreen(
    viewModel: PlaybackViewModel,
    modifier: Modifier = Modifier
) {
    val state by viewModel.playbackState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.startPlaybackRotation()
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black),
        contentAlignment = Alignment.Center
    ) {
        when (val currentState = state) {
            is PlaybackState.Idle -> {
                // Background is just black
            }
            is PlaybackState.Loading -> {
                // Background is black, loading is silent for TV
            }
            is PlaybackState.Error -> {
                Text(
                    text = "Playback Error: ${currentState.message}",
                    color = Color.Red,
                    fontSize = 24.sp,
                    modifier = Modifier.padding(horizontal = 64.dp)
                )
            }
            is PlaybackState.Playing -> {
                val content = currentState.content
                when (content.type) {
                    PlaybackType.IMAGE -> {
                        content.mediaFile?.let { file ->
                            ImagePlayer(imageFile = file)
                        }
                    }
                    PlaybackType.VIDEO -> {
                        content.mediaFile?.let { file ->
                            VideoPlayer(
                                videoFile = file,
                                onVideoFinished = {
                                    viewModel.onContentFinished()
                                }
                            )
                        }
                    }
                    PlaybackType.TEXT -> {
                        // TV-appropriate text display:
                        // - Large font for 720p/1080p/4K readability
                        // - Centered horizontally and vertically
                        // - Safe padding to avoid overscan clipping
                        // - Multiline support (lineHeight > fontSize)
                        // - Graceful empty/null content (shows nothing)
                        val text = content.textContent?.takeIf { it.isNotBlank() }
                        if (text != null) {
                            Text(
                                text = text,
                                color = Color.White,
                                fontSize = 48.sp,
                                textAlign = TextAlign.Center,
                                lineHeight = 64.sp,
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(horizontal = 96.dp, vertical = 64.dp)
                                    .wrapContentSize(Alignment.Center)
                            )
                        }
                        // If text is null/blank, shows black background
                    }
                }
            }
        }
    }
}
