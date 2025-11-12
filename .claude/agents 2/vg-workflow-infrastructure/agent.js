/**
 * Workflow Infrastructure Agent - Manages n8n workflows and pipeline structure
 * Handles node management, workflow migrations, and JSON structure updates
 */

const BaseAgent = require('../../core/base-agent');
const fs = require('fs').promises;
const path = require('path');

class WorkflowInfrastructureAgent extends BaseAgent {
  constructor() {
    super({
      name: 'vg-workflow-infrastructure',
      version: '2.0.0',
      description: 'Autonomous n8n workflow management and pipeline infrastructure agent',
      capabilities: [
        'update_workflow',
        'add_node',
        'modify_connections',
        'migrate_version',
        'validate_structure',
        'export_workflow',
        'import_workflow',
        'fix_pipeline_bugs'
      ],
      dependencies: ['workflow-business-logic']
    });

    this.workflowPath = path.join(process.cwd(), 'services', 'workflow', 'workflows');
    this.currentVersion = 'v1.7.0';
  }

  /**
   * Main execution entry point
   */
  async execute(task) {
    this.log(`Executing task: ${task.action}`);

    switch (task.action) {
      case 'update_workflow':
        return await this.updateWorkflow(task);

      case 'add_node':
        return await this.addNode(task);

      case 'modify_connections':
        return await this.modifyConnections(task);

      case 'migrate_version':
        return await this.migrateVersion(task);

      case 'validate_structure':
        return await this.validateStructure(task);

      case 'export_workflow':
        return await this.exportWorkflow(task);

      case 'import_workflow':
        return await this.importWorkflow(task);

      case 'fix_pipeline_bugs':
        return await this.fixPipelineBugs(task);

      default:
        return await this.handleAutonomously(task);
    }
  }

  /**
   * Update n8n workflow JSON structure
   */
  async updateWorkflow(task) {
    const { version = this.currentVersion, updates } = task.payload || {};

    this.log(`Updating workflow ${version}`);

    const workflowFile = path.join(this.workflowPath, `Vigil-Guard-${version}.json`);

    try {
      // Load current workflow
      const workflow = await this.loadWorkflow(workflowFile);

      // Apply updates
      const updatedWorkflow = this.applyWorkflowUpdates(workflow, updates);

      // Validate structure
      const validation = this.validateWorkflowStructure(updatedWorkflow);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Save updated workflow
      await this.saveWorkflow(workflowFile, updatedWorkflow);

      // Report progress
      await this.reportProgress({
        percentage: 100,
        message: 'Workflow updated successfully'
      });

      return {
        success: true,
        version,
        updates: Object.keys(updates).length,
        validation,
        message: 'Workflow updated. Import to n8n required.'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add new node to workflow
   */
  async addNode(task) {
    const { nodeType, position, parameters, connections } = task.payload || {};

    this.log(`Adding ${nodeType} node to workflow`);

    const workflowFile = path.join(this.workflowPath, `Vigil-Guard-v${this.currentVersion}.json`);
    const workflow = await this.loadWorkflow(workflowFile);

    // Generate node configuration
    const newNode = this.generateNode(nodeType, position, parameters);

    // Add to workflow
    workflow.nodes.push(newNode);

    // Update connections if provided
    if (connections) {
      workflow.connections = this.updateConnections(workflow.connections, newNode.name, connections);
    }

    // Save workflow
    await this.saveWorkflow(workflowFile, workflow);

    // Autonomous decision: If adding PII node, update PII configuration
    if (nodeType.includes('pii') || nodeType.includes('presidio')) {
      await this.invokeAgent('pii-detection', {
        action: 'configure_entities',
        entities: parameters?.entities || {}
      });
    }

    return {
      success: true,
      node: newNode.name,
      type: nodeType,
      totalNodes: workflow.nodes.length,
      message: 'Node added. Import workflow to n8n to apply changes.'
    };
  }

  /**
   * Modify workflow connections
   */
  async modifyConnections(task) {
    const { source, target, action = 'add' } = task.payload || {};

    this.log(`Modifying connections: ${source} → ${target}`);

    const workflowFile = path.join(this.workflowPath, `Vigil-Guard-v${this.currentVersion}.json`);
    const workflow = await this.loadWorkflow(workflowFile);

    if (action === 'add') {
      // Add connection
      if (!workflow.connections[source]) {
        workflow.connections[source] = { main: [[]] };
      }
      workflow.connections[source].main[0].push({
        node: target,
        type: 'main',
        index: 0
      });
    } else if (action === 'remove') {
      // Remove connection
      if (workflow.connections[source]) {
        workflow.connections[source].main[0] = workflow.connections[source].main[0]
          .filter(conn => conn.node !== target);
      }
    }

    await this.saveWorkflow(workflowFile, workflow);

    return {
      success: true,
      source,
      target,
      action,
      totalConnections: this.countConnections(workflow.connections)
    };
  }

  /**
   * Migrate workflow to new version
   */
  async migrateVersion(task) {
    const { fromVersion, toVersion } = task.payload || {};

    this.log(`Migrating workflow from ${fromVersion} to ${toVersion}`);

    const sourceFile = path.join(this.workflowPath, `Vigil-Guard-v${fromVersion}.json`);
    const targetFile = path.join(this.workflowPath, `Vigil-Guard-v${toVersion}.json`);

    try {
      // Load source workflow
      const sourceWorkflow = await this.loadWorkflow(sourceFile);

      // Apply migration rules
      const migratedWorkflow = await this.applyMigrationRules(sourceWorkflow, fromVersion, toVersion);

      // Update version info
      migratedWorkflow.meta = {
        ...migratedWorkflow.meta,
        version: toVersion,
        migratedFrom: fromVersion,
        migratedAt: new Date().toISOString()
      };

      // Save migrated workflow
      await this.saveWorkflow(targetFile, migratedWorkflow);

      // Validate migrated workflow
      const validation = this.validateWorkflowStructure(migratedWorkflow);

      return {
        success: true,
        fromVersion,
        toVersion,
        nodesCount: migratedWorkflow.nodes.length,
        validation,
        file: `Vigil-Guard-v${toVersion}.json`
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate workflow structure
   */
  async validateStructure(task) {
    const { version = this.currentVersion } = task.payload || {};

    this.log(`Validating workflow structure for ${version}`);

    const workflowFile = path.join(this.workflowPath, `Vigil-Guard-v${version}.json`);

    try {
      const workflow = await this.loadWorkflow(workflowFile);

      const validation = {
        valid: true,
        errors: [],
        warnings: [],
        stats: {
          nodes: workflow.nodes.length,
          connections: this.countConnections(workflow.connections),
          codeNodes: workflow.nodes.filter(n => n.type === 'n8n-nodes-base.code').length,
          webhookNodes: workflow.nodes.filter(n => n.type === 'n8n-nodes-base.webhook').length
        }
      };

      // Check for required nodes
      const requiredNodes = ['Webhook', 'Input Validation', 'Final Decision'];
      for (const required of requiredNodes) {
        if (!workflow.nodes.some(n => n.name.includes(required))) {
          validation.warnings.push(`Missing recommended node: ${required}`);
        }
      }

      // Check for orphaned nodes
      const orphaned = this.findOrphanedNodes(workflow);
      if (orphaned.length > 0) {
        validation.warnings.push(`Orphaned nodes found: ${orphaned.join(', ')}`);
      }

      // Check for circular dependencies
      const circular = this.detectCircularDependencies(workflow);
      if (circular.length > 0) {
        validation.errors.push(`Circular dependencies detected: ${circular.join(' → ')}`);
        validation.valid = false;
      }

      // Check for PII flag preservation (v1.7.0 critical bug pattern)
      const piiIssues = this.checkPIIFlagPreservation(workflow);
      if (piiIssues.length > 0) {
        validation.errors.push(`PII flag preservation issues in nodes: ${piiIssues.join(', ')}`);
        validation.valid = false;
      }

      return validation;

    } catch (error) {
      return {
        valid: false,
        errors: [error.message]
      };
    }
  }

  /**
   * Export workflow from n8n database
   */
  async exportWorkflow(task) {
    const { workflowId, outputPath } = task.payload || {};

    this.log(`Exporting workflow ${workflowId}`);

    // This would connect to n8n database in real implementation
    // For now, simulate export
    const exportedWorkflow = {
      id: workflowId,
      name: 'Vigil Guard Detection Pipeline',
      nodes: [],
      connections: {},
      active: true,
      settings: {},
      exportedAt: new Date().toISOString()
    };

    const exportFile = outputPath || path.join(this.workflowPath, `export-${Date.now()}.json`);
    await this.saveWorkflow(exportFile, exportedWorkflow);

    return {
      success: true,
      workflowId,
      file: exportFile,
      message: 'Workflow exported successfully'
    };
  }

  /**
   * Import workflow to n8n
   */
  async importWorkflow(task) {
    const { file, activate = false } = task.payload || {};

    this.log(`Importing workflow from ${file}`);

    // This would import to n8n in real implementation
    // For now, validate and prepare for import
    const workflow = await this.loadWorkflow(file);

    const validation = this.validateWorkflowStructure(workflow);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    return {
      success: true,
      file,
      nodes: workflow.nodes.length,
      activated: activate,
      message: 'Workflow ready for import. Use n8n UI: Import from File'
    };
  }

  /**
   * Fix pipeline bugs (especially v1.7.0 PII flag issues)
   */
  async fixPipelineBugs(task) {
    const { version = this.currentVersion, bugs = ['pii_flags'] } = task.payload || {};

    this.log(`Fixing pipeline bugs in ${version}`);

    const workflowFile = path.join(this.workflowPath, `Vigil-Guard-v${version}.json`);
    const workflow = await this.loadWorkflow(workflowFile);

    const fixes = [];

    // Fix PII flag preservation bug
    if (bugs.includes('pii_flags')) {
      const fixed = this.fixPIIFlagPreservation(workflow);
      fixes.push({
        bug: 'pii_flag_preservation',
        nodesFixed: fixed.length,
        nodes: fixed
      });
    }

    // Fix decision node bugs
    if (bugs.includes('decision_node')) {
      const fixed = this.fixDecisionNodeBugs(workflow);
      fixes.push({
        bug: 'decision_node',
        nodesFixed: fixed.length,
        nodes: fixed
      });
    }

    // Save fixed workflow
    await this.saveWorkflow(workflowFile, workflow);

    // Autonomous decision: Run validation after fixes
    const validation = await this.validateStructure({ payload: { version } });

    return {
      success: true,
      version,
      fixes,
      validation,
      message: 'Pipeline bugs fixed. Import workflow to n8n to apply fixes.'
    };
  }

  /**
   * Handle task autonomously
   */
  async handleAutonomously(task) {
    this.log('Making autonomous decision for workflow infrastructure task...');

    const taskText = task.task || task.payload?.description || '';

    // Analyze task to determine action
    if (taskText.includes('add') && taskText.includes('node')) {
      return await this.addNode(task);
    } else if (taskText.includes('fix') || taskText.includes('bug')) {
      return await this.fixPipelineBugs(task);
    } else if (taskText.includes('validate') || taskText.includes('check')) {
      return await this.validateStructure(task);
    } else if (taskText.includes('migrate') || taskText.includes('upgrade')) {
      return await this.migrateVersion(task);
    } else {
      // Default: Validate current workflow
      return await this.validateStructure(task);
    }
  }

  /**
   * Helper methods
   */
  async loadWorkflow(file) {
    const content = await fs.readFile(file, 'utf8');
    return JSON.parse(content);
  }

  async saveWorkflow(file, workflow) {
    await fs.writeFile(file, JSON.stringify(workflow, null, 2));
  }

  applyWorkflowUpdates(workflow, updates) {
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'nodes') {
        // Update nodes
        for (const nodeUpdate of value) {
          const node = workflow.nodes.find(n => n.name === nodeUpdate.name);
          if (node) {
            Object.assign(node, nodeUpdate);
          }
        }
      } else if (key === 'connections') {
        // Update connections
        Object.assign(workflow.connections, value);
      } else {
        // Update top-level properties
        workflow[key] = value;
      }
    }
    return workflow;
  }

  validateWorkflowStructure(workflow) {
    const validation = {
      valid: true,
      errors: []
    };

    // Check required properties
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      validation.errors.push('Missing or invalid nodes array');
      validation.valid = false;
    }

    if (!workflow.connections || typeof workflow.connections !== 'object') {
      validation.errors.push('Missing or invalid connections object');
      validation.valid = false;
    }

    // Check node structure
    for (const node of workflow.nodes || []) {
      if (!node.name || !node.type) {
        validation.errors.push(`Invalid node structure: ${JSON.stringify(node)}`);
        validation.valid = false;
      }
    }

    return validation;
  }

  generateNode(type, position, parameters) {
    return {
      name: `${type}_${Date.now()}`,
      type: this.getNodeType(type),
      position: position || [0, 0],
      parameters: parameters || {},
      typeVersion: 1
    };
  }

  getNodeType(type) {
    const typeMap = {
      'code': 'n8n-nodes-base.code',
      'webhook': 'n8n-nodes-base.webhook',
      'http': 'n8n-nodes-base.httpRequest',
      'switch': 'n8n-nodes-base.switch',
      'merge': 'n8n-nodes-base.merge',
      'set': 'n8n-nodes-base.set'
    };
    return typeMap[type] || type;
  }

  updateConnections(connections, nodeName, newConnections) {
    connections[nodeName] = newConnections;
    return connections;
  }

  countConnections(connections) {
    let count = 0;
    for (const node of Object.values(connections)) {
      if (node.main) {
        for (const outputs of node.main) {
          count += outputs.length;
        }
      }
    }
    return count;
  }

  findOrphanedNodes(workflow) {
    const connected = new Set();

    // Add all nodes that are targets of connections
    for (const connections of Object.values(workflow.connections)) {
      if (connections.main) {
        for (const outputs of connections.main) {
          for (const conn of outputs) {
            connected.add(conn.node);
          }
        }
      }
    }

    // Add all nodes that are sources of connections
    for (const source of Object.keys(workflow.connections)) {
      connected.add(source);
    }

    // Find orphaned nodes
    return workflow.nodes
      .map(n => n.name)
      .filter(name => !connected.has(name) && !name.includes('Webhook'));
  }

  detectCircularDependencies(workflow) {
    // Simplified circular dependency detection
    const visited = new Set();
    const recursionStack = new Set();
    const circular = [];

    const hasCycle = (node) => {
      visited.add(node);
      recursionStack.add(node);

      const connections = workflow.connections[node];
      if (connections?.main) {
        for (const outputs of connections.main) {
          for (const conn of outputs) {
            if (!visited.has(conn.node)) {
              if (hasCycle(conn.node)) return true;
            } else if (recursionStack.has(conn.node)) {
              circular.push(node, conn.node);
              return true;
            }
          }
        }
      }

      recursionStack.delete(node);
      return false;
    };

    for (const node of workflow.nodes) {
      if (!visited.has(node.name)) {
        if (hasCycle(node.name)) break;
      }
    }

    return circular;
  }

  checkPIIFlagPreservation(workflow) {
    const issues = [];

    for (const node of workflow.nodes) {
      if (node.type === 'n8n-nodes-base.code') {
        const code = node.parameters?.jsCode || '';

        // Check for problematic patterns
        if (code.includes('const result = {') && !code.includes('_pii_sanitized')) {
          issues.push(node.name);
        }

        if (code.includes('return [{') && !code.includes('...ctxItem?.json')) {
          issues.push(node.name);
        }
      }
    }

    return [...new Set(issues)]; // Remove duplicates
  }

  async applyMigrationRules(workflow, fromVersion, toVersion) {
    // Apply version-specific migration rules
    if (fromVersion === '1.6.11' && toVersion === '1.7.0') {
      // Add PII classification tracking
      for (const node of workflow.nodes) {
        if (node.name.includes('PII') || node.name.includes('Redact')) {
          if (!node.parameters) node.parameters = {};
          node.parameters.trackClassification = true;
        }
      }
    }

    return workflow;
  }

  fixPIIFlagPreservation(workflow) {
    const fixed = [];

    for (const node of workflow.nodes) {
      if (node.type === 'n8n-nodes-base.code') {
        const code = node.parameters?.jsCode || '';

        // Fix missing PII flag preservation
        if (code.includes('const result = {') && !code.includes('_pii_sanitized')) {
          node.parameters.jsCode = code.replace(
            'return [{ json: result }]',
            `return [{ json: {
              ...result,
              _pii_sanitized: ctxItem?.json?._pii_sanitized,
              pii_classification: ctxItem?.json?.pii_classification,
              pii: ctxItem?.json?.pii || {}
            }}]`
          );
          fixed.push(node.name);
        }
      }
    }

    return fixed;
  }

  fixDecisionNodeBugs(workflow) {
    const fixed = [];

    for (const node of workflow.nodes) {
      if (node.name.includes('Decision') || node.name.includes('Final')) {
        if (node.type === 'n8n-nodes-base.code') {
          // Ensure decision nodes preserve all flags
          const code = node.parameters?.jsCode || '';
          if (!code.includes('...items[0].json')) {
            node.parameters.jsCode = code.replace(
              'const decision = {',
              'const decision = { ...items[0].json,'
            );
            fixed.push(node.name);
          }
        }
      }
    }

    return fixed;
  }
}

module.exports = WorkflowInfrastructureAgent;