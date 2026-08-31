# QA Test Cases v1.0

Core: boot, pairing, normal display, prayer transitions, iqomah, reboot recovery.

Device Pairing & Identity: valid pairing, invalid PIN, expired PIN, reused PIN, brute-force/rate limiting (5 attempts/15m), duplicate device identifier.
Device Authentication: valid heartbeat, invalid API key, DISABLED device behavior, REVOKED device behavior, configuration version comparison.

Network: offline startup, loss during runtime, recovery, repeated reconnect.

Provider: myQuran API v3, EQuran Shalat API v2, timeout, malformed payload, failover, both unavailable, cache, local cache, fallback calculation, provenance.

Display: 1280x720, 1920x1080, 3840x2160, overscan, long-running, API 23+ media, API 21–22 graceful media degradation.

Devices: built-in Android TV and Android TV Box.
