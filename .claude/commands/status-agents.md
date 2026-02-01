---
name: status-agents
description: "Show real-time status of all Vigil Guard agents (12 agents) from .claude-code/ui-state.json"
version: 1.0.0
---

# Agent Status Command

Read the `.claude-code/ui-state.json` file and display the current status of all 12 Vigil Guard agents in a formatted table.

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
  // File doesn't exist - show initialization message
  console.log('⚠️  Agent system not yet initialized');
  console.log('');
  console.log('The .claude-code/ui-state.json file doesn\'t exist yet.');
  console.log('This file is created automatically when agents start executing.');
  console.log('');
  console.log('To initialize the system, try:');
  console.log('  • /orchestrate [task]');
  console.log('  • Invoke any agent via Skill tool');
  return;
}
```

### 2. Helper Functions

```javascript
// Time ago formatter
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

// Elapsed time calculator
function elapsedTime(startIsoTimestamp) {
  const start = new Date(startIsoTimestamp);
  const now = new Date();
  const diffMs = now - start;
  return (diffMs / 1000).toFixed(1); // seconds with 1 decimal
}

// Agent name formatter
function formatAgentName(agentName) {
  return agentName;
}
```

### 3. Display Format

Show this structured output:

```
🤖 Vigil Guard Agent System v[agent_system_version]

═══════════════════════════════════════════════════════════════════════════

[ACTIVE AGENTS SECTION - only if any agent has status='active']
ACTIVE AGENTS ([count]):
🔄 [agent-name]    Running: "[current_task]" ([duration]s elapsed)

[IDLE AGENTS SECTION]
IDLE AGENTS ([count]):
✅ [icon] [agent-name]
   Last: "[last_task]" ([time-ago])
   Success: [success_count] | Failures: [failure_count]
   [If last_error] ⚠️  Last Error: [last_error]

[Or if never executed:]
✅ [icon] [agent-name]
   Never executed
   Description: [description]

═══════════════════════════════════════════════════════════════════════════

WORKFLOW STATUS:
[If active_workflow !== null]
🎯 Active Workflow: [workflow_name]
   Strategy: [strategy]
   Progress: Step [step]/[total_steps]
   Duration: [elapsed]s elapsed

[If active_workflow === null]
✅ No active workflow

═══════════════════════════════════════════════════════════════════════════

SYSTEM STATS:
• Total Agent Executions: [metadata.total_agent_executions || 0]
• Last Updated: [metadata.last_updated] ([time-ago])
• Agent System Version: [agent_system_version]
• Conversation Count: [conversation_count]

═══════════════════════════════════════════════════════════════════════════
```

### 4. Sort Order

- **Active agents:** by agent name alphabetically
- **Idle agents:** by last_execution descending (most recent first), null/never executed last

### 5. Example Implementation

```javascript
// Separate agents into active and idle
const activeAgents = [];
const idleAgents = [];

Object.entries(state.agents || {}).forEach(([name, agent]) => {
  if (agent.status === 'active') {
    activeAgents.push({ name, ...agent });
  } else {
    idleAgents.push({ name, ...agent });
  }
});

// Sort
activeAgents.sort((a, b) => a.name.localeCompare(b.name));
idleAgents.sort((a, b) => {
  if (!a.last_execution) return 1;
  if (!b.last_execution) return -1;
  return new Date(b.last_execution) - new Date(a.last_execution);
});

// Display header
console.log(`🤖 Vigil Guard Agent System v${state.agent_system_version || '2.0.1'}`);
console.log('');
console.log('═'.repeat(75));
console.log('');

// Display active agents
if (activeAgents.length > 0) {
  console.log(`ACTIVE AGENTS (${activeAgents.length}):`);
  activeAgents.forEach(agent => {
    const elapsed = agent.last_execution ? elapsedTime(agent.last_execution) : '0.0';
    const task = agent.current_task || 'unknown';
    console.log(`🔄 ${formatAgentName(agent.name).padEnd(28)} Running: "${task}" (${elapsed}s elapsed)`);
  });
  console.log('');
}

// Display idle agents
console.log(`IDLE AGENTS (${idleAgents.length}):`);
idleAgents.forEach(agent => {
  const icon = agent.icon || '🤖';
  const name = formatAgentName(agent.name);

  if (!agent.last_execution) {
    console.log(`✅ ${icon} ${name}`);
    console.log(`   Never executed`);
    if (agent.description) {
      console.log(`   Description: ${agent.description}`);
    }
  } else {
    console.log(`✅ ${icon} ${name}`);
    console.log(`   Last: "${agent.last_task}" (${timeAgo(agent.last_execution)})`);
    console.log(`   Success: ${agent.success_count || 0} | Failures: ${agent.failure_count || 0}`);
    if (agent.last_error) {
      console.log(`   ⚠️  Last Error: ${agent.last_error}`);
    }
  }
  console.log('');
});

console.log('═'.repeat(75));
console.log('');

// Display workflow status
console.log('WORKFLOW STATUS:');
if (state.active_workflow) {
  const details = state.workflow_details || {};
  const elapsed = details.start_time ? elapsedTime(details.start_time) : '0.0';
  console.log(`🎯 Active Workflow: ${state.active_workflow}`);
  if (details.strategy) {
    console.log(`   Strategy: ${details.strategy}`);
  }
  if (details.total_steps > 0) {
    console.log(`   Progress: Step ${details.step}/${details.total_steps}`);
  }
  console.log(`   Duration: ${elapsed}s elapsed`);
} else {
  console.log('✅ No active workflow');
}
console.log('');

console.log('═'.repeat(75));
console.log('');

// Display system stats
console.log('SYSTEM STATS:');
const metadata = state.metadata || {};
console.log(`• Total Agent Executions: ${metadata.total_agent_executions || 0}`);
console.log(`• Last Updated: ${metadata.last_updated || 'never'} (${timeAgo(metadata.last_updated)})`);
console.log(`• Agent System Version: ${state.agent_system_version || '2.0.1'}`);
console.log(`• Conversation Count: ${state.conversation_count || 0}`);
console.log('');

console.log('═'.repeat(75));
```

## Usage

```bash
/status-agents
```

## Notes

- This command is **read-only** (no modifications to ui-state.json)
- Updates in real-time as agents execute
- Complements the progress reporter console output
- Useful for debugging and monitoring agent activity
- Can be called at any time during conversation
- If .claude-code/ directory doesn't exist, gracefully shows initialization message
