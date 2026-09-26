# PHASE-08 — Moderation & Anti-Abuse

## Goal

Implement blocking, reports, warnings, restrictions, spam controls, and risk-based abuse defenses.

## PRD Anchor

Sections 74-80, 110-112, 131

## Tasks

| Task | Title | Priority | Dependencies |
|---|---|---|---|
| `TASK-0801` | Unified Blocking Model | P0 | TASK-0403, TASK-0305 |
| `TASK-0802` | Reports & Evidence Precision | P0 | TASK-0305, TASK-0503 |
| `TASK-0803` | Warnings, Restrictions & Bans | P0 | TASK-0802 |
| `TASK-0804` | Rate Limits & Flood Control | P1 | TASK-0102 |
| `TASK-0805` | Risk Signals & Abuse Detection Hooks | P2 | TASK-0802, TASK-0804 |

## Phase Exit Signals

- Unified Blocking Model: Blocked pairs cannot match while block is active.
- Reports & Evidence Precision: Reports point to exact session/message/anonymous source where applicable.
- Warnings, Restrictions & Bans: Restrictions are enforced server-side.
- Rate Limits & Flood Control: Flooding is limited without relying on in-process memory only.
- Risk Signals & Abuse Detection Hooks: Risk controls can influence moderation/search/media limits without exposing private data to users.

## Execution Rule

Do not mark this phase complete from task counts alone. The acceptance criteria of all required P0/P1 tasks must be verified with evidence. Optional P2/P3 tasks may be deferred only with an explicit reason.
