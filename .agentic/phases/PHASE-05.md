# PHASE-05 — Live Chat & Session Lifecycle

## Goal

Implement session-scoped relay, Telegram message mapping, active-chat controls, and deterministic session ending.

## PRD Anchor

Sections 32-44, 122, 126-129

## Tasks

| Task | Title | Priority | Dependencies |
|---|---|---|---|
| `TASK-0501` | Chat Session Model & Lifecycle | P0 | TASK-0404 |
| `TASK-0502` | Live Chat Relay | P0 | TASK-0501 |
| `TASK-0503` | Telegram Message Mapping | P0 | TASK-0502 |
| `TASK-0504` | Session System Message Registry | P1 | TASK-0501 |
| `TASK-0505` | End Chat & Post-Chat Flow | P0 | TASK-0502 |
| `TASK-0506` | Restart & Reachability Recovery | P1 | TASK-0501, TASK-0102 |

## Phase Exit Signals

- Chat Session Model & Lifecycle: Ended sessions are never reopened.
- Live Chat Relay: Partner Telegram identity is never exposed.
- Telegram Message Mapping: Both Telegram copies are addressable later for deletion.
- Session System Message Registry: Match/profile/protected/end notices can be associated with a session and user.
- End Chat & Post-Chat Flow: Both users leave active-chat state.
- Restart & Reachability Recovery: Restart does not destroy active durable records.

## Execution Rule

Do not mark this phase complete from task counts alone. The acceptance criteria of all required P0/P1 tasks must be verified with evidence. Optional P2/P3 tasks may be deferred only with an explicit reason.
