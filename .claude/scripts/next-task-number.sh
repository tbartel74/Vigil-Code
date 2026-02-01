#!/bin/bash
# next-task-number.sh
# Determines the next sequential task number for dev_docs
# Scans both dev_docs/active/ and dev_docs/archive/ directories
# Returns zero-padded 4-digit number (e.g., 0001, 0002, etc.)

set -e

# Find project root (where dev_docs/ lives)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

ACTIVE_DIR="$PROJECT_ROOT/dev_docs/active"
ARCHIVE_DIR="$PROJECT_ROOT/dev_docs/archive"

# Find highest existing number across both directories
max_num=0

for dir in "$ACTIVE_DIR" "$ARCHIVE_DIR"; do
    if [[ -d "$dir" ]]; then
        for entry in "$dir"/*; do
            if [[ -d "$entry" ]]; then
                basename=$(basename "$entry")
                # Extract leading digits before underscore (e.g., "0001_task-name" -> "0001")
                if [[ "$basename" =~ ^([0-9]+)_ ]]; then
                    num=$((10#${BASH_REMATCH[1]}))  # Force base-10 interpretation
                    if (( num > max_num )); then
                        max_num=$num
                    fi
                fi
            fi
        done
    fi
done

# Output next number, zero-padded to 4 digits
next_num=$((max_num + 1))
printf "%04d\n" "$next_num"
