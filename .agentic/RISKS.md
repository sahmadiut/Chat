# Risks

## Active Risks

| ID | Severity | Risk | Why It Matters | Mitigation / Verification | Status |
|---|---|---|---|---|---|
| R-001 | Critical | Telegram identity leakage between anonymous users | Breaks the core privacy model | Separate internal/public projections; test every anonymous delivery/profile path | OPEN |
| R-002 | Critical | Reusing an old chat session for a repeat match | Corrupts history, deletion, reports, exports and moderation evidence | Enforce new session per successful match; add invariant tests | OPEN |
| R-003 | Critical | Session deletion accidentally targets messages from other sessions | Can delete unrelated history and breaks user expectations | Require exact `chat_session_id` mappings for all deletion operations | OPEN |
| R-004 | High | Telegram deletion limitations produce inconsistent user-visible results | Older messages may remain visible | Pre-delete warning, batch processing, partial result states, audit events | OPEN |
| R-005 | Critical | Match race connects one user to multiple users | Corrupts active chat state | Atomic reservation, Redis/database locking, deterministic cancel race handling | OPEN |
| R-006 | High | Coin/referral retries duplicate rewards or spends | Financial/economy integrity failure | Transactional ledger, unique constraints, idempotency keys | OPEN |
| R-007 | Critical | Forged callback/object IDs bypass ownership/admin checks | Privacy and admin compromise | Server-side identity/permission/ownership/session membership validation | OPEN |
| R-008 | High | Private content duplicated into generic logs | Expands sensitive-data exposure | Keep conversation content in controlled archive; minimize log payloads | OPEN |
| R-009 | High | Critical state exists only in process memory/Redis | Restart/failure can corrupt sessions/queues | PostgreSQL remains durable authority; fail-safe Redis recovery | OPEN |
| R-010 | High | Product wording overstates anonymity or encryption | Misleading privacy/security claims | Use PRD-approved semantics: anonymous to users; Protected Chat is not E2E | OPEN |

## Repository-Specific Risks

| ID | Severity | Observed risk | Evidence | Follow-up |
|---|---|---|---|---|
| R-011 | High | Generic `/profile` displays Telegram identity and could leak it if reused for anonymous profiles | `src/bot/features/start/start.command.ts` | Keep anonymous profile in a separate model and projection |
| R-012 | High | Incoming text/payload is copied to Pino, per-user logs and PostgreSQL | `src/bot/middlewares/logger.middleware.ts` | Define private-content logging policy before adding inbox/chat relay |
| R-013 | High | Startup forces schema push and may alter production schema without migration review | `src/database/index.ts` | Replace with controlled migrations for production |
| R-014 | Medium | No checked-in migration or backup/deployment artifacts | `drizzle.config.ts`, repository tree | Define migration, backup and recovery process |
| R-015 | High | Startup executes forced schema push, which can change a production schema without reviewed migrations | `src/database/index.ts` | Remove from production startup and establish migration baseline in TASK-0102 |
| R-016 | High | Basic admin allowlist/audit does not cover granular roles or sensitive archive reads/exports | `src/bot/filters/admin.filter.ts`, `src/bot/features/admin/admin.command.ts` | Define permissions and audit coverage in TASK-0901/0906 |
| R-017 | High | Generic messages table cannot identify both Telegram copies or the exact peer session | `src/database/schema/messages.ts`, `conversations.ts` | Add session/copy registries before relay/deletion in TASK-0501/0503 |
| R-018 | Medium | CI omits Vitest and there is no clean-database/Redis integration test harness | `.github/workflows/ci.yml`, `vitest.config.ts` | Add targeted integration/acceptance gates as product models land |
| R-019 | Medium | Queue workers run with the bot process; deployment and crash recovery are unverified | `src/queue/`, `src/main.ts` | Define worker topology and retry/idempotency policy in TASK-1003/1004 |

No task is currently blocked. Live PostgreSQL, Redis, Telegram startup, restore behavior, and deployment topology remain unverified; these are validation work for their owning implementation tasks rather than evidence that the services fail.
