#!/bin/bash
# Post Tool Use Tracker - Shell Wrapper
# Passes stdin through to Python handler

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Execute Python hook
python3 "$SCRIPT_DIR/post-tool-use-tracker.py"
