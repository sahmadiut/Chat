# PRD-to-Code Gap Analysis

Reviewed 2026-09-26 against `references/PRODUCT_PRD.md`, phase definitions, `PROJECT_KNOWLEDGE.md`, `ARCHITECTURE.md`, and cited code. Assessments cover checked-in code, not a live deployment. `Partial` means useful code exists but the phase exit criteria are unmet.

## Summary

This is a generic Telegram bot scaffold with grammY, Fastify, PostgreSQL, Redis, BullMQ, localization, logging, and an allowlisted admin panel. Neither anonymous product is implemented. `src/database/schema/conversations.ts` tracks grammY wizards, not peer chat sessions; `messages.ts` logs generic interactions with one Telegram message ID, not a two-sided relay map. The next task is `TASK-0101` to validate the runtime/configuration boundary before adding domain models.

## Phase Assessment

| Phase | Assessment | Evidence and gap | Next work |
|---|---|---|---|
| PHASE-00 Discovery | Implemented | `PROJECT_KNOWLEDGE.md` records reconnaissance; this analysis and `state/project_state.json` complete both discovery tasks. | Proceed to TASK-0101 |
| PHASE-01 Foundation | Partial | `src/main.ts`, `src/config/env.ts`, `src/database/index.ts`, Redis, user upsert, and `locales/` exist. Consent, identity history, safe migrations, and runtime boundaries remain. | TASK-0101-0106 |
| PHASE-02 Profiles | Partial | Telegram profile and notification settings exist (`src/database/schema/users.ts`, `src/bot/features/start/start.command.ts`); no separate matchmaking profile, history, or public projection. | TASK-0201-0205 |
| PHASE-03 Anonymous links/inbox | Missing | No link, thread, inbox, or anonymous block models/features in `src/database/schema/index.ts` and `src/bot/features/index.ts`. | TASK-0301-0306 |
| PHASE-04 Matchmaking | Missing | No queue, pair, atomic match, eligibility, or snapshot model in schema/features. | TASK-0401-0406 |
| PHASE-05 Live chat | Missing | `conversations.ts` is wizard history; `messages.ts` lacks a peer session key and two-sided relay mapping. | TASK-0501-0506 |
| PHASE-06 Deletion | Missing | No session/copy registry or product deletion service. Existing `ctx.deleteMessage()` only closes the admin panel (`admin.command.ts`). | TASK-0601-0604 |
| PHASE-07 Coins/referrals | Missing | No ledger, reward, balance, or referral tables in schema barrel. | TASK-0701-0705 |
| PHASE-08 Moderation | Partial | Generic ban guard/admin ban and rate limiter exist (`banguard.middleware.ts`, `ratelimit.middleware.ts`); no pair blocks, session reports, warnings, or product-specific limits. | TASK-0801-0805 |
| PHASE-09 Admin/archive | Partial | Admin allowlist, generic users/broadcast/stats, and `admin_logs` exist (`admin.filter.ts`, `src/bot/features/admin/`). No granular roles, session/anonymous archive, exports, or full audit coverage. | TASK-0901-0907 |
| PHASE-10 Security/reliability | Partial | Webhook/Mini App verification, queues, and guards exist (`src/server/webhook.ts`, `src/queue/`). No match/deletion/ledger concurrency safety, Redis recovery, or restore drill. | TASK-1001-1005 |
| PHASE-11 Observability/config | Partial | Pino, health endpoints, settings, maintenance, and indexes exist. Generic logger stores content (`logger.middleware.ts`); product analytics/flags and dependency health are incomplete. | TASK-1101-1106 |
| PHASE-12 Phase 2 | Missing | Generic media helpers (`src/bot/media/`) are not anonymous/session-aware; no protected session, voluntary GPS, or distance matching. | TASK-1201-1205 |
| PHASE-13 Phase 3 | Missing | No growth, payment, reputation, or recommendation domain flows in schema/features. | TASK-1301-1305 |
| PHASE-14 Readiness | Missing | CI runs lint/typecheck/build (`.github/workflows/ci.yml`); no PRD acceptance evidence, concurrency/load verification, restore drill, or release checklist. | TASK-1401-1405 |

## Critical Invariants

`Unimplemented` does not imply a leak in a product flow that does not exist.

| Invariant | Result | Evidence / follow-up |
|---|---|---|
| Telegram identity separate from custom profile | Unimplemented | `users.ts` holds Telegram identity; no custom profile table. TASK-0201/0203. |
| Link mode hides destination matchmaking profile | Unimplemented | No link mode or matchmaking profile. TASK-0301-0303. |
| Every match creates new session; never reopen ended session | Unimplemented | No match/session model; wizard `conversations.ts` is unrelated. TASK-0404/0501. |
| Each live message belongs to one session | Unimplemented | `messages.ts` has no session foreign key. TASK-0502/0503. |
| Both Telegram copies mapped | Unimplemented | `messages.ts` has one `telegramMessageId`. TASK-0503/0504. |
| Exact-session deletion | Unimplemented | No session mappings/deletion service. TASK-0601-0603. |
| Internal archive survives Telegram deletion | Unimplemented | No session archive/product deletion path. TASK-0602/0903. |
| Match concurrency safe | Unimplemented | No match creation/reservation transaction. TASK-0404/1002. |
| Coin/referral operations idempotent | Unimplemented | No ledger/referral models. TASK-0701-0703/1002. |
| Admin authorization server-side | Partial | `admin.filter.ts` checks configured IDs and `admin.command.ts` guards callbacks; granular roles and future sensitive paths absent. TASK-0901/1001. |
| Sensitive admin actions audited | Partial | `AdminLogService.logAction` records ban/unban and selected config/broadcast actions; search/view/export/location/coin coverage absent. TASK-0906. |
| Protected Chat not represented as E2E | Unimplemented | No protected-chat flow. Preserve wording in TASK-1201. |
| Exact GPS private/voluntary; activity means bot activity | Unimplemented | No GPS or last-activity domain fields in `users.ts`. TASK-0103/1203. |

## Implementation Order

After this analysis, `TASK-0101` is the highest-priority unblocked implementation task. Validate startup and staging/production boundaries, then durable migrations/Redis (`0102`) and identity/consent (`0103`/`0104`). Continue in the recorded task dependency order. Generic components provide starting code, not evidence of anonymous-product acceptance.
