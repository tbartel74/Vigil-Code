---
name: workflow-json-architect
description: n8n workflow JSON structure management (1166+ lines, 41 nodes). Use for node manipulation, connections, Code node JavaScript, workflow migration, and critical reminder to import workflow to n8n GUI.
version: 1.7.0
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# n8n Workflow JSON Architecture Management

## Overview
Expert guidance for managing n8n workflow JSON files (1166+ lines, 41 nodes) in Vigil Guard. This skill focuses **exclusively** on the JSON structure, node manipulation, connections, and workflow lifecycle - NOT on detection patterns or business logic (see `n8n-vigil-workflow` for patterns).

## When to Use This Skill
- Modifying workflow JSON structure (`Vigil-Guard-v*.json`)
- Adding/removing/reordering nodes
- Editing Code node embedded JavaScript (500+ lines per node)
- Managing node connections and data flow
- Migrating workflows between versions (v1.8.1 → v1.8.1 → v1.7.x)
- Debugging workflow execution errors
- Understanding n8n JSON schema
- **Explaining to user: "Import workflow to n8n GUI NOW!"**

## ⚠️ CRITICAL: Workflow Lifecycle Understanding

### The #1 Most Important Concept

**n8n workflows are stored in SQLite database, NOT in JSON files!**

```yaml
TRUTH:
  - Workflow execution reads from: SQLite database (/home/node/.n8n/database.sqlite)
  - JSON file in repo is: Backup/version control ONLY
  - Changes to JSON have NO EFFECT until user imports to n8n GUI

WORKFLOW:
  1. Edit JSON file in repo
  2. IMMEDIATELY tell user: "⚠️ IMPORT THIS FILE TO n8n GUI NOW!"
  3. User imports via: n8n GUI → Import from File
  4. n8n copies JSON → SQLite database
  5. Workflow executes from SQLite (NOT from file)
```

### Common Mistakes (AVOID!)

```yaml
❌ WRONG:
  - Edit JSON → Assume n8n reloads automatically
  - Test workflow → Confused why changes don't work
  - Forget to tell user to import

✅ CORRECT:
  - Edit JSON → Tell user "Import to n8n NOW!"
  - Wait for user confirmation: "Imported successfully"
  - Then test workflow execution
```

### User Communication Template

```markdown
✅ Workflow JSON updated successfully!

⚠️ **CRITICAL NEXT STEP - DO THIS NOW:**

1. Open n8n GUI: http://localhost:5678
2. Click menu (≡) → **Import from File**
3. Select: `services/workflow/workflows/Vigil-Guard-vX.X.X.json`
4. Confirm import
5. Activate workflow (toggle switch)

**Your changes will NOT work until you complete this import!**

After importing, test with: n8n GUI → Test workflow → Chat tab
```

### 🚨 CROWN RULE: WORKFLOW IMPORT STATUS - OPERATOR TRUST AXIOM

**ABSOLUTELY FORBIDDEN DEBUGGING HYPOTHESES:**

```yaml
❌ NEVER CHECK:
  - "Was the workflow imported?"
  - "Is the workflow in n8n SQL database?"
  - "Is the workflow active?"
  - "Did you activate the workflow after import?"
  - "Let me verify if the workflow was imported correctly..."

✅ INDISPUTABLE FACT:
  - If operator confirmed import: workflow IS imported
  - Workflow IS in SQLite database
  - Workflow IS active
  - All Code nodes have LATEST JavaScript from JSON file
  - This is 100% TRUTH without verification

🎯 CORRECT DEBUGGING APPROACH:
  - Operator confirms import → END OF STORY
  - Problem is NOT in import
  - Problem IS in workflow logic
  - Debug: analyze node code, tests, configuration
  - DO NOT waste tokens verifying import
```

**Why This Is Critical:**
1. Checking SQL database is **blind alley** (waste of time/tokens)
2. Import is **manual process** (operator ALWAYS knows if they did it)
3. After confirmation → **FACT, not hypothesis**
4. Bugs are ALWAYS in **workflow logic**, never in "missing import"

**When problem appears after import:**
```yaml
INSTEAD OF:
  "Maybe workflow was not imported?"
  "Let's check n8n SQL database..."
  "Is the workflow really active?"

DO THIS:
  "Workflow is imported (operator confirmed)"
  "Debug workflow node logic"
  "Check JavaScript in Code nodes"
  "Analyze tests and execution results"
```

**Real Examples from Project History:**
```yaml
v1.8.1 PII flags bug:
  ❌ Wrong: "Workflow not imported correctly"
  ✅ Real: Code node missing pii.has preservation
  ✅ Fix: Edit Code node to copy pii flags

v1.8.0 SmartPersonRecognizer:
  ❌ Wrong: "Is workflow active?"
  ✅ Real: Regex too greedy ("John Smith lives")
  ✅ Fix: Add word boundary to regex pattern
```

**Pattern:** EVERY "import issue" = **code logic bug**.

## Workflow JSON Structure

### Top-Level Schema

```json
{
  "name": "Vigil Guard v1.8.1",
  "nodes": [
    {
      "parameters": {},
      "id": "unique-uuid",
      "name": "Node_Name",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [x, y]
    }
  ],
  "connections": {
    "Source_Node": {
      "main": [
        [
          {
            "node": "Target_Node",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {},
  "settings": {
    "executionOrder": "v1"
  },
  "staticData": null,
  "tags": [],
  "triggerCount": 0,
  "updatedAt": "2025-01-30T10:00:00.000Z",
  "versionId": "uuid"
}
```

### Node Types (41 nodes in Vigil Guard)

**Core Processing Nodes:**
1. **Code** - Custom JavaScript logic (most common, 20+ nodes)
2. **HTTP Request** - API calls (Presidio, Language Detector, Prompt Guard)
3. **Merge** - Combine data streams (7-way config merge)
4. **Switch** - Conditional routing (thresholds)
5. **Set** - Variable assignment
6. **Webhook** - Trigger endpoint

**Data Flow:**
```
Webhook Trigger
  → Code (Input_Validator)
  → HTTP Request (Language_Detector)
  → Code (PII_Redactor_v2)
  → Code (Normalize_Node)
  → Code (Bloom_Prefilter)
  → Merge (7-way config merge)
  → Code (Pattern_Matching_Engine)
  → Switch (Decision_Engine)
  → Code (Sanitization_Enforcement)
  → HTTP Request (Optional: Prompt_Guard_API)
  → Code (Final_Decision)
  → HTTP Request (ClickHouse logging)
  → Code (Clean_Output)
```

## Common Tasks

### Task 1: Add New Node

**Example: Add new validation step**

```javascript
// 1. Identify insertion point (after Input_Validator, before Language_Detector)
const nodes = workflow.nodes;
const validatorIndex = nodes.findIndex(n => n.name === "Input_Validator");

// 2. Create new node
const newNode = {
  "parameters": {
    "jsCode": `
      // Your JavaScript code here
      const items = $input.all();
      return items.map(item => ({
        json: {
          ...item.json,
          new_field: "value"
        }
      }));
    `
  },
  "id": crypto.randomUUID(),  // Generate unique ID
  "name": "Custom_Validation_Step",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [820, 380],  // X, Y coordinates (adjust based on flow)
  "executeOnce": false
};

// 3. Insert into nodes array
nodes.splice(validatorIndex + 1, 0, newNode);

// 4. Update connections
workflow.connections["Input_Validator"] = {
  "main": [
    [
      {
        "node": "Custom_Validation_Step",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

workflow.connections["Custom_Validation_Step"] = {
  "main": [
    [
      {
        "node": "Language_Detector_HTTP",  // Next node in chain
        "type": "main",
        "index": 0
      }
    ]
  ]
};

// 5. Save JSON and TELL USER TO IMPORT!
```

**After Edit:**
```markdown
✅ New node "Custom_Validation_Step" added!

⚠️ **IMPORT TO n8n NOW:** (see User Communication Template above)
```

### Task 2: Modify Code Node JavaScript

**Example: Add new flag to PII_Redactor_v2**

```javascript
// 1. Find the node
const piiNode = workflow.nodes.find(n => n.name === "PII_Redactor_v2");

// 2. Extract current code
let code = piiNode.parameters.jsCode;

// 3. Modify code (preserve existing logic!)
// ADD new flag to return object
code = code.replace(
  /return \[\{ json: result \}\];/,
  `// Add v1.8.1 PII classification flag
result._pii_sanitized = result.pii?.has ? 1 : 0;
result.pii_classification = result.pii?.has ? 'detected' : 'clean';

return [{ json: result }];`
);

// 4. Update node
piiNode.parameters.jsCode = code;

// 5. CRITICAL: Update updatedAt timestamp
workflow.updatedAt = new Date().toISOString();

// 6. Save and tell user to import
```

### Task 3: Reorder Nodes (Change Execution Flow)

**Example: Move Bloom_Prefilter before PII_Redactor**

```javascript
// 1. Identify nodes to swap
const bloomIndex = nodes.findIndex(n => n.name === "Bloom_Prefilter");
const piiIndex = nodes.findIndex(n => n.name === "PII_Redactor_v2");

// 2. Swap positions (visual only)
[nodes[bloomIndex].position, nodes[piiIndex].position] =
  [nodes[piiIndex].position, nodes[bloomIndex].position];

// 3. Update connections (execution order)
// Before: Normalize → PII → Bloom → Patterns
// After:  Normalize → Bloom → PII → Patterns

const normalizeNode = nodes.find(n => n.name === "Normalize_Node");
workflow.connections["Normalize_Node"].main[0][0].node = "Bloom_Prefilter";

workflow.connections["Bloom_Prefilter"].main[0][0].node = "PII_Redactor_v2";

workflow.connections["PII_Redactor_v2"].main[0][0].node = "Pattern_Matching_Engine";
```

### Task 4: Remove Node

**Example: Remove optional Prompt_Guard_API call**

```javascript
// 1. Find node and its connections
const pgNode = nodes.find(n => n.name === "Prompt_Guard_API");
const pgIndex = nodes.indexOf(pgNode);

// 2. Find predecessor (what connects TO this node)
const predecessor = Object.entries(workflow.connections)
  .find(([name, conn]) => conn.main[0][0].node === "Prompt_Guard_API");

// 3. Find successor (what this node connects to)
const successor = workflow.connections["Prompt_Guard_API"].main[0][0].node;

// 4. Reconnect: predecessor → successor (bypass removed node)
workflow.connections[predecessor[0]].main[0][0].node = successor;

// 5. Remove node and its connections
nodes.splice(pgIndex, 1);
delete workflow.connections["Prompt_Guard_API"];

// 6. Clean up any references in other nodes
```

### Task 5: Migrate Workflow Version (v1.8.1 → v1.8.1)

**Example: Add browser fingerprinting metadata**

```javascript
// 1. Update workflow name and version
workflow.name = "Vigil Guard v1.8.1";

// 2. Add new fields to Input_Validator
const validatorNode = nodes.find(n => n.name === "Input_Validator");
validatorNode.parameters.jsCode = validatorNode.parameters.jsCode.replace(
  /const chatInput = /,
  `// v1.8.1: Extract browser metadata
const clientId = items[0].json.clientId || 'unknown';
const browserMetadata = items[0].json.browser_metadata || {};

const chatInput = `
);

// 3. Add new flags to PII_Redactor_v2 output
const piiNode = nodes.find(n => n.name === "PII_Redactor_v2");
piiNode.parameters.jsCode += `
// v1.8.1: Add PII classification flags
result._pii_sanitized = result.pii?.has ? 1 : 0;
result.pii_classification = result.pii?.has ? 'detected' : 'clean';
`;

// 4. Update ClickHouse logging to include new columns
const loggingNode = nodes.find(n => n.name === "Build+Sanitize NDJSON");
loggingNode.parameters.jsCode = loggingNode.parameters.jsCode.replace(
  /"pipeline_version": "1.6.11"/,
  `"pipeline_version": "1.7.0",
  "client_id": "${clientId}",
  "browser_metadata": ${JSON.stringify(browserMetadata)},
  "pii_sanitized": ${result._pii_sanitized ? 1 : 0}`
);

// 5. Update workflow metadata
workflow.updatedAt = new Date().toISOString();
workflow.versionId = crypto.randomUUID();
```

**Migration Checklist:**
- [ ] Update workflow.name to new version
- [ ] Add new fields to relevant nodes
- [ ] Preserve backward compatibility flags
- [ ] Update ClickHouse schema (if needed)
- [ ] Test old clients still work (no breaking changes)
- [ ] Document migration path in `docs/MIGRATION_vX.X.X.md`

## Code Node Patterns

### Pattern 1: Data Access

```javascript
// Get all input items
const items = $input.all();

// Access first item's JSON
const data = items[0].json;

// Access specific fields
const chatInput = data.chatInput;
const sessionId = data.sessionId;
```

### Pattern 2: Returning Modified Data

```javascript
// Return modified items (preserves pairedItem for tracing)
return items.map((item, index) => ({
  json: {
    ...item.json,
    new_field: "value"
  },
  pairedItem: {
    item: index
  }
}));
```

### Pattern 3: Accessing Config Data (7-way Merge)

```javascript
// Config loaded via Merge node, available in all downstream Code nodes
const items = $input.all();
const contextItem = items[0];

// Access config sections
const rules = contextItem.json.rules;           // rules.config.json
const thresholds = contextItem.json.thresholds; // thresholds.config.json
const unified = contextItem.json.config;        // unified_config.json

// Use config values
const allowMax = thresholds.allow_max;          // 29
const categories = Object.keys(rules.categories); // ["SQL_XSS_ATTACKS", ...]
```

### Pattern 4: HTTP Request Error Handling

```javascript
// In Code node calling external service
try {
  const response = await axios.post('http://vigil-presidio-pii:5001/analyze', {
    text: inputText,
    language: 'en',
    entities: ['EMAIL', 'PHONE']
  }, {
    timeout: 3000,
    headers: { 'Content-Type': 'application/json' }
  });

  return [{ json: response.data }];
} catch (error) {
  console.error('Presidio service unavailable:', error.message);

  // Graceful fallback
  return [{
    json: {
      entities: [],
      detection_method: 'fallback_regex',
      error: error.message
    }
  }];
}
```

### Pattern 5: Score Accumulation

```javascript
// Pattern_Matching_Engine pattern
let totalScore = 0;
const scoreBreakdown = {};

for (const [category, config] of Object.entries(rules.categories)) {
  let categoryScore = 0;

  for (const pattern of config.patterns) {
    if (new RegExp(pattern, 'i').test(text)) {
      categoryScore += config.base_weight;
    }
  }

  if (categoryScore > 0) {
    categoryScore *= config.multiplier;
    scoreBreakdown[category] = categoryScore;
    totalScore += categoryScore;
  }
}

return [{
  json: {
    totalScore,
    scoreBreakdown,
    detectedCategories: Object.keys(scoreBreakdown)
  }
}];
```

## Node Positioning (Visual Layout)

### Grid System
- **X-axis:** 0 (left) → 2000+ (right)
- **Y-axis:** 0 (top) → 1200+ (bottom)
- **Spacing:** 220 pixels between nodes horizontally
- **Vertical offset:** 100-150 pixels for parallel branches

### Example Layout
```javascript
// Sequential flow (left to right)
nodes[0].position = [240, 300];   // Webhook Trigger
nodes[1].position = [460, 300];   // Input_Validator
nodes[2].position = [680, 300];   // Language_Detector
nodes[3].position = [900, 300];   // PII_Redactor_v2

// Parallel branches (Y offset)
nodes[4].position = [1120, 200];  // Branch A
nodes[5].position = [1120, 400];  // Branch B
```

## Connection Syntax

### Simple Connection (A → B)

```json
{
  "connections": {
    "Node_A": {
      "main": [
        [
          {
            "node": "Node_B",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### Multiple Outputs (A → B, A → C)

```json
{
  "connections": {
    "Node_A": {
      "main": [
        [
          { "node": "Node_B", "type": "main", "index": 0 }
        ],
        [
          { "node": "Node_C", "type": "main", "index": 0 }
        ]
      ]
    }
  }
}
```

### Switch Node (Conditional)

```json
{
  "connections": {
    "Decision_Engine": {
      "main": [
        [
          { "node": "Allow_Path", "type": "main", "index": 0 }
        ],
        [
          { "node": "Sanitize_Path", "type": "main", "index": 0 }
        ],
        [
          { "node": "Block_Path", "type": "main", "index": 0 }
        ]
      ]
    }
  }
}
```

## Version Control Best Practices

### Commit Message Format
```bash
git commit -m "feat(workflow): add browser fingerprinting to v1.8.1

- Add clientId extraction to Input_Validator
- Add browser_metadata to ClickHouse logging
- Update PII_Redactor_v2 with classification flags

BREAKING: Requires ClickHouse schema migration (see docs/MIGRATION_v1.8.1.md)
"
```

### Backup Before Migration
```bash
# Before modifying workflow JSON
cp services/workflow/workflows/Vigil-Guard-vX.X.X.json \
   services/workflow/workflows/backups/Vigil-Guard-vX.X.X-$(date +%Y%m%d).json
```

### Testing Changes
```bash
# 1. Edit JSON
# 2. Tell user to import to n8n
# 3. User tests in n8n Chat interface
# 4. Verify ClickHouse logs
docker exec vigil-clickhouse clickhouse-client -q "
  SELECT
    pipeline_version,
    original_input,
    result
  FROM n8n_logs.events_processed
  ORDER BY timestamp DESC
  LIMIT 5
  FORMAT Pretty
"
```

## Debugging Workflow Execution

### Common Error Patterns

**Error: "Cannot read property 'json' of undefined"**
```javascript
// Problem: Accessing item.json when items array is empty
const items = $input.all();
const data = items[0].json;  // ❌ Fails if items.length === 0

// Solution: Check array length
if (items.length === 0) {
  return [{ json: { error: "No input data" } }];
}
const data = items[0].json;  // ✅ Safe
```

**Error: "pairedItem must be set"**
```javascript
// Problem: Not preserving pairedItem in return
return [{ json: newData }];  // ❌ Loses tracing

// Solution: Preserve pairedItem
return items.map((item, index) => ({
  json: newData,
  pairedItem: { item: index }
}));  // ✅ Maintains tracing
```

**Error: "Timeout exceeded"**
```javascript
// Problem: HTTP request hangs
await axios.post(url, data);  // ❌ No timeout

// Solution: Add timeout
await axios.post(url, data, { timeout: 3000 });  // ✅ 3 second limit
```

### Enable Debug Logging

```javascript
// Add to Code nodes for debugging
console.log('=== Node Name Debug ===');
console.log('Input:', JSON.stringify($input.all(), null, 2));
console.log('Config:', JSON.stringify(contextItem.json.config, null, 2));
console.log('Output:', JSON.stringify(result, null, 2));
```

**View Logs:**
```bash
docker logs vigil-n8n | grep "Node Name Debug"
```

## Performance Optimization

### Minimize Node Count
```javascript
// ❌ INEFFICIENT: 3 separate Code nodes
Node1: Extract field A
Node2: Extract field B
Node3: Combine A + B

// ✅ EFFICIENT: 1 Code node
Node1: Extract A, B, and combine
```

### Cache Config Data
```javascript
// ❌ INEFFICIENT: Re-read config in every iteration
for (const item of items) {
  const config = $('Config_Loader').all()[0].json.config;  // Repeated reads
}

// ✅ EFFICIENT: Read once, reuse
const config = $('Config_Loader').all()[0].json.config;
for (const item of items) {
  // Use cached config
}
```

### Avoid Blocking Operations
```javascript
// ❌ BLOCKING: Sequential HTTP requests
const result1 = await axios.post(url1, data);
const result2 = await axios.post(url2, data);

// ✅ PARALLEL: Concurrent requests
const [result1, result2] = await Promise.all([
  axios.post(url1, data),
  axios.post(url2, data)
]);
```

## Integration with Other Skills

### When to Use Other Skills

**`n8n-vigil-workflow`:**
- Adding detection patterns (rules.config.json)
- Modifying threat categories
- Tuning scoring algorithms
- Understanding business logic

**`vigil-testing-e2e`:**
- Writing tests for modified workflow
- Validating node behavior
- Regression testing after changes

**`clickhouse-grafana-monitoring`:**
- Verifying workflow logs new fields correctly
- Analyzing execution metrics
- Troubleshooting data pipeline issues

## Troubleshooting

### Issue: Changes don't take effect

**Diagnosis:**
```bash
# Check if user imported workflow
sqlite3 /path/to/n8n/database.sqlite "SELECT updatedAt FROM workflow_entity WHERE name LIKE 'Vigil%' ORDER BY updatedAt DESC LIMIT 1"

# Compare with JSON file timestamp
stat services/workflow/workflows/Vigil-Guard-vX.X.X.json | grep Modify
```

**Solution:**
```markdown
⚠️ **Your workflow JSON is newer than n8n database!**

You MUST import the file to n8n GUI:
1. Open http://localhost:5678
2. Menu (≡) → Import from File
3. Select: `services/workflow/workflows/Vigil-Guard-vX.X.X.json`
4. Confirm import and activate
```

### Issue: Node execution order wrong

**Diagnosis:**
```javascript
// Check connections in JSON
const connections = workflow.connections;
console.log(JSON.stringify(connections, null, 2));

// Trace execution path
const path = [];
let current = "Webhook_Trigger";
while (connections[current]) {
  path.push(current);
  current = connections[current].main[0][0].node;
}
console.log("Execution path:", path);
```

**Solution:**
- Verify connections match intended flow
- Check for orphaned nodes (no incoming connections)
- Ensure Switch nodes have correct output indexes

### Issue: Embedded code too large

**Problem:** Code node exceeds 10,000 characters

**Solution:** Extract to external function module
```javascript
// Create: services/workflow/lib/my-function.js
module.exports = function myFunction(data) {
  // Complex logic here
  return processedData;
};

// In Code node:
const myFunction = require('./lib/my-function.js');
const result = myFunction(items[0].json);
return [{ json: result }];
```

**Note:** Requires mounting volume in Docker Compose:
```yaml
services:
  n8n:
    volumes:
      - ./services/workflow/lib:/home/node/lib:ro
```

## Reference Files

### Workflow Versions
- **(Current)**: `services/workflow/workflows/Vigil-Guard-vX.X.X.json`
- **Backups**: `services/workflow/workflows/backups/Vigil-Guard-vX.X.X.json`

### Documentation
- Architecture: `docs/ARCHITECTURE.md`
- Migration guides: `docs/MIGRATION_v*.md`
- n8n docs: https://docs.n8n.io/

### Related Code
- Config loader: `services/workflow/config/`
- Test helpers: `services/workflow/tests/helpers/webhook.js`
- ClickHouse schema: `services/monitoring/sql/01-create-tables.sql`

## Quick Reference

### Essential Commands
```bash
# View workflow structure (pretty print)
cat services/workflow/workflows/Vigil-Guard-vX.X.X.json | jq .

# Count nodes
jq '.nodes | length' services/workflow/workflows/Vigil-Guard-vX.X.X.json

# List node names
jq -r '.nodes[].name' services/workflow/workflows/Vigil-Guard-vX.X.X.json

# Find specific node
jq '.nodes[] | select(.name == "PII_Redactor_v2")' services/workflow/workflows/Vigil-Guard-vX.X.X.json

# Extract Code node JavaScript
jq -r '.nodes[] | select(.name == "Pattern_Matching_Engine") | .parameters.jsCode' services/workflow/workflows/Vigil-Guard-vX.X.X.json
```

### Node Checklist (Before Commit)
- [ ] Node has unique `id` (UUID)
- [ ] Node has valid `type` (n8n-nodes-base.*)
- [ ] Node has `position` [x, y]
- [ ] Node has incoming connection (or is trigger)
- [ ] Node has outgoing connection (or is terminal)
- [ ] Code node JavaScript is syntactically valid
- [ ] pairedItem preserved in return statements
- [ ] Error handling implemented (try/catch)
- [ ] Console logs added for debugging
- [ ] Workflow `updatedAt` timestamp updated
- [ ] User instructed: "Import to n8n NOW!"

---

**Last Updated:** 2025-11-02
**Workflow Version:** v1.8.1 (41 nodes, 1166 lines)
**Maintained By:** Vigil Guard Development Team
