/**
 * Base Agent Class - Foundation for all autonomous agents
 * Provides core functionality for agent execution, communication, and state management
 */

class BaseAgent {
  constructor(config) {
    this.name = config.name;
    this.version = config.version || '1.0.0';
    this.description = config.description;
    this.capabilities = config.capabilities || [];
    this.dependencies = config.dependencies || [];
    this.state = {};
    this.messageBus = null;
    this.orchestrator = null;
  }

  /**
   * Initialize agent with runtime dependencies
   */
  async initialize(runtime) {
    this.messageBus = runtime.messageBus;
    this.orchestrator = runtime.orchestrator;
    this.stateManager = runtime.stateManager;

    // Load persisted state if exists
    const savedState = await this.stateManager.loadAgentState(this.name);
    if (savedState) {
      this.state = savedState;
    }

    // Register with message bus for inter-agent communication
    this.messageBus.register(this.name, this.handleMessage.bind(this));

    // Custom initialization for derived agents
    await this.onInitialize();
  }

  /**
   * Main execution entry point - must be implemented by derived agents
   */
  async execute(task) {
    throw new Error(`Agent ${this.name} must implement execute() method`);
  }

  /**
   * Invoke another agent and wait for response
   */
  async invokeAgent(agentName, payload) {
    console.log(`[${this.name}] Invoking agent: ${agentName}`);

    const message = {
      from: this.name,
      to: agentName,
      type: 'invoke',
      payload,
      timestamp: Date.now(),
      messageId: this.generateMessageId()
    };

    // Send message and wait for response
    const response = await this.messageBus.sendAndWait(message);

    if (response.error) {
      throw new Error(`Agent ${agentName} returned error: ${response.error}`);
    }

    return response.result;
  }

  /**
   * Invoke multiple agents in parallel
   */
  async invokeAgentsParallel(invocations) {
    console.log(`[${this.name}] Invoking ${invocations.length} agents in parallel`);

    const promises = invocations.map(({ agent, payload }) =>
      this.invokeAgent(agent, payload)
    );

    return await Promise.allSettled(promises);
  }

  /**
   * Report progress to orchestrator
   */
  async reportProgress(progress) {
    if (this.orchestrator) {
      await this.orchestrator.updateProgress(this.name, progress);
    }
  }

  /**
   * Save agent state for persistence
   */
  async saveState() {
    await this.stateManager.saveAgentState(this.name, this.state);
  }

  /**
   * Handle incoming messages from other agents
   */
  async handleMessage(message) {
    console.log(`[${this.name}] Received message from ${message.from}`);

    try {
      switch (message.type) {
        case 'invoke':
          const result = await this.execute(message.payload);
          return {
            success: true,
            result,
            timestamp: Date.now()
          };

        case 'query':
          return await this.handleQuery(message.payload);

        case 'notify':
          await this.handleNotification(message.payload);
          return { success: true };

        default:
          throw new Error(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Handle capability queries from other agents
   */
  async handleQuery(query) {
    if (query.type === 'capabilities') {
      return {
        name: this.name,
        capabilities: this.capabilities,
        version: this.version,
        description: this.description
      };
    }

    // Agent-specific query handling
    return await this.onQuery(query);
  }

  /**
   * Handle notifications from other agents
   */
  async handleNotification(notification) {
    // Default: log notification
    console.log(`[${this.name}] Notification: ${JSON.stringify(notification)}`);

    // Agent-specific notification handling
    await this.onNotification(notification);
  }

  /**
   * Hook methods for derived agents to override
   */
  async onInitialize() {
    // Override in derived agent for custom initialization
  }

  async onQuery(query) {
    // Override in derived agent for custom queries
    return { error: 'Query not implemented' };
  }

  async onNotification(notification) {
    // Override in derived agent for custom notifications
  }

  /**
   * Utility methods
   */
  generateMessageId() {
    return `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] [${this.name}] ${message}`);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = BaseAgent;