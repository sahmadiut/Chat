# PHASE-06 — Deletion & Retention

## Goal

Implement message/session Telegram deletion while preserving the internal archive and audit trail.

## PRD Anchor

Sections 40-54, 149-150

## Tasks

| Task | Title | Priority | Dependencies |
|---|---|---|---|
| `TASK-0601` | Single Message Deletion | P0 | TASK-0503 |
| `TASK-0602` | Full Session Deletion | P0 | TASK-0503, TASK-0504 |
| `TASK-0603` | Deletion Batching & Limits | P0 | TASK-0602 |
| `TASK-0604` | Deletion UX & Audit | P1 | TASK-0603 |

## Phase Exit Signals

- Single Message Deletion: Requester membership is verified.
- Full Session Deletion: Only selected session mappings are targeted.
- Deletion Batching & Limits: Sessions with >100 messages are processed in multiple batches.
- Deletion UX & Audit: Warning appears before full deletion.

## Execution Rule

Do not mark this phase complete from task counts alone. The acceptance criteria of all required P0/P1 tasks must be verified with evidence. Optional P2/P3 tasks may be deferred only with an explicit reason.
