#!/usr/bin/env python3
"""
Memory Writer Hook - Persists session learnings to permanent memory.

Runs on Stop event. Reads session learnings file and appends to permanent
learnings.json with FIFO rotation (max 100 entries).

Session learnings file (.claude/state/session-learnings.json) is populated
by Claude during the session when /remember command is used.
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

CLAUDE_PROJECT_DIR = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
MEMORY_DIR = Path(CLAUDE_PROJECT_DIR) / ".claude" / "memory"
STATE_DIR = Path(CLAUDE_PROJECT_DIR) / ".claude" / "state"

SESSION_LEARNINGS_FILE = STATE_DIR / "session-learnings.json"
LEARNINGS_FILE = MEMORY_DIR / "learnings.json"
DECISIONS_FILE = MEMORY_DIR / "decisions.json"
PREFERENCES_FILE = MEMORY_DIR / "preferences.json"

MAX_LEARNINGS = 100
MAX_DECISIONS = 50


def load_json(file_path: Path, default: dict) -> dict:
    """Load JSON file or return default if not exists/invalid."""
    if not file_path.exists():
        return default
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return default


def save_json(file_path: Path, data: dict) -> None:
    """Save data to JSON file with pretty formatting."""
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def rotate_entries(entries: list, max_count: int) -> list:
    """FIFO rotation - keep only the most recent entries."""
    if len(entries) > max_count:
        return entries[-max_count:]
    return entries


def process_session_learnings() -> dict:
    """Process session learnings and persist to permanent memory."""
    stats = {"learnings_added": 0, "decisions_added": 0, "preferences_updated": 0}

    # Check if session learnings exist
    if not SESSION_LEARNINGS_FILE.exists():
        return stats

    session_data = load_json(SESSION_LEARNINGS_FILE, {})
    session_id = session_data.get("session_id", "unknown")

    # Process learnings
    if "learnings" in session_data and session_data["learnings"]:
        learnings_data = load_json(LEARNINGS_FILE, {
            "version": "1.0",
            "description": "Cross-session learnings from workflows. FIFO rotation at max_entries.",
            "max_entries": MAX_LEARNINGS,
            "entries": []
        })

        for learning in session_data["learnings"]:
            entry = {
                "lesson": learning.get("lesson", ""),
                "context": learning.get("context", ""),
                "category": learning.get("category", "general"),
                "timestamp": learning.get("timestamp", datetime.now(timezone.utc).isoformat()),
                "session_id": session_id
            }
            learnings_data["entries"].append(entry)
            stats["learnings_added"] += 1

        # FIFO rotation
        learnings_data["entries"] = rotate_entries(
            learnings_data["entries"],
            MAX_LEARNINGS
        )
        save_json(LEARNINGS_FILE, learnings_data)

    # Process decisions
    if "decisions" in session_data and session_data["decisions"]:
        decisions_data = load_json(DECISIONS_FILE, {
            "version": "1.0",
            "description": "Key architectural and technical decisions made during sessions.",
            "max_entries": MAX_DECISIONS,
            "decisions": []
        })

        for decision in session_data["decisions"]:
            entry = {
                "decision": decision.get("decision", ""),
                "rationale": decision.get("rationale", ""),
                "alternatives": decision.get("alternatives", []),
                "timestamp": decision.get("timestamp", datetime.now(timezone.utc).isoformat()),
                "session_id": session_id
            }
            decisions_data["decisions"].append(entry)
            stats["decisions_added"] += 1

        # FIFO rotation
        decisions_data["decisions"] = rotate_entries(
            decisions_data["decisions"],
            MAX_DECISIONS
        )
        save_json(DECISIONS_FILE, decisions_data)

    # Process preferences (key-based overwrite, not append)
    if "preferences" in session_data and session_data["preferences"]:
        preferences_data = load_json(PREFERENCES_FILE, {
            "version": "1.0",
            "description": "User style preferences learned over time.",
            "preferences": {}
        })

        for key, value in session_data["preferences"].items():
            preferences_data["preferences"][key] = value
            stats["preferences_updated"] += 1

        save_json(PREFERENCES_FILE, preferences_data)

    # Clear session learnings after processing
    try:
        SESSION_LEARNINGS_FILE.unlink()
    except OSError:
        pass

    return stats


def main():
    """Main entry point for Stop hook."""
    try:
        stats = process_session_learnings()

        total = stats["learnings_added"] + stats["decisions_added"] + stats["preferences_updated"]
        if total > 0:
            parts = []
            if stats["learnings_added"]:
                parts.append(f"{stats['learnings_added']} learnings")
            if stats["decisions_added"]:
                parts.append(f"{stats['decisions_added']} decisions")
            if stats["preferences_updated"]:
                parts.append(f"{stats['preferences_updated']} preferences")
            print(f"Memory persisted: {', '.join(parts)}", file=sys.stderr)
    except Exception as e:
        # Never block Stop - just log error
        print(f"Memory writer error (non-blocking): {e}", file=sys.stderr)

    # Always exit 0 - never block session end
    sys.exit(0)


if __name__ == "__main__":
    main()
