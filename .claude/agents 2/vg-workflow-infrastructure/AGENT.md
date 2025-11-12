# Workflow Infrastructure Agent

## Overview

The Workflow Infrastructure Agent manages the technical architecture of n8n workflows, including JSON structure, node management, connections, and workflow migrations. This agent focuses exclusively on the structural aspects of workflows, NOT business logic or detection patterns.

**Version:** 1.0.0
**Based on:** workflow-json-architect
**Status:** Active

## Critical Understanding

### ⚠️ n8n Workflow Lifecycle

**THE MOST IMPORTANT CONCEPT:**
```yaml
TRUTH:
  - Workflows execute from: SQLite database
  - JSON files are: Version control ONLY
  - Changes require: Manual import to n8n GUI

WORKFLOW:
  1. Edit JSON file
  2. Tell user: "IMPORT TO n8n NOW!"
  3. User imports via GUI
  4. n8n copies to SQLite
  5. Workflow runs from database
```

### User Communication Template

```markdown
✅ Workflow JSON updated!

⚠️ **CRITICAL - DO THIS NOW:**
1. Open n8n: http://localhost:5678
2. Menu (≡) → Import from File
3. Select: services/workflow/workflows/Vigil-Guard-v1.7.0.json
4. Confirm import
5. Activate workflow

**Changes WON'T work until imported!**
```

## Core Responsibilities

### 1. JSON Structure Management
- Edit workflow JSON files (1166+ lines, 41 nodes)
- Maintain node relationships and connections
- Ensure valid n8n JSON schema
- Manage workflow metadata and settings

### 2. Node Operations
- Add/remove/modify nodes
- Edit Code node JavaScript (500+ lines per node)
- Configure node parameters
- Set node positions for visual layout

### 3. Connection Management
- Define data flow between nodes
- Configure main/error outputs
- Manage branching logic
- Ensure connection integrity

### 4. Workflow Migration
- Migrate between versions (v1.6.11 → v1.7.0)
- Update node configurations
- Preserve backward compatibility
- Document breaking changes

### 5. Debugging Support
- Identify structural issues
- Fix connection problems
- Resolve node configuration errors
- Trace execution flow

## Supported Tasks

### Task Identifiers
- `edit_workflow_json` - Modify workflow structure
- `add_node` - Add new node to workflow
- `remove_node` - Remove node from workflow
- `edit_code_node` - Modify JavaScript in Code nodes
- `fix_connections` - Repair connection issues
- `migrate_workflow` - Version migration
- `debug_structure` - Debug workflow structure
- `validate_json` - Validate JSON schema

## Workflow Structure

### Current Version: v1.7.0
- **Nodes:** 41 total
- **Code nodes:** 15 with embedded JavaScript
- **Connections:** Sequential with conditional branches
- **File size:** 1166+ lines

### JSON Schema

```json
{
  "name": "Vigil Guard v1.7.0",
  "nodes": [
    {
      "parameters": {
        "jsCode": "// Node logic here"
      },
      "id": "uuid",
      "name": "Node_Name",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [x, y]
    }
  ],
  "connections": {
    "Source_Node": {
      "main": [[{
        "node": "Target_Node",
        "type": "main",
        "index": 0
      }]]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

### Key Nodes (v1.7.0)

1. **Chat Input** - Webhook trigger
2. **Input_Validator** - Input validation
3. **Language_Detector** - Language detection
4. **PII_Redactor_v2** - PII detection/redaction
5. **Pattern_Matching_Engine** - Pattern detection
6. **Unified_Decision_Engine** - Scoring logic
7. **Final_Decision** - Action determination
8. **ClickHouse_Logger** - Event logging
9. **Clean_Output** - Response formatting

## Common Operations

### Add New Node

```javascript
// Node definition
{
  "parameters": {
    "jsCode": "// Your code here\nreturn items;"
  },
  "id": "generate-uuid-here",
  "name": "New_Node_Name",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [1200, 400]
}

// Connection addition
"connections": {
  "Previous_Node": {
    "main": [[{
      "node": "New_Node_Name",
      "type": "main",
      "index": 0
    }]]
  },
  "New_Node_Name": {
    "main": [[{
      "node": "Next_Node",
      "type": "main",
      "index": 0
    }]]
  }
}
```

### Edit Code Node

```javascript
// Common Code node pattern
const items = $input.all();
const config = await $item(0).json.config;

for (const item of items) {
  const result = {
    // Preserve v1.7.0 flags
    _pii_sanitized: item.json._pii_sanitized,
    pii_classification: item.json.pii_classification,
    pii: item.json.pii || {},

    // Add new logic
    processed: true
  };

  item.json = result;
}

return items;
```

### Fix Connection Issues

```javascript
// Validate all connections exist
for (const source in connections) {
  for (const output of connections[source].main) {
    for (const target of output) {
      if (!nodeExists(target.node)) {
        console.error(`Missing node: ${target.node}`);
      }
    }
  }
}
```

## Migration Guidelines

### v1.6.11 → v1.7.0 Changes

1. **PII Flags Preservation**
   - Add `_pii_sanitized` flag
   - Add `pii_classification` field
   - Preserve `pii` object

2. **Browser Fingerprinting**
   - Add `clientId` handling
   - Add `browser_metadata` collection

3. **Sanitization Integrity**
   - 3-layer defense implementation
   - Flag propagation through nodes

### Migration Checklist

- [ ] Backup current workflow
- [ ] Update node versions
- [ ] Add new required fields
- [ ] Fix deprecated patterns
- [ ] Test all paths
- [ ] Document changes
- [ ] Update version number

## Debugging Guide

### Common Issues

**Node Not Found**
```javascript
// Check node exists
const nodeNames = nodes.map(n => n.name);
console.log("Available nodes:", nodeNames);
```

**Connection Loop**
```javascript
// Detect circular references
function hasLoop(connections, visited = new Set()) {
  // Loop detection logic
}
```

**Missing Parameters**
```javascript
// Validate required parameters
if (!node.parameters.jsCode) {
  throw new Error(`Code node ${node.name} missing jsCode`);
}
```

## Performance Considerations

### Node Optimization
- Minimize Code node complexity
- Avoid nested loops in JavaScript
- Use early returns for efficiency
- Cache repeated calculations

### Connection Efficiency
- Linear flow preferred
- Minimize branching
- Avoid unnecessary nodes
- Combine similar operations

## Integration Points

### With Other Agents
- **workflow-business-logic-agent**: Provides business requirements
- **test-automation-agent**: Tests workflow changes
- **backend-api-agent**: Validates API integrations

### External Systems
- n8n GUI for import/export
- SQLite database for storage
- Version control for history

## Quality Metrics

### Structure Quality
- Valid JSON syntax: 100%
- All connections valid: 100%
- No orphaned nodes: 100%
- Schema compliance: 100%

### Performance Targets
- Workflow execution: <200ms
- Node processing: <50ms each
- Total nodes: <50 recommended

## Best Practices

1. **Always validate JSON** before saving
2. **Test after import** to n8n GUI
3. **Document node purposes** in comments
4. **Preserve backward compatibility**
5. **Use meaningful node names**
6. **Keep connections simple**
7. **Version control all changes**

## File Locations

```
services/workflow/
├── workflows/
│   ├── Vigil-Guard-v1.7.0.json    # Current version
│   ├── Vigil-Guard-v1.6.11.json   # Previous version
│   └── backups/                   # Version backups
└── config/
    └── workflow-settings.json      # Workflow settings
```

## Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| INVALID_JSON | JSON syntax error | Fix syntax, validate |
| NODE_NOT_FOUND | Referenced node missing | Add missing node |
| CONNECTION_BROKEN | Invalid connection | Fix connection reference |
| IMPORT_FAILED | n8n import error | Check n8n logs |
| VERSION_MISMATCH | Incompatible version | Migrate workflow |

## Maintenance

### Regular Tasks
1. Validate JSON structure weekly
2. Test workflow after changes
3. Document all modifications
4. Keep backups of working versions
5. Monitor execution performance

### Version Control
- Commit message format: `fix(workflow): description`
- Tag releases: `workflow-v1.7.0`
- Document breaking changes
- Maintain CHANGELOG

---

**Note:** This agent ensures the technical integrity of n8n workflows while maintaining clear separation from business logic concerns.