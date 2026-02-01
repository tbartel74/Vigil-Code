#!/usr/bin/env python3
"""
Self-Check Reminder - Error Handling Analysis

Analyzes edited files for patterns that require extra attention:
- try/catch blocks without proper error handling
- async/await without error handling
- Database queries without parameterization
- Missing Sentry integration

Input (stdin): { session_id }
Output (stdout): Reminder message if risky patterns detected
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path
from typing import NamedTuple


class RiskPattern(NamedTuple):
    name: str
    pattern: str
    reminder: str
    severity: str


RISK_PATTERNS: list[RiskPattern] = [
    RiskPattern(
        name="empty-catch",
        pattern=r"catch\s*\([^)]*\)\s*\{\s*\}",
        reminder="Empty catch blocks found - add proper error handling or logging",
        severity="high",
    ),
    RiskPattern(
        name="catch-without-sentry",
        pattern=r"catch\s*\([^)]*\)\s*\{[^}]*(?!Sentry\.captureException)[^}]*\}",
        reminder="Catch blocks without Sentry - consider adding captureException",
        severity="medium",
    ),
    RiskPattern(
        name="raw-sql",
        pattern=r"`SELECT.*\$\{|`INSERT.*\$\{|`UPDATE.*\$\{|`DELETE.*\$\{",
        reminder="Template literal SQL detected - use parameterized queries",
        severity="high",
    ),
    RiskPattern(
        name="console-error-only",
        pattern=r"console\.error\([^)]+\)(?!\s*throw)",
        reminder="console.error without throw - errors may be silently swallowed",
        severity="medium",
    ),
    RiskPattern(
        name="async-without-try",
        pattern=r"async\s+\w+\s*\([^)]*\)\s*(?::\s*Promise<[^>]+>)?\s*\{(?![^}]*try\s*\{)",
        reminder="Async function without try/catch - consider error handling",
        severity="low",
    ),
    RiskPattern(
        name="password-in-code",
        pattern=r"password\s*[:=]\s*['\"][^'\"]+['\"]",
        reminder="Hardcoded password detected - use environment variables",
        severity="high",
    ),
    RiskPattern(
        name="api-key-in-code",
        pattern=r"api[_-]?key\s*[:=]\s*['\"][^'\"]+['\"]",
        reminder="Hardcoded API key detected - use environment variables",
        severity="high",
    ),
]


def get_project_root() -> Path:
    return Path(os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd()))


def get_cache_dir(session_id: str) -> Path:
    return get_project_root() / ".claude" / "tsc-cache" / session_id


def get_edited_files(session_id: str) -> list[str]:
    cache_dir = get_cache_dir(session_id)
    log_file = cache_dir / "edited-files.log"

    if not log_file.exists():
        return []

    files: set[str] = set()
    with open(log_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split(":", 1)
            if len(parts) >= 2:
                file_path = parts[1]
                if ":" in file_path:
                    file_path = ":".join(line.split(":")[1:])
                files.add(file_path)

    return list(files)


class Finding(NamedTuple):
    pattern: RiskPattern
    line: int


def analyze_file(file_path: str) -> list[Finding]:
    project_root = get_project_root()
    absolute_path = project_root / file_path

    if not absolute_path.exists():
        return []

    try:
        content = absolute_path.read_text(encoding="utf-8")
    except Exception:
        return []

    lines = content.split("\n")
    findings: list[Finding] = []

    for pattern in RISK_PATTERNS:
        regex = re.compile(
            pattern.pattern, re.IGNORECASE if "sql" in pattern.name else 0
        )
        for i, line in enumerate(lines):
            if regex.search(line):
                findings.append(Finding(pattern=pattern, line=i + 1))

    return findings


def format_output(findings: dict[str, list[Finding]]) -> str:
    high_severity: list[str] = []
    medium_severity: list[str] = []

    for file, file_findings in findings.items():
        for finding in file_findings:
            msg = f"  * {file}:{finding.line} - {finding.pattern.reminder}"
            if finding.pattern.severity == "high":
                high_severity.append(msg)
            elif finding.pattern.severity == "medium":
                medium_severity.append(msg)

    if not high_severity and not medium_severity:
        return ""

    lines: list[str] = [
        "",
        "=" * 50,
        "SELF-CHECK REMINDER",
        "=" * 50,
        "",
    ]

    if high_severity:
        lines.append("HIGH PRIORITY:")
        lines.extend(high_severity)
        lines.append("")

    if medium_severity:
        lines.append("MEDIUM PRIORITY:")
        lines.extend(medium_severity)
        lines.append("")

    lines.append("ACTION: Review these patterns before completing the task.")
    lines.append("=" * 50)

    return "\n".join(lines)


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
    edited_files = get_edited_files(session_id)

    if not edited_files:
        sys.exit(0)

    all_findings: dict[str, list[Finding]] = {}

    for file in edited_files:
        findings = analyze_file(file)
        if findings:
            all_findings[file] = findings

    output = format_output(all_findings)
    if output:
        print(output)

    sys.exit(0)


if __name__ == "__main__":
    main()
