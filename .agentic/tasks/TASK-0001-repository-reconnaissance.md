# TASK-0001 — Repository Reconnaissance

**Phase:** PHASE-00 — Discovery & Baseline  
**Priority:** P0  
**Initial status:** READY  
**Primary outputs:** `PROJECT_KNOWLEDGE.md`, `ARCHITECTURE.md`

## Objective

Inspect the entire repository and create a verified, compact understanding that another AI can use without re-reading the whole codebase.

## Rules

- Do not implement product features during this task.
- Do not infer technology choices from the PRD when the repository can answer the question.
- Label anything not verified as `UNKNOWN`.
- Prefer file paths, class/function names, migrations, configuration keys, commands, and tests as evidence.
- Running non-destructive setup/test/lint commands is allowed when the repository provides them.

## Work Steps

1. Map the repository tree and identify major directories.
2. Identify language versions, dependency/package files, Telegram bot library/framework, and application entrypoints.
3. Locate update/command/callback routing and current state-management implementation.
4. Locate persistence models, schemas, migrations, repositories/ORM, Redis usage, queues/workers, caches, locks, and rate limits.
5. Locate configuration/environment loading, secrets handling, deployment files, CI, Docker/systemd/process manager definitions, and operational scripts.
6. Locate tests, fixtures, test database setup, lint/type-check configuration, and documented run commands.
7. Identify existing modules for registration, profiles, anonymous links/inbox, matchmaking, chat sessions, deletion, coins/referrals, moderation, admin/archive/export, monitoring and localization.
8. Record suspicious cross-cutting risks, but do not perform the full PRD gap analysis yet.

## Required Output: `PROJECT_KNOWLEDGE.md`

Replace the initial `UNKNOWN` sections with:

- Repository summary
- Repository map with important paths
- Runtime and local-development commands
- Data/infrastructure dependencies
- Existing product modules and their key paths
- Existing conventions/patterns
- Existing tests and quality gates
- Known technical debt observed directly
- Open questions / evidence gaps

## Required Output: `ARCHITECTURE.md`

Populate **As-Is Architecture** with:

- Entrypoints and update path
- Router/state flow
- Main services/modules
- PostgreSQL/data model approach
- Redis/transient-state approach
- Workers/queues
- External integrations
- Deployment topology
- Important request/message lifecycles

## Completion Criteria

Mark this task `DONE` only when an AI can answer “what is this repository, how does it run, where are the important parts, and what already exists?” from the generated files without scanning the repository again.

## Finish Command

```bash
python projectctl.py done TASK-0001 --note "Repository map and as-is architecture verified."
```
