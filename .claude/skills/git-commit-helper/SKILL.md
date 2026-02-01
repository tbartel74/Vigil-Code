---
name: git-commit-helper
description: Automated git workflow management for Vigil Guard Enterprise. Use for Conventional Commits formatting, CHANGELOG generation, commit validation, pre-commit hooks, release versioning, and semantic commits. CRITICAL - NO AI ATTRIBUTION IN COMMITS.
version: 1.0.0
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# Git Commit Helper (Enterprise)

## Overview

Automated git workflow management for Vigil Guard Enterprise including Conventional Commits format, CHANGELOG generation, commit validation, and pre-commit hooks.

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
# ❌ NEVER INCLUDE:
🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

**This is NON-NEGOTIABLE:**
- NO AI attribution footers in commit messages
- NO "Generated with Claude" lines
- NO "Co-Authored-By: Claude" trailers
- Commits MUST appear as human-authored only

**Correct commit message format:**
```bash
# ✅ CORRECT:
fix(pii): improve entity deduplication

- Fixed sort to prefer longer overlaps
- Added error bubbling for Presidio failures

# ❌ WRONG - has AI attribution:
fix(pii): improve entity deduplication

- Fixed sort to prefer longer overlaps

🤖 Generated with Claude Code
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

### Scopes (Vigil Guard Enterprise)
```yaml
# API & Web
api:        Public REST API (apps/api)
web-ui:     Config interface (apps/web-ui)
extension:  Browser extension (apps/extension)

# NATS Workers
detection:  Detection worker (services/detection-worker)
semantic:   Semantic worker (services/semantic-worker)
pii:        PII worker (services/pii-worker)
arbiter:    Arbiter worker (services/arbiter-worker)
logging:    Logging worker (services/logging-worker)

# Support Services
presidio:   Presidio API (services/presidio-api)
language:   Language detector (services/language-detector)

# Shared Packages
sdk:        Python SDK (packages/sdk)
nats:       NATS client (packages/nats-client)
shared:     Shared types (packages/shared)

# Infrastructure
docker:     Container orchestration (infra/docker)
k8s:        Kubernetes (infra/k8s)
helm:       Helm charts (infra/helm)
grafana:    Monitoring dashboards (infra/grafana)
clickhouse: Database migrations (infra/clickhouse)

# Other
auth:       Authentication/authorization
config:     Configuration files
tests:      Test suite
docs:       Documentation
ci:         CI/CD pipelines
```

### Examples (Enterprise)

**Feature (NATS Worker):**
```bash
git commit -m "feat(arbiter): implement weighted fusion

- Add worker weight configuration (35/35/30)
- Implement threshold-based decision logic
- Add degradation handling for failed workers

BREAKING: Requires NATS KV config migration"
```

**Bug Fix:**
```bash
git commit -m "fix(detection): correct pattern timeout handling

- Fix 1000ms timeout not being enforced
- Add graceful degradation on timeout
- Fixes #123"
```

**Documentation:**
```bash
git commit -m "docs: update architecture for Enterprise

- Document NATS JetStream worker pipeline
- Add worker specifications table
- Update port reference table"
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

# Infer scope (Enterprise paths)
SCOPE=""
if echo "$CHANGED_FILES" | grep -q "apps/api/"; then
  SCOPE="api"
elif echo "$CHANGED_FILES" | grep -q "apps/web-ui/frontend/"; then
  SCOPE="web-ui"
elif echo "$CHANGED_FILES" | grep -q "apps/web-ui/backend/"; then
  SCOPE="web-ui"
elif echo "$CHANGED_FILES" | grep -q "services/detection-worker/"; then
  SCOPE="detection"
elif echo "$CHANGED_FILES" | grep -q "services/semantic-worker/"; then
  SCOPE="semantic"
elif echo "$CHANGED_FILES" | grep -q "services/pii-worker/"; then
  SCOPE="pii"
elif echo "$CHANGED_FILES" | grep -q "services/arbiter-worker/"; then
  SCOPE="arbiter"
elif echo "$CHANGED_FILES" | grep -q "services/logging-worker/"; then
  SCOPE="logging"
elif echo "$CHANGED_FILES" | grep -q "packages/nats-client/"; then
  SCOPE="nats"
elif echo "$CHANGED_FILES" | grep -q "packages/sdk/"; then
  SCOPE="sdk"
elif echo "$CHANGED_FILES" | grep -q "infra/docker/"; then
  SCOPE="docker"
elif echo "$CHANGED_FILES" | grep -q "infra/k8s/"; then
  SCOPE="k8s"
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
echo "⚠️  Reminder: NO AI attribution will be added"
read -p "Proceed? (y/n): " CONFIRM

if [ "$CONFIRM" = "y" ]; then
  git commit -m "$COMMIT_MSG"
  echo "✅ Committed successfully (no AI attribution)"
else
  echo "❌ Aborted"
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
  echo "❌ ERROR: AI attribution detected in staged changes!"
  echo "   Remove any 'Generated with Claude' or 'Co-Authored-By: Claude' lines"
  echo ""
  exit 1
fi

# 2. Run linter on staged files
if git diff --cached --name-only | grep -q ".ts$"; then
  echo "Running TypeScript type check..."
  pnpm typecheck || exit 1
fi

# 3. Run tests for changed workers
CHANGED=$(git diff --cached --name-only)
if echo "$CHANGED" | grep -qE "services/.*-worker/"; then
  echo "Running worker tests..."
  pnpm test || exit 1
fi

# 4. Check for secrets
echo "Checking for secrets..."
if git diff --cached | grep -iE "(password|secret|api_key|token).*(=|:).*['\"][^'\"]{8,}['\"]"; then
  echo "⚠️  WARNING: Potential secret detected in staged changes"
  read -p "Continue anyway? (y/n): " CONFIRM
  [ "$CONFIRM" != "y" ] && exit 1
fi

echo "✅ Pre-commit checks passed"
```

### Task 3: Commit Message Validation (Git Hook)

```bash
#!/bin/bash
# .git/hooks/commit-msg

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# CRITICAL: Check for AI attribution
if echo "$COMMIT_MSG" | grep -iE "(Generated with.*Claude|Co-Authored-By:.*Claude|🤖)"; then
  echo ""
  echo "❌ FORBIDDEN: AI attribution detected in commit message!"
  echo ""
  echo "Remove these lines:"
  echo "  - '🤖 Generated with Claude Code'"
  echo "  - 'Co-Authored-By: Claude'"
  echo ""
  exit 1
fi

# Conventional Commits regex (Enterprise scopes)
REGEX="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|security)(\(.+\))?: .{1,50}"

if ! echo "$COMMIT_MSG" | grep -qE "$REGEX"; then
  echo ""
  echo "❌ Invalid commit message format"
  echo ""
  echo "Format: <type>(<scope>): <subject>"
  echo ""
  echo "Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert, security"
  echo ""
  echo "Scopes (Enterprise):"
  echo "  API:      api, web-ui, extension"
  echo "  Workers:  detection, semantic, pii, arbiter, logging"
  echo "  Services: presidio, language"
  echo "  Packages: sdk, nats, shared"
  echo "  Infra:    docker, k8s, helm, grafana, clickhouse"
  echo "  Other:    auth, config, tests, docs, ci"
  echo ""
  echo "Examples:"
  echo "  feat(arbiter): add weighted fusion"
  echo "  fix(detection): correct pattern timeout"
  echo "  security(auth): fix timing attack"
  echo ""
  exit 1
fi

# Check subject length
SUBJECT=$(echo "$COMMIT_MSG" | head -1 | sed 's/^[^:]*: //')
if [ ${#SUBJECT} -gt 50 ]; then
  echo "⚠️  Warning: Subject line should be ≤50 characters (current: ${#SUBJECT})"
fi

echo "✅ Commit message format valid (no AI attribution)"
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

### Task 5: Semantic Versioning Helper

```bash
#!/bin/bash
# scripts/bump-version.sh

CURRENT_VERSION=$(git describe --tags --abbrev=0 | sed 's/v//')
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

echo "Current version: $CURRENT_VERSION"
echo ""
echo "Select version bump:"
echo "1) Major (breaking changes): $((MAJOR+1)).0.0"
echo "2) Minor (new features): $MAJOR.$((MINOR+1)).0"
echo "3) Patch (bug fixes): $MAJOR.$MINOR.$((PATCH+1))"
read -p "Choice: " BUMP

case $BUMP in
  1) NEW_VERSION="$((MAJOR+1)).0.0" ;;
  2) NEW_VERSION="$MAJOR.$((MINOR+1)).0" ;;
  3) NEW_VERSION="$MAJOR.$MINOR.$((PATCH+1))" ;;
  *) echo "Invalid choice"; exit 1 ;;
esac

echo ""
echo "New version: v$NEW_VERSION"
read -p "Create tag? (y/n): " CONFIRM

if [ "$CONFIRM" = "y" ]; then
  # NO AI attribution in tag message!
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
  3. Commit docs changes (NO AI attribution!)
```

### With security-audit-scanner:
```yaml
when: Security fix committed
action:
  1. Use "security" type
  2. Include CVE if applicable
  3. Update SECURITY.md if needed
```

## Quick Reference

```bash
# Install hooks (validates no AI attribution)
cp scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

cp scripts/commit-msg.sh .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg

# Generate CHANGELOG
./scripts/generate-changelog.sh v1.0.0 > CHANGELOG.md

# Smart commit (no AI attribution)
./scripts/smart-commit.sh

# Bump version
./scripts/bump-version.sh

# Fix accidental AI attribution
git commit --amend  # Remove AI lines from message
```

## Enterprise Commit Examples

```bash
# API feature
git commit -m "feat(api): add batch processing endpoint

- Support up to 100 texts per request
- Add concurrent worker distribution via NATS
- Return aggregated results with request IDs"

# Worker fix
git commit -m "fix(semantic): handle embedding timeout gracefully

- Add 2000ms timeout for embedding generation
- Return degraded result instead of error
- Log warning for monitoring"

# Security fix
git commit -m "security(nats): add TLS for production connections

- Configure TLS certificates for NATS
- Update worker connection strings
- Add cert rotation documentation"

# Infrastructure change
git commit -m "chore(docker): optimize worker images

- Use multi-stage builds for smaller images
- Pin Node.js version to 20.18-alpine
- Reduce image size by 40%"
```

---

**Format:** Conventional Commits 1.0.0
**Validation:** Pre-commit hooks (AI attribution check)
**Scopes:** Updated for Enterprise (NATS workers, packages)
**CRITICAL:** NO AI ATTRIBUTION IN COMMITS

## Version History

- **v1.0.0** (Current): Enterprise NATS worker scopes, pnpm integration
- **v0.x** (PoC): Legacy scopes, npm integration
