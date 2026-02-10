---
name: git-commit-helper
description: Automated git workflow management for enterprise projects. Use for Conventional Commits formatting, CHANGELOG generation, commit validation, pre-commit hooks, release versioning, and semantic commits. CRITICAL - NO AI ATTRIBUTION IN COMMITS.
---

# Git Commit Helper

## Overview

Automated git workflow management for enterprise projects including Conventional Commits format, CHANGELOG generation, commit validation, and pre-commit hooks.

## When to Use This Skill

- Creating properly formatted commit messages
- Generating CHANGELOG.md from commits
- Setting up pre-commit hooks
- Validating commit message format
- Managing release versioning
- Creating semantic commits

---

## CROWN RULE: NO AI ATTRIBUTION IN COMMITS

**ABSOLUTELY FORBIDDEN in git commits:**

```bash
# NEVER INCLUDE:
Generated with [Claude Code]
Co-Authored-By: Claude <noreply@anthropic.com>
```

**This is NON-NEGOTIABLE:**
- NO AI attribution footers in commit messages
- NO "Generated with Claude" lines
- NO "Co-Authored-By: Claude" trailers
- Commits MUST appear as human-authored only

**Correct commit message format:**
```bash
# CORRECT:
fix(api): improve error handling

- Fixed timeout handling in middleware
- Added error bubbling for failures

# WRONG - has AI attribution:
fix(api): improve error handling

- Fixed timeout handling in middleware

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**If AI attribution accidentally added:**
1. STOP immediately
2. Use `git commit --amend` to rewrite message
3. Remove ALL AI attribution lines
4. Force push if already pushed (after user confirmation)

---

## Conventional Commits Format

### Structure
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
```yaml
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
style:    Code style (formatting, no logic change)
refactor: Code restructuring (no behavior change)
perf:     Performance improvement
test:     Adding/updating tests
build:    Build system changes
ci:       CI/CD configuration
chore:    Maintenance tasks
revert:   Revert previous commit
security: Security-related changes
```

### Scopes

Customize scopes for your project. Example:

```yaml
# API & Web
api:        Public REST API (apps/api)
web-ui:     Web interface (apps/web-ui)

# Services
worker:     Background workers (services/*)

# Shared Packages
shared:     Shared types (packages/shared)

# Infrastructure
docker:     Container orchestration (infra/docker)

# Other
auth:       Authentication/authorization
config:     Configuration files
tests:      Test suite
docs:       Documentation
ci:         CI/CD pipelines
```

### Examples

**Feature:**
```bash
git commit -m "feat(api): add batch processing endpoint

- Support up to 100 items per request
- Add concurrent processing
- Return aggregated results with request IDs"
```

**Bug Fix:**
```bash
git commit -m "fix(worker): correct timeout handling

- Fix 1000ms timeout not being enforced
- Add graceful degradation on timeout
- Fixes #123"
```

**Security:**
```bash
git commit -m "security(auth): fix timing attack in key validation

- Use constant-time comparison for API keys
- Add rate limiting on auth endpoints"
```

## Common Tasks

### Task 1: Automated Commit Message Generation

```bash
#!/bin/bash
# scripts/smart-commit.sh

# Analyze changed files
CHANGED_FILES=$(git diff --cached --name-only)

# Infer scope from paths
SCOPE=""
if echo "$CHANGED_FILES" | grep -q "apps/api/"; then
  SCOPE="api"
elif echo "$CHANGED_FILES" | grep -q "apps/web-ui/"; then
  SCOPE="web-ui"
elif echo "$CHANGED_FILES" | grep -q "services/"; then
  SCOPE="worker"
elif echo "$CHANGED_FILES" | grep -q "packages/"; then
  SCOPE="shared"
elif echo "$CHANGED_FILES" | grep -q "infra/"; then
  SCOPE="docker"
elif echo "$CHANGED_FILES" | grep -q "docs/"; then
  SCOPE="docs"
elif echo "$CHANGED_FILES" | grep -qE "\.test\.(ts|js)$"; then
  SCOPE="tests"
fi

# Prompt for type and subject
echo "Changed files:"
echo "$CHANGED_FILES"
echo ""
echo "Inferred scope: $SCOPE"
echo ""
echo "Select commit type:"
echo "1) feat"
echo "2) fix"
echo "3) docs"
echo "4) refactor"
echo "5) test"
echo "6) security"
read -p "Choice: " TYPE_CHOICE

case $TYPE_CHOICE in
  1) TYPE="feat" ;;
  2) TYPE="fix" ;;
  3) TYPE="docs" ;;
  4) TYPE="refactor" ;;
  5) TYPE="test" ;;
  6) TYPE="security" ;;
  *) TYPE="chore" ;;
esac

read -p "Commit subject: " SUBJECT

# Build commit message (NO AI ATTRIBUTION!)
if [ -n "$SCOPE" ]; then
  COMMIT_MSG="$TYPE($SCOPE): $SUBJECT"
else
  COMMIT_MSG="$TYPE: $SUBJECT"
fi

# Show preview
echo ""
echo "Commit message:"
echo "$COMMIT_MSG"
echo ""
read -p "Proceed? (y/n): " CONFIRM

if [ "$CONFIRM" = "y" ]; then
  git commit -m "$COMMIT_MSG"
  echo "Committed successfully"
else
  echo "Aborted"
fi
```

### Task 2: Pre-commit Hook (Validation)

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running pre-commit checks..."

# 1. Check for AI attribution (FORBIDDEN!)
if git diff --cached | grep -iE "(Generated with.*Claude|Co-Authored-By:.*Claude)"; then
  echo ""
  echo "ERROR: AI attribution detected in staged changes!"
  echo "   Remove any 'Generated with Claude' or 'Co-Authored-By: Claude' lines"
  echo ""
  exit 1
fi

# 2. Run linter on staged files
if git diff --cached --name-only | grep -q ".ts$"; then
  echo "Running TypeScript type check..."
  pnpm typecheck || exit 1
fi

# 3. Run tests for changed services
CHANGED=$(git diff --cached --name-only)
if echo "$CHANGED" | grep -qE "services/"; then
  echo "Running service tests..."
  pnpm test || exit 1
fi

# 4. Check for secrets
echo "Checking for secrets..."
if git diff --cached | grep -iE "(password|secret|api_key|token).*(=|:).*['\"][^'\"]{8,}['\"]"; then
  echo "WARNING: Potential secret detected in staged changes"
  read -p "Continue anyway? (y/n): " CONFIRM
  [ "$CONFIRM" != "y" ] && exit 1
fi

echo "Pre-commit checks passed"
```

### Task 3: Commit Message Validation (Git Hook)

```bash
#!/bin/bash
# .git/hooks/commit-msg

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# CRITICAL: Check for AI attribution
if echo "$COMMIT_MSG" | grep -iE "(Generated with.*Claude|Co-Authored-By:.*Claude)"; then
  echo ""
  echo "FORBIDDEN: AI attribution detected in commit message!"
  echo ""
  exit 1
fi

# Conventional Commits regex
REGEX="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|security)(\(.+\))?: .{1,50}"

if ! echo "$COMMIT_MSG" | grep -qE "$REGEX"; then
  echo ""
  echo "Invalid commit message format"
  echo ""
  echo "Format: <type>(<scope>): <subject>"
  echo ""
  echo "Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert, security"
  echo ""
  exit 1
fi

echo "Commit message format valid"
```

### Task 4: CHANGELOG Generation

```bash
#!/bin/bash
# scripts/generate-changelog.sh

VERSION="$1"
PREV_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

echo "# Changelog"
echo ""
echo "## [$VERSION] - $(date +%Y-%m-%d)"
echo ""

# Group commits by type
for TYPE in feat fix security docs refactor perf test build ci chore; do
  COMMITS=$(git log --pretty=format:"%s" ${PREV_TAG}..HEAD | grep "^$TYPE")

  if [ -n "$COMMITS" ]; then
    case $TYPE in
      feat) SECTION="### Features" ;;
      fix) SECTION="### Bug Fixes" ;;
      security) SECTION="### Security" ;;
      docs) SECTION="### Documentation" ;;
      refactor) SECTION="### Refactoring" ;;
      perf) SECTION="### Performance" ;;
      test) SECTION="### Tests" ;;
      build) SECTION="### Build" ;;
      ci) SECTION="### CI/CD" ;;
      chore) SECTION="### Chore" ;;
    esac

    echo "$SECTION"
    echo ""
    echo "$COMMITS" | while read line; do
      MSG=$(echo "$line" | sed "s/^$TYPE[^:]*: //")
      echo "- $MSG"
    done
    echo ""
  fi
done

# Breaking changes
BREAKING=$(git log --pretty=format:"%b" ${PREV_TAG}..HEAD | grep "BREAKING")
if [ -n "$BREAKING" ]; then
  echo "### BREAKING CHANGES"
  echo ""
  echo "$BREAKING"
  echo ""
fi
```

## Quick Reference

```bash
# Install hooks
cp scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

cp scripts/commit-msg.sh .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg

# Generate CHANGELOG
./scripts/generate-changelog.sh v1.0.0 > CHANGELOG.md

# Smart commit (no AI attribution)
./scripts/smart-commit.sh
```

---

**Format:** Conventional Commits 1.0.0
**Validation:** Pre-commit hooks (AI attribution check)
**CRITICAL:** NO AI ATTRIBUTION IN COMMITS
