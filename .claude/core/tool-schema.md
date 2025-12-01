# Tool Schema v3.1

> Defines tool categorization, loading strategies, and usage patterns for the technology expert system.

## Tool Categories

### Core Tools (Always Loaded)

These tools are essential for basic operations and loaded in every expert context.

| Tool | Tokens | Purpose | When to Use |
|------|--------|---------|-------------|
| Read | ~200 | Read file contents | Examining code, configs, docs |
| Edit | ~300 | Modify existing files | Targeted changes to files |
| Glob | ~150 | Find files by pattern | Locate files by name/extension |
| Grep | ~200 | Search file contents | Find patterns in code |

**Total Core: ~850 tokens**

**Usage Pattern:**
```
Expert receives task
    │
    ▼
Use Glob to find relevant files
    │
    ▼
Use Grep to narrow down content
    │
    ▼
Use Read to examine specific files
    │
    ▼
Use Edit to make changes
```

### Extended Tools (On-Demand)

Loaded when expert first requests them. Used for more complex operations.

| Tool | Tokens | Purpose | When to Use |
|------|--------|---------|-------------|
| Write | ~250 | Create new files | New components, fixtures, configs |
| Bash | ~300 | Execute commands | Git, npm, docker, testing |
| Task | ~400 | Spawn subagents | Delegate to other experts |

**Total Extended: ~950 tokens**

**Loading Trigger:**
```
Expert needs to:
├── Create new file → Load Write
├── Run command → Load Bash
└── Delegate task → Load Task
```

### Deferred Tools (Discovery-Based)

Not loaded until explicitly discovered via search. Reserved for external lookups.

| Tool | Tokens | Purpose | When to Use |
|------|--------|---------|-------------|
| WebFetch | ~350 | Fetch web content | Official documentation |
| WebSearch | ~300 | Search the web | Edge cases, community solutions |
| NotebookEdit | ~400 | Edit Jupyter notebooks | Data science workflows |

**Total Deferred: ~1050 tokens**

**Discovery Protocol:**
```
Expert uncertain about API/syntax
    │
    ▼
Check Tier 1 knowledge (in-context)
    │
    ├── Found? → Use it
    │
    └── Not found?
            │
            ▼
        Announce: "🔍 Fetching documentation..."
            │
            ▼
        Use WebFetch for official docs (Tier 2)
            │
            ├── Found? → Use + cite source
            │
            └── Not found?
                    │
                    ▼
                Use WebSearch for community (Tier 3)
```

---

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

### Token Budget by Task Type

| Task Type | Core | Extended | Deferred | Total |
|-----------|------|----------|----------|-------|
| Simple file edit | ✅ | - | - | ~850 |
| New component | ✅ | ✅ | - | ~1800 |
| Research task | ✅ | - | ✅ | ~2200 |
| Full implementation | ✅ | ✅ | ✅ | ~2850 |

---

## Token Savings Calculation

| Scenario | Traditional | v3.1 | Savings |
|----------|------------|------|---------|
| Simple file edit | 2850 | 850 | **70%** |
| Code + test | 2850 | 1800 | **37%** |
| Code + docs lookup | 2850 | 2200 | **23%** |
| Full toolkit | 2850 | 2850 | 0% |

**Average savings: 35-50%**

---

## Tool Examples Schema

Each expert should include tool examples in YAML frontmatter:

```yaml
tool-examples:
  ToolName:
    - description: "What the example demonstrates"
      parameters:
        param1: "value1"
        param2: "value2"
      expected: "What output to expect"
```

### Why Tool Examples Improve Accuracy

Per Anthropic's research:
- **Without examples:** 72% correct tool usage
- **With examples:** 90% correct tool usage
- **Improvement:** +25% accuracy

### Example Categories

**1. Read Examples**
```yaml
Read:
  - description: "Read configuration file"
    parameters:
      file_path: "services/workflow/config/rules.config.json"
    expected: "829-line JSON with 34 detection categories"
```

**2. Grep Examples**
```yaml
Grep:
  - description: "Find all route definitions"
    parameters:
      pattern: "@(Get|Post|Put|Delete)\\("
      path: "services/web-ui/backend/"
      output_mode: "content"
    expected: "Express route decorators with endpoints"
```

**3. Bash Examples**
```yaml
Bash:
  - description: "Run test suite"
    parameters:
      command: "cd services/workflow && npm test"
    expected: "Vitest output with pass/fail counts"
```

**4. WebFetch Examples**
```yaml
WebFetch:
  - description: "Fetch n8n Code node documentation"
    parameters:
      url: "https://docs.n8n.io/code/builtin/current-node-input/"
      prompt: "Extract $input methods and return formats"
    expected: "$input.first(), $input.all(), $input.item, return { json: {} }"
```

---

## Tool Selection Decision Tree

```
Task received
    │
    ▼
Is file location known?
    │
    ├── YES → Use Read directly
    │
    └── NO → Need to find files?
            │
            ├── By name pattern → Use Glob
            │       glob: "**/*.test.js"
            │
            └── By content → Use Grep
                    pattern: "describe\\("
                    output_mode: "files_with_matches"
                        │
                        ▼
                Read specific files from results
```

### Common Patterns

**Pattern 1: Find and Read**
```
1. Glob("**/*.config.js") → List of config files
2. Read(config_files[0]) → Full content
```

**Pattern 2: Search and Examine**
```
1. Grep("export.*function", output_mode: "files_with_matches") → Files with exports
2. Grep("export.*function", path: specific_file, output_mode: "content") → Actual exports
3. Read(specific_file, offset: line_number) → Context around match
```

**Pattern 3: Edit Workflow**
```
1. Read(file) → Understand current state (REQUIRED before Edit)
2. Edit(file, old_string, new_string) → Make change
3. [Optional] Bash("npm test") → Verify change
```

---

## Expert Tool Allocation

### By Expert Type

| Expert | Core | Extended | Deferred |
|--------|------|----------|----------|
| orchestrator | Read, Glob, Grep | Task | - |
| n8n-expert | Read, Edit, Glob, Grep | Write, Bash | WebFetch, WebSearch |
| vitest-expert | Read, Edit, Glob, Grep | Write, Bash | WebFetch, WebSearch |
| react-expert | Read, Edit, Glob, Grep | Write | WebFetch, WebSearch |
| express-expert | Read, Edit, Glob, Grep | Write, Bash | WebFetch, WebSearch |
| clickhouse-expert | Read, Edit, Glob, Grep | Bash | WebFetch, WebSearch |
| docker-expert | Read, Edit, Glob, Grep | Write, Bash | WebFetch, WebSearch |
| presidio-expert | Read, Edit, Glob, Grep | Write, Bash | WebFetch, WebSearch |
| security-expert | Read, Edit, Glob, Grep | Write, Bash | WebFetch, WebSearch |
| git-expert | Read, Glob, Grep | Bash | WebFetch, WebSearch |
| python-expert | Read, Edit, Glob, Grep | Write, Bash | WebFetch, WebSearch |
| tailwind-expert | Read, Edit, Glob, Grep | Write | WebFetch, WebSearch |

### Special Cases

**orchestrator**
- Uses Task tool extensively (spawns other experts)
- Does NOT use Edit (delegates changes to experts)
- Uses model: opus (higher reasoning for coordination)

**git-expert**
- Does NOT use Edit tool (git manages file changes)
- Bash is primary tool for git commands

**clickhouse-expert**
- Bash for SQL queries via `clickhouse-client`
- No Write (schema changes via SQL)

---

## Output Schema Standard

Every expert response should follow this schema:

```yaml
output-schema:
  type: object
  required: [status, findings, actions_taken, ooda]
  properties:
    status:
      enum: [success, partial, failed, blocked]
    findings:
      type: array
      description: "Key discoveries from investigation"
    actions_taken:
      type: array
      description: "Tools used and their results"
    ooda:
      type: object
      properties:
        observe: { type: string }
        orient: { type: string }
        decide: { type: string }
        act: { type: string }
    next_steps:
      type: array
      description: "Recommended follow-up actions"
```

### Status Definitions

| Status | Meaning | Next Action |
|--------|---------|-------------|
| success | Task fully completed | None required |
| partial | Task partially completed | Continue with next_steps |
| failed | Task could not be completed | Review findings for cause |
| blocked | External blocker encountered | Escalate to user |

---

## Batch Operations Integration

For operations spanning multiple files, use Bash with batch scripts:

```yaml
# In AGENT.md tool-examples:
Bash:
  - description: "Batch file analysis"
    parameters:
      command: |
        for f in $(find services -name "*.ts" | head -20); do
          echo "=== $f ==="
          grep -n "pattern" "$f" 2>/dev/null | head -3
        done
    expected: "Consolidated output from multiple files"
```

### When to Use Batch Operations

| Scenario | Threshold | Approach |
|----------|-----------|----------|
| File search | >3 files | Bash + find/grep |
| Content extraction | >5 files | Bash loop |
| Pattern replacement | >2 files | Bash + sed |
| Analysis | >10 items | Generate script |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 3.1 | 2025-12-01 | Initial tool schema specification |
| 3.0 | 2025-11-27 | Tool categories introduced in AGENT.md |
