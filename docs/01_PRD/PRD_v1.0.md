# PRD v1.0 — Clean Baseline

## Product
TV-first Jam Digital Masjid for Android TV built-in and Android TV Box.

## Core experience
Current time, prayer schedule, current/next prayer, countdown, adhan/iqomah transitions, mosque identity, announcements and content.

## Compatibility
Core Android API 21+. Enhanced media API 23+. Required visual profiles 1280x720, 1920x1080, 3840x2160.

## Offline-first
TV continues operating from last valid local data during network outage and recovers automatically after connectivity returns.

## Prayer data
Server-side provider gateway supports myQuran API v3 (Primary) and EQuran Shalat API v2 (Secondary). Both are third-party APIs and must not be described as official Kemenag APIs. Android consumes normalized internal API data only. Failover: myQuran → EQuran → server cache → Android cache → calculation fallback. Provider order is CLOSED.

## Fallback
Android calculation is last resort; never silently overwrites provider/server data.

## Admin/backend
Next.js + TypeScript; NestJS + TypeScript; PostgreSQL.

## Non-functional
Resilient reboot, network recovery, secure pairing, auditable sync, readable at distance, Docker/VPS-ready.
