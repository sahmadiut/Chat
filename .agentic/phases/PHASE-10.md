# PHASE-10 — Security, Concurrency & Reliability

## Goal

Harden authorization, transactional behavior, restart safety, Redis failure behavior, workers, backups, and recovery.

## PRD Anchor

Sections 105-115, 126-129, 137

## Tasks

| Task | Title | Priority | Dependencies |
|---|---|---|---|
| `TASK-1001` | Callback & Ownership Security | P0 | TASK-0105, TASK-0901 |
| `TASK-1002` | Concurrency & Transaction Review | P0 | TASK-0404, TASK-0703, TASK-0603 |
| `TASK-1003` | Background Workers & Retries | P1 | TASK-0102 |
| `TASK-1004` | Redis/Restart Failure Safety | P0 | TASK-0402, TASK-0506 |
| `TASK-1005` | Secrets, Backups & Access Controls | P0 | TASK-0102 |

## Phase Exit Signals

- Callback & Ownership Security: Forged callback IDs cannot access other users/sessions/admin objects.
- Concurrency & Transaction Review: Known critical race conditions have deterministic outcomes.
- Background Workers & Retries: Heavy tasks do not block user-facing handlers.
- Redis/Restart Failure Safety: No duplicate active match is created after recovery.
- Secrets, Backups & Access Controls: Credentials are not committed.

## Execution Rule

Do not mark this phase complete from task counts alone. The acceptance criteria of all required P0/P1 tasks must be verified with evidence. Optional P2/P3 tasks may be deferred only with an explicit reason.
