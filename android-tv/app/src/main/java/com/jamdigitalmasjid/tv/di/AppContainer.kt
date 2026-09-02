package com.jamdigitalmasjid.tv.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import com.jamdigitalmasjid.tv.data.local.AppDatabase
import com.jamdigitalmasjid.tv.data.local.DeviceCredentialStore
import com.jamdigitalmasjid.tv.data.local.DeviceCredentialStoreImpl
import com.jamdigitalmasjid.tv.data.network.AuthInterceptor
import com.jamdigitalmasjid.tv.data.network.JdmApiService
import com.jamdigitalmasjid.tv.data.repository.DeviceAuthRepository
import com.jamdigitalmasjid.tv.data.repository.PrayerRepositoryImpl
import com.jamdigitalmasjid.tv.data.repository.SyncRepository
import com.jamdigitalmasjid.tv.domain.engine.PrayerEngine
import com.jamdigitalmasjid.tv.domain.statemachine.PrayerStateMachine
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

interface AppContainer {
    val deviceCredentialStore: DeviceCredentialStore
    val deviceAuthRepository: DeviceAuthRepository
    val prayerRepository: PrayerRepositoryImpl
    val syncRepository: SyncRepository
    val prayerEngine: PrayerEngine
    val prayerStateMachine: PrayerStateMachine
    val dataStore: DataStore<Preferences>
    val mediaDownloadManager: com.jamdigitalmasjid.tv.data.repository.MediaDownloadManager
    val contentSelector: com.jamdigitalmasjid.tv.domain.engine.ContentSelector
}

class AppContainerImpl(private val applicationContext: Context) : AppContainer {
    override val dataStore: DataStore<Preferences> = applicationContext.dataStore

    override val deviceCredentialStore: DeviceCredentialStore by lazy {
        DeviceCredentialStoreImpl(dataStore)
    }

    private val authInterceptor = AuthInterceptor(dataStore)

    val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BODY })
        .build()

    // Using the user's permanent Ngrok domain for production/testing
    private val retrofit = Retrofit.Builder()
        .baseUrl("https://bonelike-tartness-patronize.ngrok-free.dev/")
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val jdmApiService: JdmApiService by lazy {
        retrofit.create(JdmApiService::class.java)
    }

    private val appDatabase: AppDatabase by lazy {
        AppDatabase.getDatabase(applicationContext)
    }

    override val deviceAuthRepository: DeviceAuthRepository by lazy {
        DeviceAuthRepository(
            credentialStore = deviceCredentialStore,
            apiService = jdmApiService
        )
    }

    override val prayerRepository: PrayerRepositoryImpl by lazy {
        PrayerRepositoryImpl(
            apiService = jdmApiService,
            prayerScheduleDao = appDatabase.prayerScheduleDao(),
            dataStore = dataStore
        )
    }

    override val syncRepository: SyncRepository by lazy {
        SyncRepository(
            apiService = jdmApiService,
            database = appDatabase,
            dataStore = dataStore,
            authRepository = deviceAuthRepository // we'll pass this so SyncRepository can trigger clearCredentials on 401
        )
    }

    override val mediaDownloadManager: com.jamdigitalmasjid.tv.data.repository.MediaDownloadManager by lazy {
        com.jamdigitalmasjid.tv.data.repository.MediaDownloadManager(
            context = applicationContext,
            database = appDatabase,
            authRepository = deviceAuthRepository,
            okHttpClient = okHttpClient
        )
    }

    override val contentSelector: com.jamdigitalmasjid.tv.domain.engine.ContentSelector by lazy {
        com.jamdigitalmasjid.tv.domain.engine.ContentSelector(
            database = appDatabase,
            mediaDownloadManager = mediaDownloadManager
        )
    }

    override val prayerEngine: PrayerEngine by lazy {
        PrayerEngine()
    }

    override val prayerStateMachine: PrayerStateMachine by lazy {
        PrayerStateMachine(prayerEngine)
    }
}
