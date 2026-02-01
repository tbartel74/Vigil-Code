#!/bin/bash
# Auto-format files based on extension
# Called by PostToolUse hook after Write|Edit operations
#
# Reads JSON from stdin with tool_input.file_path

# Read tool input from stdin
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ -z "$FILE" || ! -f "$FILE" ]]; then
  exit 0
fi

case "$FILE" in
  *.js|*.jsx|*.ts|*.tsx|*.json|*.css|*.scss|*.md)
    prettier --write "$FILE" 2>/dev/null || true
    ;;
  *.py)
    ruff format "$FILE" 2>/dev/null || true
    ruff check --fix "$FILE" 2>/dev/null || true
    ;;
esac

exit 0
