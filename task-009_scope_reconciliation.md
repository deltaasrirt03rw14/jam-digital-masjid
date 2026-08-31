# TASK-009 SCOPE RECONCILIATION

## Hubungan TASK-009 dengan Roadmap Lama
Berdasarkan `DEVELOPMENT_PLAN.md`, Phase 7 berfokus pada **Integration**. TASK-009 adalah realisasi murni dari integrasi antara layer presentasi pengurus Masjid (Admin Dashboard UI) dengan fungsionalitas Engine Sinkronisasi yang dikembangkan di TASK-005, 006, 007, dan 008. Oleh sebab itu, tugas ini selaras dengan Roadmap.

## Hubungan dengan TASK-005 sampai TASK-008
*   **TASK-005 & 007**: Membangun kapabilitas Klien Android (TV) untuk mengunduh dan men-cache file biner (gambar, video) serta menampilkannya sesuai jadwal.
*   **TASK-008**: Memperkuat keamanan dan stabilitas network (Heartbeat, Throttle, dsb).
*   **TASK-009**: Mengubah Admin Dashboard yang tadinya tidak bisa memasukkan gambar/video ke dalam sistem, menjadi bisa (Admin Media Management & Content Deployment UI).

## Apakah TASK-009 Benar-Benar Scope Baru?
Terdapat unsur scope yang **baru diimplementasikan** (yaitu flow HTTP Upload Multipart di sisi backend), namun secara konseptual ini adalah pemenuhan Requirement (PRD) agar sistem dapat beroperasi secara keseluruhan. Secara UI, sebagian mock telah ada, sehingga ini adalah eksekusi fungsionalitas yang tertunda.

## Adakah Scope yang Bagian dari Task Lama Namun Belum Selesai?
Dalam TASK-004 (Dashboard Foundation), kerangka dashboard sudah diatur (layouting, mock-up list). Saat itu backend upload belum diwajibkan karena fokus pada layout dan integrasi otentikasi. Jadi TASK-009 ini mengisi "hole" yang sengaja ditinggalkan dari TASK-004 karena menunggu engine TV (TASK-007) rampung (mengurangi integrasi prematur).

## Scope Final TASK-009
1.  **Backend Upload Endpoint**: Menambahkan dukungan `multipart/form-data` melalui Multer untuk menerima file gambar dan video. Validasi ukuran (max 50MB) dan ekstensi.
2.  **Backend Static File Serving**: Melayani file yang di-upload agar dapat diunduh (GET) menggunakan path `/uploads/...`.
3.  **Admin Media Management UI**: 
    - Real list dari API `/media`.
    - Modal / Drag & Drop Upload untuk file baru.
    - Delete file.
4.  **Admin Content Management UI**:
    - Real form (Dialog) untuk `Create Content` dan `Edit Content`.
    - Pilihan media (combobox/selector) berdasarkan referensi media di library.
    - Pengaturan urutan, tipe (TEXT/IMAGE/VIDEO), *schedule*, *status* aktif.

## Requirement Baru untuk Traceability Matrix
Berdasarkan analisa di atas, Traceability Matrix (REQUIREMENT_TRACEABILITY_MATRIX.md) akan diperluas untuk mencakup spesifikasi pengelolaan konten:
*   **REQ-016 | Admin Media Upload** | PRD | 009
*   **REQ-017 | Admin Content Authoring** | PRD | 009
*   **REQ-018 | File Storage Integrity (Multer)** | Architecture | 009
