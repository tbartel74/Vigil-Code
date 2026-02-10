#!/usr/bin/env python3
"""
Memory Loader - Progressive disclosure for cross-session memory.

Provides layered access to memory with token-efficient loading:
- Layer 1 (summary): Categories + counts (~50-100 tokens)
- Layer 2 (headlines): One-liners per entry (~200-400 tokens)
- Layer 3 (details): Full entries with context (~500-1000 tokens)

Usage:
    python3 memory-loader.py --layer=summary
    python3 memory-loader.py --layer=headlines [--category=X]
    python3 memory-loader.py --layer=details --id=N
    python3 memory-loader.py --layer=details --category=X
    python3 memory-loader.py --search="query"
"""

import argparse
import json
import os
from collections import defaultdict
from pathlib import Path

CLAUDE_PROJECT_DIR = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
MEMORY_DIR = Path(CLAUDE_PROJECT_DIR) / ".claude" / "memory"

LEARNINGS_FILE = MEMORY_DIR / "learnings.json"
DECISIONS_FILE = MEMORY_DIR / "decisions.json"
INDEX_FILE = MEMORY_DIR / "index.json"
COMODS_FILE = MEMORY_DIR / "co-modifications.json"


def load_json(file_path: Path, default: dict) -> dict:
    if not file_path.exists():
        return default
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return default


def get_learnings() -> list:
    data = load_json(LEARNINGS_FILE, {"entries": []})
    return data.get("entries", [])


def get_decisions() -> list:
    data = load_json(DECISIONS_FILE, {"decisions": []})
    return data.get("decisions", [])


def get_comods() -> list:
    data = load_json(COMODS_FILE, {"pairs": []})
    return data.get("pairs", [])


def get_index() -> dict:
    """Load index.json for fast summary access."""
    return load_json(INDEX_FILE, {})


def layer_summary() -> str:
    """Layer 1: Categories + counts (~50-100 tokens)

    Uses index.json for fast access when available (avoids loading full files).
    Falls back to loading full files if index is missing.
    """
    lines = ["## Cross-Session Memory Loaded", ""]

    # Try fast path: use index.json
    index = get_index()
    if index and "summary" in index:
        summary = index["summary"]
        learnings_info = summary.get("learnings", {})
        decisions_info = summary.get("decisions", {})

        total_learnings = learnings_info.get("total", 0)
        total_decisions = decisions_info.get("total", 0)
        by_category = learnings_info.get("by_category", {})

        # Get comods count (still need to check file for frequency filter)
        comods = get_comods()
        comods_count = len([p for p in comods if p.get("frequency", 0) >= 2])
    else:
        # Fallback: load full files (slower but always works)
        learnings = get_learnings()
        decisions = get_decisions()
        comods = get_comods()

        by_category = defaultdict(int)
        for entry in learnings:
            cat = entry.get("category", "general")
            by_category[cat] += 1
        by_category = dict(by_category)

        total_learnings = len(learnings)
        total_decisions = len(decisions)
        comods_count = len([p for p in comods if p.get("frequency", 0) >= 2])

    lines.append(f"**Learnings:** {total_learnings} | **Decisions:** {total_decisions}")

    if by_category:
        cats = ", ".join(
            f"{cat}: {count}" for cat, count in sorted(by_category.items())
        )
        lines.append(f"Categories: {cats}")

    if comods_count > 0:
        lines.append(f"Co-modifications: {comods_count} file pairs tracked")

    # Show recent learnings hint if any exist
    if total_learnings > 0:
        lines.append("")
        lines.append("### Recent Learnings")
        # Load just last 3 for preview (minimal overhead)
        learnings = get_learnings()
        for entry in learnings[-3:]:
            lesson = entry.get("lesson", "")
            cat = entry.get("category", "general")
            headline = lesson[:50] + "..." if len(lesson) > 50 else lesson
            lines.append(f"- [{cat}] {headline}")

    lines.append("")
    lines.append(
        "Use `/memory list` to see headlines, `/memory show <id>` for details."
    )

    return "\n".join(lines)


def layer_headlines(category: str = None) -> str:
    """Layer 2: One-liners per entry (~200-400 tokens)"""
    learnings = get_learnings()
    decisions = get_decisions()

    lines = ["## Memory Headlines", ""]

    if learnings:
        lines.append("### Learnings")
        for idx, entry in enumerate(learnings):
            cat = entry.get("category", "general")
            if category and cat != category:
                continue
            lesson = entry.get("lesson", "")
            headline = lesson[:80] + "..." if len(lesson) > 80 else lesson
            lines.append(f"  {idx}. [{cat}] {headline}")
        lines.append("")

    if decisions and not category:
        lines.append("### Decisions")
        for idx, entry in enumerate(decisions):
            decision = entry.get("decision", "")
            headline = decision[:80] + "..." if len(decision) > 80 else decision
            lines.append(f"  D{idx}. {headline}")
        lines.append("")

    if not learnings and not decisions:
        lines.append("No entries found.")

    lines.append("")
    lines.append(
        "Use `/memory show <id>` for full details (e.g., `/memory show 0` or `/memory show D0`)."
    )

    return "\n".join(lines)


def layer_details(entry_id: str = None, category: str = None) -> str:
    """Layer 3: Full entries with context (~500-1000 tokens)"""
    learnings = get_learnings()
    decisions = get_decisions()

    lines = ["## Memory Details", ""]

    if entry_id is not None:
        if entry_id.startswith("D") or entry_id.startswith("d"):
            idx = int(entry_id[1:])
            if 0 <= idx < len(decisions):
                entry = decisions[idx]
                lines.append(f"### Decision D{idx}")
                lines.append(f"**Decision:** {entry.get('decision', '')}")
                if entry.get("rationale"):
                    lines.append(f"**Rationale:** {entry.get('rationale')}")
                if entry.get("alternatives"):
                    lines.append(
                        f"**Alternatives:** {', '.join(entry.get('alternatives', []))}"
                    )
                lines.append(f"**Timestamp:** {entry.get('timestamp', 'unknown')}")
                lines.append(f"**Session:** {entry.get('session_id', 'unknown')}")
            else:
                lines.append(f"Decision D{idx} not found.")
        else:
            idx = int(entry_id)
            if 0 <= idx < len(learnings):
                entry = learnings[idx]
                lines.append(f"### Learning {idx}")
                lines.append(f"**Category:** {entry.get('category', 'general')}")
                lines.append(f"**Lesson:** {entry.get('lesson', '')}")
                if entry.get("context"):
                    lines.append(f"**Context:** {entry.get('context')}")
                lines.append(f"**Timestamp:** {entry.get('timestamp', 'unknown')}")
                lines.append(f"**Session:** {entry.get('session_id', 'unknown')}")
            else:
                lines.append(f"Learning {idx} not found.")
    elif category:
        found = False
        for idx, entry in enumerate(learnings):
            if entry.get("category", "general") == category:
                found = True
                lines.append(f"### Learning {idx}")
                lines.append(f"**Lesson:** {entry.get('lesson', '')}")
                if entry.get("context"):
                    lines.append(f"**Context:** {entry.get('context')}")
                lines.append(f"**Timestamp:** {entry.get('timestamp', 'unknown')}")
                lines.append("")
        if not found:
            lines.append(f"No learnings found for category '{category}'.")
    else:
        lines.append("Specify --id=N or --category=X to view details.")

    return "\n".join(lines)


def search_memory(query: str) -> str:
    """Search learnings and decisions by substring match."""
    learnings = get_learnings()
    decisions = get_decisions()
    query_lower = query.lower()

    lines = [f"## Search Results for '{query}'", ""]

    found_learnings = []
    for idx, entry in enumerate(learnings):
        lesson = entry.get("lesson", "").lower()
        context = entry.get("context", "").lower()
        if query_lower in lesson or query_lower in context:
            found_learnings.append((idx, entry))

    found_decisions = []
    for idx, entry in enumerate(decisions):
        decision = entry.get("decision", "").lower()
        rationale = entry.get("rationale", "").lower()
        if query_lower in decision or query_lower in rationale:
            found_decisions.append((idx, entry))

    if found_learnings:
        lines.append(f"### Learnings ({len(found_learnings)} matches)")
        for idx, entry in found_learnings:
            cat = entry.get("category", "general")
            lesson = entry.get("lesson", "")
            headline = lesson[:60] + "..." if len(lesson) > 60 else lesson
            lines.append(f"  {idx}. [{cat}] {headline}")
        lines.append("")

    if found_decisions:
        lines.append(f"### Decisions ({len(found_decisions)} matches)")
        for idx, entry in found_decisions:
            decision = entry.get("decision", "")
            headline = decision[:60] + "..." if len(decision) > 60 else decision
            lines.append(f"  D{idx}. {headline}")
        lines.append("")

    if not found_learnings and not found_decisions:
        lines.append("No matches found.")

    return "\n".join(lines)


def layer_comods() -> str:
    """Show co-modification pairs with frequency >= 2."""
    comods = get_comods()
    high_freq = [p for p in comods if p.get("frequency", 0) >= 2]
    high_freq.sort(key=lambda p: p.get("frequency", 0), reverse=True)

    lines = ["## Co-modification Patterns", ""]

    if not high_freq:
        lines.append("No significant co-modification patterns detected yet.")
        lines.append("(Pairs must be edited together in 2+ sessions to appear here.)")
        return "\n".join(lines)

    lines.append(f"Found {len(high_freq)} file pairs frequently edited together:")
    lines.append("")

    for pair in high_freq[:10]:
        files = pair.get("files", [])
        freq = pair.get("frequency", 0)
        last_seen = pair.get("last_seen", "unknown")
        if len(files) >= 2:
            f1 = files[0].split("/")[-1]
            f2 = files[1].split("/")[-1]
            lines.append(
                f"  - {f1} + {f2} (edited together {freq}x, last: {last_seen[:10]})"
            )

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Memory Loader - Progressive Disclosure"
    )
    parser.add_argument(
        "--layer",
        choices=["summary", "headlines", "details", "comods"],
        help="Layer to load: summary, headlines, details, comods",
    )
    parser.add_argument("--id", type=str, help="Entry ID for details (e.g., 0 or D0)")
    parser.add_argument("--category", type=str, help="Filter by category")
    parser.add_argument("--search", type=str, help="Search query")

    args = parser.parse_args()

    if args.search:
        print(search_memory(args.search))
    elif args.layer == "summary":
        print(layer_summary())
    elif args.layer == "headlines":
        print(layer_headlines(args.category))
    elif args.layer == "details":
        print(layer_details(args.id, args.category))
    elif args.layer == "comods":
        print(layer_comods())
    else:
        print(layer_summary())


if __name__ == "__main__":
    main()
