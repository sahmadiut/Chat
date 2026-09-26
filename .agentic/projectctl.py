#!/usr/bin/env python3
"""Small stdlib-only task/status controller for the AI project framework."""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
STATE_PATH = ROOT / "state" / "project_state.json"
VALID_STATUSES = {"NOT_STARTED","READY","PARTIAL","IN_PROGRESS","BLOCKED","REVIEW","DONE","SKIPPED"}
PRIORITY_ORDER = {"P0":0,"P1":1,"P2":2,"P3":3}
PHASE_ORDER = {f"PHASE-{i:02d}": i for i in range(100)}


def load_state() -> dict:
    return json.loads(STATE_PATH.read_text(encoding="utf-8"))


def save_state(state: dict) -> None:
    state["project"]["updated_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    STATE_PATH.write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def task_map(state: dict) -> dict[str, dict]:
    return {t["id"]: t for t in state["tasks"]}


def get_task(state: dict, task_id: str) -> dict:
    tm = task_map(state)
    if task_id not in tm:
        raise SystemExit(f"Unknown task: {task_id}")
    return tm[task_id]


def dep_satisfied(task: dict, tm: dict[str, dict]) -> bool:
    return all(tm[d]["status"] in {"DONE","SKIPPED"} for d in task.get("dependencies", []))


def eligible_tasks(state: dict) -> list[dict]:
    tm = task_map(state)
    candidates = []
    for task in state["tasks"]:
        if task["status"] in {"NOT_STARTED","READY","PARTIAL"} and dep_satisfied(task, tm):
            candidates.append(task)
    return sorted(candidates, key=lambda t: (PRIORITY_ORDER.get(t["priority"],99), PHASE_ORDER.get(t["phase"],99), t["id"]))


def projected_next_tasks(state: dict, current: dict | None, limit: int = 5) -> list[dict]:
    if not current:
        return eligible_tasks(state)[:limit]
    tm = task_map(state)
    candidates = []
    for task in state["tasks"]:
        if task["id"] == current["id"] or task["status"] in {"DONE", "SKIPPED", "BLOCKED", "IN_PROGRESS", "REVIEW"}:
            continue
        deps_ok = all((d == current["id"]) or tm[d]["status"] in {"DONE", "SKIPPED"} for d in task.get("dependencies", []))
        if deps_ok:
            candidates.append(task)
    return sorted(candidates, key=lambda t: (PRIORITY_ORDER.get(t["priority"],99), PHASE_ORDER.get(t["phase"],99), t["id"]))[:limit]


def phase_progress(state: dict, phase_id: str) -> tuple[int,int,int]:
    pts=[t for t in state["tasks"] if t["phase"]==phase_id]
    done=sum(t["status"] in {"DONE","SKIPPED"} for t in pts)
    active=sum(t["status"] in {"IN_PROGRESS","PARTIAL","REVIEW","BLOCKED"} for t in pts)
    return done, active, len(pts)


def current_task(state: dict) -> dict | None:
    cid=state["project"].get("current_task_id")
    return get_task(state,cid) if cid else None


def refresh_ready_states(state: dict) -> None:
    tm=task_map(state)
    for task in state["tasks"]:
        if task["status"] == "NOT_STARTED" and dep_satisfied(task, tm):
            task["status"] = "READY"
        elif task["status"] == "READY" and not dep_satisfied(task, tm):
            task["status"] = "NOT_STARTED"


def generate_task_board(state: dict) -> str:
    lines=["# Task Board","",f"**Updated:** {state['project'].get('updated_at','unknown')}",""]
    for phase in state["phases"]:
        pid=phase["id"]
        done,active,total=phase_progress(state,pid)
        lines += [f"## {pid} — {phase['name']}","",f"Progress: **{done}/{total} complete**, {active} active/partial/review/blocked.","", "| Task | Status | Priority | Title | Dependencies |", "|---|---|---|---|---|"]
        for t in [x for x in state["tasks"] if x["phase"]==pid]:
            deps=", ".join(t["dependencies"]) if t["dependencies"] else "—"
            cur=" ← CURRENT" if state["project"].get("current_task_id")==t["id"] else ""
            lines.append(f"| `{t['id']}` | **{t['status']}**{cur} | {t['priority']} | {t['title']} | {deps} |")
        lines.append("")
    return "\n".join(lines)+"\n"


def generate_current_work(state: dict) -> str:
    task=current_task(state)
    if not task:
        elig=eligible_tasks(state)
        next_id=elig[0]["id"] if elig else "None"
        return f"# Current Work\n\nNo current task is selected.\n\nRecommended next task: `{next_id}`.\n"
    deps=", ".join(task["dependencies"]) if task["dependencies"] else "None"
    outputs="\n".join(f"- `{x}`" for x in task["outputs"])
    acc="\n".join(f"- [ ] {x}" for x in task["acceptance"])
    blocker=task.get("blocker") or "None"
    note=task.get("last_note") or "None"
    projected=projected_next_tasks(state, task, 3)
    after="\n".join(f"- `{x['id']}` — {x['title']} [{x['priority']}]" for x in projected) or "- None identified yet."
    return f"""# Current Work

## {task['id']} — {task['title']}

- **Phase:** {task['phase']}
- **Status:** {task['status']}
- **Priority:** {task['priority']}
- **Dependencies:** {deps}
- **Blocker:** {blocker}
- **Last note:** {note}

## Objective

{task['objective']}

## Required Outputs

{outputs}

## Acceptance Criteria

{acc}

## Planned After This Task

{after}

## Immediate Execution Order

1. Read the task-specific file under `tasks/` if present.
2. Verify dependencies and relevant project knowledge/architecture.
3. Perform only the scope required for this task.
4. Record evidence in the required output files.
5. Update status with `projectctl.py` and run `refresh`.
"""


def generate_ai_context(state: dict) -> str:
    task=current_task(state)
    elig=eligible_tasks(state)[:5]
    blocked=[t for t in state["tasks"] if t["status"]=="BLOCKED"]
    overall_done=sum(t["status"] in {"DONE","SKIPPED"} for t in state["tasks"])
    total=len(state["tasks"])
    lines=[
        "# AI Context — Project Snapshot","",
        "> Read this file first. It is generated from `state/project_state.json` by `projectctl.py`.","",
        "## Project at a Glance","",
        f"- **Product:** {state['project']['name']}",
        "- **Platform:** Telegram Bot only",
        "- **Core product:** Personal anonymous inbox + anonymous matchmaking chat",
        f"- **Task progress:** {overall_done}/{total} complete/skipped",
        f"- **Current task:** `{task['id']}` — {task['title']} ({task['status']})" if task else "- **Current task:** None",
        "",
        "## Non-Negotiable Rules","",
        "1. Never expose Telegram identity through anonymous user surfaces.",
        "2. Keep Telegram identity and custom matchmaking profile separate.",
        "3. Every successful match creates a new Chat Session; never reopen an ended session.",
        "4. Every live-chat message belongs to exactly one session.",
        "5. Map both Telegram copies of relayed messages for later exact deletion attempts.",
        "6. Full chat deletion targets one exact session only.",
        "7. Telegram-visible deletion does not erase the internal administrative archive.",
        "8. Protected Chat is Telegram content protection, not end-to-end encryption.",
        "9. Exact GPS is private by default and voluntary to collect.",
        "10. Critical matches/rewards/spends/retries are concurrency-safe and idempotent.",
        "11. Admin actions require server-side permission checks; sensitive actions are audited.",
        "",
        "## Current Work",""
    ]
    if task:
        lines += [f"**{task['id']} — {task['title']}**", "", task["objective"], "", "Required outputs:"]
        lines += [f"- `{x}`" for x in task["outputs"]]
        if task.get("blocker"):
            lines += ["", f"**Blocker:** {task['blocker']}"]
    else:
        lines += ["No task selected. Run `python projectctl.py pick-next`."]
    lines += ["", "## Next Eligible Tasks", ""]
    if elig:
        for x in elig:
            current_marker=" (current)" if task and x["id"]==task["id"] else ""
            lines.append(f"- `{x['id']}` — {x['title']} [{x['status']}, {x['priority']}]{current_marker}")
    else:
        lines.append("- None while the current task is active.")
    projected=projected_next_tasks(state, task, 5)
    lines += ["", "## Planned After Current Task", ""]
    if projected:
        for x in projected:
            lines.append(f"- `{x['id']}` — {x['title']} [{x['priority']}]")
    else:
        lines.append("- None identified yet.")
    lines += ["", "## Phase Progress", "", "| Phase | Done | Active/Partial/Review/Blocked | Total |", "|---|---:|---:|---:|"]
    for p in state["phases"]:
        d,a,n=phase_progress(state,p["id"])
        lines.append(f"| {p['id']} — {p['name']} | {d} | {a} | {n} |")
    lines += ["", "## Active Blockers", ""]
    if blocked:
        for b in blocked:
            lines.append(f"- `{b['id']}` — {b.get('blocker') or 'Blocker reason missing'}")
    else:
        lines.append("- None recorded.")
    lines += ["", "## Files to Read", "",
        "1. `CURRENT_WORK.md` — exact task detail.",
        "2. `PROJECT_CHARTER.md` — hard invariants.",
        "3. `PROJECT_KNOWLEDGE.md` — verified repository facts.",
        "4. `ARCHITECTURE.md` — as-is and target architecture.",
        "5. Current task file under `tasks/` when available.",
        "6. Relevant phase file under `phases/`.",
        "7. `references/PRODUCT_PRD.md` only when task scope needs source detail.",
        "",
        "## State Update Protocol", "",
        "- Start: `python projectctl.py start TASK-ID`",
        "- Mark partial: `python projectctl.py set TASK-ID PARTIAL --note \"...\"`",
        "- Block: `python projectctl.py block TASK-ID \"reason\"`",
        "- Complete: `python projectctl.py done TASK-ID --note \"evidence summary\"`",
        "- Regenerate snapshot: `python projectctl.py refresh`",
    ]
    return "\n".join(lines)+"\n"


def refresh_files(state: dict) -> None:
    refresh_ready_states(state)
    save_state(state)
    (ROOT/"TASK_BOARD.md").write_text(generate_task_board(state), encoding="utf-8")
    (ROOT/"CURRENT_WORK.md").write_text(generate_current_work(state), encoding="utf-8")
    (ROOT/"AI_CONTEXT.md").write_text(generate_ai_context(state), encoding="utf-8")


def verify(state: dict) -> list[str]:
    errors=[]
    ids=[t["id"] for t in state["tasks"]]
    if len(ids)!=len(set(ids)):
        errors.append("Duplicate task IDs exist.")
    tm=task_map(state)
    phase_ids={p["id"] for p in state["phases"]}
    for t in state["tasks"]:
        if t["status"] not in VALID_STATUSES:
            errors.append(f"{t['id']}: invalid status {t['status']}")
        if t["phase"] not in phase_ids:
            errors.append(f"{t['id']}: unknown phase {t['phase']}")
        for d in t.get("dependencies",[]):
            if d not in tm:
                errors.append(f"{t['id']}: missing dependency {d}")
        if t["status"] in {"READY", "IN_PROGRESS", "REVIEW", "DONE"} and any(
            d in tm and tm[d]["status"] not in {"DONE", "SKIPPED"} for d in t.get("dependencies", [])
        ):
            errors.append(f"{t['id']}: {t['status']} with unsatisfied dependencies")
        if t["status"]=="BLOCKED" and not t.get("blocker"):
            errors.append(f"{t['id']}: BLOCKED requires blocker reason")
        if t["status"]=="SKIPPED" and not t.get("last_note"):
            errors.append(f"{t['id']}: SKIPPED requires a documented reason")
    cid=state["project"].get("current_task_id")
    if cid and cid not in tm:
        errors.append(f"Current task {cid} does not exist")
    elif cid and tm[cid]["status"] in {"DONE", "SKIPPED"}:
        errors.append(f"Current task {cid} is already complete")
    in_progress=[t["id"] for t in state["tasks"] if t["status"]=="IN_PROGRESS"]
    if len(in_progress)>1:
        errors.append("More than one IN_PROGRESS task: "+", ".join(in_progress))
    if cid and in_progress and cid not in in_progress:
        errors.append(f"Current task is {cid}, but IN_PROGRESS task is {in_progress[0]}")
    if in_progress and not cid:
        errors.append(f"IN_PROGRESS task {in_progress[0]} is not current")
    return errors


def cmd_status(state: dict) -> None:
    t=current_task(state)
    done=sum(x["status"] in {"DONE","SKIPPED"} for x in state["tasks"])
    print(f"Project: {state['project']['name']}")
    print(f"Progress: {done}/{len(state['tasks'])} complete/skipped")
    if t:
        print(f"Current: {t['id']} | {t['status']} | {t['priority']} | {t['title']}")
        if t.get("blocker"):
            print(f"Blocker: {t['blocker']}")
    else:
        print("Current: none")
    nxt=eligible_tasks(state)[:3]
    print("Next eligible:")
    for x in nxt:
        print(f"  {x['id']} | {x['status']} | {x['priority']} | {x['title']}")


def cmd_next(state: dict) -> None:
    for x in eligible_tasks(state)[:10]:
        deps=", ".join(x["dependencies"]) if x["dependencies"] else "none"
        print(f"{x['id']} | {x['status']} | {x['priority']} | {x['phase']} | {x['title']} | deps: {deps}")


def pick_next(state: dict) -> dict | None:
    candidates=eligible_tasks(state)
    if not candidates:
        state["project"]["current_task_id"] = None
        return None
    chosen=candidates[0]
    state["project"]["current_task_id"] = chosen["id"]
    if chosen["status"]=="NOT_STARTED":
        chosen["status"]="READY"
    return chosen


def main() -> int:
    parser=argparse.ArgumentParser(description="Manage project task state and generated AI context.")
    sub=parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("status")
    sub.add_parser("next")
    sub.add_parser("refresh")
    sub.add_parser("verify")
    sub.add_parser("pick-next")

    p=sub.add_parser("start"); p.add_argument("task_id"); p.add_argument("--note",default="")
    p=sub.add_parser("set"); p.add_argument("task_id"); p.add_argument("status"); p.add_argument("--note",default="")
    p=sub.add_parser("done"); p.add_argument("task_id"); p.add_argument("--note",default="")
    p=sub.add_parser("block"); p.add_argument("task_id"); p.add_argument("reason")
    p=sub.add_parser("unblock"); p.add_argument("task_id"); p.add_argument("--note",default="")
    p=sub.add_parser("note"); p.add_argument("task_id"); p.add_argument("text")

    args=parser.parse_args()
    state=load_state()

    # Refuse to operate on inconsistent state instead of writing more corruption.
    if args.cmd != "verify":
        errors=verify(state)
        if errors:
            raise SystemExit("State errors:\n - " + "\n - ".join(errors))

    if args.cmd=="status":
        cmd_status(state); return 0
    if args.cmd=="next":
        cmd_next(state); return 0
    if args.cmd=="verify":
        errors=verify(state)
        if errors:
            print("State errors:")
            for e in errors: print(" -",e)
            return 1
        print("State is valid."); return 0
    if args.cmd=="refresh":
        refresh_files(state); print("Generated AI_CONTEXT.md, CURRENT_WORK.md and TASK_BOARD.md"); return 0
    if args.cmd=="pick-next":
        if any(t["status"]=="IN_PROGRESS" for t in state["tasks"]):
            raise SystemExit("Finish or pause the IN_PROGRESS task before picking another.")
        chosen=pick_next(state); refresh_files(state)
        print(f"Current task: {chosen['id']} — {chosen['title']}" if chosen else "No eligible task remains.")
        return 0

    task=get_task(state,args.task_id)
    tm=task_map(state)

    if args.cmd=="start":
        if task["status"] in {"DONE", "SKIPPED"}:
            raise SystemExit(f"Cannot start a {task['status']} task: {task['id']}")
        if not dep_satisfied(task,tm):
            missing=[d for d in task["dependencies"] if tm[d]["status"] not in {"DONE","SKIPPED"}]
            raise SystemExit("Unsatisfied dependencies: "+", ".join(missing))
        other=[x for x in state["tasks"] if x["status"]=="IN_PROGRESS" and x["id"]!=task["id"]]
        if other:
            raise SystemExit(f"Another task is already IN_PROGRESS: {other[0]['id']}")
        task["status"]="IN_PROGRESS"; task["blocker"]=""
        if args.note: task["last_note"]=args.note
        state["project"]["current_task_id"]=task["id"]
    elif args.cmd=="set":
        status=args.status.upper()
        if status not in VALID_STATUSES:
            raise SystemExit("Invalid status. Choose: "+", ".join(sorted(VALID_STATUSES)))
        if status=="BLOCKED" and not task.get("blocker"):
            raise SystemExit("Use the block command so a blocker reason is recorded.")
        if status=="SKIPPED" and not args.note:
            raise SystemExit("SKIPPED requires --note with the reason.")
        if status=="DONE":
            raise SystemExit("Use the done command to complete a task with evidence.")
        if status=="IN_PROGRESS" and not dep_satisfied(task,tm):
            raise SystemExit(f"Unsatisfied dependencies: {task['id']}")
        task["status"]=status
        if args.note: task["last_note"]=args.note
        if status=="IN_PROGRESS": state["project"]["current_task_id"]=task["id"]
    elif args.cmd=="done":
        if state["project"].get("current_task_id") != task["id"] or task["status"] not in {"IN_PROGRESS", "REVIEW"}:
            raise SystemExit("Only the current IN_PROGRESS or REVIEW task can be completed.")
        if not args.note.strip():
            raise SystemExit("Completion requires --note with acceptance evidence.")
        task["status"]="DONE"; task["blocker"]=""
        if args.note: task["last_note"]=args.note
        if state["project"].get("current_task_id")==task["id"]:
            state["project"]["current_task_id"]=None
        refresh_ready_states(state)
        pick_next(state)
    elif args.cmd=="block":
        if not args.reason.strip():
            raise SystemExit("A concrete blocker reason is required.")
        task["status"]="BLOCKED"; task["blocker"]=args.reason; task["last_note"]=args.reason
        state["project"]["current_task_id"]=task["id"]
    elif args.cmd=="unblock":
        task["blocker"]=""
        task["status"]="READY" if dep_satisfied(task,tm) else "NOT_STARTED"
        if args.note: task["last_note"]=args.note
    elif args.cmd=="note":
        task["last_note"]=args.text

    errors=verify(state)
    if errors:
        raise SystemExit("State errors:\n - " + "\n - ".join(errors))
    refresh_files(state)
    print(f"{task['id']} -> {task['status']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
