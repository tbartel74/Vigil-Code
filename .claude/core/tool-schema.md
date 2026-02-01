# Tool Schema v4.0

Tool usage patterns and examples for technology expert agents.

---

## Tool Categories

### Always Available
| Tool | Purpose | When to Use |
|------|---------|-------------|
| Read | Read file contents | Examining code, configs, docs |
| Edit | Modify existing files | Targeted changes to files |
| Glob | Find files by pattern | Locate files by name/extension |
| Grep | Search file contents | Find patterns in code |

### On-Demand
| Tool | Purpose | When to Use |
|------|---------|-------------|
| Write | Create new files | New components, fixtures, configs |
| Bash | Execute commands | Git, npm, docker, testing |
| Task | Spawn subagents | Delegate to other experts |
| WebFetch | Fetch web content | Official documentation |
| WebSearch | Search the web | Edge cases, community solutions |

---

## Tool Examples

### Read
```yaml
- description: "Read configuration file"
  parameters:
    file_path: "services/detection-worker/config/rules.config.json"
  expected: "JSON with detection categories and patterns"
```

### Grep
```yaml
- description: "Find all route definitions"
  parameters:
    pattern: "router\\.(get|post|put|delete)"
    path: "apps/api/src/routes/"
    output_mode: "content"
  expected: "Express route definitions"
```

### Bash
```yaml
- description: "Run test suite"
  parameters:
    command: "pnpm test -- services/detection-worker"
  expected: "Vitest output with pass/fail counts"
```

### WebFetch
```yaml
- description: "Fetch NATS JetStream documentation"
  parameters:
    url: "https://docs.nats.io/nats-concepts/jetstream"
    prompt: "Extract stream and consumer configuration options"
  expected: "Stream: retention, max_msgs. Consumer: ack_policy, max_deliver"
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
            │       glob: "**/*.test.ts"
            │
            └── By content → Use Grep
                    pattern: "describe\\("
                    output_mode: "files_with_matches"
```

---

## Common Patterns

### Pattern 1: Find and Read
```
1. Glob("**/*.config.ts") → List of config files
2. Read(config_files[0]) → Full content
```

### Pattern 2: Search and Examine
```
1. Grep("export class", output_mode: "files_with_matches") → Files with classes
2. Read(specific_file) → Full content
```

### Pattern 3: Edit Workflow
```
1. Read(file) → Understand current state (REQUIRED before Edit)
2. Edit(file, old_string, new_string) → Make change
3. [Optional] Bash("pnpm test") → Verify change
```

---

## Expert Tool Allocation

| Expert | Always | On-Demand |
|--------|--------|-----------|
| nats-expert | Read, Edit, Glob, Grep | Write, Bash, Task, WebFetch |
| express-expert | Read, Edit, Glob, Grep | Write, Bash, Task, WebFetch |
| vitest-expert | Read, Edit, Glob, Grep | Write, Bash, Task, WebFetch |
| docker-expert | Read, Edit, Glob, Grep | Write, Bash, Task, WebFetch |
| react-expert | Read, Edit, Glob, Grep | Write, Bash, Task, WebFetch |
| presidio-expert | Read, Edit, Glob, Grep | Write, Bash, Task, WebFetch |
| security-expert | Read, Edit, Glob, Grep | Write, Bash, Task, WebFetch |
| helm-expert | Read, Edit, Glob, Grep | Write, Bash, Task, WebFetch |
| kubernetes-expert | Read, Edit, Glob, Grep | Write, Bash, Task, WebFetch |
| clickhouse-expert | Read, Edit, Glob, Grep | Bash, WebFetch |
| git-expert | Read, Glob, Grep | Bash, WebFetch |
| tailwind-expert | Read, Edit, Glob, Grep | Write, WebFetch |

---

## Status Definitions

| Status | Meaning | Next Action |
|--------|---------|-------------|
| success | Task fully completed | None required |
| partial | Task partially completed | Continue with next_steps |
| failed | Task could not be completed | Review findings for cause |
| blocked | External blocker encountered | Escalate to user |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 4.0 | 2026-01-31 | Simplified, removed token calculations |
| 3.1 | 2025-12-01 | Initial tool schema specification |
