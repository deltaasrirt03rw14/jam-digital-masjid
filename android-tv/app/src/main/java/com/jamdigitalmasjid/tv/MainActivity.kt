package com.jamdigitalmasjid.tv

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.Box
import androidx.compose.ui.Modifier
import androidx.tv.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.material3.CircularProgressIndicator

import androidx.activity.viewModels
import com.jamdigitalmasjid.tv.presentation.PlaybackViewModel
import com.jamdigitalmasjid.tv.presentation.PlaybackViewModelFactory
import com.jamdigitalmasjid.tv.presentation.MainViewModel
import com.jamdigitalmasjid.tv.presentation.MainViewModelFactory
import com.jamdigitalmasjid.tv.presentation.ui.MainScreen
import com.jamdigitalmasjid.tv.presentation.ui.PairingScreen
import com.jamdigitalmasjid.tv.domain.statemachine.DeviceAuthState

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels {
        val app = application as JdmApplication
        MainViewModelFactory(
            app.container.deviceAuthRepository,
            app.container.prayerRepository,
            app.container.syncRepository,
            app.container.prayerStateMachine
        )
    }

    private val playbackViewModel: PlaybackViewModel by viewModels {
        val app = application as JdmApplication
        PlaybackViewModelFactory(
            app.container.contentSelector
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val authState by viewModel.authState.collectAsState()

            when (authState) {
                is DeviceAuthState.Loading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                is DeviceAuthState.Authenticated -> {
                    MainScreen(viewModel = viewModel, playbackViewModel = playbackViewModel)
                }
                else -> {
                    // Unpaired, Pairing, or Error
                    PairingScreen(
                        authState = authState,
                        onPairClicked = { pin ->
                            viewModel.pairDevice(pin)
                        }
                    )
                }
            }
        }
    }
}
