# Core Protocols for Technology Expert Agents

This document defines shared protocols that all technology expert agents follow.

## 1. Progress File Protocol

All multi-step tasks use `.claude/state/progress.json` for state management.

### Progress File Schema

```json
{
  "version": "2.0",
  "workflow_id": "wf-{timestamp}-{random}",
  "created_at": "ISO8601",
  "updated_at": "ISO8601",

  "task": {
    "original_request": "User's original request",
    "summary": "Brief task summary",
    "project_context": {
      "name": "Project name (from CLAUDE.md or detected)",
      "root": "/path/to/project"
    }
  },

  "classification": {
    "primary_expert": "n8n-expert",
    "supporting_experts": ["vitest-expert"],
    "strategy": "sequential|parallel|single",
    "estimated_steps": 3
  },

  "status": "initialized|in_progress|completed|failed",
  "current_step": 1,
  "total_steps": 3,

  "completed_steps": [
    {
      "step": 1,
      "expert": "n8n-expert",
      "action": "analyze_workflow",
      "result": {},
      "artifacts": [],
      "duration_ms": 1200,
      "timestamp": "ISO8601"
    }
  ],

  "next_step": {
    "step": 2,
    "expert": "vitest-expert",
    "action": "create_test",
    "context": {}
  },

  "artifacts": {
    "files_created": [],
    "files_modified": [],
    "documentation_consulted": []
  },

  "errors": []
}
```

### Reading Progress
```
1. Check if .claude/state/progress.json exists
2. If exists and status != completed:
   - Resume from current_step
   - Use context from completed_steps
3. If not exists or completed:
   - Create new workflow
```

### Updating Progress
```
1. Update current step result in completed_steps
2. Increment current_step
3. Set next_step with context for next expert
4. Update artifacts with any files created/modified
5. Update timestamp
6. If final step: set status = "completed"
```

---

## 2. Documentation Protocol

All experts follow this protocol for knowledge verification.

### Confidence Levels

| Level | Description | Action |
|-------|-------------|--------|
| **HIGH** | Core knowledge, used daily | Answer directly |
| **MEDIUM** | Know the concept, unsure of details | Verify in docs first |
| **LOW** | Unfamiliar or edge case | Research thoroughly |

### Uncertainty Triggers

Fetch documentation when:
- Asked about specific API parameters
- Version-specific features
- Complex configuration options
- Error messages or codes
- Anything that might have changed recently

### Verification Pattern

```markdown
## High Confidence Response
[Direct answer with solution]

## Medium Confidence Response
🔍 Let me verify this in the documentation...
[Fetch docs]
✅ Confirmed: [solution]
Source: [url]

## Low Confidence Response
🔍 This requires research...
[Fetch docs + search community]
Based on my research: [solution]
Sources:
- Official: [url]
- Community: [url]
⚠️ Note: [any caveats]
```

### Documentation Fetching

```
WebFetch(
  url="[documentation_url]",
  prompt="Extract [specific information needed]"
)
```

### Community Search

```
WebSearch(
  query="[topic] site:[community_url] OR site:github.com/[repo]"
)
```

---

## 3. Expert Invocation Protocol

### Via Task Tool

Experts are invoked using the Task tool with focused prompts:

```
Task(
  prompt="""
  You are {expert-name}, a world-class expert in {technology}.

  ## Current Task
  Read .claude/state/progress.json for context.
  Execute: {action}

  ## Your Expertise
  [Core knowledge areas]

  ## Documentation Sources
  [Primary docs URL]

  ## Instructions
  1. Read progress file for context
  2. Apply your expertise
  3. If uncertain, consult documentation
  4. Update progress file with results
  5. Return brief summary
  """,
  subagent_type="general-purpose"
)
```

### Parallel Invocation

When experts are independent, invoke multiple in single message:

```
Task(expert1_prompt, subagent_type="general-purpose")
Task(expert2_prompt, subagent_type="general-purpose")
Task(expert3_prompt, subagent_type="general-purpose")
```

---

## 4. Response Format Protocol

### Progress Reporting (Orchestrator)

```
🎯 Task: [description]

📋 Classification:
   • Primary Expert: {expert}
   • Strategy: {strategy}
   • Steps: {n}

🤖 Step 1/{n}: {expert-name}
   ├─ ▶️  Action: {action}
   ├─ 📝 {progress message}
   └─ ✅ Completed ({duration})

🤖 Step 2/{n}: {expert-name}
   ...

═══════════════════════════════════════
✨ Task Completed in {total_duration}

📋 Summary:
   {what was accomplished}

📁 Artifacts:
   • {file1}
   • {file2}

💡 Next Steps (if any):
   1. {suggestion}
═══════════════════════════════════════
```

### Expert Response Format

```
## Action: {action_name}

### Analysis
{what I found/understood}

### Solution
{implementation details or guidance}

### Artifacts
- Created: {files}
- Modified: {files}

### Documentation Consulted
- {url}: {what was verified}

### Confidence: {HIGH|MEDIUM|LOW}
{any caveats or notes}
```

---

## 5. Error Handling Protocol

### When Expert Encounters Error

1. Log error in progress.json errors array
2. Attempt recovery if possible
3. If unrecoverable:
   - Set step status to "failed"
   - Provide clear error message
   - Suggest alternative approaches

### Error Response Format

```
❌ Error in {action}

**Problem:** {description}

**Attempted:** {what was tried}

**Suggestion:** {how to proceed}

**Documentation:** {relevant docs if applicable}
```

---

## 6. Project Context Protocol

### Detecting Project Context

1. Check for CLAUDE.md in project root
2. Check for package.json, docker-compose.yml, etc.
3. Extract relevant configuration
4. Store in progress.json task.project_context

### Using Project Context

- Experts read project-specific info from progress file
- Never hardcode project-specific paths
- Adapt solutions to project structure
- Reference project conventions from CLAUDE.md

---

## 7. Handoff Protocol

### Between Experts

When one expert hands off to another:

1. **Outgoing expert:**
   - Complete current step
   - Document all relevant context in next_step
   - List artifacts created
   - Note any decisions made

2. **Incoming expert:**
   - Read completed_steps for history
   - Read next_step for immediate context
   - Check artifacts for files to work with
   - Continue without re-doing previous work

### Context Passing Example

```json
{
  "next_step": {
    "expert": "vitest-expert",
    "action": "create_test",
    "context": {
      "pattern_to_test": "sql_injection_hex",
      "expected_result": "BLOCKED",
      "relevant_files": [
        "services/workflow/config/rules.config.json"
      ],
      "notes": "Pattern added at line 245, category CODE_INJECTION"
    }
  }
}
```
