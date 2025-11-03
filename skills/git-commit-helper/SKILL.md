# Git Commit Helper

## Overview
Automated git workflow management for Vigil Guard including Conventional Commits format, CHANGELOG generation, commit validation, and pre-commit hooks.

## When to Use This Skill
- Creating properly formatted commit messages
- Generating CHANGELOG.md from commits
- Setting up pre-commit hooks
- Validating commit message format
- Managing release versioning
- Creating semantic commits

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
```

### Scopes (Vigil Guard specific)
```yaml
workflow:     n8n workflow changes
detection:    Pattern/rules changes
pii:          PII detection
frontend:     React UI
backend:      Express API
docker:       Container/orchestration
tests:        Test suite
docs:         Documentation
config:       Configuration files
```

### Examples

**Feature:**
```bash
git commit -m "feat(workflow): add browser fingerprinting to v1.7.0

- Add clientId extraction to Input_Validator
- Add browser_metadata to ClickHouse logging
- Update PII_Redactor_v2 with classification flags

BREAKING: Requires ClickHouse schema migration (see docs/MIGRATION_v1.7.0.md)
"
```

**Bug Fix:**
```bash
git commit -m "fix(pii): correct CREDIT_CARD detection in Polish text

- Update Presidio analyzer to use pl_core_news_lg for Polish context
- Add entity deduplication for overlapping detections
- Fixes #123
"
```

**Documentation:**
```bash
git commit -m "docs: update API.md with retention endpoints

- Add POST /api/retention/cleanup
- Add GET /api/retention/config
- Update authentication requirements
"
```

## Common Tasks

### Task 1: Automated Commit Message Generation

```bash
#!/bin/bash
# scripts/smart-commit.sh

# Analyze changed files
CHANGED_FILES=$(git diff --cached --name-only)

# Infer scope
SCOPE=""
if echo "$CHANGED_FILES" | grep -q "services/workflow/"; then
  SCOPE="workflow"
elif echo "$CHANGED_FILES" | grep -q "services/web-ui/frontend/"; then
  SCOPE="frontend"
elif echo "$CHANGED_FILES" | grep -q "services/web-ui/backend/"; then
  SCOPE="backend"
elif echo "$CHANGED_FILES" | grep -q "docs/"; then
  SCOPE="docs"
elif echo "$CHANGED_FILES" | grep -q "docker-compose.yml"; then
  SCOPE="docker"
elif echo "$CHANGED_FILES" | grep -q "tests/"; then
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
read -p "Choice: " TYPE_CHOICE

case $TYPE_CHOICE in
  1) TYPE="feat" ;;
  2) TYPE="fix" ;;
  3) TYPE="docs" ;;
  4) TYPE="refactor" ;;
  5) TYPE="test" ;;
  *) TYPE="chore" ;;
esac

read -p "Commit subject: " SUBJECT

# Build commit message
COMMIT_MSG="$TYPE($SCOPE): $SUBJECT"

# Show preview
echo ""
echo "Commit message:"
echo "$COMMIT_MSG"
echo ""
read -p "Proceed? (y/n): " CONFIRM

if [ "$CONFIRM" = "y" ]; then
  git commit -m "$COMMIT_MSG"
  echo "✅ Committed successfully"
else
  echo "❌ Aborted"
fi
```

### Task 2: Pre-commit Hook (Validation)

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running pre-commit checks..."

# 1. Validate commit message format
COMMIT_MSG_FILE=".git/COMMIT_EDITMSG"
if [ -f "$COMMIT_MSG_FILE" ]; then
  MSG=$(cat "$COMMIT_MSG_FILE")

  # Check conventional commits format
  if ! echo "$MSG" | grep -qE "^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .{1,50}"; then
    echo "❌ Commit message must follow Conventional Commits format"
    echo "   Format: <type>(<scope>): <subject>"
    echo "   Example: feat(workflow): add new detection pattern"
    exit 1
  fi
fi

# 2. Run linter on staged files
if git diff --cached --name-only | grep -q ".ts$"; then
  echo "Running TypeScript type check..."
  npx tsc --noEmit || exit 1
fi

# 3. Run tests
if git diff --cached --name-only | grep -qE "(test|spec)"; then
  echo "Running test suite..."
  cd services/workflow && npm test || exit 1
fi

# 4. Check for secrets
echo "Checking for secrets..."
if git diff --cached | grep -iE "(password|secret|api_key|token).*(=|:)"; then
  echo "⚠️  WARNING: Potential secret detected in staged changes"
  read -p "Continue anyway? (y/n): " CONFIRM
  [ "$CONFIRM" != "y" ] && exit 1
fi

echo "✅ Pre-commit checks passed"
```

### Task 3: CHANGELOG Generation

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
for TYPE in feat fix docs refactor perf test build ci chore; do
  COMMITS=$(git log --pretty=format:"%s" ${PREV_TAG}..HEAD | grep "^$TYPE")

  if [ -n "$COMMITS" ]; then
    case $TYPE in
      feat) SECTION="### ✨ Features" ;;
      fix) SECTION="### 🐛 Bug Fixes" ;;
      docs) SECTION="### 📝 Documentation" ;;
      refactor) SECTION="### ♻️ Refactoring" ;;
      perf) SECTION="### ⚡ Performance" ;;
      test) SECTION="### ✅ Tests" ;;
      build) SECTION="### 🏗️ Build" ;;
      ci) SECTION="### 👷 CI/CD" ;;
      chore) SECTION="### 🔧 Chore" ;;
    esac

    echo "$SECTION"
    echo ""
    echo "$COMMITS" | while read line; do
      # Remove type prefix
      MSG=$(echo "$line" | sed "s/^$TYPE[^:]*: //")
      echo "- $MSG"
    done
    echo ""
  fi
done

# Breaking changes
BREAKING=$(git log --pretty=format:"%b" ${PREV_TAG}..HEAD | grep "BREAKING")
if [ -n "$BREAKING" ]; then
  echo "### ⚠️ BREAKING CHANGES"
  echo ""
  echo "$BREAKING"
  echo ""
fi
```

**Usage:**
```bash
./scripts/generate-changelog.sh v1.7.0 > CHANGELOG.md
```

### Task 4: Commit Message Validation (Git Hook)

```bash
#!/bin/bash
# .git/hooks/commit-msg

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Conventional Commits regex
REGEX="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .{1,50}"

if ! echo "$COMMIT_MSG" | grep -qE "$REGEX"; then
  echo ""
  echo "❌ Invalid commit message format"
  echo ""
  echo "Format: <type>(<scope>): <subject>"
  echo ""
  echo "Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert"
  echo "Scopes: workflow, detection, pii, frontend, backend, docker, tests, docs, config"
  echo ""
  echo "Examples:"
  echo "  feat(workflow): add new detection pattern"
  echo "  fix(pii): correct PESEL validation"
  echo "  docs: update API documentation"
  echo ""
  exit 1
fi

# Check subject length
SUBJECT=$(echo "$COMMIT_MSG" | head -1 | sed 's/^[^:]*: //')
if [ ${#SUBJECT} -gt 50 ]; then
  echo "⚠️  Warning: Subject line should be ≤50 characters (current: ${#SUBJECT})"
fi

echo "✅ Commit message format valid"
```

### Task 5: Semantic Versioning Helper

```bash
#!/bin/bash
# scripts/bump-version.sh

CURRENT_VERSION=$(git describe --tags --abbrev=0 | sed 's/v//')
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

echo "Current version: $CURRENT_VERSION"
echo ""
echo "Select version bump:"
echo "1) Major (breaking changes): $MAJOR.0.0"
echo "2) Minor (new features): $MAJOR.$((MINOR+1)).0"
echo "3) Patch (bug fixes): $MAJOR.$MINOR.$((PATCH+1))"
read -p "Choice: " BUMP

case $BUMP in
  1) NEW_VERSION="$MAJOR.0.0" ;;
  2) NEW_VERSION="$MAJOR.$((MINOR+1)).0" ;;
  3) NEW_VERSION="$MAJOR.$MINOR.$((PATCH+1))" ;;
  *) echo "Invalid choice"; exit 1 ;;
esac

echo ""
echo "New version: v$NEW_VERSION"
read -p "Create tag? (y/n): " CONFIRM

if [ "$CONFIRM" = "y" ]; then
  git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
  echo "✅ Tag created: v$NEW_VERSION"
  echo ""
  echo "Push with: git push origin v$NEW_VERSION"
fi
```

## Integration Points

### With documentation-sync-specialist:
```yaml
when: Version tag created
action:
  1. Generate CHANGELOG.md
  2. Update version in docs/
  3. Commit docs changes
```

### With workflow-json-architect:
```yaml
when: Workflow modified
action:
  1. Commit with scope "workflow"
  2. Include "Import to n8n NOW!" in body
  3. Reference workflow version in footer
```

## Quick Reference

```bash
# Install pre-commit hook
cp scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Install commit-msg hook
cp scripts/commit-msg.sh .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg

# Generate CHANGELOG
./scripts/generate-changelog.sh v1.7.0 > CHANGELOG.md

# Smart commit
./scripts/smart-commit.sh

# Bump version
./scripts/bump-version.sh
```

---
**Format:** Conventional Commits 1.0.0
**Validation:** Pre-commit hooks
**Automation:** CHANGELOG generation, version bumping
