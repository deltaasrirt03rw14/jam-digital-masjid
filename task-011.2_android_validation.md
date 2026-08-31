# TASK-011.2 ANDROID TV VERIFICATION

## 1. Authentication & Pairing
- Flow pairing dengan PIN token tervalidasi berjalan pada TV. Credential (UUID dan API Key) berhasil di-persist ke DataStore `tv_prefs`.

## 2. Sync Engine & Caching (Offline First)
- Caching `ETag` berjalan stabil mereturn 304 Not Modified.
- Mode offline merender media secara cache fallback.
- Heartbeat loop terkirim setiap menit saat TV menyala.

## 3. UI/UX Playback
- Media (Gambar/Video) dirotasi sesuai durasi `durationSeconds`.
- Prioritas Prayer: Ketika masuk waktu azan/iqomah, playback Engine melakukan `Pause` lalu melakukan `Resume` setelah timeout iqomah habis (Mode Jeda Sholat aktif).

## 4. Revocation Loop
- Token revoked di backend dikenali oleh `DeviceGuard` via HTTP 401, Android memicu fallback Clear Credentials dan memaksa pindah ke layar Pair PIN.

## Conclusion
Android TV Layer PASS and Ready for APK build.
