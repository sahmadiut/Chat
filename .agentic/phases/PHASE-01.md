# PHASE-01 — Foundation, Identity & Runtime

## Goal

Establish the bot runtime, durable infrastructure, identity model, consent, state routing, and localization foundation.

## PRD Anchor

Sections 1-15, 100-108, 119-122, 136

## Tasks

| Task | Title | Priority | Dependencies |
|---|---|---|---|
| `TASK-0101` | Runtime & Project Skeleton | P0 | TASK-0002 |
| `TASK-0102` | PostgreSQL & Redis Foundations | P0 | TASK-0101 |
| `TASK-0103` | User Identity & Registration | P0 | TASK-0102 |
| `TASK-0104` | Terms, Privacy & Age Gate | P0 | TASK-0103 |
| `TASK-0105` | Explicit State Machine & Routing | P0 | TASK-0103 |
| `TASK-0106` | Localization Foundation | P1 | TASK-0101 |

## Phase Exit Signals

- Runtime & Project Skeleton: Bot starts in a development environment.
- PostgreSQL & Redis Foundations: Migrations can run from a clean database.
- User Identity & Registration: Telegram identity is stored internally and never exposed through anonymous views.
- Terms, Privacy & Age Gate: Version and acceptance timestamps are stored.
- Explicit State Machine & Routing: Important flows do not infer state from last message text.
- Localization Foundation: Business logic does not hard-code Persian text.

## Execution Rule

Do not mark this phase complete from task counts alone. The acceptance criteria of all required P0/P1 tasks must be verified with evidence. Optional P2/P3 tasks may be deferred only with an explicit reason.
