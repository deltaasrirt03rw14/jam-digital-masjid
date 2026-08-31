# API Design Notes v1.0

Base path `/api/v1`.

Modules: auth, mosques, devices, prayer schedules/config, content, media, events, announcements, sync, health.

Prayer endpoints:
- GET `/mosques/{mosqueId}/prayer-schedules?date=YYYY-MM-DD`
- PUT `/mosques/{mosqueId}/prayer-schedules/{date}` for approved override
- GET `/mosques/{mosqueId}/prayer-config`
- GET `/mosques/{mosqueId}/prayer-provider-status`

Android consumes internal API only. (Providers: myQuran API v3 [Primary], EQuran Shalat API v2 [Secondary]). Server must support location aliases to map physical cities to provider locations (e.g. Purwokerto → Kab. Banyumas).

Device Pairing & Identity:
- Identity: Android TV generates immutable UUIDv4 on first launch (device_identifier).
- PIN Lifecycle: Admin generates 6-digit numeric PIN (15-minute expiration, one-time use) hashed with bcrypt.
- Device API Key Lifecycle: Successful PIN validation issues a permanent, backend-generated high-entropy Bearer token. Plaintext is never stored; backend stores hash, Android uses EncryptedSharedPreferences.
- State Behavior: States include ACTIVE, DISABLED, and REVOKED. REVOKED cannot transition to ACTIVE directly.
- Configuration Version: Config version (`config_version`) belongs to `mosques` and increments on changes.
- Heartbeat: Uses Device API Key Bearer auth. Periodic (default 5 min). Returns `configVersion` and `syncRequired` flags to trigger future syncs (sync not implemented yet).
