# TASK-011.1 PREFLIGHT AUDIT

## 1. Kondisi Sebelum Test
- Docker CLI tidak tersedia di environment ini (berdasarkan eksekusi TASK-011 sebelumnya).
- Android Emulator dan hardware acceleration tidak didukung penuh (berdasarkan log error JAVA_HOME dan test sebelumnya).
- Runtime bugs (DeviceGuard DI, Admin Port Collision) telah diperbaiki di TASK-011.
- Database PostgreSQL berjalan secara native di `localhost:5432`.
- Backend dan Admin dapat berjalan secara native menggunakan Node.js versi 22.

## 2. Expected Architecture & Deployment Topology
- **Production Server**: 
  - `db` (PostgreSQL 15) di dalam internal docker network (Port 5432)
  - `backend` (NestJS) dieskpos via proxy ke port 3000
  - `admin` (Next.js) diekspos via proxy ke port 3001
- **Storage Topology**: Persistent Docker Volumes untuk `pgdata` dan `backend_uploads`.
- **Topologi Alternatif (Native)**: 
  - DB di `localhost:5432`
  - Backend `localhost:3000`
  - Admin `localhost:3001`

## 3. Required Ports
- 5432 (PostgreSQL)
- 3000 (Backend API & Static File Server)
- 3001 (Admin Dashboard Next.js)

## 4. Environment Variables
- `DATABASE_URL` untuk koneksi NestJS
- `NEXT_PUBLIC_API_URL` (Admin -> Backend)

## 5. Known Risks & Blockers
- **Docker E2E (BLOCKED)**: Tidak tersedianya Docker CLI menghalangi verifikasi konfigurasi Docker-Compose secara end-to-end langsung di environment ini.
- **Android TV GUI/Emulator E2E (BLOCKED)**: Absennya Android SDK, JAVA_HOME, dan emulator support secara native mencegah validasi GUI visual, sehingga build testing dan unit test akan menjadi substitusi validasi stabilitas kode.

## 6. Test Strategy
Meskipun Docker diblokir, sistem akan diverifikasi kemampuannya secara Native Lifecycle.
1. Run Backend Database Migrations via `npm run migration:run`
2. Start Backend via `npm run start` (native)
3. Start Admin via `npx next start -p 3001` (native)
4. Gunakan API REST calls (PowerShell/Curl) untuk eksekusi API Smoke Test, Media Storage Persistence, E2E Auth Lifecycle.
5. Jalankan full regression suite (`npm run test`, `gradlew build`, dll).
