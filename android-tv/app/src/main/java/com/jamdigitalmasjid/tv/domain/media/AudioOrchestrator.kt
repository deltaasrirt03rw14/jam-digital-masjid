package com.jamdigitalmasjid.tv.domain.media

interface AudioOrchestrator {
    fun playAdhan()
    fun playIqomah()
    fun stop()
}

class AudioOrchestratorImpl : AudioOrchestrator {
    override fun playAdhan() {
        // LIMITATION REPORT:
        // No media assets are currently available in the repository for Adhan.
        // API 21+ and 23+ graceful media degradation will be handled here once assets are provided.
        // This is a no-op stub for now.
    }

    override fun playIqomah() {
        // LIMITATION REPORT: No media assets for Iqomah.
    }

    override fun stop() {
        // Stop playback
    }
}
