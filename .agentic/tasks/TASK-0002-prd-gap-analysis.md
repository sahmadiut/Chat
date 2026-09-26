# TASK-0002 — PRD-to-Code Gap Analysis

**Phase:** PHASE-00 — Discovery & Baseline  
**Priority:** P0  
**Dependency:** TASK-0001  
**Primary outputs:** `GAP_ANALYSIS.md`, `RISKS.md`, `DECISIONS.md`, `state/project_state.json`

## Objective

Compare the verified as-is repository against `references/PRODUCT_PRD.md`, identify what is implemented/partial/missing/unknown, and convert the result into the next executable implementation task.

## Rules

- Read `PROJECT_KNOWLEDGE.md` and `ARCHITECTURE.md` first.
- Use repository evidence for implementation claims.
- Do not mark a task `DONE` just because similarly named code exists; verify its acceptance criteria.
- Use `PARTIAL` when meaningful implementation exists but acceptance criteria are incomplete.
- Preserve current architecture facts even if the PRD recommends a different target; record the gap instead.

## Work Steps

1. Review the PRD and the framework phase/task definitions.
2. For every phase, classify repository coverage as Implemented, Partial, Missing, or Unknown.
3. Explicitly test/review the critical invariants in `PROJECT_CHARTER.md`.
4. Update `GAP_ANALYSIS.md` with evidence paths and the most important gaps.
5. Update `RISKS.md` with repository-specific privacy, correctness, concurrency, retention, security, and operational risks.
6. Update `DECISIONS.md` with unresolved architectural choices that need a deliberate decision.
7. Update task statuses in `state/project_state.json` only where evidence supports the change.
8. Select the highest-priority unblocked task as the new current task.
9. Run `python projectctl.py refresh` and confirm `AI_CONTEXT.md` / `CURRENT_WORK.md` match the new state.

## Critical Checks

At minimum, verify whether the code currently enforces:

- Telegram identity vs custom profile separation
- No matchmaking profile in Anonymous Link Mode
- New session for every successful match
- No reopening ended sessions
- One session per live-chat message
- Sender/recipient Telegram message-ID mapping
- Exact-session deletion scope
- Internal archive retention after Telegram deletion
- Match concurrency safety
- Coin/referral idempotency
- Server-side admin authorization
- Sensitive admin audit logging

## Completion Criteria

Mark this task `DONE` only when the framework reflects the actual repository state and the next implementation task is unambiguous.
