# Jam Digital Masjid v1.0.0

Kami bangga merilis **Jam Digital Masjid v1.0.0**, rilis stabil pertama yang dirancang khusus untuk manajemen display masjid yang interaktif, modern, dan andal (offline-first).

## Fitur Utama

- **Offline-First Android TV App**: Jam digital tidak akan pernah blank saat internet mati. TV dapat beroperasi otomatis selama berbulan-bulan berkat lokal caching (Room DB).
- **Admin Dashboard Lengkap**: Interface elegan untuk manajemen Device, Pengaturan Masjid, Media (Gambar & Video), serta Penjadwalan Konten.
- **Prayer Engine Dinamis**: Terhubung ke sumber Kemenag dan Muslim World League (MWL) dengan fallback mode.
- **Auto-Sync & Heartbeat**: TV akan sinkron otomatis (ETag based) dalam bandwidth rendah.
- **Keamanan Ketat (Revocation)**: Sistem PIN Pairing 6 digit memastikan device terdaftar. Admin dapat me-revoke (mematikan akses) TV secara sekejap dari jarak jauh.

## Deployment Readiness
Rilis ini siap diterjunkan (production-ready) menggunakan Docker Compose, mendukung arsitektur multi-device dalam satu environment server.
