# State Behavior v1.0

Display: BOOT → UNPAIRED/PAIRING (PIN entry) → PAIRING SUCCESS → NORMAL; NORMAL → PRE_ADZAN → ADZAN → IQOMAH → PRAYER_MODE → NORMAL. CONTENT/EVENT return to NORMAL. Connectivity loss enters OFFLINE; recovery returns to last valid runtime state.
If device is REVOKED or DISABLED by backend, transition to PAIRING FAILURE / REVOKED SCREEN.

Operational data states: SYNCING → success/failure; failure may become STALE_DATA; provider unavailable uses cache; if cache is unavailable, last-resort FALLBACK_CALCULATION.
