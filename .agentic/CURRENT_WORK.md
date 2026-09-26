# Current Work

## TASK-0101 — Runtime & Project Skeleton

- **Phase:** PHASE-01
- **Status:** PARTIAL
- **Priority:** P0
- **Dependencies:** TASK-0002
- **Blocker:** None
- **Last note:** Development polling entrypoint verified with controlled external service stand-ins; 169 tests, build, typecheck, and lint pass. Live startup still requires PostgreSQL, Redis, and Telegram credentials, unavailable locally.

## Objective

Establish or validate the Telegram bot application skeleton, configuration loading, update entrypoint, and environment separation.

## Required Outputs

- `bot runtime`
- `configuration layer`
- `environment templates`

## Acceptance Criteria

- [ ] Bot starts in a development environment.
- [ ] Secrets are not committed.
- [ ] Production/staging configuration boundaries are explicit.

## Planned After This Task

- `TASK-0102` — PostgreSQL & Redis Foundations [P0]
- `TASK-0106` — Localization Foundation [P1]
- `TASK-1101` — Structured Logging [P1]

## Immediate Execution Order

1. Read the task-specific file under `tasks/` if present.
2. Verify dependencies and relevant project knowledge/architecture.
3. Perform only the scope required for this task.
4. Record evidence in the required output files.
5. Update status with `projectctl.py` and run `refresh`.
