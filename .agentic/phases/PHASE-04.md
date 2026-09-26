# PHASE-04 — Matchmaking Core

## Goal

Build eligibility checks, queueing, atomic matching, pair history, repeat-match rules, and profile snapshots.

## PRD Anchor

Sections 27-36, 105, 123-125, 141

## Tasks

| Task | Title | Priority | Dependencies |
|---|---|---|---|
| `TASK-0401` | Matchmaking Eligibility | P0 | TASK-0203, TASK-0105 |
| `TASK-0402` | Match Queue | P0 | TASK-0401, TASK-0102 |
| `TASK-0403` | User Pair Model | P1 | TASK-0102 |
| `TASK-0404` | Atomic Match Creation | P0 | TASK-0402, TASK-0403, TASK-0204 |
| `TASK-0405` | Match Preferences & Repeat Rules | P0 | TASK-0404 |
| `TASK-0406` | Match Search UX | P1 | TASK-0402, TASK-0106 |

## Phase Exit Signals

- Matchmaking Eligibility: Banned/inactive/incomplete/already-chatting/already-queued users cannot enter incorrectly.
- Match Queue: Queue add/cancel is deterministic.
- User Pair Model: Pair ordering is normalized.
- Atomic Match Creation: One user cannot be matched to two people concurrently.
- Match Preferences & Repeat Rules: Self/block/banned/unavailable matches are impossible.
- Match Search UX: Search state cannot accidentally forward control messages.

## Execution Rule

Do not mark this phase complete from task counts alone. The acceptance criteria of all required P0/P1 tasks must be verified with evidence. Optional P2/P3 tasks may be deferred only with an explicit reason.
