# TASK-009 REPOSITORY AUDIT

## 1. Executive Summary
Audit difokuskan pada fungsionalitas Admin Media Management & Content Deployment. Ditemukan bahwa backend `MediaController` dan `ContentsController` sudah memiliki CRUD endpoints dasar, namun **belum mendukung flow upload file nyata** pada backend dan UI admin masih bersifat *mock/placeholder*. Kontrak Android TV telah siap menerima data media/content dan offline sync via `/sync`.

## 2. Scope TASK-009 yang direkomendasikan
Fokus TASK-009 adalah menyelesaikan kapabilitas Admin Dashboard dan Backend untuk memungkinkan user mengunggah file media (gambar/video) secara real, mengelola media tersebut, serta menautkannya ke Content untuk dikirim via Sync API ke Android TV.

## 3. Existing Implementation
*   **Backend Media/Content API**: Terdapat entitas, service, controller, dan DTO untuk `Media` dan `Content`. Relasi database sudah terdefinisi.
*   **Android TV**: Fitur `MediaDownloadManager` dan sinkronisasi `ContentSelector` beserta rendering engine (`ImagePlayer`, `VideoPlayer`, `TEXT`) sudah 100% fungsional dan beroperasi secara *offline-first*.
*   **Admin Dashboard UI Structure**: Terdapat halaman `/media` dan `/content`, dan tabel listing di `/content` telah memanggil `ApiAdapter.getContent()`.

## 4. Already Completed / Do Not Rebuild
*   Database relasional (Entity `Media`, `Content`).
*   Tabel integrasi pada sinkronisasi `GET /devices/:id/sync`.
*   Semua infrastruktur sinkronisasi dan manajemen file (offline caching) di sisi klien Android.
*   Authentikasi JWT pada Admin UI.

## 5. Missing Implementation
*   **Backend**: 
    *   Endpoint sesungguhnya untuk mengunggah (`upload`) file media menggunakan `multer` (FileInterceptor).
    *   Fasilitas melayani file statis (Serve static files) untuk folder uploads.
*   **Admin**: 
    *   Integrasi HTTP form-data upload pada halaman `/media`.
    *   Formulir (Modal/Page) `Create Content` dan `Edit Content` yang mengizinkan pemilihan tipe konten (TEXT, IMAGE, VIDEO) dan menautkan `media_id` yang valid.

## 6. Mock / Placeholder Detection
*   Halaman `admin/src/app/(dashboard)/media/page.tsx` sepenuhnya **MOCK**. Daftar item *hardcoded* (`background-jumat.jpg`, dll). Tombol Upload juga tidak beroperasi.
*   Halaman `admin/src/app/(dashboard)/content/page.tsx` memanggil API untuk daftar konten, namun tombol "Add Content", "Edit", dan "Delete" adalah **Placeholder** (tidak ada action handler).

## 7. Backend API Readiness
Backend memiliki CRUD berbasis JSON, namun belum mendukung penerimaan MIME type `multipart/form-data` untuk upload biner. Ini adalah gap teknis yang perlu diisi. Endpoint `POST /media/upload` (atau modifikasi pada `POST /media`) harus dibuat.

## 8. Admin Dashboard Readiness
Layout siap, tetapi integrasi upload file ke server (`fetch` dengan `FormData`) belum diimplementasikan di `ApiAdapter`. Form Create/Edit Content belum tersedia.

## 9. Android Compatibility Analysis
Tidak akan ada perubahan yang merusak (breaking changes) pada Android. File akan tersedia melalui URL yang di-serve oleh backend, dan Android MediaDownloadManager akan mengambil URL tersebut dari objek `sync` seperti biasa. Format API contract `SyncResponseDto` tetap stabil.

## 10. Data Flow
1. Admin Upload (Multipart) -> Backend API (`POST /media`).
2. File disimpan di disk `/uploads`, data tersimpan di tabel `media`.
3. Admin Create Content -> Backend API (`POST /contents`) dengan ref `media_id`.
4. TV Sync Request -> Backend `GET /sync` menghasilkan daftar konten.
5. TV MediaDownloadManager mengunduh file dari URL statis.

## 11. Risks
*   **Penyimpanan**: Uploads disimpan lokal (disk). Jika nantinya menggunakan Docker/VPS, folder upload perlu di-mount sebagai Volume.
*   **MIME Validation**: Bahaya security jika file non-media (misal `.exe`, `.sh`) diizinkan. Perlu filter ekstensi pada backend (multer).

## 12. Required Changes
1. Backend `MediaController`: Tambah endpoint upload (Multer).
2. Backend `AppModule` / `main.ts`: Tambah akses ke folder statis `/uploads`.
3. Admin `ApiAdapter`: Tambah method `uploadMedia`, `createContent`, `updateContent`, `deleteContent`, `deleteMedia`.
4. Admin UI: Implementasi form pada `/media` dan `/content`.

## 13. Out of Scope
*   External cloud storage (AWS S3) (di luar requirement minimal saat ini, kita gunakan local storage server).
*   Live Streaming support.

## 14. Recommendation
Audit mengkonfirmasi TASK-009 **bukan pengulangan** tapi kelanjutan natural yang vital. Tidak ditemukan arsitektur yang bentrok. Silakan langsung mengeksekusi integrasi ini.
