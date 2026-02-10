#!/usr/bin/env python3
"""
Remember Handler - Writes learnings/decisions/preferences to session storage.

Called by Claude when user invokes /remember command.
At session end, memory-writer.py persists these to permanent memory.

Usage:
    python3 remember-handler.py learning "Always use parameterized queries"
    python3 remember-handler.py learning "Always use parameterized queries" --context "Discovered during database work"
    python3 remember-handler.py learning "Always use parameterized queries" --category security
    python3 remember-handler.py decision "Use request-reply for service calls" --rationale "Lower latency than HTTP"
    python3 remember-handler.py preference commit_style "conventional"
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

CLAUDE_PROJECT_DIR = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
STATE_DIR = Path(CLAUDE_PROJECT_DIR) / ".claude" / "state"
SESSION_FILE = STATE_DIR / "session-learnings.json"


def load_session_data() -> dict:
    """Load current session learnings or create empty structure."""
    STATE_DIR.mkdir(parents=True, exist_ok=True)

    if SESSION_FILE.exists():
        try:
            with open(SESSION_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass

    # Get session ID from session-context.json if available
    session_id = "unknown"
    context_file = STATE_DIR / "session-context.json"
    if context_file.exists():
        try:
            with open(context_file, "r", encoding="utf-8") as f:
                ctx = json.load(f)
                session_id = ctx.get("session_id", "unknown")
        except (json.JSONDecodeError, IOError):
            pass

    return {
        "session_id": session_id,
        "learnings": [],
        "decisions": [],
        "preferences": {},
    }


def save_session_data(data: dict) -> None:
    """Save session learnings to file."""
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    with open(SESSION_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def add_learning(content: str, context: str = "", category: str = "general") -> str:
    """Add a learning to session storage."""
    data = load_session_data()

    entry = {
        "lesson": content,
        "context": context,
        "category": category,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    data["learnings"].append(entry)
    save_session_data(data)

    return f"✓ Learning saved [{category}]: {content[:60]}{'...' if len(content) > 60 else ''}"


def add_decision(content: str, rationale: str = "", alternatives: list = None) -> str:
    """Add a decision to session storage."""
    data = load_session_data()

    entry = {
        "decision": content,
        "rationale": rationale,
        "alternatives": alternatives or [],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    data["decisions"].append(entry)
    save_session_data(data)

    return f"✓ Decision saved: {content[:60]}{'...' if len(content) > 60 else ''}"


def add_preference(key: str, value: str) -> str:
    """Add or update a preference."""
    data = load_session_data()

    data["preferences"][key] = value
    save_session_data(data)

    return f"✓ Preference saved: {key} = {value}"


def main():
    parser = argparse.ArgumentParser(description="Remember Handler")
    parser.add_argument(
        "type",
        choices=["learning", "decision", "preference"],
        help="Type of memory to save",
    )
    parser.add_argument("content", help="Content to remember (or key for preference)")
    parser.add_argument("value", nargs="?", help="Value for preference type")
    parser.add_argument(
        "--context", "-c", default="", help="Additional context for learning"
    )
    parser.add_argument(
        "--category",
        "-g",
        default="general",
        help="Category for learning (e.g., security, performance, architecture)",
    )
    parser.add_argument("--rationale", "-r", default="", help="Rationale for decision")
    parser.add_argument(
        "--alternatives",
        "-a",
        nargs="*",
        default=[],
        help="Alternatives considered for decision",
    )

    args = parser.parse_args()

    if args.type == "learning":
        result = add_learning(args.content, args.context, args.category)
    elif args.type == "decision":
        result = add_decision(args.content, args.rationale, args.alternatives)
    elif args.type == "preference":
        if not args.value:
            print("Error: preference requires both key and value", file=sys.stderr)
            sys.exit(1)
        result = add_preference(args.content, args.value)
    else:
        print(f"Error: unknown type {args.type}", file=sys.stderr)
        sys.exit(1)

    print(result)


if __name__ == "__main__":
    main()
