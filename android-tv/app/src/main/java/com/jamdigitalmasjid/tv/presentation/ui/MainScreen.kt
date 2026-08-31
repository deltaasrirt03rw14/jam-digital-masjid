package com.jamdigitalmasjid.tv.presentation.ui
import com.jamdigitalmasjid.tv.presentation.PlaybackViewModel
import com.jamdigitalmasjid.tv.presentation.ui.playback.PlaybackEngineScreen
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.material3.Text
import com.jamdigitalmasjid.tv.domain.statemachine.PrayerState
import com.jamdigitalmasjid.tv.domain.statemachine.StateMachineResult
import com.jamdigitalmasjid.tv.presentation.MainViewModel
import com.jamdigitalmasjid.tv.presentation.SyncStatus

@Composable
fun getScaleFactor(): Float {
    val configuration = LocalConfiguration.current
    val screenWidth = configuration.screenWidthDp
    // Base design is assumed to be 720p (1280dp width)
    return screenWidth / 1280f
}

@Composable
fun Float.scaledSp(): TextUnit = (this * getScaleFactor()).sp

@Composable
fun Float.scaledDp(): Dp = (this * getScaleFactor()).dp



@Composable
fun MainScreen(viewModel: MainViewModel, playbackViewModel: PlaybackViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    val syncStatus by viewModel.syncStatus.collectAsState()

    val state = uiState ?: return

    LaunchedEffect(state.activeState) {
        if (state.activeState == PrayerState.NORMAL) {
            playbackViewModel.resumePlayback()
        } else {
            playbackViewModel.pausePlayback()
        }
    }

    LaunchedEffect(syncStatus) {
        if (syncStatus is SyncStatus.Success || syncStatus is SyncStatus.NotModified) {
            // Also reload if NotModified just in case the app restarted and we need to load from cache
            // Actually, PlaybackEngineScreen's LaunchedEffect calls startPlaybackRotation() initially,
            // so we only need to reload if Sync actually updated. But calling it on both is safe.
            playbackViewModel.reloadContents()
        }
    }

    when (state.activeState) {
        PrayerState.PRAYER_MODE -> PrayerModeScreen()
        PrayerState.ADHAN -> AdhanScreen(state)
        PrayerState.IQOMAH -> IqomahScreen()
        PrayerState.PRE_ADHAN -> PreAdhanScreen(state)
        else -> NormalScreen(state, syncStatus, playbackViewModel)
    }
}

@Composable
fun NormalScreen(state: StateMachineResult, syncStatus: SyncStatus = SyncStatus.Idle, playbackViewModel: PlaybackViewModel) {
    Box(
        modifier = Modifier.fillMaxSize().background(Color(0xFF1E1E1E)),
        contentAlignment = Alignment.Center
    ) {
        PlaybackEngineScreen(viewModel = playbackViewModel)

        // Overlay the Clock/Prayer information on top
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.Black.copy(alpha = 0.5f))
                .align(Alignment.BottomCenter)
                .padding(16f.scaledDp())
        ) {

            if (state.isOffline) {
                Text("⚠️ OFFLINE MODE", color = Color.Red, fontSize = 24f.scaledSp())
            }
            if (state.isStale) {
                Text("⚠️ STALE DATA", color = Color.Yellow, fontSize = 24f.scaledSp())
            }
            if (state.activeState == PrayerState.FALLBACK) {
                Text("⚠️ FALLBACK CALCULATION FAILED (No Data)", color = Color.Red, fontSize = 24f.scaledSp())
            }

            // Sync status indicator
            val syncLabel = when (syncStatus) {
                is SyncStatus.Syncing     -> "🔄 Syncing..."
                is SyncStatus.Offline     -> "📵 Content Offline"
                is SyncStatus.Failed      -> "⚠️ Sync Failed (${syncStatus.code ?: "?"})"
                is SyncStatus.Success     -> "✓ Synced (v${syncStatus.configVersion})"
                is SyncStatus.NotModified -> "✓ Up to date"
                else -> ""
            }
            if (syncLabel.isNotEmpty()) {
                Text(
                    text = syncLabel,
                    color = when (syncStatus) {
                        is SyncStatus.Offline, is SyncStatus.Failed -> Color(0xFFFFAA00)
                        else -> Color(0xFF88FF88)
                    },
                    fontSize = 18f.scaledSp()
                )
            }

            Spacer(modifier = Modifier.height(32f.scaledDp()))

            val current = state.prayerEngineResult?.currentPrayer
            val next = state.prayerEngineResult?.nextPrayer
            val countdown = state.prayerEngineResult?.countdownMillis ?: 0L

            Text(
                text = "Current Prayer: ${current?.type?.name ?: "None"}",
                color = Color.White,
                fontSize = 48f.scaledSp(),
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(16f.scaledDp()))

            val nextDayMarker = if (state.prayerEngineResult?.isNextDay == true) " (Tomorrow)" else ""
            Text(
                text = "Next Prayer: ${next?.type?.name ?: "None"} at ${next?.timeString ?: ""}$nextDayMarker",
                color = Color.LightGray,
                fontSize = 32f.scaledSp()
            )

            Spacer(modifier = Modifier.height(16f.scaledDp()))

            val minutes = (countdown / 1000) / 60
            val seconds = (countdown / 1000) % 60
            Text(
                text = "Countdown: ${String.format("%02d:%02d", minutes, seconds)}",
                color = Color.Cyan,
                fontSize = 64f.scaledSp(),
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun PreAdhanScreen(state: StateMachineResult) {
    Box(
        modifier = Modifier.fillMaxSize().background(Color(0xFF8B0000)),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "Bersiap-siap Shalat",
                color = Color.White,
                fontSize = 64f.scaledSp(),
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(16f.scaledDp()))
            val next = state.prayerEngineResult?.nextPrayer
            Text(
                text = "${next?.type?.name ?: ""} at ${next?.timeString ?: ""}",
                color = Color.White,
                fontSize = 48f.scaledSp()
            )
        }
    }
}

@Composable
fun AdhanScreen(state: StateMachineResult) {
    Box(
        modifier = Modifier.fillMaxSize().background(Color(0xFF006400)),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "Waktunya Adhan",
                color = Color.White,
                fontSize = 72f.scaledSp(),
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(16f.scaledDp()))
            val current = state.prayerEngineResult?.currentPrayer
            Text(
                text = current?.type?.name ?: "",
                color = Color.White,
                fontSize = 56f.scaledSp()
            )
        }
    }
}

@Composable
fun IqomahScreen() {
    Box(
        modifier = Modifier.fillMaxSize().background(Color(0xFF00008B)),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "Iqomah Countdown",
                color = Color.White,
                fontSize = 64f.scaledSp(),
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun PrayerModeScreen() {
    Box(
        modifier = Modifier.fillMaxSize().background(Color.Black),
        contentAlignment = Alignment.Center
    ) {
        // Blank screen for prayer mode
    }
}
