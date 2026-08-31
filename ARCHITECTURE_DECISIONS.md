# ARCHITECTURE DECISIONS

## AD-001 Offline-first
Android stores the latest valid configuration, prayer schedule, content metadata and essential runtime state locally.

## AD-002 Server authority
Server is authoritative for synchronized configuration when available; Android remains operational from validated local data during outage.

## AD-003 Prayer provider gateway
Provider → adapter → validation → normalization → PostgreSQL/cache → internal REST API → Android sync → Room → Prayer Engine.
Android never calls myQuran/EQuran directly.

## AD-004 Dual provider
myQuran API v3 (Primary) and EQuran Shalat API v2 (Secondary) are behind a common provider interface. Both are third-party APIs (not official Kemenag APIs). Failover order: myQuran → EQuran → server cache → Android local cache → calculation fallback. Provenance (provider, version, source reference, timestamp, validation) must be preserved. Location aliases must be server-side configurable (e.g. Purwokerto mapped to Kab. Banyumas).

## AD-005 Fallback calculation
Android calculation is last resort and must be distinguishable from provider-derived data.

## AD-006 Responsive TV
Required profiles: 1280x720, 1920x1080, 3840x2160. Safe area and overscan handling required.

## AD-007 Compatibility
Core API 21+. Enhanced media API 23+ with graceful degradation on API 21–22.

## AD-008 Deployment
Docker-friendly and deployable on a general VPS.

## AD-009 Database ORM
TypeORM is the approved ORM for backend persistence. PostgreSQL remains the database. Business schema implementation is NOT part of TASK-000. ORM approval does not authorize implementation of TASK-001 or later.
