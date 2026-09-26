# PHASE-02 — Profiles & User Settings

## Goal

Implement the custom matchmaking profile, profile history, validation, completion, visibility, and user preferences.

## PRD Anchor

Sections 12-15, 96-99, 132-134

## Tasks

| Task | Title | Priority | Dependencies |
|---|---|---|---|
| `TASK-0201` | Custom Profile Data Model | P0 | TASK-0103 |
| `TASK-0202` | Profile Editing & Validation | P1 | TASK-0201, TASK-0105, TASK-0106 |
| `TASK-0203` | Profile Views & Privacy | P0 | TASK-0202 |
| `TASK-0204` | Profile History & Snapshots Support | P1 | TASK-0202 |
| `TASK-0205` | User Settings & Deactivation | P1 | TASK-0203 |

## Phase Exit Signals

- Custom Profile Data Model: Telegram and custom identities are separate data structures.
- Profile Editing & Validation: Invalid age/name/bio/photo/city inputs are rejected consistently.
- Profile Views & Privacy: Public profile never contains Telegram ID/username/real account data/exact GPS.
- Profile History & Snapshots Support: Historical values are retained with timestamps.
- User Settings & Deactivation: Deactivation disables links and matchmaking and handles an active session.

## Execution Rule

Do not mark this phase complete from task counts alone. The acceptance criteria of all required P0/P1 tasks must be verified with evidence. Optional P2/P3 tasks may be deferred only with an explicit reason.
