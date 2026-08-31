package com.jamdigitalmasjid.tv

import android.app.Application
import com.jamdigitalmasjid.tv.di.AppContainer
import com.jamdigitalmasjid.tv.di.AppContainerImpl

class JdmApplication : Application() {
    lateinit var container: AppContainer

    override fun onCreate() {
        super.onCreate()
        container = AppContainerImpl(this)
    }
}
