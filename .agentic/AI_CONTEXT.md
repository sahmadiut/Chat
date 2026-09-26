# AI Context — Project Snapshot

> Read this file first. It is generated from `state/project_state.json` by `projectctl.py`.

## Project at a Glance

- **Product:** Anonymous Messaging & Anonymous Chat Telegram Bot
- **Platform:** Telegram Bot only
- **Core product:** Personal anonymous inbox + anonymous matchmaking chat
- **Task progress:** 0/78 complete/skipped
- **Current task:** `TASK-0001` — Repository Reconnaissance (IN_PROGRESS)

## Non-Negotiable Rules

1. Never expose Telegram identity through anonymous user surfaces.
2. Keep Telegram identity and custom matchmaking profile separate.
3. Every successful match creates a new Chat Session; never reopen an ended session.
4. Every live-chat message belongs to exactly one session.
5. Map both Telegram copies of relayed messages for later exact deletion attempts.
6. Full chat deletion targets one exact session only.
7. Telegram-visible deletion does not erase the internal administrative archive.
8. Protected Chat is Telegram content protection, not end-to-end encryption.
9. Exact GPS is private by default and voluntary to collect.
10. Critical matches/rewards/spends/retries are concurrency-safe and idempotent.
11. Admin actions require server-side permission checks; sensitive actions are audited.

## Current Work

**TASK-0001 — Repository Reconnaissance**

Inspect the entire repository and create a verified as-is understanding of the codebase before implementation changes.

Required outputs:
- `PROJECT_KNOWLEDGE.md`
- `ARCHITECTURE.md`

## Next Eligible Tasks

- None while the current task is active.

## Planned After Current Task

- `TASK-0002` — PRD-to-Code Gap Analysis [P0]

## Phase Progress

| Phase | Done | Active/Partial/Review/Blocked | Total |
|---|---:|---:|---:|
| PHASE-00 — Discovery & Baseline | 0 | 1 | 2 |
| PHASE-01 — Foundation, Identity & Runtime | 0 | 0 | 6 |
| PHASE-02 — Profiles & User Settings | 0 | 0 | 5 |
| PHASE-03 — Anonymous Links & Inbox | 0 | 0 | 6 |
| PHASE-04 — Matchmaking Core | 0 | 0 | 6 |
| PHASE-05 — Live Chat & Session Lifecycle | 0 | 0 | 6 |
| PHASE-06 — Deletion & Retention | 0 | 0 | 4 |
| PHASE-07 — Coins, Rewards & Referrals | 0 | 0 | 5 |
| PHASE-08 — Moderation & Anti-Abuse | 0 | 0 | 5 |
| PHASE-09 — Admin, Archive, Export & Operations UI | 0 | 0 | 7 |
| PHASE-10 — Security, Concurrency & Reliability | 0 | 0 | 5 |
| PHASE-11 — Observability, Configuration & Analytics | 0 | 0 | 6 |
| PHASE-12 — Phase 2 Product Enhancements | 0 | 0 | 5 |
| PHASE-13 — Phase 3 Growth & Monetization | 0 | 0 | 5 |
| PHASE-14 — Production Readiness & Acceptance | 0 | 0 | 5 |

## Active Blockers

- None recorded.

## Files to Read

1. `CURRENT_WORK.md` — exact task detail.
2. `PROJECT_CHARTER.md` — hard invariants.
3. `PROJECT_KNOWLEDGE.md` — verified repository facts.
4. `ARCHITECTURE.md` — as-is and target architecture.
5. Current task file under `tasks/` when available.
6. Relevant phase file under `phases/`.
7. `references/PRODUCT_PRD.md` only when task scope needs source detail.

## State Update Protocol

- Start: `python projectctl.py start TASK-ID`
- Mark partial: `python projectctl.py set TASK-ID PARTIAL --note "..."`
- Block: `python projectctl.py block TASK-ID "reason"`
- Complete: `python projectctl.py done TASK-ID --note "evidence summary"`
- Regenerate snapshot: `python projectctl.py refresh`
