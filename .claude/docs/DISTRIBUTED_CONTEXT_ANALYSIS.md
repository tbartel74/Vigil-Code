# Distributed Context Architecture - Comprehensive Analysis

**Document Version:** 1.0.0
**Date:** 2025-11-30
**Status:** Analysis Phase
**Author:** Technology Expert System

---

## Executive Summary

This document analyzes the feasibility and implementation strategy for a **Distributed Context System** - an architecture where AI context information is embedded directly in source files and automatically aggregated, rather than maintained in a single monolithic CLAUDE.md file.

**Key Finding:** The concept is viable and solves real problems, but requires careful implementation to avoid creating new failure modes.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Proposed Architecture](#2-proposed-architecture)
3. [Positive Scenarios (Benefits)](#3-positive-scenarios-benefits)
4. [Negative Scenarios (Risks)](#4-negative-scenarios-risks)
5. [Implementation Strategies Comparison](#5-implementation-strategies-comparison)
6. [Recommended Implementation](#6-recommended-implementation)
7. [Migration Plan](#7-migration-plan)
8. [Success Metrics](#8-success-metrics)

---

## 1. Current State Analysis

### 1.1 CLAUDE.md Pain Points

**Current Statistics:**
- **Size:** 1,570 lines (54 KB)
- **Sections:** 25+ major sections
- **Update Frequency:** 2-5x per week during active development
- **Staleness Risk:** HIGH - information becomes outdated within days

**Identified Problems:**

| Problem | Severity | Impact |
|---------|----------|--------|
| **Monolithic file** | HIGH | Cannot be holistically analyzed by AI in one pass |
| **Manual synchronization** | HIGH | Human must remember to update after code changes |
| **Context collision** | MEDIUM | Sections reference things that no longer exist |
| **No versioning per section** | MEDIUM | Can't tell which sections are stale |
| **Cognitive overload** | MEDIUM | 1,570 lines is overwhelming to maintain |
| **Duplicate information** | LOW | Same info in CLAUDE.md and code comments |

### 1.2 Current Information Distribution

```
CLAUDE.md (1,570 lines)
├── Crown Rules (100 lines) - CRITICAL, rarely changes
├── Technology Experts (200 lines) - STABLE, updated with agent changes
├── Project Overview (150 lines) - STABLE, version bumps only
├── Repository Structure (100 lines) - CHANGES with file additions
├── Key Commands (80 lines) - STABLE
├── Critical Constraints (200 lines) - CHANGES with architecture
├── Architecture Overview (150 lines) - CHANGES with services
├── Testing Strategy (100 lines) - CHANGES with test additions
├── Security Best Practices (150 lines) - STABLE
├── Troubleshooting (100 lines) - GROWS with issues
├── Environment Variables (80 lines) - CHANGES with config
└── Version History (160 lines) - GROWS with releases
```

**Analysis:** ~40% of content is stable, ~60% changes with code

### 1.3 Files That Generate Context

| File Type | Count | Context Relevance |
|-----------|-------|-------------------|
| TypeScript/JavaScript | 50+ | API endpoints, business logic |
| React Components | 30+ | UI structure, state management |
| JSON Configs | 5 | Detection rules, unified settings |
| Docker files | 3 | Service architecture |
| Python scripts | 10+ | PII detection, language detection |
| Workflow JSON | 1 | 40-node detection pipeline |

---

## 2. Proposed Architecture

### 2.1 Core Concept

```
┌─────────────────────────────────────────────────────────────────┐
│                    DISTRIBUTED CONTEXT                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ server.ts    │  │ PIISettings  │  │ rules.config │         │
│  │ @context     │  │ @context     │  │ @context     │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│                           ▼                                     │
│              ┌───────────────────────────┐                     │
│              │   Aggregation Script      │                     │
│              │   (generate-context.sh)   │                     │
│              └───────────────────────────┘                     │
│                           │                                     │
│                           ▼                                     │
│              ┌───────────────────────────┐                     │
│              │   aggregated-context.md   │                     │
│              │   (auto-generated)        │                     │
│              └───────────────────────────┘                     │
│                           │                                     │
│                           ▼                                     │
│              ┌───────────────────────────┐                     │
│              │       CLAUDE.md           │                     │
│              │   (imports aggregated)    │                     │
│              └───────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Context Block Format

**Option A: Comment-Based (Language-Agnostic)**

```typescript
/**
 * @claude-context
 * ## Express Backend Server
 *
 * ### Purpose
 * Main API server for Vigil Guard Web UI
 *
 * ### Key Endpoints
 * - POST /api/config/:file - Save configuration (ETag required)
 * - GET /api/pii-detection/analyze - Dual-language PII detection
 * - POST /api/auth/login - JWT authentication
 *
 * ### Constraints
 * - Rate limiting: 5 login attempts / 15 min
 * - ETag concurrency control for all config operations
 * - JWT tokens expire after 24 hours
 *
 * ### Dependencies
 * - ClickHouse (port 8123) for logging
 * - Presidio PII API (port 5001) for entity detection
 *
 * @last-updated 2025-11-30
 * @maintainer backend-team
 * @end-claude-context
 */
```

**Option B: Frontmatter-Based (Markdown/YAML)**

```yaml
---
claude-context:
  component: Express Backend Server
  purpose: Main API server for Vigil Guard Web UI
  endpoints:
    - "POST /api/config/:file - Save configuration"
    - "GET /api/pii-detection/analyze - Dual-language PII"
  constraints:
    - "Rate limiting: 5 attempts / 15 min"
    - "ETag concurrency control"
  dependencies:
    - "ClickHouse:8123"
    - "Presidio:5001"
  last-updated: 2025-11-30
---
```

**Option C: Inline Helpers (For Variables/Config)**

```json
{
  "categories": {
    "SQL_INJECTION": {
      "_claude_helper": "Detects SQL injection attempts. Patterns include UNION SELECT, OR 1=1, DROP TABLE. Score range: 75-90. False positive rate: <2%.",
      "patterns": ["UNION.*SELECT", "OR\\s+1\\s*=\\s*1"],
      "score": 85
    }
  }
}
```

### 2.3 Aggregation Mechanisms

**Mechanism 1: Script-Based (Manual/CI)**

```bash
#!/bin/bash
# scripts/aggregate-context.sh

OUTPUT=".claude/context/aggregated.md"
echo "# Auto-Generated Context" > $OUTPUT
echo "Generated: $(date -Iseconds)" >> $OUTPUT
echo "" >> $OUTPUT

# Scan TypeScript files
for file in $(find services -name "*.ts" -o -name "*.tsx"); do
  context=$(sed -n '/@claude-context/,/@end-claude-context/p' "$file" | \
            grep -v '@claude-context' | grep -v '@end-claude-context')
  if [ -n "$context" ]; then
    echo "## $(basename $file)" >> $OUTPUT
    echo "**Path:** \`$file\`" >> $OUTPUT
    echo "" >> $OUTPUT
    echo "$context" >> $OUTPUT
    echo "" >> $OUTPUT
  fi
done
```

**Mechanism 2: Hook-Based (Automatic)**

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{
          "type": "command",
          "command": "node .claude/scripts/update-context.js \"$(cat | jq -r '.tool_input.file_path')\"",
          "timeout": 10
        }]
      }
    ]
  }
}
```

**Mechanism 3: SessionStart Injection**

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [{
          "type": "command",
          "command": ".claude/scripts/aggregate-context.sh && cat .claude/context/aggregated.md",
          "timeout": 30
        }]
      }
    ]
  }
}
```

---

## 3. Positive Scenarios (Benefits)

### 3.1 Scenario: Developer Edits Component File

**Current Flow (Monolithic):**
```
1. Developer edits PIISettings.tsx
2. Component behavior changes
3. CLAUDE.md still describes old behavior
4. AI reads stale CLAUDE.md
5. AI gives incorrect advice based on outdated info
6. Developer frustrated, manually updates CLAUDE.md
7. Repeat every time...
```

**Proposed Flow (Distributed):**
```
1. Developer edits PIISettings.tsx
2. Developer updates @claude-context block in same file
3. PostToolUse hook detects Edit to .tsx file
4. Hook runs update-context.js for that file
5. aggregated.md updated automatically
6. Next AI interaction has fresh context
```

**Benefit:** Context update is **co-located** with code change - intuitive and automatic

### 3.2 Scenario: New Endpoint Added

**Current Flow:**
```
1. Developer adds /api/retention endpoint to server.ts
2. Developer forgets to update CLAUDE.md
3. AI doesn't know endpoint exists
4. User asks "how do I configure retention?"
5. AI searches, finds nothing, hallucinates
```

**Proposed Flow:**
```
1. Developer adds /api/retention endpoint
2. Developer adds endpoint to @claude-context in server.ts
3. Hook aggregates automatically
4. AI knows about new endpoint immediately
```

**Benefit:** **Single source of truth** - code and documentation in one place

### 3.3 Scenario: Configuration File Changes

**Current Flow:**
```
1. User adds new detection category to rules.config.json via Web UI
2. 829-line file updated
3. CLAUDE.md says "34 categories" (now 35)
4. AI gives incorrect count
```

**Proposed Flow (with inline helpers):**
```json
{
  "_claude_meta": {
    "description": "Detection patterns for prompt injection",
    "category_count": "auto-calculated",
    "last_modified": "auto-updated"
  },
  "categories": { ... }
}
```

**Benefit:** **Self-describing data** - metadata travels with data

### 3.4 Scenario: Multi-Developer Team

**Current Flow:**
```
1. Dev A edits backend, updates their section of CLAUDE.md
2. Dev B edits frontend, updates their section
3. Both push at same time
4. Merge conflict in CLAUDE.md
5. Resolution loses one developer's updates
```

**Proposed Flow:**
```
1. Dev A edits backend/src/server.ts (includes @context)
2. Dev B edits frontend/src/PIISettings.tsx (includes @context)
3. Both push - no conflict (different files)
4. Aggregation script runs on both changes
5. Both contexts preserved
```

**Benefit:** **No merge conflicts** on context updates

### 3.5 Scenario: Large Codebase Navigation

**Current Flow:**
```
1. AI needs to understand project architecture
2. Reads 1,570-line CLAUDE.md
3. Context window partially consumed
4. Deeper file exploration limited
```

**Proposed Flow:**
```
1. AI gets aggregated context (relevant sections only)
2. When editing specific file, reads local @context
3. Context is always file-relevant
4. More room for actual code analysis
```

**Benefit:** **Contextual relevance** - right information at right time

### 3.6 Quantified Benefits

| Metric | Current | Proposed | Improvement |
|--------|---------|----------|-------------|
| Context staleness | Days | Hours | 10x faster |
| Manual update burden | High | Low | 80% reduction |
| Merge conflicts | Common | Rare | 90% reduction |
| Context relevance | Global | Local | Higher precision |
| Onboarding time | High | Medium | 30% faster |

---

## 4. Negative Scenarios (Risks)

### 4.1 Risk: Context Fragmentation

**Scenario:**
```
1. Context scattered across 50+ files
2. AI can't see full picture
3. Contradictory information in different files
4. No single source of truth for architecture
```

**Impact:** HIGH - AI gives conflicting advice

**Mitigation:**
- Keep CLAUDE.md for **global rules** and **architecture overview**
- Distributed context only for **file-specific** details
- Aggregation script detects contradictions
- Regular validation pass (weekly CI job)

### 4.2 Risk: Hook Failures

**Scenario:**
```
1. PostToolUse hook fails silently
2. Context not updated
3. User unaware of failure
4. Stale context persists
```

**Impact:** MEDIUM - Same as current situation (no worse)

**Mitigation:**
- Hooks write to `.claude/context/last-update.log`
- SessionStart hook checks last update timestamp
- Warning if context older than 24 hours
- Fallback: Manual `./scripts/aggregate-context.sh`

```bash
# In SessionStart hook
LAST_UPDATE=$(stat -c %Y .claude/context/aggregated.md 2>/dev/null || echo 0)
NOW=$(date +%s)
AGE=$((NOW - LAST_UPDATE))
if [ $AGE -gt 86400 ]; then
  echo "⚠️ WARNING: Context is $(($AGE / 3600)) hours old. Run ./scripts/aggregate-context.sh"
fi
```

### 4.3 Risk: Developer Adoption Failure

**Scenario:**
```
1. System requires developers to write @context blocks
2. Developers skip it (extra work)
3. Context becomes incomplete
4. System worse than monolithic approach
```

**Impact:** HIGH - System fails without adoption

**Mitigation:**
- **Automated templates** - scaffolding adds @context
- **CI validation** - fail PR if new file lacks @context
- **IDE snippets** - quick insertion
- **Minimal required fields** - just purpose + last-updated
- **Gradual rollout** - start with critical files only

```yaml
# .github/workflows/context-check.yml
- name: Check context blocks
  run: |
    for file in $(git diff --name-only HEAD~1 -- '*.ts' '*.tsx'); do
      if ! grep -q '@claude-context' "$file"; then
        echo "❌ Missing @claude-context in $file"
        exit 1
      fi
    done
```

### 4.4 Risk: Context Block Pollution

**Scenario:**
```
1. Every file has 50-line @context block
2. Actual code buried under documentation
3. Files become 30% documentation
4. Code readability suffers
```

**Impact:** MEDIUM - Developer experience degradation

**Mitigation:**
- **Size limits** - max 20 lines per @context block
- **Separate files allowed** - `ComponentName.context.md`
- **Linting** - warn if @context exceeds threshold
- **Essential only** - purpose, constraints, dependencies

```javascript
// ESLint rule for context block size
module.exports = {
  rules: {
    'claude-context-size': {
      create(context) {
        return {
          Program(node) {
            const comments = context.getSourceCode().getAllComments();
            const contextBlock = comments.find(c => c.value.includes('@claude-context'));
            if (contextBlock && contextBlock.value.split('\n').length > 25) {
              context.report({
                node,
                message: '@claude-context block exceeds 25 lines. Consider extracting to .context.md file.'
              });
            }
          }
        };
      }
    }
  }
};
```

### 4.5 Risk: Aggregation Performance

**Scenario:**
```
1. 500+ files with @context blocks
2. Aggregation script takes 30+ seconds
3. Hook timeout (60s default) becomes issue
4. SessionStart delayed significantly
```

**Impact:** LOW-MEDIUM - UX degradation

**Mitigation:**
- **Incremental updates** - only process changed files
- **Caching** - hash-based invalidation
- **Async aggregation** - run in background
- **File count threshold** - warn if >200 context files

```bash
#!/bin/bash
# Incremental aggregation with caching

CACHE_DIR=".claude/context/.cache"
mkdir -p "$CACHE_DIR"

for file in $(find services -name "*.ts" -newer "$CACHE_DIR/.last-run" 2>/dev/null); do
  HASH=$(md5sum "$file" | cut -d' ' -f1)
  CACHE_FILE="$CACHE_DIR/$HASH.md"

  if [ ! -f "$CACHE_FILE" ]; then
    extract_context "$file" > "$CACHE_FILE"
  fi
done

cat "$CACHE_DIR"/*.md > .claude/context/aggregated.md
touch "$CACHE_DIR/.last-run"
```

### 4.6 Risk: Security - Context Injection

**Scenario:**
```
1. Malicious actor adds @context with misleading info
2. AI follows malicious instructions
3. Code security compromised
```

**Impact:** HIGH - Security vulnerability

**Mitigation:**
- **Code review** - @context changes reviewed like code
- **No executable instructions** - context is descriptive only
- **Sanitization** - strip suspicious patterns from context
- **Audit log** - track all @context changes

```bash
# In aggregation script - sanitize dangerous patterns
sanitize_context() {
  sed -e 's/ignore previous instructions//gi' \
      -e 's/you are now//gi' \
      -e 's/forget everything//gi' \
      -e 's/system prompt//gi'
}
```

### 4.7 Risk: Loss of Global Perspective

**Scenario:**
```
1. All context is file-local
2. AI doesn't understand cross-cutting concerns
3. Architecture decisions made without full picture
4. System becomes inconsistent
```

**Impact:** MEDIUM - Architectural drift

**Mitigation:**
- **Preserve CLAUDE.md** for global concerns:
  - Crown rules
  - Architecture overview
  - Cross-cutting constraints
  - Security policies
- Distributed context supplements, doesn't replace

### 4.8 Risk Matrix Summary

| Risk | Probability | Impact | Risk Score | Mitigation Effort |
|------|-------------|--------|------------|-------------------|
| Context fragmentation | Medium | High | 6 | Medium |
| Hook failures | Low | Medium | 2 | Low |
| Developer adoption | Medium | High | 6 | High |
| Context pollution | Medium | Medium | 4 | Low |
| Aggregation performance | Low | Low | 1 | Low |
| Security injection | Low | High | 3 | Medium |
| Loss of global view | Medium | Medium | 4 | Low |

---

## 5. Implementation Strategies Comparison

### 5.1 Strategy A: Full Distribution

**Description:** All context in source files, no central CLAUDE.md

**Pros:**
- Maximum locality
- No duplication
- Always up-to-date

**Cons:**
- No global overview
- Fragmented architecture knowledge
- Steep learning curve

**Verdict:** ❌ Too extreme - loses valuable global context

### 5.2 Strategy B: Hybrid (Recommended)

**Description:** Global rules in CLAUDE.md, file-specific context distributed

**Architecture:**
```
CLAUDE.md (500 lines)
├── Crown Rules (100 lines) - NEVER distributed
├── Architecture Overview (150 lines) - Global only
├── Security Policies (100 lines) - Global only
├── Quick Reference (100 lines) - Global only
└── @import .claude/context/aggregated.md (50 lines summary)

+ Distributed @context blocks in 30-50 critical files
+ Auto-aggregation via hooks
```

**Pros:**
- Preserves global perspective
- File-local details distributed
- Gradual migration possible
- Best of both worlds

**Cons:**
- Two systems to maintain
- Potential duplication
- More complex tooling

**Verdict:** ✅ **Recommended** - balanced approach

### 5.3 Strategy C: Sidebar Files

**Description:** Each source file has companion `.context.md`

```
services/web-ui/backend/src/
├── server.ts
├── server.context.md    # Claude context for server.ts
├── piiAnalyzer.ts
├── piiAnalyzer.context.md
```

**Pros:**
- No code pollution
- Full markdown support
- Easy to review

**Cons:**
- File count doubles
- Easy to forget companion file
- Harder to keep in sync

**Verdict:** ⚠️ Viable alternative - consider for large files only

### 5.4 Strategy D: Schema-Driven

**Description:** Define schema, generate context from code analysis

```yaml
# .claude/context-schema.yml
sources:
  - type: typescript
    patterns:
      - "export class * {"     # Extract class names
      - "app.post\\('.*'"      # Extract API endpoints
      - "@deprecated"          # Extract deprecations
```

**Pros:**
- Zero manual maintenance
- Always accurate
- No developer burden

**Cons:**
- Complex to implement
- Misses semantic meaning
- Can't capture intent

**Verdict:** ⚠️ Useful supplement - not a replacement

### 5.5 Strategy Comparison Matrix

| Criteria | Full Dist. | Hybrid | Sidebar | Schema |
|----------|------------|--------|---------|--------|
| Global context | ❌ | ✅ | ⚠️ | ❌ |
| File locality | ✅ | ✅ | ✅ | ⚠️ |
| Maintenance burden | Medium | Low | High | Very Low |
| Accuracy | High | High | High | Medium |
| Developer adoption | Hard | Medium | Easy | N/A |
| Implementation effort | Medium | Medium | Low | High |
| Risk level | High | Low | Medium | Medium |

---

## 6. Recommended Implementation

### 6.1 Architecture: Hybrid Approach

```
┌─────────────────────────────────────────────────────────────────┐
│                    HYBRID CONTEXT SYSTEM                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     CLAUDE.md                            │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │ TIER 1: Global Rules (NEVER distributed)        │    │   │
│  │  │ - Crown Rules                                   │    │   │
│  │  │ - Architecture Overview                         │    │   │
│  │  │ - Security Policies                             │    │   │
│  │  │ - Technology Experts Reference                  │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │ TIER 2: Aggregated Context (auto-imported)      │    │   │
│  │  │ @import .claude/context/services-summary.md     │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              DISTRIBUTED @CONTEXT BLOCKS                 │   │
│  │                                                          │   │
│  │  server.ts ──────► services-summary.md                  │   │
│  │  PIISettings.tsx ──► services-summary.md                │   │
│  │  rules.config.json ► services-summary.md                │   │
│  │                                                          │   │
│  │  Aggregation: PostToolUse hook + SessionStart rebuild   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Context Block Specification

**Required Format:**

```typescript
/**
 * @claude-context
 * @component [Component Name]
 * @purpose [One-line description]
 *
 * ## Key Information
 * [2-5 bullet points of critical information]
 *
 * ## Constraints
 * [Important limitations or requirements]
 *
 * ## Dependencies
 * [External services or files this depends on]
 *
 * @updated [YYYY-MM-DD]
 * @end-claude-context
 */
```

**Size Limits:**
- Minimum: 5 lines (purpose only)
- Maximum: 25 lines
- Recommended: 10-15 lines

**Required Metadata:**
- `@component` - Name for aggregation
- `@purpose` - What this file does
- `@updated` - Last update date

**Optional Metadata:**
- `@dependencies` - What this file needs
- `@constraints` - Limitations
- `@api` - Public interface summary
- `@security` - Security considerations

### 6.3 File Priority for Distribution

**Phase 1: Critical Files (Week 1)**

| File | Priority | Reason |
|------|----------|--------|
| `server.ts` | P0 | Main API, all endpoints |
| `piiAnalyzer.ts` | P0 | Complex dual-language logic |
| `rules.config.json` | P0 | 829 lines, 34 categories |
| `Vigil-Guard-v1.7.0.json` | P0 | 40-node workflow |
| `PIISettings.tsx` | P1 | Complex UI state |

**Phase 2: Important Files (Week 2-3)**

| File | Priority | Reason |
|------|----------|--------|
| `ConfigSection.tsx` | P1 | getCurrentValue pattern |
| `unified_config.json` | P1 | Main settings |
| `docker-compose.yml` | P2 | 9 services |
| `install.sh` | P2 | 2000+ line setup |

**Phase 3: Supporting Files (Week 4+)**

- All React components with complex state
- All API route handlers
- Test helper files

### 6.4 Aggregation Script Design

```bash
#!/bin/bash
# .claude/scripts/aggregate-context.sh

set -e

OUTPUT_DIR=".claude/context"
OUTPUT_FILE="$OUTPUT_DIR/services-summary.md"
TEMP_FILE="$OUTPUT_DIR/.temp-aggregate.md"
CACHE_DIR="$OUTPUT_DIR/.cache"

mkdir -p "$OUTPUT_DIR" "$CACHE_DIR"

# Header
cat > "$TEMP_FILE" << 'EOF'
# Auto-Generated Service Context

> **Warning:** This file is auto-generated. Do not edit directly.
> Edit @claude-context blocks in source files instead.

**Last Updated:** $(date -Iseconds)
**Files Processed:** 0

---

EOF

FILE_COUNT=0

# Process TypeScript files
for file in $(find services -name "*.ts" -o -name "*.tsx" 2>/dev/null); do
  if grep -q '@claude-context' "$file" 2>/dev/null; then
    COMPONENT=$(grep '@component' "$file" | sed 's/.*@component //')

    echo "## $COMPONENT" >> "$TEMP_FILE"
    echo "**Source:** \`$file\`" >> "$TEMP_FILE"
    echo "" >> "$TEMP_FILE"

    # Extract context block
    sed -n '/@claude-context/,/@end-claude-context/p' "$file" | \
      grep -v '@claude-context' | \
      grep -v '@end-claude-context' | \
      grep -v '@component' | \
      grep -v '@updated' | \
      sed 's/^ \* //' | \
      sed 's/^\* //' >> "$TEMP_FILE"

    echo "" >> "$TEMP_FILE"
    echo "---" >> "$TEMP_FILE"
    echo "" >> "$TEMP_FILE"

    ((FILE_COUNT++))
  fi
done

# Process JSON files with _claude_context
for file in $(find services -name "*.json" 2>/dev/null); do
  if grep -q '"_claude_context"' "$file" 2>/dev/null; then
    NAME=$(basename "$file" .json)

    echo "## $NAME" >> "$TEMP_FILE"
    echo "**Source:** \`$file\`" >> "$TEMP_FILE"
    echo "" >> "$TEMP_FILE"

    # Extract _claude_context value
    jq -r '._claude_context // empty' "$file" 2>/dev/null >> "$TEMP_FILE"

    echo "" >> "$TEMP_FILE"
    echo "---" >> "$TEMP_FILE"
    echo "" >> "$TEMP_FILE"

    ((FILE_COUNT++))
  fi
done

# Update file count in header
sed -i "s/Files Processed:.*/Files Processed: $FILE_COUNT/" "$TEMP_FILE"
sed -i "s/\$(date -Iseconds)/$(date -Iseconds)/" "$TEMP_FILE"

# Atomic replace
mv "$TEMP_FILE" "$OUTPUT_FILE"

echo "✅ Aggregated $FILE_COUNT files to $OUTPUT_FILE"
```

### 6.5 Hook Configuration

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "FILE=$(cat | jq -r '.tool_input.file_path // empty'); if [[ \"$FILE\" =~ \\.(ts|tsx|json)$ ]] && grep -q '@claude-context\\|_claude_context' \"$FILE\" 2>/dev/null; then .claude/scripts/aggregate-context.sh > /dev/null 2>&1 & fi",
            "timeout": 5
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/scripts/aggregate-context.sh && echo '📚 Context aggregated from source files'",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

### 6.6 CLAUDE.md Integration

Add to CLAUDE.md (replace detailed sections):

```markdown
## Service Context (Auto-Aggregated)

> The following context is automatically aggregated from @claude-context blocks
> in source files. For details, see the source file directly.

<!-- BEGIN AUTO-AGGREGATED CONTEXT -->
@import .claude/context/services-summary.md
<!-- END AUTO-AGGREGATED CONTEXT -->

**To update:** Edit @claude-context blocks in source files.
Context aggregates automatically via hooks.
```

---

## 7. Migration Plan

### 7.1 Phase 1: Foundation (Week 1)

**Tasks:**
1. Create `.claude/scripts/aggregate-context.sh`
2. Create `.claude/context/` directory structure
3. Add hooks to `.claude/settings.local.json`
4. Add @context blocks to 5 critical files
5. Test aggregation manually

**Success Criteria:**
- [ ] Script extracts context from 5 files
- [ ] Hook triggers on file edit
- [ ] aggregated.md generated correctly

### 7.2 Phase 2: Migration (Week 2-3)

**Tasks:**
1. Add @context to 20 priority files
2. Remove migrated sections from CLAUDE.md
3. Add @import to CLAUDE.md
4. Create CI validation workflow
5. Document @context format in CONTRIBUTING.md

**Success Criteria:**
- [ ] CLAUDE.md reduced by 40%
- [ ] No information loss
- [ ] CI catches missing @context

### 7.3 Phase 3: Optimization (Week 4)

**Tasks:**
1. Add incremental caching to aggregation
2. Add context validation (contradictions)
3. Add staleness warnings
4. Create IDE snippets for @context
5. Train team on workflow

**Success Criteria:**
- [ ] Aggregation < 5 seconds
- [ ] Staleness warning in SessionStart
- [ ] Team adoption > 80%

### 7.4 Migration Checklist

```markdown
## @context Migration Checklist

### Critical Files (P0)
- [ ] services/web-ui/backend/src/server.ts
- [ ] services/web-ui/backend/src/piiAnalyzer.ts
- [ ] services/workflow/config/rules.config.json
- [ ] services/workflow/workflows/Vigil-Guard-v1.7.0.json
- [ ] services/web-ui/frontend/src/components/PIISettings.tsx

### Important Files (P1)
- [ ] services/web-ui/frontend/src/components/ConfigSection.tsx
- [ ] services/workflow/config/unified_config.json
- [ ] services/presidio-pii-api/app.py
- [ ] services/language-detector/app.py

### Supporting Files (P2)
- [ ] docker-compose.yml
- [ ] install.sh
- [ ] services/web-ui/frontend/src/routes.tsx
```

---

## 8. Success Metrics

### 8.1 Quantitative Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| CLAUDE.md size | 1,570 lines | <800 lines | Line count |
| Context staleness | Days | <24 hours | Last-updated checks |
| Manual updates/week | 5 | <1 | Git commits to CLAUDE.md |
| Merge conflicts | 3/month | 0/month | Git history |
| Hook success rate | N/A | >99% | Hook logs |
| Aggregation time | N/A | <5s | Script timing |

### 8.2 Qualitative Metrics

| Metric | Measurement Method |
|--------|-------------------|
| AI response accuracy | Manual review of 20 interactions/week |
| Developer satisfaction | Survey after 1 month |
| Context completeness | Audit of AI misunderstandings |
| System maintainability | Time to add new service |

### 8.3 Health Check Script

```bash
#!/bin/bash
# .claude/scripts/health-check.sh

echo "🔍 Distributed Context Health Check"
echo "===================================="

# Check 1: Aggregation freshness
LAST_UPDATE=$(stat -c %Y .claude/context/services-summary.md 2>/dev/null || echo 0)
NOW=$(date +%s)
AGE_HOURS=$(( (NOW - LAST_UPDATE) / 3600 ))
if [ $AGE_HOURS -gt 24 ]; then
  echo "⚠️  Context is $AGE_HOURS hours old (should be <24)"
else
  echo "✅ Context freshness: ${AGE_HOURS}h old"
fi

# Check 2: File coverage
TOTAL_TS=$(find services -name "*.ts" -o -name "*.tsx" | wc -l)
WITH_CONTEXT=$(grep -l '@claude-context' $(find services -name "*.ts" -o -name "*.tsx" 2>/dev/null) 2>/dev/null | wc -l)
COVERAGE=$((WITH_CONTEXT * 100 / TOTAL_TS))
if [ $COVERAGE -lt 30 ]; then
  echo "⚠️  Context coverage: ${COVERAGE}% (target: >30%)"
else
  echo "✅ Context coverage: ${COVERAGE}%"
fi

# Check 3: CLAUDE.md size
CLAUDE_LINES=$(wc -l < CLAUDE.md)
if [ $CLAUDE_LINES -gt 1000 ]; then
  echo "⚠️  CLAUDE.md: ${CLAUDE_LINES} lines (target: <800)"
else
  echo "✅ CLAUDE.md size: ${CLAUDE_LINES} lines"
fi

# Check 4: Hook configuration
if grep -q 'aggregate-context' .claude/settings.local.json 2>/dev/null; then
  echo "✅ Aggregation hook configured"
else
  echo "❌ Aggregation hook NOT configured"
fi

echo ""
echo "Run './scripts/aggregate-context.sh' to refresh context"
```

---

## 9. Conclusion

### 9.1 Recommendation

**Implement the Hybrid Approach** with:

1. **Keep CLAUDE.md** for global rules, architecture, security
2. **Distribute @context** to 30-50 critical source files
3. **Auto-aggregate** via PostToolUse and SessionStart hooks
4. **Gradual migration** over 4 weeks
5. **CI validation** to ensure adoption

### 9.2 Expected Outcomes

**After 1 month:**
- CLAUDE.md reduced from 1,570 to ~700 lines
- Context staleness reduced from days to hours
- Zero merge conflicts on context
- Developer adoption >80%

**After 3 months:**
- AI response accuracy improved measurably
- System fully self-documenting
- New files automatically prompt for @context
- Team considers it "how we work"

### 9.3 Risk Assessment

**Overall Risk Level: MEDIUM**

The hybrid approach minimizes risk by:
- Preserving global context in CLAUDE.md
- Gradual migration (no big-bang)
- Fallback to manual aggregation if hooks fail
- CI validation catching gaps

### 9.4 Next Steps

1. ✅ Complete this analysis document
2. ⏳ Review with team
3. ⏳ Implement Phase 1 (foundation scripts)
4. ⏳ Pilot with 5 critical files
5. ⏳ Measure and iterate

---

**Document Status:** Ready for Review
**Estimated Implementation:** 4 weeks
**Required Resources:** 1 developer (part-time)
**Dependencies:** Claude Code hooks feature (available)

