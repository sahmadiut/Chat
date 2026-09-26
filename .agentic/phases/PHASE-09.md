# PHASE-09 — Admin, Archive, Export & Operations UI

## Goal

Build Telegram-only administrative workflows for investigation, moderation, export, audit, broadcasts, and statistics.

## PRD Anchor

Sections 81-95, 142

## Tasks

| Task | Title | Priority | Dependencies |
|---|---|---|---|
| `TASK-0901` | Admin Authentication & RBAC | P0 | TASK-0103 |
| `TASK-0902` | Admin User Search & User Page | P1 | TASK-0901, TASK-0203 |
| `TASK-0903` | Admin Session & Message Archive | P0 | TASK-0902, TASK-0503, TASK-0604 |
| `TASK-0904` | Admin Anonymous Archive | P1 | TASK-0902, TASK-0304 |
| `TASK-0905` | Exports | P0 | TASK-0903 |
| `TASK-0906` | Admin Notes & Audit Log | P0 | TASK-0901 |
| `TASK-0907` | Broadcast & Statistics | P2 | TASK-0901, TASK-1103 |

## Phase Exit Signals

- Admin Authentication & RBAC: Every sensitive admin action checks caller permissions server-side.
- Admin User Search & User Page: Search explains matched identifier.
- Admin Session & Message Archive: Old sessions remain independently reviewable.
- Admin Anonymous Archive: Regular users never gain these identity views.
- Exports: Sessions are not merged in pair history.
- Admin Notes & Audit Log: Search/view/export/location/coin/moderation/config actions can be audited as required.
- Broadcast & Statistics: Broadcast delivery is backgrounded and reports queued/sent/failed states.

## Execution Rule

Do not mark this phase complete from task counts alone. The acceptance criteria of all required P0/P1 tasks must be verified with evidence. Optional P2/P3 tasks may be deferred only with an explicit reason.
