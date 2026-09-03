package com.jamdigitalmasjid.tv.presentation.ui

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.LinearEasing
import androidx.compose.foundation.Image
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import com.jamdigitalmasjid.tv.R
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.material3.Text
import com.jamdigitalmasjid.tv.data.local.SyncedMosqueConfigEntity
import com.jamdigitalmasjid.tv.data.local.SyncedContentEntity
import com.jamdigitalmasjid.tv.domain.engine.PrayerType
import com.jamdigitalmasjid.tv.domain.statemachine.PrayerState
import com.jamdigitalmasjid.tv.domain.statemachine.StateMachineResult
import com.jamdigitalmasjid.tv.presentation.MainViewModel
import com.jamdigitalmasjid.tv.presentation.PlaybackViewModel
import com.jamdigitalmasjid.tv.presentation.SyncStatus
import com.jamdigitalmasjid.tv.presentation.ui.playback.PlaybackEngineScreen
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import com.google.gson.Gson
import com.google.gson.JsonObject

@Composable
fun getScaleFactor(): Float {
    val configuration = LocalConfiguration.current
    return configuration.screenWidthDp / 1280f
}

@Composable
fun Float.scaledSp(): TextUnit = (this * getScaleFactor()).sp

@Composable
fun Float.scaledDp(): Dp = (this * getScaleFactor()).dp

@Composable
fun MainScreen(viewModel: MainViewModel, playbackViewModel: PlaybackViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    val syncStatus by viewModel.syncStatus.collectAsState()
    val mosqueConfig by viewModel.mosqueConfig.collectAsState(initial = null)
    val runningTextList by viewModel.runningText.collectAsState(initial = emptyList())

    val state = uiState ?: return

    LaunchedEffect(state.activeState) {
        if (state.activeState == PrayerState.NORMAL || state.activeState == PrayerState.OFFLINE || state.activeState == PrayerState.STALE_DATA) {
            playbackViewModel.resumePlayback()
        } else {
            playbackViewModel.pausePlayback()
        }
    }

    LaunchedEffect(syncStatus) {
        if (syncStatus is SyncStatus.Success || syncStatus is SyncStatus.NotModified) {
            playbackViewModel.reloadContents()
        }
    }

    val mosqueConfig by viewModel.syncedMosqueConfig.collectAsState()
    val runningTextList by viewModel.syncedRunningText.collectAsState()

    when (state.activeState) {
        PrayerState.PRAYER_MODE -> PrayerModeScreen()
        PrayerState.ADHAN -> AdhanScreen(state)
        PrayerState.IQOMAH -> IqomahScreen()
        PrayerState.PRE_ADHAN -> PreAdhanScreen(state)
        else -> NormalScreen(state, syncStatus, playbackViewModel, mosqueConfig, runningTextList)
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun NormalScreen(
    state: StateMachineResult,
    syncStatus: SyncStatus,
    playbackViewModel: PlaybackViewModel,
    mosqueConfig: SyncedMosqueConfigEntity?,
    runningTextList: List<SyncedContentEntity>
) {
    Box(modifier = Modifier.fillMaxSize().background(Color(0xFF0F172A))) {
        // Fallback Background
        Image(
            painter = painterResource(id = R.drawable.bg_default_mosque),
            contentDescription = "Mosque Background",
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize(),
            alpha = 0.4f
        )

        // Media/Content Layer in Background
        PlaybackEngineScreen(viewModel = playbackViewModel)

        // Overlay Dashboard
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Header Area
            HeaderArea(mosqueConfig = mosqueConfig, syncStatus = syncStatus, isOffline = state.isOffline, isStale = state.isStale)

            // Slot 1 Running Text Area (Top)
            RunningTextArea(runningTextList = runningTextList, slot = 1)

            // Center Area - Blank (To let media play) or Countdown overlay
            Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                val next = state.prayerEngineResult?.nextPrayer
                val countdown = state.prayerEngineResult?.countdownMillis ?: 0L

                if (countdown > 0) {
                    val minutes = (countdown / 1000) / 60
                    val seconds = (countdown / 1000) % 60
                    val isNear = minutes < 10

                    Box(
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .padding(bottom = 32f.scaledDp(), end = 48f.scaledDp())
                            .clip(RoundedCornerShape(16f.scaledDp()))
                            .background(if (isNear) Color(0xFFE17055).copy(alpha = 0.9f) else Color(0xFF1E293B).copy(alpha = 0.85f))
                            .padding(horizontal = 32f.scaledDp(), vertical = 16f.scaledDp())
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("MENUJU ${next?.type?.name?.uppercase() ?: ""}", color = Color.White, fontSize = 24f.scaledSp(), fontWeight = FontWeight.Bold)
                            Text(String.format("%02d:%02d", minutes, seconds), color = Color.White, fontSize = 64f.scaledSp(), fontWeight = FontWeight.ExtraBold)
                        }
                    }
                }
            }

            // Prayer Schedule Area
            PrayerScheduleArea(state = state)

            // Slot 2 Running Text Area (Bottom)
            RunningTextArea(runningTextList = runningTextList, slot = 2)
        }
    }
}

@Composable
fun HeaderArea(mosqueConfig: SyncedMosqueConfigEntity?, syncStatus: SyncStatus, isOffline: Boolean, isStale: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .wrapContentHeight()
            .background(Color(0xFF0F172A).copy(alpha = 0.85f)) // Pastel Dark Navy
            .padding(horizontal = 32f.scaledDp(), vertical = 24f.scaledDp()),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Left: Mosque Name
        Column {
            Text(
                text = mosqueConfig?.name?.uppercase() ?: "MASJID NAME",
                color = Color.White,
                fontSize = 32f.scaledSp(),
                fontWeight = FontWeight.Bold
            )
            val networkStatus = if (isOffline) "Offline - Cached" else if (isStale) "Offline - Stale" else "Online"
            Text(
                text = mosqueConfig?.address ?: "Status: $networkStatus",
                color = Color.LightGray,
                fontSize = 16f.scaledSp()
            )
        }

        // Right: Clock & Date
        var currentTime by remember { mutableStateOf(System.currentTimeMillis()) }
        LaunchedEffect(Unit) {
            while (true) {
                delay(1000)
                currentTime = System.currentTimeMillis()
            }
        }
        val timezone = mosqueConfig?.timezone ?: "Asia/Jakarta"
        val timeFormat = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
        timeFormat.timeZone = java.util.TimeZone.getTimeZone(timezone)
        val dateFormat = SimpleDateFormat("EEEE, dd MMMM yyyy", Locale("id", "ID"))
        dateFormat.timeZone = java.util.TimeZone.getTimeZone(timezone)
        
        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = timeFormat.format(Date(currentTime)),
                color = Color.White,
                fontSize = 40f.scaledSp(),
                fontWeight = FontWeight.Bold
            )
            Text(
                text = dateFormat.format(Date(currentTime)),
                color = Color(0xFF93C5FD), // Pastel Cyan
                fontSize = 18f.scaledSp()
            )
        }
    }
}

@Composable
fun PrayerScheduleArea(state: StateMachineResult) {
    val schedule = state.prayerEngineResult?.todaySchedule
    val current = state.prayerEngineResult?.currentPrayer?.type
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .wrapContentHeight()
            .background(Color(0xFF0F172A).copy(alpha = 0.85f))
            .padding(horizontal = 16f.scaledDp(), vertical = 24f.scaledDp()),
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (schedule == null) {
            Text("No Prayer Data Available", color = Color(0xFFE17055), fontSize = 24f.scaledSp())
        } else {
            PrayerBox("SUBUH", schedule.subuh, current == PrayerType.SUBUH)
            PrayerBox("SYURUQ", schedule.syuruq ?: "--:--", false)
            PrayerBox("DZUHUR", schedule.dzuhur, current == PrayerType.DZUHUR)
            PrayerBox("ASHAR", schedule.ashar, current == PrayerType.ASHAR)
            PrayerBox("MAGHRIB", schedule.maghrib, current == PrayerType.MAGHRIB)
            PrayerBox("ISYA", schedule.isya, current == PrayerType.ISYA)
        }
    }
}

@Composable
fun PrayerBox(name: String, time: String, isCurrent: Boolean) {
    Box(
        modifier = Modifier
            .width(170f.scaledDp()) // Slightly wider for safe area
            .wrapContentHeight()
            .clip(RoundedCornerShape(12f.scaledDp()))
            .background(if (isCurrent) Color(0xFF4A90E2) else Color(0xFF1E293B)) // Pastel Blue vs Slate
            .padding(vertical = 16f.scaledDp(), horizontal = 8f.scaledDp()),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(name, color = if (isCurrent) Color.White else Color.LightGray, fontSize = 20f.scaledSp(), fontWeight = FontWeight.SemiBold)
            Spacer(modifier = Modifier.height(8f.scaledDp()))
            Text(time, color = if (isCurrent) Color.White else Color(0xFF93C5FD), fontSize = 34f.scaledSp(), fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun CustomMarqueeText(text: String, modifier: Modifier = Modifier, color: Color = Color.White, fontSize: TextUnit) {
    val scrollState = rememberScrollState()
    
    LaunchedEffect(text) {
        while(true) {
            if (scrollState.maxValue > 0) {
                // Scroll to end slowly (about 50px per second)
                val duration = scrollState.maxValue * 20
                scrollState.animateScrollTo(
                    value = scrollState.maxValue,
                    animationSpec = tween(durationMillis = duration, easing = LinearEasing)
                )
                // Pause at the end for a brief moment
                delay(500)
                // Instantly snap to beginning
                scrollState.scrollTo(0)
            } else {
                delay(1000)
            }
        }
    }

    Text(
        text = text,
        color = color,
        fontSize = fontSize,
        maxLines = 1,
        modifier = modifier.horizontalScroll(scrollState, enabled = false)
    )
}

@Composable
fun RunningTextArea(runningTextList: List<SyncedContentEntity>, slot: Int = 1) {
    val gson = Gson()
    val filteredList = runningTextList.filter {
        var itemSlot = 1
        try {
            if (!it.contentData.isNullOrBlank()) {
                val json = gson.fromJson(it.contentData, JsonObject::class.java)
                if (json.has("slot") && !json.get("slot").isJsonNull) {
                    itemSlot = json.get("slot").asInt
                }
            }
        } catch (e: Exception) {}
        itemSlot == slot
    }

    val text = if (filteredList.isEmpty()) {
        if (slot == 1) "Selamat datang di aplikasi Jam Digital Masjid..." else ""
    } else {
        filteredList.joinToString(" • ") {
            var txt = it.title
            try {
                if (!it.contentData.isNullOrBlank()) {
                    val json = gson.fromJson(it.contentData, JsonObject::class.java)
                    if (json.has("text") && !json.get("text").isJsonNull) {
                        txt = json.get("text").asString
                    }
                }
            } catch (e: Exception) {}
            txt
        }
    }

    if (text.isNotEmpty()) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(50f.scaledDp())
                .background(Color(0xFF0F172A)) // Dark slate
                .padding(horizontal = 16f.scaledDp()),
            contentAlignment = Alignment.CenterStart
        ) {
            CustomMarqueeText(
                text = text,
                color = Color.White,
                fontSize = 24f.scaledSp()
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
        modifier = Modifier.fillMaxSize().background(Color(0xFF8B0000)),
        contentAlignment = Alignment.Center
    ) {
        Text("IQOMAH", color = Color.White, fontSize = 72f.scaledSp())
    }
}

@Composable
fun PrayerModeScreen() {
    Box(
        modifier = Modifier.fillMaxSize().background(Color.Black),
        contentAlignment = Alignment.Center
    ) {
        Text("MOHON NONAKTIFKAN ALAT KOMUNIKASI", color = Color.White, fontSize = 32f.scaledSp())
    }
}
