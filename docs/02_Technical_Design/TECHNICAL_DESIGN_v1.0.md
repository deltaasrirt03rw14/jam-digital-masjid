# Technical Design v1.0

## Components
Android TV client; NestJS API; PostgreSQL; Next.js Admin; Prayer Provider Gateway; Docker/VPS infrastructure.

## Prayer gateway
Provider adapters (myQuran API v3 [Primary], EQuran Shalat API v2 [Secondary]) → validation → normalization → PostgreSQL/cache → internal REST API → Android sync → Room → Prayer Engine. Both providers are third-party (not official Kemenag APIs). Failover: myQuran → EQuran → server cache → Android local cache → calculation fallback (last resort).

## Android
Presentation → ViewModel/state → domain/prayer engine → repositories → Room/DataStore/network.

## Sync
Versioned/idempotent sync, retries/backoff, validation and atomic local updates.

## Security
TLS in production, server-side secrets, controlled pairing, boundary validation.
