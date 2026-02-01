#!/usr/bin/env python3
"""
PreToolUse hook for Vigil Guard Enterprise.
Blocks destructive commands and protects sensitive files.

Exit codes:
  0 - Allow operation
  2 - Block operation (with message to stderr)
"""

import json
import re
import sys
from pathlib import Path


DANGEROUS_BASH_PATTERNS = [
    r'rm\s+-rf\s+/',
    r'rm\s+-rf\s+\*',
    r'rm\s+-rf\s+~',
    r'rm\s+-rf\s+\$HOME',
    r'rm\s+-rf\s+\$\{HOME\}',
    r'rm\s+--no-preserve-root',
    r'dd\s+.*of=/dev/',
    r'mkfs\.',
    r':\(\)\s*\{\s*:\|:&\s*\};:',
    r'>\s*/dev/sd[a-z]',
    r'chmod\s+-R\s+777\s+/',
    r'chown\s+-R\s+.*\s+/',
    r'DROP\s+DATABASE',
    r'DROP\s+TABLE',
    r'TRUNCATE\s+TABLE',
    r'DELETE\s+FROM\s+\w+\s*;?\s*$',
    r'docker\s+system\s+prune\s+-a?f',
    r'docker\s+volume\s+prune\s+-f',
    r'kubectl\s+delete\s+namespace',
    r'kubectl\s+delete\s+--all',
    r'helm\s+uninstall\s+--all',
    r'git\s+push\s+.*--force.*main',
    r'git\s+push\s+.*--force.*master',
    r'git\s+reset\s+--hard\s+HEAD~',
]

PROTECTED_FILE_PATTERNS = [
    r'\.env$',
    r'\.env\.(?!example)',  # Allow .env.example but block .env.local, .env.production, etc.
    r'\.env\.local',
    r'\.env\.production',
    r'\.env\.development',
    r'id_rsa',
    r'id_ed25519',
    r'id_dsa',
    r'\.pem$',
    r'\.key$',
    r'credentials\.json',
    r'secrets\.yaml',
    r'secrets\.json',
    r'\.aws/credentials',
    r'\.kube/config',
    r'JWT_SECRET',
    r'API_KEY_SALT',
    r'CLICKHOUSE_PASSWORD',
]

PROTECTED_PATHS = [
    'infra/secrets/',
    '.claude/audit_logs/',
    '~/.ssh/',
    '~/.aws/',
    '~/.kube/',
]


def is_dangerous_bash_command(command: str) -> tuple[bool, str]:
    """Check if bash command matches dangerous patterns."""
    command_lower = command.lower()

    for pattern in DANGEROUS_BASH_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            return True, f"Blocked dangerous command pattern: {pattern}"

    return False, ""


def is_protected_file(file_path: str) -> tuple[bool, str]:
    """Check if file path matches protected patterns."""
    for pattern in PROTECTED_FILE_PATTERNS:
        if re.search(pattern, file_path, re.IGNORECASE):
            return True, f"Blocked access to protected file: {file_path}"

    for protected_path in PROTECTED_PATHS:
        if protected_path in file_path:
            return True, f"Blocked access to protected path: {protected_path}"

    return False, ""


def validate_tool_use(tool_name: str, tool_input: dict) -> tuple[bool, str]:
    """Validate tool use and return (is_blocked, message)."""

    if tool_name == "Bash":
        command = tool_input.get("command", "")
        return is_dangerous_bash_command(command)

    elif tool_name in ("Write", "Edit"):
        file_path = tool_input.get("file_path", "")
        return is_protected_file(file_path)

    elif tool_name == "Read":
        file_path = tool_input.get("file_path", "")
        for sensitive in ['.env', 'id_rsa', 'id_ed25519', '.pem', 'credentials']:
            if sensitive in file_path.lower():
                pass

    return False, ""


def main():
    try:
        input_data = json.loads(sys.stdin.read())
    except json.JSONDecodeError:
        sys.exit(0)

    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})

    is_blocked, message = validate_tool_use(tool_name, tool_input)

    if is_blocked:
        print(json.dumps({
            "decision": "block",
            "reason": message
        }))
        sys.exit(2)

    sys.exit(0)


if __name__ == "__main__":
    main()
