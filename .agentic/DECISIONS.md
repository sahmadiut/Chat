# Architecture & Product Decisions

The PRD/charter establish these constraints. Pending entries are choices for implementation tasks, not decisions made by this analysis.

| ID | Decision | Rationale / consequence | Status |
|---|---|---|---|
| ADR-001 | User-facing product UI is Telegram-only. | Existing Mini App scaffold is outside required flow. | ACCEPTED |
| ADR-002 | PostgreSQL is durable authority; Redis holds transient state/queues/locks. | Survive process and Redis restarts. | ACCEPTED |
| ADR-003 | Telegram identity and matchmaking profile are separate. | Prevent identity leaks in anonymous views. | ACCEPTED |
| ADR-004 | Every match creates a new Chat Session; ended sessions remain history. | Keep deletion/reports/exports precise. | ACCEPTED |
| ADR-005 | Telegram deletion preserves the internal administrative archive. | Support moderation and audit. | ACCEPTED |
| ADR-006 | Protected Chat uses Telegram content protection, not E2E encryption. | Backend processes content. | ACCEPTED |
| ADR-007 | Critical update routing uses explicit states. | Prevent control-message relay. | ACCEPTED |
| ADR-008 | Business settings and rollout flags are database-backed. | Operational control. | ACCEPTED |
| ADR-009 | User-facing strings use localization keys. | Persian and other locale support. | ACCEPTED |
| ADR-010 | Sensitive admin actions use server-side permissions and audit. | Protect private content and operations. | ACCEPTED |

## Pending Repository-Specific Decisions

| ID | Choice to resolve | Evidence / owner task | Status |
|---|---|---|---|
| ADR-011 | Replace startup `drizzle-kit push --force` with reviewed versioned migrations and a clean-install path. | `src/database/index.ts`, `drizzle.config.ts`; TASK-0102. | PENDING |
| ADR-012 | Define staging/production configuration and deployment secret boundaries. | `src/config/env.ts`, `.env.example`; TASK-0101/1005. | PENDING |
| ADR-013 | Define routing priority for inbox compose, match search, active chat, and control commands. | `src/bot/bot.ts`, `start.command.ts`; TASK-0105. | PENDING |
| ADR-014 | Choose DB uniqueness/transaction plus Redis reservation strategy for matching/cancel races. | No match model; TASK-0404/1002. | PENDING |
| ADR-015 | Define archive retention/access and redact private payloads from generic Pino, per-user, and analytics logs. | `logger.middleware.ts`, `messages.ts`; TASK-1101/0903. | PENDING |
| ADR-016 | Define relay send-failure mapping and exact-session deletion attempt/result states. | No relay map; TASK-0503/0602/0603. | PENDING |
| ADR-017 | Define main/secondary admin permissions and search/view/export/location/coin audit. | `admin.filter.ts`, `admin-logs.ts`; TASK-0901/0906. | PENDING |
| ADR-018 | Define worker deployment, retry keys, backup/restore, and Redis-loss behavior. | In-process workers in `src/queue/`; TASK-1003-1005. | PENDING |
