/**
 * State Manager - Workflow and agent state persistence
 * Manages state across agent invocations and workflow executions
 */

const fs = require('fs').promises;
const path = require('path');

class StateManager {
  constructor(config = {}) {
    this.stateDir = config.stateDir || path.join(__dirname, '../state');
    this.maxStateAge = config.maxStateAge || 24 * 60 * 60 * 1000; // 24 hours
    this.workflows = new Map();
    this.agentStates = new Map();
    this.initialized = false;
  }

  /**
   * Initialize state manager
   */
  async initialize() {
    // Ensure state directory exists
    await this.ensureStateDirectory();

    // Load existing state files
    await this.loadPersistedState();

    this.initialized = true;
    console.log('[StateManager] Initialized');
  }

  /**
   * Create a new workflow state
   */
  async createWorkflow(workflowId, initialState = {}) {
    const workflow = {
      id: workflowId,
      state: initialState,
      status: 'initialized',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      steps: [],
      currentStep: null,
      results: {},
      errors: []
    };

    this.workflows.set(workflowId, workflow);
    await this.persistWorkflow(workflowId);

    return workflow;
  }

  /**
   * Update workflow state
   */
  async updateWorkflow(workflowId, updates) {
    if (!this.workflows.has(workflowId)) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const workflow = this.workflows.get(workflowId);

    // Merge updates
    Object.assign(workflow, updates, {
      updatedAt: Date.now()
    });

    // Persist changes
    await this.persistWorkflow(workflowId);

    return workflow;
  }

  /**
   * Update workflow status
   */
  async updateWorkflowStatus(workflowId, status) {
    return await this.updateWorkflow(workflowId, { status });
  }

  /**
   * Add step result to workflow
   */
  async addStepResult(workflowId, stepName, result) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    workflow.results[stepName] = {
      result,
      timestamp: Date.now()
    };

    workflow.steps.push({
      name: stepName,
      status: 'completed',
      timestamp: Date.now()
    });

    await this.persistWorkflow(workflowId);
  }

  /**
   * Add error to workflow
   */
  async addWorkflowError(workflowId, error) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    workflow.errors.push({
      message: error.message || error,
      stack: error.stack,
      timestamp: Date.now()
    });

    await this.persistWorkflow(workflowId);
  }

  /**
   * Get workflow state
   */
  getWorkflow(workflowId) {
    return this.workflows.get(workflowId);
  }

  /**
   * Complete workflow
   */
  async completeWorkflow(workflowId, finalResult = null) {
    const updates = {
      status: 'completed',
      completedAt: Date.now()
    };

    if (finalResult !== null) {
      updates.finalResult = finalResult;
    }

    return await this.updateWorkflow(workflowId, updates);
  }

  /**
   * Save agent state
   */
  async saveAgentState(agentName, state) {
    this.agentStates.set(agentName, {
      state,
      updatedAt: Date.now()
    });

    await this.persistAgentState(agentName);
  }

  /**
   * Load agent state
   */
  async loadAgentState(agentName) {
    if (this.agentStates.has(agentName)) {
      return this.agentStates.get(agentName).state;
    }

    // Try loading from disk
    const filePath = path.join(this.stateDir, 'agents', `${agentName}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const agentData = JSON.parse(data);
      this.agentStates.set(agentName, agentData);
      return agentData.state;
    } catch (error) {
      // No persisted state found
      return null;
    }
  }

  /**
   * Persist workflow to disk
   */
  async persistWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    const filePath = path.join(this.stateDir, 'workflows', `${workflowId}.json`);
    await this.ensureDirectory(path.dirname(filePath));

    await fs.writeFile(filePath, JSON.stringify(workflow, null, 2));
  }

  /**
   * Persist agent state to disk
   */
  async persistAgentState(agentName) {
    const agentData = this.agentStates.get(agentName);
    if (!agentData) return;

    const filePath = path.join(this.stateDir, 'agents', `${agentName}.json`);
    await this.ensureDirectory(path.dirname(filePath));

    await fs.writeFile(filePath, JSON.stringify(agentData, null, 2));
  }

  /**
   * Load persisted state from disk
   */
  async loadPersistedState() {
    // Load workflows
    const workflowDir = path.join(this.stateDir, 'workflows');
    try {
      const files = await fs.readdir(workflowDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(workflowDir, file);
          const data = await fs.readFile(filePath, 'utf8');
          const workflow = JSON.parse(data);

          // Check if workflow is expired
          if (Date.now() - workflow.updatedAt < this.maxStateAge) {
            this.workflows.set(workflow.id, workflow);
          } else {
            // Clean up expired workflow
            await fs.unlink(filePath);
          }
        }
      }
    } catch (error) {
      // Directory might not exist yet
    }

    // Load agent states
    const agentDir = path.join(this.stateDir, 'agents');
    try {
      const files = await fs.readdir(agentDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(agentDir, file);
          const data = await fs.readFile(filePath, 'utf8');
          const agentData = JSON.parse(data);
          const agentName = file.replace('.json', '');

          this.agentStates.set(agentName, agentData);
        }
      }
    } catch (error) {
      // Directory might not exist yet
    }

    console.log(`[StateManager] Loaded ${this.workflows.size} workflows and ${this.agentStates.size} agent states`);
  }

  /**
   * Clean up expired states
   */
  async cleanup() {
    const now = Date.now();
    const expiredWorkflows = [];

    // Find expired workflows
    for (const [id, workflow] of this.workflows) {
      if (now - workflow.updatedAt > this.maxStateAge) {
        expiredWorkflows.push(id);
      }
    }

    // Remove expired workflows
    for (const id of expiredWorkflows) {
      this.workflows.delete(id);
      const filePath = path.join(this.stateDir, 'workflows', `${id}.json`);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // File might not exist
      }
    }

    console.log(`[StateManager] Cleaned up ${expiredWorkflows.length} expired workflows`);
  }

  /**
   * Get all active workflows
   */
  getActiveWorkflows() {
    return Array.from(this.workflows.values()).filter(w =>
      w.status !== 'completed' && w.status !== 'failed'
    );
  }

  /**
   * Ensure directory exists
   */
  async ensureDirectory(dir) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Ensure state directory structure exists
   */
  async ensureStateDirectory() {
    await this.ensureDirectory(this.stateDir);
    await this.ensureDirectory(path.join(this.stateDir, 'workflows'));
    await this.ensureDirectory(path.join(this.stateDir, 'agents'));
  }
}

module.exports = StateManager;