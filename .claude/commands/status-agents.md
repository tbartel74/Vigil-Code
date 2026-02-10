---
name: status-agents
description: Show real-time status of all agents from .claude-code/ui-state.json
---

# Agent Status Command

Read the `.claude-code/ui-state.json` file and display the current status of all agents in a formatted table.

## Implementation Instructions

When this command is invoked, follow these steps:

### 1. Read UI State File

```javascript
const fs = require('fs').promises;
const path = require('path');

const uiStatePath = path.join(process.cwd(), '.claude-code/ui-state.json');
let state;

try {
  const content = await fs.readFile(uiStatePath, 'utf8');
  state = JSON.parse(content);
} catch (error) {
  console.log('Agent system not yet initialized');
  console.log('');
  console.log('The .claude-code/ui-state.json file doesn\'t exist yet.');
  console.log('This file is created automatically when agents start executing.');
  return;
}
```

### 2. Helper Functions

```javascript
function timeAgo(isoTimestamp) {
  if (!isoTimestamp) return 'never';
  const now = new Date();
  const past = new Date(isoTimestamp);
  const diffMs = now - past;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  if (seconds > 0) return `${seconds}s ago`;
  return 'just now';
}

function elapsedTime(startIsoTimestamp) {
  const start = new Date(startIsoTimestamp);
  const now = new Date();
  const diffMs = now - start;
  return (diffMs / 1000).toFixed(1);
}
```

### 3. Display Format

```
Agent System v[agent_system_version]

===================================================================

[ACTIVE AGENTS SECTION - only if any agent has status='active']
ACTIVE AGENTS ([count]):
[agent-name]    Running: "[current_task]" ([duration]s elapsed)

[IDLE AGENTS SECTION]
IDLE AGENTS ([count]):
[agent-name]
   Last: "[last_task]" ([time-ago])
   Success: [success_count] | Failures: [failure_count]

[Or if never executed:]
[agent-name]
   Never executed
   Description: [description]

===================================================================

WORKFLOW STATUS:
[If active_workflow !== null]
Active Workflow: [workflow_name]
   Strategy: [strategy]
   Progress: Step [step]/[total_steps]

[If active_workflow === null]
No active workflow

===================================================================

SYSTEM STATS:
- Total Agent Executions: [metadata.total_agent_executions || 0]
- Last Updated: [metadata.last_updated] ([time-ago])
- Agent System Version: [agent_system_version]
===================================================================
```

### 4. Sort Order

- **Active agents:** by agent name alphabetically
- **Idle agents:** by last_execution descending (most recent first), null/never executed last

## Usage

```bash
/status-agents
```

## Notes

- This command is **read-only** (no modifications to ui-state.json)
- Updates in real-time as agents execute
- Useful for debugging and monitoring agent activity
- Can be called at any time during conversation
- If .claude-code/ directory doesn't exist, gracefully shows initialization message
