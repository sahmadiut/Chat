# PHASE-07 — Coins, Rewards & Referrals

## Goal

Implement the transactional coin ledger, one-time rewards, referral qualification, and anti-farming guarantees.

## PRD Anchor

Sections 65-73, 106-108

## Tasks

| Task | Title | Priority | Dependencies |
|---|---|---|---|
| `TASK-0701` | Coin Ledger | P0 | TASK-0102 |
| `TASK-0702` | Welcome & Profile Rewards | P0 | TASK-0701, TASK-0202 |
| `TASK-0703` | Referral Qualification | P0 | TASK-0701, TASK-0104 |
| `TASK-0704` | Match & Filter Costs | P1 | TASK-0701, TASK-0404 |
| `TASK-0705` | Coins UI & History | P2 | TASK-0701, TASK-0106 |

## Phase Exit Signals

- Coin Ledger: Spends are concurrency-safe.
- Welcome & Profile Rewards: Each reward type is claimable once per policy.
- Referral Qualification: One referred user cannot trigger duplicate rewards.
- Match & Filter Costs: No double-spend on concurrent actions.
- Coins UI & History: Displayed balances reconcile with ledger.

## Execution Rule

Do not mark this phase complete from task counts alone. The acceptance criteria of all required P0/P1 tasks must be verified with evidence. Optional P2/P3 tasks may be deferred only with an explicit reason.
