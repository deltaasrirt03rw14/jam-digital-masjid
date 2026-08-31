# Backup & Restore Guide - Jam Digital Masjid v1.0

## 1. Backup Strategy

Ada 2 komponen penting yang harus dicadangkan secara rutin agar operasional jam masjid tidak hilang:
1. **Database PostgreSQL**: Menyimpan data jadwal sholat, referensi device, pengaturan, dan link content.
2. **Media Storage (`/uploads`)**: Berisi file statis video dan gambar masjid.

### A. Melakukan Backup Database (Docker)
Jika menggunakan deployment standar berbasis Docker Compose, jalankan:
```bash
docker exec -t jam_db pg_dump -c -U postgres jam_digital_masjid > dump_`date +%Y-%m-%d`.sql
```
Perintah tersebut akan menghasilkan file `.sql` yang berisi snapshot seluruh database.

### B. Melakukan Backup Media
Masuk ke root direktori proyek, dan jalankan perintah tar untuk mengarsip folder uploads.
```bash
tar -czvf media_backup_`date +%Y-%m-%d`.tar.gz backend/uploads/
```

Simpan file `.sql` dan `.tar.gz` ke penyimpanan eksternal atau cloud storage seperti AWS S3 atau Google Drive secara harian atau mingguan.

---

## 2. Restore Strategy

Jika terjadi kerusakan server atau perpindahan ke mesin baru, ikuti panduan berikut:

### A. Restore Database
Pastikan container database dalam keadaan menyala (`docker compose up -d db`). Kemudian jalankan:
```bash
cat dump_YYYY-MM-DD.sql | docker exec -i jam_db psql -U postgres -d jam_digital_masjid
```
Log akan menampilkan rangkaian operasi restorasi tabel.

### B. Restore Media
Pastikan container backend dalam keadaan **mati**.
Lalu ekstrak file tarball ke dalam direktori proyek:
```bash
tar -xzvf media_backup_YYYY-MM-DD.tar.gz -C backend/
```
Setelah itu hidupkan ulang backend dengan `docker compose up -d backend`.

Verifikasi pada Admin Dashboard apakah seluruh asset media dapat dipreview kembali.
