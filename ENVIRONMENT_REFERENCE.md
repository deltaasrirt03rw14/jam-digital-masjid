# Environment Variables Reference

Berisi seluruh daftar spesifikasi `Environment Variables` (Env Vars) yang digunakan pada Ekosistem Jam Digital Masjid.

## 1. Backend (`backend/.env`)

File harus ditempatkan di root folder `backend/`.

| Variable | Required | Tipe | Contoh Default | Deskripsi |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | **Yes** | URI | `postgres://postgres:postgres@localhost:5432/jam_digital_masjid` | Koneksi utama DB. Ubah nama domain jadi `db` jika di dalam Docker compose. |
| `JWT_SECRET` | **Yes** | String | `super_secret_jwt_key` | Kunci simetris untuk menandatangani sesi admin login. Disarankan >32 karakter random. |
| `ADMIN_USERNAME` | **Yes** | String | `admin` | Username untuk login pertama kali dan seterusnya ke Dashboard Admin. |
| `ADMIN_PASSWORD` | **Yes** | String | `password` | Password pasangannya. Backend otomatis melakukan seed user pertama saat boot. |

## 2. Admin (`admin/.env.local`)

File ditempatkan di root folder `admin/`. Server Next.js akan membaca environment local pada build/runtime (apabila Node) atau dicompile langsung saat build (khusus `NEXT_PUBLIC_`).

| Variable | Required | Tipe | Contoh Default | Deskripsi |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | **Yes** | URL | `http://localhost:3000` | URL dari service Backend untuk Client Component API Calls. Ubah ke public URL backend saat production agar Browser TV/PC admin bisa mengeksekusi request. |

## 3. Android TV
Aplikasi Android memiliki konfigurasi base API statis atau dinamis. Pada rilis v1.0, pengaturan IP server dimasukkan saat runtime oleh pengguna (Settings Menu) sehingga **TIDAK ADA** environment khusus waktu kompilasi yang dibutuhkan di CI. Build APK murni portable.
