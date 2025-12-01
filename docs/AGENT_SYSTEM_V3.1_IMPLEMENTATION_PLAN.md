# Agent System v3.1 Implementation Plan

## Anthropic Advanced Tool Use Integration

**Document Version:** 1.0.0
**Date:** 2025-12-01
**Base Version:** v3.0 Technology Expert System
**Target Version:** v3.1 with Anthropic Best Practices

---

## Executive Summary

This plan integrates Anthropic's latest recommendations for advanced tool use and multi-agent systems into our v3.0 Technology Expert framework. The upgrade focuses on:

1. **OODA Loop Protocol** - Structured decision-making for subagents
2. **Tool Categorization** - Core/Extended/Deferred loading
3. **Tool Use Examples** - Parameter usage patterns (72%→90% accuracy)
4. **Checkpointing & Retry** - Resilience for long-running tasks
5. **Output Schemas** - Structured responses per expert
6. **Batch Operations** - Programmatic tool calling patterns

**Expected Impact:**
- Token reduction: 30-50%
- Accuracy improvement: 15-25%
- Resilience: 3x retry capability
- Cost reduction: ~40%

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Target Architecture v3.1](#2-target-architecture-v31)
3. [Implementation Phases](#3-implementation-phases)
4. [Detailed Specifications](#4-detailed-specifications)
5. [File Changes Matrix](#5-file-changes-matrix)
6. [Testing Strategy](#6-testing-strategy)
7. [Rollback Plan](#7-rollback-plan)
8. [Success Metrics](#8-success-metrics)

---

## 1. Current State Assessment

### 1.1 What We Have (v3.0)

```yaml
Strengths:
  - Orchestrator-Worker pattern: ✅
  - Model selection (Opus/Sonnet): ✅
  - Parallel execution support: ✅
  - Trigger-based routing: ✅
  - 3-Tier knowledge model: ✅
  - YAML frontmatter: ✅
  - Progress file v3.0: ✅

Gaps:
  - OODA protocol: ❌
  - Tool categorization: ❌
  - Tool examples: ❌
  - Checkpointing: ❌
  - Output schemas: ❌
  - Batch operations: ❌
  - Token tracking: ❌
```

### 1.2 Current AGENT.md Structure

```yaml
---
name: expert-name
description: |
  Expert description
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebFetch
  - WebSearch
model: sonnet
triggers:
  - keyword1
  - keyword2
---

# Expert Name

## Core Knowledge (Tier 1)
...

## Documentation Sources (Tier 2)
...

## Response Format
...
```

### 1.3 Current progress.json Schema

```json
{
  "schema_version": "3.0",
  "workflow_id": "wf-...",
  "status": "in_progress",
  "planning": {
    "thinking_budget": "extended",
    "strategy": "sequential"
  },
  "steps": [],
  "clean_state": {
    "tests_passing": null,
    "no_regressions": null
  }
}
```

---

## 2. Target Architecture v3.1

### 2.1 Enhanced AGENT.md Structure

```yaml
---
# === IDENTITY ===
name: n8n-expert
version: "3.1"
description: |
  n8n workflow automation expert with deep knowledge of
  Code nodes, webhooks, and workflow patterns.

# === MODEL CONFIGURATION ===
model: sonnet
thinking: extended  # NEW: extended | standard | minimal

# === TOOL CONFIGURATION ===
tools:
  core:           # Always loaded (~2K tokens)
    - Read
    - Edit
    - Glob
    - Grep
  extended:       # Loaded on first use (~1K tokens)
    - Write
    - Bash
  deferred:       # Discovered via Tool Search (~500 tokens saved)
    - WebFetch
    - WebSearch
    - NotebookEdit

# === TOOL EXAMPLES ===
tool-examples:
  Read:
    - description: "Read n8n workflow JSON"
      parameters:
        file_path: "/services/workflow/workflows/Vigil-Guard-v1.7.0.json"
      expected: "Full workflow with 40+ nodes"
  WebFetch:
    - description: "Fetch n8n Code node documentation"
      parameters:
        url: "https://docs.n8n.io/code/builtin/current-node-input/"
        prompt: "Extract all methods for $input object"
      expected: "Methods: all(), first(), last(), item, params"
  Grep:
    - description: "Find all Code nodes in workflow"
      parameters:
        pattern: '"type":\\s*"n8n-nodes-base\\.code"'
        path: "services/workflow/"
        output_mode: "content"

# === ROUTING ===
triggers:
  primary:        # High confidence routing
    - "n8n"
    - "workflow"
    - "Code node"
  secondary:      # Medium confidence, may need orchestrator
    - "automation"
    - "webhook"
    - "node"

# === OUTPUT SCHEMA ===
output-schema:
  type: object
  required:
    - status
    - findings
    - actions_taken
  properties:
    status:
      enum: [success, partial, failed, blocked]
    findings:
      type: array
      items:
        type: string
    actions_taken:
      type: array
      items:
        type: object
        properties:
          tool: { type: string }
          target: { type: string }
          result: { type: string }
    next_steps:
      type: array
      items:
        type: string
    handoff:
      type: object
      properties:
        to_expert: { type: string }
        reason: { type: string }
        context: { type: string }
---
```

### 2.2 Enhanced progress.json Schema (v3.1)

```json
{
  "schema_version": "3.1",
  "workflow_id": "wf-20251201-abc123",
  "created_at": "2025-12-01T10:00:00Z",
  "updated_at": "2025-12-01T10:05:00Z",

  "task": {
    "original_request": "Add SQL injection detection with tests",
    "summary": "TDD workflow: create test → add pattern → verify",
    "complexity": "medium",
    "estimated_steps": 3
  },

  "planning": {
    "thinking_budget": "extended",
    "strategy": "sequential",
    "model_override": null,
    "plan": [
      "1. Create test fixture for SQL injection",
      "2. Add detection pattern via n8n workflow",
      "3. Run tests to verify detection"
    ]
  },

  "classification": {
    "primary_expert": "vitest-expert",
    "supporting_experts": ["n8n-expert"],
    "execution_order": ["vitest-expert", "n8n-expert", "vitest-expert"],
    "parallel_eligible": false
  },

  "token_budget": {
    "allocated": 50000,
    "used": 12500,
    "remaining": 37500,
    "per_step_avg": 4166
  },

  "steps": [
    {
      "id": 1,
      "expert": "vitest-expert",
      "action": "create_test",
      "status": "completed",
      "started_at": "2025-12-01T10:00:05Z",
      "completed_at": "2025-12-01T10:01:30Z",
      "duration_seconds": 85,
      "tokens_used": 5200,
      "ooda": {
        "observe": "No existing SQL injection tests found",
        "orient": "Need fixture in tests/fixtures/malicious/",
        "decide": "Create sql-injection.json with 5 payloads",
        "act": "Write fixture, add test case"
      },
      "output": {
        "status": "success",
        "findings": ["Created tests/fixtures/malicious/sql-injection.json"],
        "actions_taken": [
          {"tool": "Write", "target": "sql-injection.json", "result": "created"}
        ]
      },
      "checkpoint": {
        "id": "cp-001",
        "state_hash": "a1b2c3d4",
        "restorable": true
      }
    }
  ],

  "current_step": {
    "id": 2,
    "expert": "n8n-expert",
    "action": "add_pattern",
    "status": "in_progress",
    "ooda": {
      "observe": "Test created, pattern needed in rules.config.json",
      "orient": "Use Web UI or direct workflow edit",
      "decide": null,
      "act": null
    }
  },

  "checkpoints": [
    {
      "id": "cp-001",
      "step_id": 1,
      "timestamp": "2025-12-01T10:01:30Z",
      "state_hash": "a1b2c3d4",
      "files_modified": ["tests/fixtures/malicious/sql-injection.json"],
      "git_ref": "abc123"
    }
  ],

  "retry_policy": {
    "max_retries": 3,
    "current_retries": 0,
    "backoff_seconds": [5, 15, 45],
    "last_error": null
  },

  "clean_state": {
    "tests_passing": true,
    "no_regressions": true,
    "lint_clean": true,
    "ready_to_merge": false
  },

  "metadata": {
    "initiated_by": "user",
    "session_id": "sess-xyz",
    "parent_workflow": null
  }
}
```

### 2.3 OODA Protocol Specification

```markdown
## OODA Loop Protocol for Subagents

Every expert MUST follow the OODA loop before and after tool use:

### Before Action (Planning)

```
🔍 OBSERVE
├── Read progress.json for current state
├── Understand what has been gathered so far
├── Identify gaps in information
└── Note any blockers or dependencies

🧭 ORIENT
├── Evaluate which tools are best for objective
├── Consider alternative approaches
├── Assess confidence level (high/medium/low)
└── Identify potential failure modes

🎯 DECIDE
├── Choose specific action with reasoning
├── Define expected outcome
├── Set success criteria
└── Plan fallback if action fails

▶️ ACT
├── Execute chosen tool
├── Capture full output
├── Update progress.json
└── Prepare for evaluation
```

### After Action (Evaluation)

```
🔄 INTERLEAVED THINKING
├── Evaluate tool output against expectations
├── Identify what was learned
├── Spot gaps that remain
├── Refine next query/action
└── Update OODA state in progress.json
```

### Example OODA in Practice

```json
{
  "ooda": {
    "observe": "User wants SQL injection detection. Checked tests/ - no existing SQL tests. Checked rules.config.json - no SQL_INJECTION category.",
    "orient": "TDD approach required. Need: 1) test fixture, 2) test case, 3) pattern. vitest-expert should create test first.",
    "decide": "Create fixture at tests/fixtures/malicious/sql-injection.json with UNION SELECT, OR 1=1, DROP TABLE payloads. Confidence: HIGH.",
    "act": "Using Write tool to create fixture file."
  }
}
```

### OODA Quality Checklist

- [ ] OBSERVE references specific files/data examined
- [ ] ORIENT considers 2+ alternative approaches
- [ ] DECIDE includes confidence level
- [ ] ACT specifies exact tool and parameters
- [ ] Post-action evaluation updates all fields
```

### 2.4 Batch Operations Pattern

```markdown
## Batch Operations Protocol

When processing multiple files/items, use batch scripts instead of individual tool calls.

### Anti-Pattern (Token Expensive)

```
Expert makes 10 Read calls:
  Read(file1.ts) → 500 tokens
  Read(file2.ts) → 500 tokens
  ...
  Read(file10.ts) → 500 tokens

Total: 5000 tokens + 10 round-trips
```

### Recommended Pattern (Token Efficient)

```bash
# Expert generates batch script
#!/bin/bash
for file in $(find services -name "*.ts" | head -20); do
  echo "=== $file ==="
  grep -n "@claude-context" "$file" 2>/dev/null | head -5
done
```

```
Expert makes 1 Bash call:
  Bash(script) → 800 tokens

Total: 800 tokens + 1 round-trip
Savings: 84%
```

### Batch Operation Templates

**Template 1: Multi-File Search**
```bash
# Find all files matching pattern and extract context
find services -name "*.ts" -exec grep -l "pattern" {} \; | \
  while read f; do
    echo "FILE: $f"
    grep -n "pattern" "$f" | head -3
  done
```

**Template 2: Aggregate Analysis**
```bash
# Count occurrences across codebase
echo "=== Pattern Distribution ==="
for dir in services/*/; do
  count=$(grep -r "pattern" "$dir" 2>/dev/null | wc -l)
  echo "$dir: $count matches"
done
```

**Template 3: Batch Transformation**
```bash
# Apply transformation to multiple files
for file in $(grep -l "old_pattern" services/**/*.ts); do
  sed -i 's/old_pattern/new_pattern/g' "$file"
  echo "Updated: $file"
done
```

### When to Use Batch Operations

| Scenario | Threshold | Action |
|----------|-----------|--------|
| File search | >3 files | Use Bash + find/grep |
| Content extraction | >5 files | Use Bash + loop |
| Pattern replacement | >2 files | Use Bash + sed |
| Analysis | >10 items | Generate Python script |
```

---

## 3. Implementation Phases

### Phase 1: Foundation (Days 1-2)

**Objective:** Add OODA protocol and tool examples without breaking changes.

#### Tasks

| Task | File | Effort | Priority |
|------|------|--------|----------|
| 1.1 Add OODA protocol to protocols.md | `.claude/core/protocols.md` | 2h | P0 |
| 1.2 Add OODA section to each AGENT.md | `.claude/agents/*/AGENT.md` | 3h | P0 |
| 1.3 Update progress.json schema to v3.1 | `.claude/core/protocols.md` | 1h | P0 |
| 1.4 Add tool-examples to 3 critical experts | n8n, vitest, react | 2h | P1 |
| 1.5 Document batch operations pattern | `.claude/core/protocols.md` | 1h | P1 |

#### Deliverables

- [ ] `protocols.md` updated with OODA and batch operations
- [ ] All 12 AGENT.md files have OODA section
- [ ] progress.json v3.1 schema documented
- [ ] Tool examples in n8n-expert, vitest-expert, react-expert

#### Validation

```bash
# Check OODA in all agents
for f in .claude/agents/*/AGENT.md; do
  if grep -q "OODA" "$f"; then
    echo "✅ $f"
  else
    echo "❌ $f missing OODA"
  fi
done
```

---

### Phase 2: Tool Optimization (Days 3-4)

**Objective:** Implement tool categorization and deferred loading pattern.

#### Tasks

| Task | File | Effort | Priority |
|------|------|--------|----------|
| 2.1 Define tool categories schema | `.claude/core/tool-schema.md` | 2h | P0 |
| 2.2 Update AGENT.md frontmatter format | All agents | 3h | P0 |
| 2.3 Add tool-examples to remaining experts | 9 experts | 4h | P1 |
| 2.4 Create tool loading documentation | `.claude/core/protocols.md` | 1h | P1 |
| 2.5 Add output-schema to all experts | All agents | 3h | P2 |

#### New File: `.claude/core/tool-schema.md`

```markdown
# Tool Schema v3.1

## Tool Categories

### Core Tools (Always Loaded)
These tools are essential for basic operations and loaded in every expert context.

| Tool | Tokens | Purpose |
|------|--------|---------|
| Read | ~200 | Read file contents |
| Edit | ~300 | Modify existing files |
| Glob | ~150 | Find files by pattern |
| Grep | ~200 | Search file contents |

**Total Core: ~850 tokens**

### Extended Tools (On-Demand)
Loaded when expert first requests them.

| Tool | Tokens | Purpose |
|------|--------|---------|
| Write | ~250 | Create new files |
| Bash | ~300 | Execute commands |
| Task | ~400 | Spawn subagents |

**Total Extended: ~950 tokens**

### Deferred Tools (Discovery-Based)
Not loaded until explicitly discovered via search.

| Tool | Tokens | Purpose |
|------|--------|---------|
| WebFetch | ~350 | Fetch web content |
| WebSearch | ~300 | Search the web |
| NotebookEdit | ~400 | Edit Jupyter notebooks |

**Total Deferred: ~1050 tokens**

## Loading Strategy

```
Session Start
    │
    ▼
Load Core Tools (~850 tokens)
    │
    ▼
Expert Activated
    │
    ├─── First Write/Bash needed ──► Load Extended (~950 tokens)
    │
    └─── Documentation lookup needed ──► Discover Deferred via search
```

## Token Savings Calculation

| Scenario | Traditional | v3.1 | Savings |
|----------|------------|------|---------|
| Simple file edit | 2850 | 850 | 70% |
| Code + search | 2850 | 1800 | 37% |
| Full toolkit | 2850 | 2850 | 0% |

**Average savings: 35-50%**
```

#### Deliverables

- [ ] `tool-schema.md` created with full specification
- [ ] All AGENT.md files updated with tool categories
- [ ] All AGENT.md files have tool-examples
- [ ] All AGENT.md files have output-schema

---

### Phase 3: Resilience (Days 5-6)

**Objective:** Implement checkpointing and retry logic.

#### Tasks

| Task | File | Effort | Priority |
|------|------|--------|----------|
| 3.1 Design checkpoint format | `.claude/core/protocols.md` | 2h | P0 |
| 3.2 Add checkpoint logic to orchestrator | `orchestrator/AGENT.md` | 2h | P0 |
| 3.3 Define retry policies | `.claude/core/protocols.md` | 1h | P1 |
| 3.4 Create recovery procedures | `.claude/core/protocols.md` | 2h | P1 |
| 3.5 Add error taxonomy | `.claude/core/protocols.md` | 1h | P2 |

#### Checkpoint Specification

```markdown
## Checkpoint Protocol

### When to Checkpoint

| Event | Action | Priority |
|-------|--------|----------|
| Step completed successfully | Create checkpoint | REQUIRED |
| Before risky operation | Create checkpoint | REQUIRED |
| After 5 minutes of work | Create checkpoint | RECOMMENDED |
| Before handoff to another expert | Create checkpoint | REQUIRED |

### Checkpoint Structure

```json
{
  "id": "cp-001",
  "step_id": 1,
  "timestamp": "2025-12-01T10:01:30Z",
  "type": "step_complete",
  "state": {
    "progress_snapshot": { ... },
    "files_modified": ["path/to/file.ts"],
    "git_status": {
      "ref": "abc123",
      "dirty_files": []
    }
  },
  "restorable": true,
  "restore_command": "git checkout abc123 -- path/to/file.ts"
}
```

### Recovery Procedures

**Procedure 1: Tool Failure**
```
1. Log error in progress.json
2. Increment retry_count
3. If retry_count < max_retries:
   a. Wait backoff_seconds[retry_count]
   b. Retry with same parameters
4. If retry_count >= max_retries:
   a. Mark step as "blocked"
   b. Create diagnostic report
   c. Handoff to orchestrator for decision
```

**Procedure 2: Expert Timeout**
```
1. Save current OODA state to checkpoint
2. Log timeout in progress.json
3. If recoverable:
   a. Resume from last checkpoint
4. If not recoverable:
   a. Rollback to previous checkpoint
   b. Try alternative approach
```

**Procedure 3: Validation Failure**
```
1. Save failing state
2. Analyze failure cause (OODA observe)
3. If fixable:
   a. Apply fix
   b. Re-validate
4. If not fixable:
   a. Rollback to last clean checkpoint
   b. Report to user
```
```

#### Error Taxonomy

```markdown
## Error Categories

### Recoverable Errors (Retry)

| Code | Error | Retry Strategy |
|------|-------|----------------|
| E001 | Network timeout | Exponential backoff, max 3 |
| E002 | Rate limit | Wait + retry after delay |
| E003 | Transient file lock | Wait 5s, retry |
| E004 | WebFetch 5xx | Retry with backoff |

### Soft Errors (Alternative Approach)

| Code | Error | Alternative |
|------|-------|-------------|
| E101 | File not found | Search with Glob |
| E102 | Pattern not found | Broaden search |
| E103 | WebFetch 404 | Try WebSearch |
| E104 | Tool not available | Use alternative tool |

### Hard Errors (Escalate)

| Code | Error | Action |
|------|-------|--------|
| E201 | Permission denied | Report to user |
| E202 | Out of tokens | Save state, request continuation |
| E203 | Conflicting edits | Request user resolution |
| E204 | Security violation | Halt and report |
```

#### Deliverables

- [ ] Checkpoint protocol documented
- [ ] Retry policies defined for all error types
- [ ] Recovery procedures for 3 failure modes
- [ ] Error taxonomy with 12+ error codes
- [ ] Orchestrator updated with checkpoint management

---

### Phase 4: Integration & Testing (Days 7-8)

**Objective:** Integrate all components and validate.

#### Tasks

| Task | File | Effort | Priority |
|------|------|--------|----------|
| 4.1 Update /expert command | `.claude/commands/expert.md` | 2h | P0 |
| 4.2 Create integration tests | `tests/agent-system/` | 4h | P0 |
| 4.3 Update README.md | `.claude/README.md` | 2h | P1 |
| 4.4 Create migration guide | `docs/V3.1_MIGRATION.md` | 2h | P1 |
| 4.5 Performance benchmarks | `docs/BENCHMARKS.md` | 2h | P2 |

#### Integration Test Scenarios

```markdown
## Test Scenarios

### Scenario 1: Single Expert with OODA
```yaml
name: "Simple file search"
expert: n8n-expert
input: "Find all Code nodes in the workflow"
expected:
  - OODA state populated in response
  - Batch grep used (not multiple Grep calls)
  - Token usage < 3000
```

### Scenario 2: Multi-Expert Handoff
```yaml
name: "TDD workflow"
input: "Add XSS detection with tests"
expected_sequence:
  1. orchestrator creates plan
  2. vitest-expert creates test (checkpoint)
  3. n8n-expert adds pattern (checkpoint)
  4. vitest-expert verifies
expected:
  - 2 checkpoints created
  - All OODA states populated
  - Token usage < 15000
```

### Scenario 3: Error Recovery
```yaml
name: "WebFetch failure recovery"
expert: react-expert
input: "Check React 19 breaking changes"
inject_failure: WebFetch returns 503
expected:
  - Retry attempted (max 3)
  - Falls back to WebSearch
  - Error logged in progress.json
```

### Scenario 4: Token Budget
```yaml
name: "Large codebase analysis"
input: "Analyze all components for accessibility"
token_budget: 20000
expected:
  - Batch operations used
  - Token tracking accurate
  - Stops before budget exceeded
```
```

#### Deliverables

- [ ] /expert command supports v3.1 features
- [ ] 4 integration test scenarios documented
- [ ] README.md updated with v3.1 features
- [ ] Migration guide for v3.0 → v3.1
- [ ] Performance benchmarks documented

---

### Phase 5: Optimization (Days 9-10)

**Objective:** Fine-tune and optimize based on testing.

#### Tasks

| Task | Effort | Priority |
|------|--------|----------|
| 5.1 Tune token budgets per expert | 2h | P1 |
| 5.2 Optimize batch operation templates | 2h | P1 |
| 5.3 Refine OODA prompts | 3h | P1 |
| 5.4 Add monitoring hooks | 2h | P2 |
| 5.5 Document lessons learned | 1h | P2 |

#### Monitoring Hooks

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [{
          "type": "command",
          "command": "echo \"$(date -Iseconds) | Tool: $(cat | jq -r .tool_name) | Tokens: estimated\" >> .claude/logs/tool-usage.log",
          "timeout": 2
        }]
      }
    ]
  }
}
```

---

## 4. Detailed Specifications

### 4.1 Updated AGENT.md Template

```yaml
---
# ╔══════════════════════════════════════════════════════════════╗
# ║                    AGENT CONFIGURATION v3.1                  ║
# ╚══════════════════════════════════════════════════════════════╝

# === IDENTITY ===
name: {expert-name}
version: "3.1"
description: |
  {One paragraph description of expertise}

# === MODEL CONFIGURATION ===
model: sonnet  # sonnet | opus
thinking: extended  # extended | standard | minimal

# === TOOL CONFIGURATION ===
tools:
  core:
    - Read
    - Edit
    - Glob
    - Grep
  extended:
    - Write
    - Bash
  deferred:
    - WebFetch
    - WebSearch

# === TOOL EXAMPLES ===
tool-examples:
  {ToolName}:
    - description: "{What this example demonstrates}"
      parameters:
        {param1}: "{value1}"
        {param2}: "{value2}"
      expected: "{Expected outcome}"

# === ROUTING ===
triggers:
  primary:
    - "{high-confidence-keyword}"
  secondary:
    - "{medium-confidence-keyword}"

# === OUTPUT SCHEMA ===
output-schema:
  type: object
  required: [status, findings, actions_taken]
  properties:
    status:
      enum: [success, partial, failed, blocked]
    findings:
      type: array
    actions_taken:
      type: array
    next_steps:
      type: array
    handoff:
      type: object

---

# {Expert Name}

## Core Knowledge (Tier 1)

{Essential knowledge that expert has in-context}

## OODA Protocol

Before each action, I follow the OODA loop:

### 🔍 OBSERVE
- Read progress.json for current state
- Examine relevant files and context
- Identify what information exists vs gaps

### 🧭 ORIENT
- Evaluate available tools for this objective
- Consider alternative approaches
- Assess confidence level (HIGH/MEDIUM/LOW)

### 🎯 DECIDE
- Choose specific action with reasoning
- Define expected outcome and success criteria
- Plan fallback if action fails

### ▶️ ACT
- Execute chosen tool
- Update progress.json with OODA state
- Evaluate results with interleaved thinking

## Batch Operations

When processing multiple files, I use batch scripts:

```bash
# Example: Find all relevant files
find services -name "*.{ext}" -exec grep -l "{pattern}" {} \;
```

## Documentation Sources (Tier 2)

| Source | URL | When to Use |
|--------|-----|-------------|
| {Official Docs} | {url} | {scenario} |

## Response Format

I always respond with structured output:

```json
{
  "status": "success|partial|failed|blocked",
  "findings": ["Finding 1", "Finding 2"],
  "actions_taken": [
    {"tool": "Read", "target": "file.ts", "result": "found pattern"}
  ],
  "next_steps": ["Step 1", "Step 2"],
  "ooda": {
    "observe": "What I examined",
    "orient": "Approaches considered",
    "decide": "Chosen action and why",
    "act": "Tool used and parameters"
  }
}
```

## Critical Rules

1. {Rule 1}
2. {Rule 2}
```

### 4.2 Orchestrator Enhancements

```markdown
## Orchestrator v3.1 Enhancements

### Checkpoint Management

The orchestrator is responsible for:
1. Creating checkpoints before each expert handoff
2. Storing checkpoint state in progress.json
3. Triggering recovery procedures on failure
4. Maintaining git refs for file rollback

### Token Budget Management

```python
def allocate_tokens(task_complexity, num_experts):
    base_budget = {
        "simple": 10000,
        "medium": 25000,
        "complex": 50000
    }
    per_expert = base_budget[task_complexity] / num_experts
    return {
        "total": base_budget[task_complexity],
        "per_expert": per_expert,
        "reserve": per_expert * 0.2  # 20% reserve
    }
```

### Expert Selection v3.1

```python
def select_expert(request, experts):
    scores = {}
    for expert in experts:
        score = 0
        # Primary triggers = high confidence
        for trigger in expert.triggers.primary:
            if trigger.lower() in request.lower():
                score += 10
        # Secondary triggers = medium confidence
        for trigger in expert.triggers.secondary:
            if trigger.lower() in request.lower():
                score += 5
        scores[expert.name] = score

    # If highest score < 10, use orchestrator for clarification
    if max(scores.values()) < 10:
        return "orchestrator"

    return max(scores, key=scores.get)
```

### Parallel Execution Decision

```python
def can_parallelize(steps):
    """Determine if steps can run in parallel"""
    for i, step in enumerate(steps):
        # Check if step depends on previous step's output
        if step.requires_input_from:
            return False
        # Check if steps modify same files
        if has_file_conflict(step, steps[:i]):
            return False
    return True
```
```

---

## 5. File Changes Matrix

| File | Phase | Change Type | Lines Added | Lines Removed |
|------|-------|-------------|-------------|---------------|
| `.claude/core/protocols.md` | 1,2,3 | Major update | ~400 | ~50 |
| `.claude/core/tool-schema.md` | 2 | New file | ~150 | 0 |
| `.claude/agents/orchestrator/AGENT.md` | 1,3 | Major update | ~100 | ~20 |
| `.claude/agents/n8n-expert/AGENT.md` | 1,2 | Major update | ~80 | ~10 |
| `.claude/agents/vitest-expert/AGENT.md` | 1,2 | Major update | ~80 | ~10 |
| `.claude/agents/react-expert/AGENT.md` | 1,2 | Major update | ~80 | ~10 |
| `.claude/agents/*/AGENT.md` (9 others) | 1,2 | Update | ~60 each | ~10 each |
| `.claude/commands/expert.md` | 4 | Update | ~50 | ~20 |
| `.claude/README.md` | 4 | Update | ~100 | ~30 |
| `docs/V3.1_MIGRATION.md` | 4 | New file | ~200 | 0 |
| `docs/BENCHMARKS.md` | 4 | New file | ~100 | 0 |

**Total Estimated:**
- New lines: ~1,500
- Removed lines: ~200
- New files: 3
- Modified files: 17

---

## 6. Testing Strategy

### 6.1 Unit Tests

```bash
# Validate AGENT.md frontmatter
for f in .claude/agents/*/AGENT.md; do
  yq eval '.tools.core' "$f" > /dev/null || echo "❌ Invalid tools.core in $f"
  yq eval '.tool-examples' "$f" > /dev/null || echo "❌ Invalid tool-examples in $f"
  yq eval '.output-schema' "$f" > /dev/null || echo "❌ Invalid output-schema in $f"
done
```

### 6.2 Integration Tests

| Test | Input | Expected Output |
|------|-------|-----------------|
| OODA tracking | "Find config files" | Response contains ooda.observe, ooda.decide |
| Batch operations | "Search 20 files" | Single Bash call, not 20 Grep calls |
| Checkpoint creation | Multi-step task | progress.json has checkpoints array |
| Error recovery | Inject WebFetch 503 | Retry logged, fallback attempted |
| Token tracking | 10K budget task | Stops before exceeding budget |

### 6.3 Performance Benchmarks

| Metric | v3.0 Baseline | v3.1 Target | Measurement |
|--------|---------------|-------------|-------------|
| Tokens per simple task | 5000 | 3000 | API logs |
| Tokens per complex task | 30000 | 18000 | API logs |
| Time to first action | 5s | 3s | Stopwatch |
| Error recovery rate | 60% | 90% | Test suite |
| Checkpoint coverage | 0% | 100% | progress.json audit |

---

## 7. Rollback Plan

### 7.1 Rollback Triggers

| Condition | Action |
|-----------|--------|
| >20% accuracy regression | Rollback to v3.0 |
| >50% token increase | Rollback to v3.0 |
| Critical bug in orchestrator | Rollback orchestrator only |
| Tool examples cause errors | Remove tool-examples section |

### 7.2 Rollback Procedure

```bash
# Full rollback to v3.0
git checkout v3.0 -- .claude/

# Partial rollback (keep OODA, remove tool categories)
git checkout v3.0 -- .claude/agents/*/AGENT.md
# Then manually re-add OODA sections
```

### 7.3 Feature Flags

```json
{
  "agent_system": {
    "version": "3.1",
    "features": {
      "ooda_protocol": true,
      "tool_categories": true,
      "tool_examples": true,
      "checkpointing": true,
      "batch_operations": true,
      "token_tracking": false
    }
  }
}
```

---

## 8. Success Metrics

### 8.1 Quantitative

| Metric | Current (v3.0) | Target (v3.1) | Measurement |
|--------|----------------|---------------|-------------|
| Token usage (simple) | 5000 | 3000 (-40%) | API metrics |
| Token usage (complex) | 30000 | 18000 (-40%) | API metrics |
| Tool accuracy | 75% | 90% (+15pp) | Test results |
| Error recovery | 60% | 90% (+30pp) | Test results |
| OODA compliance | 0% | 100% | Response audit |
| Checkpoint coverage | 0% | 100% | progress.json |

### 8.2 Qualitative

| Metric | Measurement Method |
|--------|-------------------|
| Response quality | Manual review of 20 interactions |
| OODA clarity | Can human understand reasoning? |
| Batch efficiency | Are batch ops used appropriately? |
| Error messages | Are they actionable? |

### 8.3 Success Criteria

**Phase 1 Complete:**
- [ ] All 12 agents have OODA section
- [ ] 3 agents have tool-examples
- [ ] progress.json v3.1 schema works

**Phase 2 Complete:**
- [ ] All agents have tool categories
- [ ] All agents have tool-examples
- [ ] All agents have output-schema

**Phase 3 Complete:**
- [ ] Checkpointing works for multi-step tasks
- [ ] Retry logic handles 3 error types
- [ ] Recovery procedures documented

**Phase 4 Complete:**
- [ ] Integration tests pass
- [ ] README updated
- [ ] Migration guide complete

**Phase 5 Complete:**
- [ ] Token usage reduced by 30%+
- [ ] Accuracy improved by 15%+
- [ ] All benchmarks documented

---

## Appendix A: Quick Reference

### Command Cheatsheet

```bash
# Validate all AGENT.md files
./scripts/validate-agents.sh

# Run integration tests
./scripts/test-agent-system.sh

# Measure token usage
./scripts/benchmark-tokens.sh

# Check OODA compliance
./scripts/audit-ooda.sh
```

### File Locations

```
.claude/
├── agents/
│   └── */AGENT.md          # Expert definitions (v3.1)
├── core/
│   ├── protocols.md        # Shared protocols (v3.1)
│   └── tool-schema.md      # Tool categories (NEW)
├── commands/
│   └── expert.md           # /expert command (updated)
├── state/
│   └── progress.json       # Workflow state (v3.1 schema)
└── README.md               # System overview (updated)
```

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 3.0 | 2025-11-27 | Initial technology expert system |
| 3.1 | 2025-12-01 | Anthropic best practices integration |

---

**Document Status:** Ready for Implementation
**Estimated Effort:** 10 days (2 weeks with buffer)
**Required Resources:** 1 developer
**Dependencies:** Claude Code hooks, YAML parser

