# PROJECT START HERE

1. Create/open a fresh `JamDigitalMasjid` repository.
2. Copy this entire package into it.
3. Do NOT copy old project documents into the active tree.
4. Open in Antigravity IDE.
5. Read `AGENTS.md`, `TECH_STACK.md`, `ARCHITECTURE_DECISIONS.md`, `OPEN_DECISIONS.md`.
6. Execute TASK-006 first.
7. Review evidence and lock provider order with human approval.
8. Execute TASK-000.

## Windows / PowerShell Execution
On some Windows systems, PowerShell `ExecutionPolicy` may prevent `npm.ps1` or local setup scripts from running. To resolve this safely without permanently disabling security protections:
- Use `cmd.exe` instead of PowerShell for npm operations.
- Run `npm.cmd` explicitly where appropriate.
- Follow your organization's approved PowerShell execution policy for trusted local scripts.

## STOP conditions
AI must stop when it finds conflicting specifications, needs an unapproved framework, wants to change API/database contracts, or needs to resolve an OPEN decision.
