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

Pending `TASK-0001` and `TASK-0002`.
