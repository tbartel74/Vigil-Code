#!/usr/bin/env python3
"""
Post Tool Use Tracker - Session File Tracking

Tracks all files edited during a session for:
- TSC check on affected repos only
- Self-check reminders based on file patterns

Input (stdin): { tool_name, tool_input: { file_path }, session_id }
Output: None (writes to session cache)
"""

from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


REPO_MAPPINGS = [
    {
        "pattern": r"^apps/api/",
        "repo": "apps/api",
        "tsc_command": "pnpm --filter @vigil-guard-enterprise/api typecheck",
    },
    {
        "pattern": r"^apps/web-ui/frontend/",
        "repo": "apps/web-ui/frontend",
        "tsc_command": "pnpm --filter @vigil-guard-enterprise/web-ui-frontend typecheck",
    },
    {
        "pattern": r"^apps/web-ui/backend/",
        "repo": "apps/web-ui/backend",
        "tsc_command": "pnpm --filter @vigil-guard-enterprise/web-ui-backend typecheck",
    },
    {
        "pattern": r"^services/detection-worker/",
        "repo": "services/detection-worker",
        "tsc_command": "pnpm --filter @vigil-guard-enterprise/detection-worker typecheck",
    },
    {
        "pattern": r"^services/semantic-worker/",
        "repo": "services/semantic-worker",
        "tsc_command": "pnpm --filter @vigil-guard-enterprise/semantic-worker typecheck",
    },
    {
        "pattern": r"^services/pii-worker/",
        "repo": "services/pii-worker",
        "tsc_command": "pnpm --filter @vigil-guard-enterprise/pii-worker typecheck",
    },
    {
        "pattern": r"^services/arbiter-worker/",
        "repo": "services/arbiter-worker",
        "tsc_command": "pnpm --filter @vigil-guard-enterprise/arbiter-worker typecheck",
    },
    {
        "pattern": r"^services/logging-worker/",
        "repo": "services/logging-worker",
        "tsc_command": "pnpm --filter @vigil-guard-enterprise/logging-worker typecheck",
    },
    {
        "pattern": r"^services/llm-guard-worker/",
        "repo": "services/llm-guard-worker",
        "tsc_command": "pnpm --filter @vigil-guard-enterprise/llm-guard-worker typecheck",
    },
    {
        "pattern": r"^packages/shared/",
        "repo": "packages/shared",
        "tsc_command": "pnpm --filter @vigil-guard-enterprise/shared typecheck",
    },
    {
        "pattern": r"^packages/nats-client/",
        "repo": "packages/nats-client",
        "tsc_command": "pnpm --filter @vigil-guard-enterprise/nats-client typecheck",
    },
    {
        "pattern": r"^packages/observability/",
        "repo": "packages/observability",
        "tsc_command": "pnpm --filter @vigil-guard-enterprise/observability typecheck",
    },
]


def get_project_root() -> Path:
    return Path(os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd()))


def get_cache_dir(session_id: str) -> Path:
    return get_project_root() / ".claude" / "tsc-cache" / session_id


def ensure_cache_dir(session_id: str) -> Path:
    cache_dir = get_cache_dir(session_id)
    cache_dir.mkdir(parents=True, exist_ok=True)
    return cache_dir


def get_relative_path(absolute_path: str) -> str:
    project_root = str(get_project_root())
    if absolute_path.startswith(project_root):
        return absolute_path[len(project_root) + 1 :]
    return absolute_path


def find_repo(relative_path: str) -> dict | None:
    for mapping in REPO_MAPPINGS:
        if re.match(mapping["pattern"], relative_path):
            return mapping
    return None


def is_typescript_file(file_path: str) -> bool:
    return (
        bool(re.search(r"\.(ts|tsx)$", file_path)) and "node_modules" not in file_path
    )


def append_to_file(file_path: Path, content: str) -> None:
    with open(file_path, "a", encoding="utf-8") as f:
        f.write(content + "\n")


def read_lines(file_path: Path) -> list[str]:
    if not file_path.exists():
        return []
    with open(file_path, "r", encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip()]


def track_file(session_id: str, file_path: str) -> None:
    cache_dir = ensure_cache_dir(session_id)
    relative_path = get_relative_path(file_path)

    if not is_typescript_file(relative_path):
        return

    timestamp = datetime.now(timezone.utc).isoformat()
    edited_files_log = cache_dir / "edited-files.log"
    affected_repos_file = cache_dir / "affected-repos.txt"
    commands_file = cache_dir / "commands.txt"

    append_to_file(edited_files_log, f"{timestamp}:{relative_path}")

    repo_mapping = find_repo(relative_path)
    if repo_mapping:
        existing_repos = read_lines(affected_repos_file)
        if repo_mapping["repo"] not in existing_repos:
            append_to_file(affected_repos_file, repo_mapping["repo"])
            append_to_file(commands_file, repo_mapping["tsc_command"])


def main() -> None:
    try:
        input_data = sys.stdin.read()
    except Exception:
        sys.exit(0)

    if not input_data.strip():
        sys.exit(0)

    try:
        data = json.loads(input_data)
    except json.JSONDecodeError:
        sys.exit(0)

    session_id = data.get("session_id", "default")
    tool_input = data.get("tool_input", {})

    if tool_input.get("file_path"):
        track_file(session_id, tool_input["file_path"])

    if tool_input.get("files"):
        for file_info in tool_input["files"]:
            if file_info.get("file_path"):
                track_file(session_id, file_info["file_path"])

    sys.exit(0)


if __name__ == "__main__":
    main()
