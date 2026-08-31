# Deployment Guide - Jam Digital Masjid v1.0

Dokumen ini menjelaskan langkah-langkah men-deploy ekosistem **Jam Digital Masjid** pada production server menggunakan Docker Compose.

## 1. Prerequisites
- **OS Server**: Linux (Ubuntu 22.04 LTS direkomendasikan)
- **Engine**: Docker Engine 24+ & Docker Compose v2+
- **Network**: Port 3000 (Backend API), Port 3001 (Admin Dashboard) terekspos.

## 2. Persiapan Environment
Clone repository dan arahkan ke direktori `infrastructure/`:
```bash
git clone <repo_url>
cd JamDigitalMasjid/infrastructure
```

Salin file environment dan atur kredensial:
```bash
cp ../backend/.env.example ../backend/.env
cp ../admin/.env.local.example ../admin/.env.local
```

### Konfigurasi Penting di Backend `.env`:
```env
DATABASE_URL=postgres://postgres:postgres_password_kuat@db:5432/jam_digital_masjid
JWT_SECRET=rahasia_jwt_panjang_sekali
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password_admin_kuat
```
*Pastikan `db:5432` sesuai dengan nama service di docker-compose.*

## 3. Eksekusi Deployment
Jalankan command Docker Compose:
```bash
docker compose up -d --build
```
Proses build akan mengunduh dependencies untuk API dan Web Admin.

## 4. Validasi Layanan
- Cek log database: `docker compose logs db -f`
- Cek log backend: `docker compose logs backend -f`
Pastikan log menunjukkan: `Nest application successfully started` dan `TypeOrmModule dependencies initialized`.

- Buka `http://<ip-server>:3001` untuk mengakses Admin Dashboard.

## 5. Reverse Proxy (Optional Tapi Direkomendasikan)
Gunakan Nginx / Traefik untuk membungkus port 3000 dan 3001 ke HTTPS (SSL) dengan Let's Encrypt.
- `api.masjid.com` ➔ `localhost:3000`
- `admin.masjid.com` ➔ `localhost:3001`

Setelah selesai, login ke Admin dan daftarkan TV client.
