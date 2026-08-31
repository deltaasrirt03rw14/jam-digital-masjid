# TASK-011 RECONCILIATION

Berdasarkan audit Task-011, berikut status kesiapan deployment sebelum eksekusi perbaikan:

| Area | Kondisi Aktual | Kondisi Diharapkan | Gap | Severity | Recommended Action |
| --- | --- | --- | --- | --- | --- |
| Media Storage Persistence | Volume uploads tidak ada di `docker-compose.yml`. | Folder `backend/uploads` harus tetap hidup antar restart container. | Ya | P1 | Tambahkan named/host volume di docker-compose. |
| Admin API URL | `NEXT_PUBLIC_API_URL=http://localhost:3000` | Memerlukan path suffix `/api/v1` untuk resolving adapter endpoint. | Ya | P1 | Perbaiki env vars di docker-compose. |
| Backend Runtime | Start script: `npm run start` (production) | Harus melakukan migrasi otomatis saat production? Migrasi dijalankan manual saat test. | Tidak | P2 | Tambahkan `npm run migration:run` sebelum start atau manual. |

_Aksi-aksi yang teridentifikasi di atas wajib dieksekusi sekarang sebagai bagian dari TASK-011 sebelum melakukan E2E UAT._
