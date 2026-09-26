# Architecture & Product Decisions

This log contains decisions explicitly established by the PRD. Repository-specific decisions discovered or made during implementation should be appended with evidence and date.

| ID | Decision | Rationale / Consequence | Status |
|---|---|---|---|
| ADR-001 | Product UI is Telegram-only; no user-facing website or Mini App is required. | Keeps the interaction model inside Telegram. | ACCEPTED |
| ADR-002 | PostgreSQL is the durable system of record; Redis is for queue/state/cache/locks/rate limits. | Critical records must survive restarts and Redis loss. | ACCEPTED |
| ADR-003 | Telegram identity and custom matchmaking profile are separate domain concepts. | Prevents accidental identity exposure. | ACCEPTED |
| ADR-004 | Every successful match creates a new Chat Session; ended sessions are immutable history. | Makes history, deletion, reports, exports and profile snapshots precise. | ACCEPTED |
| ADR-005 | Telegram-visible deletion never implies deletion of the internal administrative archive. | Supports moderation, audit and product retention semantics. | ACCEPTED |
| ADR-006 | Protected Chat uses Telegram protected-content behavior and must not be described as end-to-end encrypted. | The backend still receives/processes/stores/relays content. | ACCEPTED |
| ADR-007 | Important bot flows use explicit states and deterministic update routing. | Prevents accidental forwarding and ambiguous behavior. | ACCEPTED |
| ADR-008 | Business settings should be database-backed and feature rollout should use feature flags. | Enables operational changes without unsafe code edits. | ACCEPTED |
| ADR-009 | User-facing strings should be localization-key based. | Supports Persian initially and future languages cleanly. | ACCEPTED |
| ADR-010 | Sensitive administrative actions require server-side authorization and audit. | Protects private identity, conversations, exports, location and moderation functions. | ACCEPTED |

## Pending Repository-Specific Decisions

To be populated by `TASK-0002` after the as-is architecture is known.
