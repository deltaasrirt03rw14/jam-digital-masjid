# TASK-011 DEPLOYMENT AUDIT

## A. Repository & Configuration Audit
1. **Infrastructure (docker-compose.yml)**
   - `db` service terkonfigurasi dengan persistent volume `pgdata`.
   - `backend` service terekspos di port 3000. Tersambung ke database via `DATABASE_URL`.
   - **GAP**: `backend` tidak memiliki volume mount untuk folder `uploads`. File akan hilang jika container direstart.
   - **GAP**: `backend` tidak menggunakan .env.production atau configuration spesifik untuk environment.
   - `admin` service terekspos di port 3001. Menggunakan environment `NEXT_PUBLIC_API_URL=http://localhost:3000`.
   - **GAP**: `NEXT_PUBLIC_API_URL` di `docker-compose.yml` seharusnya `http://localhost:3000/api/v1` agar `ApiAdapter` di Admin Dashboard dapat mengakses endpoint dengan benar.
   - **GAP**: Hardcoded credentials fallback (`postgres:postgres`) sebaiknya diamankan, meskipun ini masih aman untuk test deployment.

2. **Backend Storage**
   - File static di-serve di `backend/uploads` menggunakan `ServeStaticModule`. Tanpa persistensi volume di docker, ini berbahaya.
   
3. **Android TV**
   - Endpoint terkonfigurasi pada `JdmApiService.kt` biasanya merujuk ke URL lokal (misal: 10.0.2.2 atau local IP). Jika menjalankan e2e smoke test menggunakan emulator atau device sungguhan, backend harus di-serve pada IP address mesin host (bukan sekadar `localhost`), atau menggunakan emulator `10.0.2.2:3000`.

## B. Recommended Actions (To be fixed immediately)
1. Edit `infrastructure/docker-compose.yml`:
   - Tambahkan `- ./uploads:/app/uploads` atau named volume pada service `backend`.
   - Ubah `NEXT_PUBLIC_API_URL` di service `admin` menjadi `http://localhost:3000/api/v1`.
2. Mulai Docker Compose dan jalankan End-to-End smoke test.
