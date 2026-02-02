#!/usr/bin/env python3
"""
Co-modification Tracker - Tracks files frequently edited together.

Runs on Stop event. Reads edited-files.log from tsc-cache session directory,
generates file pairs, and updates co-modifications.json with frequency tracking.

Only pairs with frequency >= 2 are shown in /memory comods (but all are stored).
FIFO rotation prioritizes high-frequency pairs when storage limit is reached.
"""

import json
import os
import sys
from datetime import datetime, timezone
from itertools import combinations
from pathlib import Path

CLAUDE_PROJECT_DIR = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
MEMORY_DIR = Path(CLAUDE_PROJECT_DIR) / ".claude" / "memory"
TSC_CACHE_DIR = Path(CLAUDE_PROJECT_DIR) / ".claude" / "tsc-cache"

COMODS_FILE = MEMORY_DIR / "co-modifications.json"
MAX_ENTRIES = 50


def load_json(file_path: Path, default: dict) -> dict:
    if not file_path.exists():
        return default
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return default


def save_json(file_path: Path, data: dict) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def find_session_cache_dir(session_id: str = "") -> Path | None:
    """Find the tsc-cache directory for current session.

    Args:
        session_id: If provided, tries exact match first.

    Returns:
        Path to cache dir with edited-files.log, or None.
    """
    if not TSC_CACHE_DIR.exists():
        return None

    # Try exact session_id match first
    if session_id:
        exact_match = TSC_CACHE_DIR / session_id
        if exact_match.is_dir() and (exact_match / "edited-files.log").exists():
            return exact_match

    # Fallback: most recently modified cache dir
    cache_dirs = [
        d
        for d in TSC_CACHE_DIR.iterdir()
        if d.is_dir() and (d / "edited-files.log").exists()
    ]
    if cache_dirs:
        return max(cache_dirs, key=lambda d: d.stat().st_mtime)

    return None


def read_edited_files(cache_dir: Path):
    """Read unique file paths from edited-files.log.

    Supports JSON Lines format (new) with fallback to legacy format.
    JSON Lines: {"ts": "...", "file": "path/to/file.ts"}
    Legacy: 2026-02-01T17:10:16+00:00:path/to/file.ts
    """
    edited_files_log = cache_dir / "edited-files.log"
    if not edited_files_log.exists():
        return set()

    files = set()
    try:
        with open(edited_files_log, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue

                # Try JSON Lines format first (new format)
                if line.startswith("{"):
                    try:
                        entry = json.loads(line)
                        filepath = entry.get("file", "")
                        if filepath:
                            files.add(filepath)
                        continue
                    except json.JSONDecodeError:
                        pass

                # Fallback to legacy format: timestamp:filepath
                if ":" in line:
                    # Handle ISO timestamp with colons
                    # Format: 2026-02-01T17:10:16.552583+00:00:filepath
                    idx = line.rfind("+00:00:")
                    if idx != -1:
                        filepath = line[idx + 7 :]
                    else:
                        # Fallback: split on first colon after date
                        idx = line.find(":", 25)
                        if idx != -1:
                            filepath = line[idx + 1 :]
                        else:
                            continue
                    if filepath:
                        files.add(filepath)
    except IOError:
        pass

    return files


def normalize_pair(file1: str, file2: str):
    """Normalize pair to consistent order (alphabetical)."""
    return tuple(sorted([file1, file2]))


def find_existing_pair(pairs: list, file1: str, file2: str):
    """Find existing pair in storage (order-independent)."""
    normalized = normalize_pair(file1, file2)
    for pair in pairs:
        pair_files = pair.get("files", [])
        if len(pair_files) >= 2:
            if normalize_pair(pair_files[0], pair_files[1]) == normalized:
                return pair
    return None


def track_co_modifications(session_id: str = "") -> dict:
    """Track co-modifications from current session.

    Args:
        session_id: Session ID from Stop event payload.
    """
    stats = {"pairs_updated": 0, "pairs_added": 0}

    cache_dir = find_session_cache_dir(session_id)
    if not cache_dir:
        return stats

    # Read edited files from session
    session_files = read_edited_files(cache_dir)

    # Need at least 2 files to form pairs
    if len(session_files) < 2:
        return stats

    # Load existing co-modifications
    comods_data = load_json(
        COMODS_FILE,
        {"version": "1.0", "max_entries": MAX_ENTRIES, "min_frequency": 2, "pairs": []},
    )

    pairs = comods_data.get("pairs", [])
    now = datetime.now(timezone.utc).isoformat()

    # Generate all pairs from session files
    session_pairs = list(combinations(sorted(session_files), 2))

    for file1, file2 in session_pairs:
        existing = find_existing_pair(pairs, file1, file2)
        if existing:
            existing["frequency"] = existing.get("frequency", 1) + 1
            existing["last_seen"] = now
            stats["pairs_updated"] += 1
        else:
            pairs.append(
                {
                    "files": list(normalize_pair(file1, file2)),
                    "frequency": 1,
                    "last_seen": now,
                }
            )
            stats["pairs_added"] += 1

    # FIFO rotation with frequency priority
    # Sort by frequency DESC, then last_seen DESC
    pairs.sort(
        key=lambda p: (p.get("frequency", 0), p.get("last_seen", "")), reverse=True
    )

    # Keep only MAX_ENTRIES
    pairs = pairs[:MAX_ENTRIES]

    comods_data["pairs"] = pairs
    save_json(COMODS_FILE, comods_data)

    return stats


def main():
    """Main entry point for Stop hook."""
    try:
        # Read session_id from Stop event payload
        session_id = ""
        try:
            data = json.loads(sys.stdin.read())
            session_id = data.get("session_id", "")
        except (json.JSONDecodeError, IOError):
            pass

        stats = track_co_modifications(session_id)

        total = stats["pairs_updated"] + stats["pairs_added"]
        if total > 0:
            print(
                f"Co-modifications: {stats['pairs_updated']} updated, {stats['pairs_added']} new",
                file=sys.stderr,
            )
    except Exception as e:
        # Never block Stop
        print(f"Co-modification tracker error (non-blocking): {e}", file=sys.stderr)

    sys.exit(0)


if __name__ == "__main__":
    main()
