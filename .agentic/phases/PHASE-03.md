# PHASE-03 — Anonymous Links & Inbox

## Goal

Implement personal anonymous links, anonymous compose/reply threads, inbox management, and anonymous sender controls.

## PRD Anchor

Sections 16-26, 130-131, 140

## Tasks

| Task | Title | Priority | Dependencies |
|---|---|---|---|
| `TASK-0301` | Anonymous Link Tokens | P0 | TASK-0104, TASK-0105 |
| `TASK-0302` | Anonymous Message Compose & Storage | P0 | TASK-0301 |
| `TASK-0303` | Anonymous Inbox & Delivery | P1 | TASK-0302 |
| `TASK-0304` | Anonymous Reply Threads | P1 | TASK-0303 |
| `TASK-0305` | Anonymous Block & Report | P0 | TASK-0303 |
| `TASK-0306` | Anonymous Abuse Controls | P1 | TASK-0302, TASK-0801 |

## Phase Exit Signals

- Anonymous Link Tokens: Tokens do not reveal Telegram/internal IDs.
- Anonymous Message Compose & Storage: Recipient never sees sender Telegram identity.
- Anonymous Inbox & Delivery: Inbox can paginate safely.
- Anonymous Reply Threads: Replies remain anonymous to both users.
- Anonymous Block & Report: Recipient can block without learning sender identity.
- Anonymous Abuse Controls: Abusive bursts are limited.

## Execution Rule

Do not mark this phase complete from task counts alone. The acceptance criteria of all required P0/P1 tasks must be verified with evidence. Optional P2/P3 tasks may be deferred only with an explicit reason.
