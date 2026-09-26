# AI Project Execution Framework

This folder converts the product PRD into an execution system that is easy for both humans and coding agents to understand.

## What to Read First

For an AI/coding agent:

1. `AI_CONTEXT.md` — compact snapshot of the project, current task, next tasks, blockers and progress.
2. `CURRENT_WORK.md` — exact current task objective, outputs, dependencies and acceptance criteria.
3. `PROJECT_CHARTER.md` — non-negotiable product/architecture rules.
4. The current task file in `tasks/` when one exists.

For a human project owner:

- `TASK_BOARD.md` — all tasks and statuses by phase.
- `phases/` — phase-level scope and milestones.
- `GAP_ANALYSIS.md` — what exists vs what the PRD requires.
- `RISKS.md` and `DECISIONS.md` — important risks and decisions.

## Source of Truth

`state/project_state.json` is the machine-readable source of truth for phase/task state.

Generated files:

- `AI_CONTEXT.md`
- `CURRENT_WORK.md`
- `TASK_BOARD.md`

Regenerate them after state changes:

```bash
python projectctl.py refresh
```

## Status Model

- `NOT_STARTED` — known work has not started.
- `READY` — dependencies are satisfied and the task can start.
- `PARTIAL` — verified implementation exists but is incomplete.
- `IN_PROGRESS` — actively being implemented.
- `BLOCKED` — cannot proceed; blocker reason is required.
- `REVIEW` — implementation is ready for validation/review.
- `DONE` — acceptance criteria are verified with evidence.
- `SKIPPED` — explicitly out of scope; reason must be documented.

## Common Commands

```bash
# Compact status
python projectctl.py status

# Show best next task(s)
python projectctl.py next

# Make a task current and active
python projectctl.py start TASK-0001

# Set an explicit state
python projectctl.py set TASK-0001 PARTIAL --note "Repository has partial profile implementation."

# Block / unblock
python projectctl.py block TASK-0001 "Missing repository credentials"
python projectctl.py unblock TASK-0001

# Finish current task; automatically selects the next eligible task as current
python projectctl.py done TASK-0001 --note "Repository knowledge and architecture documented."

# Select the best eligible task without starting it
python projectctl.py pick-next

# Validate state consistency
python projectctl.py verify
```

## Initial Two Tasks

### TASK-0001 — Repository Reconnaissance

Scans the full project and writes verified repository facts into `PROJECT_KNOWLEDGE.md` and the as-is architecture into `ARCHITECTURE.md`.

### TASK-0002 — PRD-to-Code Gap Analysis

Compares the actual repository against the PRD, writes `GAP_ANALYSIS.md`, updates risks/decisions/task states, and selects the next implementation task.

These two tasks intentionally come before feature implementation so a new AI does not guess what is already present.

## Directory Layout

```text
.
├── AGENTS.md
├── README.md
├── PROJECT_CHARTER.md
├── AI_CONTEXT.md              # generated
├── CURRENT_WORK.md             # generated
├── TASK_BOARD.md               # generated
├── PROJECT_KNOWLEDGE.md        # maintained by discovery/implementation tasks
├── ARCHITECTURE.md             # maintained as architecture changes
├── GAP_ANALYSIS.md
├── RISKS.md
├── DECISIONS.md
├── projectctl.py
├── state/
│   └── project_state.json
├── phases/
├── tasks/
├── templates/
└── references/
    └── PRODUCT_PRD.md
```

## Recommended Git Practice

Commit task state and the generated snapshot files together with the implementation change. A useful commit should make it obvious which task moved and what evidence justified the new status.
