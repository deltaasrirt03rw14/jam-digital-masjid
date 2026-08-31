# Database Schema v1.0

## Tables
`mosques`, `devices`, `device_pairing_tokens`, `prayer_schedules`, `prayer_configs`, `sync_versions`, `contents`, `media`, `events`, `announcements`.

## mosques
`id` (UUID, PK), `name` (VARCHAR(255), NOT NULL), `config_version` (INTEGER, NOT NULL, DEFAULT 1), `created_at` (TIMESTAMPTZ, NOT NULL), `updated_at` (TIMESTAMPTZ, NOT NULL).

## devices
`id` (UUID, PK), `device_identifier` (UUID, NOT NULL, UNIQUE), `mosque_id` (UUID, NOT NULL, FK to mosques.id), `name` (VARCHAR(255), NULL), `status` (VARCHAR, ACTIVE/DISABLED/REVOKED), `api_key_hash` (VARCHAR(255), NOT NULL), `last_heartbeat_at` (TIMESTAMPTZ, NULL), `disabled_at` (TIMESTAMPTZ, NULL), `revoked_at` (TIMESTAMPTZ, NULL), `created_at` (TIMESTAMPTZ, NOT NULL), `updated_at` (TIMESTAMPTZ, NOT NULL).
Constraints/Indexes: `UNIQUE(device_identifier)`, `INDEX(mosque_id)`, `INDEX(status)`.

## device_pairing_tokens
`id` (UUID, PK), `mosque_id` (UUID, NOT NULL, FK to mosques.id), `token_hash` (VARCHAR(255), NOT NULL), `expires_at` (TIMESTAMPTZ, NOT NULL), `used_at` (TIMESTAMPTZ, NULL), `created_at` (TIMESTAMPTZ, NOT NULL).

## prayer_schedules
`id, mosque_id, schedule_date, imsak, subuh, syuruq, dzuhur, ashar, maghrib, isya, source_provider, source_reference, source_version, retrieved_at, validated_at, validation_status, calculation_method, created_at, updated_at`.

Unique: `(mosque_id, schedule_date)`.

Store persistence timestamps in UTC and mosque timezone explicitly.

## prayer_configs (Additions)
Must support server-side location aliases to map physical cities to provider-required location identifiers (e.g., mapping Purwokerto to Kab. Banyumas).
