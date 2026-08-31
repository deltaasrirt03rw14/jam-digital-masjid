# AGENTS.md — AI Development Rules

AI is an implementation assistant, not the product/architecture decision maker.

## Source-of-truth priority
1. AGENTS.md
2. ARCHITECTURE_DECISIONS.md
3. TECH_STACK.md
4. OPEN_DECISIONS.md
5. docs/
6. tasks/
7. source code

Conflicts require STOP + report; never choose silently.

## Rules
- TypeScript strict mode for backend/admin.
- Kotlin for Android TV.
- No production secrets in repository.
- API changes update OpenAPI.
- DB changes use migrations.
- Sync must be idempotent.
- Android is offline-first.
- Network failure must not blank the TV.
- Core Android API 21+; enhanced media API 23+ with graceful degradation on 21–22.
- Target 1280x720, 1920x1080, 3840x2160; safe area/overscan required.
- Android never calls third-party prayer APIs directly.
- Server performs provider adapter, validation, normalization, persistence/cache.
- Fallback calculation is last resort.
