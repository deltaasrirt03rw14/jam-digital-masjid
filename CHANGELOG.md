# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-08-30

### Added
- Setup full monorepo (backend, admin, android-tv).
- Setup PostgreSQL database dengan TypeORM integration.
- Implementasi API backend core (Auth, Mosque, Devices, Prayer, Content, Media, Sync).
- Admin Dashboard berbasis Next.js dengan antarmuka manajemen penuh.
- Sistem Autentikasi Admin dan Device (Pairing menggunakan Token PIN 6-digit).
- Flow ETag dan Offline-first Sync.
- Aplikasi native Android TV menggunakan Kotlin dan Jetpack Compose.
- Room Database terintegrasi untuk cache konten dan media TV.
- Media Playback Engine (Images, MP4) dengan dukungan pre-loading dan cache di layer Android.
- Prayer schedule state machine di layer Android untuk override media saat jam Azan.
- Deployment scripts berbasis Docker Compose (`infrastructure/`).
- Dokumentasi instalasi, backup, dan standard operasional rilis.

### Changed
- Docker compose volumes dipetakan secara persisten untuk menghindari kehilangan data paska pembaruan versi (Backend Uploads & Database).
- Restrukturisasi `DeviceGuard` backend agar mengenali header HTTP `x-device-id`.

### Security
- Perlindungan seluruh API layer menggunakan JWT (Admin) dan API Key B-crypt (TV).
- Fitur remote device revocation untuk mematikan akses Android TV secara instan via dashboard Admin.
