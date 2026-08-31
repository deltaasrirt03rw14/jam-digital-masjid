# TASK-011.1 API SMOKE TEST REPORT

## 1. Execution Summary
- **Metode Pengujian**: Node.js automated script (`test_api.js`) meniru full lifecycle REST calls.
- **Kondisi Pengujian**: Backend server running native Node.js di port 3000.
- **Status Akhir**: PASS

## 2. Test Results

| Test Case | Endpoint | HTTP Method | Expected Status | Actual Status | Result |
| --- | --- | --- | --- | --- | --- |
| Health Check | `/health` | GET | 200 | 200 | PASS |
| Admin Login | `/auth/login` | POST | 200 | 200 | PASS |
| Admin Devices Listing | `/admin/devices` | GET | 200 | 200 | PASS |
| Generate Pairing Token | `/admin/devices/token` | POST | 201 | 201 | PASS |
| Device Pairing | `/devices/pair` | POST | 200 | 200 | PASS |
| Device Heartbeat | `/devices/:deviceId/heartbeat` | POST | 200 | 200 | PASS |
| Prayer Schedule Fetch | `/mosques/:mosqueId/prayer-schedules` | GET | 200 | 200 | PASS |
| Device Sync | `/devices/:deviceId/sync` | GET | 200 | 200 | PASS |
| Unauthorized Request (No Auth) | `/devices/:deviceId/sync` | GET | 401 | 401 | PASS |
| Revoke Device (Admin) | `/admin/devices/:id/revoke` | POST | 201 | 201 | PASS |
| Revoked Access Rejection | `/devices/:deviceId/sync` | GET | 401 | 401 | PASS |

## 3. Critical Fixes During Test
Ditemukan bahwa endpoint `/mosques/:mosqueId/prayer-schedules` yang dilindungi oleh `DeviceGuard` mengembalikan 401 Unauthorized secara konsisten. 
- **Root Cause**: `DeviceGuard` membaca `request.params.deviceId` untuk memeriksa status device, namun endpoint prayer tidak menerima path param `:deviceId`, hanya `:mosqueId`.
- **Resolution**: `DeviceGuard` diperbarui untuk mendukung pembacaan `deviceId` secara fallback dari header HTTP `x-device-id`. Hal ini mengatasi bug security 401 false positive tanpa mengubah routing REST standard backend. Backend direstart dan UAT pass.
