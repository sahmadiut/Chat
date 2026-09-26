"""Regression checks for task-state transitions; never edits project state."""

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent


class ProjectCtlTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        shutil.copy(ROOT / "projectctl.py", self.root / "projectctl.py")
        (self.root / "state").mkdir()
        shutil.copy(ROOT / "state" / "project_state.json", self.root / "state" / "project_state.json")
        # Keep the fixture stable as the real project advances through tasks.
        state = self.state()
        state["project"]["current_task_id"] = "TASK-0001"
        for task in state["tasks"]:
            task["status"] = "IN_PROGRESS" if task["id"] == "TASK-0001" else "NOT_STARTED"
            task["blocker"] = ""
        (self.root / "state" / "project_state.json").write_text(
            json.dumps(state, ensure_ascii=False), encoding="utf-8"
        )

    def run_cli(self, *args):
        return subprocess.run(
            [sys.executable, str(self.root / "projectctl.py"), *args],
            cwd=self.root, capture_output=True, text=True, check=False,
        )

    def state(self):
        return json.loads((self.root / "state" / "project_state.json").read_text(encoding="utf-8"))

    def test_initial_state_and_snapshots(self):
        self.assertEqual(self.run_cli("verify").returncode, 0)
        self.assertEqual(self.run_cli("refresh").returncode, 0)
        self.assertIn("TASK-0001", (self.root / "AI_CONTEXT.md").read_text(encoding="utf-8"))
        self.assertIn("TASK-0001", (self.root / "CURRENT_WORK.md").read_text(encoding="utf-8"))
        self.assertIn("TASK-0002", (self.root / "TASK_BOARD.md").read_text(encoding="utf-8"))

    def test_cannot_finish_task_without_prerequisite(self):
        before = self.state()
        self.assertNotEqual(self.run_cli("done", "TASK-0002", "--note", "evidence").returncode, 0)
        self.assertEqual(self.state(), before)
        self.assertEqual(self.run_cli("verify").returncode, 0)

    def test_cannot_pick_next_during_active_work(self):
        before = self.state()
        self.assertNotEqual(self.run_cli("pick-next").returncode, 0)
        self.assertEqual(self.state(), before)

    def test_completion_requires_evidence_and_advances(self):
        self.assertNotEqual(self.run_cli("done", "TASK-0001").returncode, 0)
        self.assertEqual(self.run_cli("done", "TASK-0001", "--note", "Acceptance evidence checked.").returncode, 0)
        state = self.state()
        self.assertEqual(state["project"]["current_task_id"], "TASK-0002")
        self.assertEqual(self.run_cli("verify").returncode, 0)
        self.assertEqual(self.run_cli("start", "TASK-0002").returncode, 0)
        self.assertEqual(self.run_cli("verify").returncode, 0)

    def test_set_cannot_create_second_active_task(self):
        before = self.state()
        self.assertNotEqual(self.run_cli("set", "TASK-0002", "IN_PROGRESS").returncode, 0)
        self.assertEqual(self.state(), before)


if __name__ == "__main__":
    unittest.main()
