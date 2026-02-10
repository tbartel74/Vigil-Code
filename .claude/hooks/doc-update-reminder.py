#!/usr/bin/env python3
"""
Documentation Update Reminder Hook

PostToolUse hook that monitors file edits and suggests documentation updates
when relevant code changes are detected.

Triggers documentation suggestions when:
- API routes are modified → api-doc-generator
- New services/packages created → readme-generator
- Significant code changes → doc-generator
"""

import json
import sys
import os
from pathlib import Path

# Documentation-relevant path patterns
DOC_TRIGGERS = {
    "api-doc-generator": {
        "path_patterns": [
            "src/routes/",
            "src/api/",
        ],
        "content_patterns": [
            "router.get",
            "router.post",
            "router.put",
            "router.delete",
            "router.patch",
        ],
        "message": "API routes modified. Consider running api-doc-generator to update docs/API.md",
    },
    "readme-generator": {
        "path_patterns": [
            "apps/",
            "services/",
            "packages/",
        ],
        "file_names": [
            "package.json",
            "pyproject.toml",
            "Cargo.toml",
        ],
        "message": "Package configuration changed. Consider running readme-generator to update README.md",
    },
    "doc-generator": {
        "path_patterns": [
            "CHANGELOG.md",
            "docs/USER_GUIDE.md",
            "docs/ARCHITECTURE.md",
        ],
        "message": "Documentation files detected. Consider running doc-generator for comprehensive updates",
    },
}

# Cooldown tracking (prevent spam)
COOLDOWN_FILE = os.path.join(
    os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd()),
    ".claude",
    "state",
    "doc-reminder-cooldown.json",
)
COOLDOWN_SECONDS = 300  # 5 minutes between reminders


def load_cooldown() -> dict:
    """Load cooldown state."""
    try:
        if os.path.exists(COOLDOWN_FILE):
            with open(COOLDOWN_FILE, "r") as f:
                return json.load(f)
    except Exception:
        pass
    return {}


def save_cooldown(state: dict) -> None:
    """Save cooldown state."""
    try:
        with open(COOLDOWN_FILE, "w") as f:
            json.dump(state, f)
    except Exception:
        pass


def check_cooldown(skill: str) -> bool:
    """Check if skill reminder is on cooldown."""
    import time

    state = load_cooldown()
    last_shown = state.get(skill, 0)
    return (time.time() - last_shown) < COOLDOWN_SECONDS


def update_cooldown(skill: str) -> None:
    """Update cooldown timestamp for skill."""
    import time

    state = load_cooldown()
    state[skill] = time.time()
    save_cooldown(state)


def match_path(file_path: str, patterns: list) -> bool:
    """Check if file path matches any pattern."""
    for pattern in patterns:
        if pattern in file_path:
            return True
    return False


def match_file_name(file_path: str, names: list) -> bool:
    """Check if file name matches any in list."""
    file_name = Path(file_path).name
    return file_name in names


def analyze_edit(tool_input: dict, tool_result: dict) -> list:
    """Analyze edit for documentation relevance."""
    suggestions = []

    file_path = tool_input.get("file_path", "")
    if not file_path:
        return suggestions

    for skill, config in DOC_TRIGGERS.items():
        # Skip if on cooldown
        if check_cooldown(skill):
            continue

        matched = False

        # Check path patterns
        if "path_patterns" in config:
            if match_path(file_path, config["path_patterns"]):
                matched = True

        # Check file names
        if not matched and "file_names" in config:
            if match_file_name(file_path, config["file_names"]):
                matched = True

        if matched:
            suggestions.append(
                {"skill": skill, "message": config["message"], "file": file_path}
            )
            update_cooldown(skill)

    return suggestions


def format_output(suggestions: list) -> str:
    """Format suggestions for output."""
    if not suggestions:
        return ""

    lines = [
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "📝 DOCUMENTATION UPDATE SUGGESTION",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
    ]

    for suggestion in suggestions:
        lines.append(f"→ {suggestion['message']}")
        lines.append(f"  File: {suggestion['file']}")
        lines.append(f"  Skill: {suggestion['skill']}")
        lines.append("")

    lines.append("💡 TIP: Use /documentation or ask to generate docs")
    lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    lines.append("")

    return "\n".join(lines)


def main():
    """Main hook entry point."""
    try:
        # Read hook input from stdin
        input_data = ""
        for line in sys.stdin:
            input_data += line

        if not input_data.strip():
            sys.exit(0)

        data = json.loads(input_data)

        # Only process Edit and Write tools
        tool_name = data.get("tool_name", "")
        if tool_name not in ["Edit", "Write"]:
            sys.exit(0)

        tool_input = data.get("tool_input", {})
        tool_result = data.get("tool_result", {})

        # Analyze for documentation relevance
        suggestions = analyze_edit(tool_input, tool_result)

        # Output suggestions if any
        output = format_output(suggestions)
        if output:
            print(output)

        sys.exit(0)

    except Exception:
        # Silent fail - don't block workflow
        sys.exit(0)


if __name__ == "__main__":
    main()
