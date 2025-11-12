---
name: vg
description: Universal command to invoke any Vigil Guard agent or orchestrator (project)
---

# Vigil Guard - Universal Agent Invocation

This is the **master command** for all Vigil Guard agents. Use it to invoke any agent directly or run the orchestrator.

## Usage

**Syntax:** `/vg [agent-name] [task]`

**Available agents:**
- `orchestrate` - Master Orchestrator (auto-selects agents)
- `test-automation` - Test management
- `workflow-business-logic` - Pattern configuration
- `pii-detection` - PII detection
- `backend-api` - Backend development
- `frontend-ui` - Frontend development
- `data-analytics` - Analytics and queries
- `workflow-infrastructure` - n8n workflow management
- `infrastructure-deployment` - Docker deployment
- `security-compliance` - Security audits
- `documentation` - Documentation

## Examples

```
/vg orchestrate Add SQL injection detection
/vg test-automation Run full test suite
/vg pii-detection Test PESEL detection
/vg backend-api Create user profile endpoint
```

## Execution Instructions

**CRITICAL:** When this command is invoked, you MUST:

1. **Parse the user's request** to extract:
   - Agent name (first word after /vg)
   - Task description (remaining words)

2. **If agent is "orchestrate":**
   - Use Task tool with subagent_type "Explore"
   - Read `.claude/master/orchestrator.js` and `.claude/core/task-classifier.js`
   - Analyze which agents should handle the task
   - Classify the task (detection, pii, testing, security, etc.)
   - Determine execution strategy (single, parallel, sequential, workflow)
   - Execute the task by coordinating appropriate vg-* agents
   - Show real-time progress with emoji indicators

3. **If agent is a specific agent name:**
   - Map to corresponding skill if available:
     - `test-automation` → Use skill `vigil-testing-e2e`
     - `pii-detection` → Use skill `n8n-vigil-workflow` (PII section)
     - `backend-api` → Direct implementation
     - etc.
   - OR use Task tool with subagent_type "Explore" to:
     - Read the agent's implementation at `.claude/agents/vg-[agent-name]/agent.js`
     - Understand agent capabilities
     - Execute the requested task
     - Return results

4. **Always show progress:**
   ```
   🎯 Task: [task description]
   🤖 Agent: vg-[agent-name]
   ▶️  Executing...
   ✅ Completed
   ```

## Important Notes

- This command MUST actually execute the task, not just show documentation
- Use existing skills when available for better performance
- For orchestration, analyze task complexity and choose appropriate strategy
- Always report progress and results to the user

Ready to execute Vigil Guard tasks!