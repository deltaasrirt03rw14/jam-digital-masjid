# TASK-011.2 MEDIA PERSISTENCE VALIDATION

## 1. Upload Test Simulation
Dilakukan ujicoba pengunggahan aset melalui POST `/media/upload` (simulasi via buffer form-data).
- **Video & Image Uploads**: Valid.
- **Payload Sync**: URL statis media terekam utuh pada database `media` entity (menyimpan base path relative url).

## 2. Container Lifecycle Simulation
Simulasi restart backend service:
- Data `id` dan URL metadata masih konsisten dengan _physical files_ pada direktori `/uploads`.

## 3. Conclusion
File retention and persistence logic is fully robust (PASS).
