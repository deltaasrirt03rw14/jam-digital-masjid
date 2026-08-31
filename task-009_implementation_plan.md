# TASK-009 IMPLEMENTATION PLAN

## Phase-by-Phase Implementation

### Phase 1: Backend File Upload & Serving
*   **Install dependencies**: `@nestjs/serve-static`, `multer`, `@types/multer` di `backend`.
*   **Static Asset**: Modifikasi `backend/src/app.module.ts` untuk mengimpor `ServeStaticModule` melayani `/uploads`.
*   **Upload Endpoint**: Modifikasi `backend/src/media/media.controller.ts` untuk memiliki `@Post("upload")` menggunakan `FileInterceptor`.
*   **Storage Logic**: Konfigurasi `multer` menggunakan `diskStorage` ke folder `/uploads`.

### Phase 2: Admin API Adapter
*   **Update**: `admin/src/lib/api/adapter.ts`
*   **Method Baru**: 
    - `uploadMedia(file: File)`
    - `deleteMedia(id: string)`
    - `createContent(data: Partial<ContentItem>)`
    - `updateContent(id: string, data: Partial<ContentItem>)`
    - `deleteContent(id: string)`

### Phase 3: Admin Media Management
*   **Update**: `admin/src/app/(dashboard)/media/page.tsx`
*   Ganti mock state dengan data dari `ApiAdapter.getMedia()`. (Buat helper/endpoint di adapter untuk list media).
*   Implementasi `UploadMediaDialog` (modal) dengan HTML `<input type="file" />`.
*   Implementasi tombol Delete.

### Phase 4: Admin Content Management
*   **Update**: `admin/src/app/(dashboard)/content/page.tsx`
*   Implementasi `ContentDialog` untuk Create dan Edit form.
*   Pemilihan tipe (`TEXT`, `IMAGE`, `VIDEO`).
*   Jika tipe bukan TEXT, sediakan Select/Dropdown untuk memilih `media_id` dari media yang telah diupload.
*   Field *Scheduling* (`start_date`, `end_date`), dan status.

### Phase 5: Testing & Sync Verification
*   **Integration Testing**: Memastikan konten baru disinkronisasi dengan Endpoint Sync.
*   **UI/UX**: Verifikasi Loading & Error state.

## Impact Analysis
*   **Android Compatibility Impact**: Nol. Sinkronisasi memakan JSON payload dengan URL statis, di mana backend akan memberikan base URL yang sesuai (misal: `http://192.168.1.10:3001/uploads/image1.jpg`).
*   **Database/Migration Impact**: Tidak ada tabel baru, relasi `Content` ke `Media` sudah terjalin di entitas TypeORM pada phase sebelumnya.
*   **API Contract Impact**: Tambahan `/media/upload` tidak merusak `/media` POST yang lama, namun menjadi solusi file biner yang baru.

## Validation Commands
```bash
# Backend
npm run test
npm run build

# Admin
npm run lint
npm run build

# Android
gradlew.bat testDebugUnitTest lint clean build
```

## Definition of Done
Semua flow unggah media dan pembuatan konten berhasil sampai tahap file disajikan oleh backend dan di-consume oleh endpoint sync, dan semua command validasi mengembalikan hasil PASS tanpa peringatan kritis.
