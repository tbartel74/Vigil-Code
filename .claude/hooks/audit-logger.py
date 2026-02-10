#!/usr/bin/env python3
"""
Audit logging hook.
Logs all tool operations to .claude/audit_logs/ in JSONL format.

Supports events: PreToolUse, PostToolUse, UserPromptSubmit, Stop
Retention: 90 days (auto-cleanup on each run)
"""

import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path


RETENTION_DAYS = 90
LOG_DIR = Path(__file__).parent.parent / "audit_logs"


def get_log_directory() -> Path:
    """Get or create the audit logs directory."""
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    return LOG_DIR


def get_iso_timestamp() -> str:
    """Get current UTC timestamp in ISO 8601 format."""
    return datetime.now(timezone.utc).isoformat()


def get_log_filename() -> str:
    """Get today's log filename."""
    return datetime.now(timezone.utc).strftime("%Y%m%d_audit.jsonl")


def parse_event_data() -> dict:
    """Parse event data from stdin."""
    try:
        return json.loads(sys.stdin.read())
    except json.JSONDecodeError:
        return {}


def rotate_old_logs(log_dir: Path) -> None:
    """Remove log files older than retention period."""
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)

    for log_file in log_dir.glob("*_audit.jsonl"):
        try:
            file_date_str = log_file.stem.split("_")[0]
            file_date = datetime.strptime(file_date_str, "%Y%m%d")
            file_date = file_date.replace(tzinfo=timezone.utc)

            if file_date < cutoff_date:
                log_file.unlink()
        except (ValueError, IndexError):
            pass


def write_audit_entry(log_dir: Path, entry: dict) -> None:
    """Write a single audit entry to the log file."""
    log_file = log_dir / get_log_filename()

    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, separators=(",", ":")) + "\n")


def sanitize_tool_input(tool_input: dict) -> dict:
    """Remove sensitive data from tool input before logging."""
    sanitized = {}

    sensitive_keys = ["password", "secret", "token", "key", "credential", "auth"]

    for key, value in tool_input.items():
        key_lower = key.lower()
        if any(s in key_lower for s in sensitive_keys):
            sanitized[key] = "[REDACTED]"
        elif isinstance(value, str) and len(value) > 1000:
            sanitized[key] = value[:500] + f"...[truncated {len(value)} chars]"
        else:
            sanitized[key] = value

    return sanitized


def main():
    event_type = os.environ.get("CLAUDE_HOOK_EVENT", "unknown")
    session_id = os.environ.get("CLAUDE_SESSION_ID", "unknown")

    event_data = parse_event_data()

    log_dir = get_log_directory()

    rotate_old_logs(log_dir)

    entry = {
        "timestamp": get_iso_timestamp(),
        "event": event_type,
        "session_id": session_id,
    }

    if event_type in ("PreToolUse", "PostToolUse"):
        entry["tool"] = event_data.get("tool_name", "unknown")
        entry["input"] = sanitize_tool_input(event_data.get("tool_input", {}))

        if event_type == "PostToolUse":
            entry["success"] = event_data.get("tool_response", {}).get("success", True)

    elif event_type == "UserPromptSubmit":
        prompt = event_data.get("prompt", "")
        if len(prompt) > 500:
            prompt = prompt[:500] + f"...[truncated {len(prompt)} chars]"
        entry["prompt_preview"] = prompt

    elif event_type == "Stop":
        entry["reason"] = event_data.get("stop_reason", "unknown")

    write_audit_entry(log_dir, entry)

    sys.exit(0)


if __name__ == "__main__":
    main()
