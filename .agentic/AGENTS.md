# AGENTS.md

## Purpose

This repository uses an explicit project-execution framework so an AI can understand the project state quickly and continue from the correct next action.

## Mandatory Startup Sequence

1. Read `AI_CONTEXT.md`.
2. Read `CURRENT_WORK.md`.
3. Read `PROJECT_CHARTER.md` for non-negotiable rules.
4. Read the current task file if one exists under `tasks/`.
5. Read only the phase/knowledge/architecture files referenced by the current task unless broader inspection is required by that task.
6. Run `python projectctl.py status` before changing task state.

For a fresh/unreviewed repository, the first task is `TASK-0001 — Repository Reconnaissance`.

## Execution Protocol

- Work on one current task at a time unless the task explicitly requires parallel independent work.
- Do not silently expand scope into later phases.
- Use `PARTIAL` for verified incomplete existing implementations.
- Use `BLOCKED` only with a concrete blocker reason.
- Mark `DONE` only when acceptance criteria have evidence.
- Update knowledge/architecture/risk/decision files whenever the task changes the facts they describe.
- After status changes, run `python projectctl.py refresh`.

## State Commands

```bash
python projectctl.py status
python projectctl.py next
python projectctl.py start TASK-0101
python projectctl.py set TASK-0101 PARTIAL --note "Existing models found; routing missing."
python projectctl.py block TASK-0101 "Database credentials unavailable"
python projectctl.py done TASK-0101 --note "Validated with tests X/Y/Z."
python projectctl.py pick-next
python projectctl.py refresh
python projectctl.py verify
```

## Core Invariants

Never violate these while implementing:

- Never expose Telegram identity to anonymous users.
- Keep Telegram identity separate from the custom matchmaking profile.
- Every match creates a new Chat Session; never reopen an ended session.
- Every live-chat message belongs to one exact session.
- Telegram message mappings must support exact two-sided deletion attempts.
- Session deletion never targets other sessions between the same users.
- Telegram deletion does not erase the internal administrative archive.
- Protected Chat is not end-to-end encryption.
- Exact GPS is private by default.
- Critical state transitions, rewards, spends, and matches are concurrency-safe/idempotent.
- Admin operations are server-side authorized and sensitive actions are audited.
