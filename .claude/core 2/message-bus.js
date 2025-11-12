/**
 * Message Bus - Inter-agent communication system
 * Handles asynchronous message passing between agents
 */

const EventEmitter = require('events');

class MessageBus extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.pendingMessages = new Map();
    this.messageLog = [];
    this.maxLogSize = 1000;
  }

  /**
   * Register an agent with the message bus
   */
  register(agentName, messageHandler) {
    console.log(`[MessageBus] Registering agent: ${agentName}`);
    this.agents.set(agentName, {
      handler: messageHandler,
      status: 'active',
      registeredAt: Date.now()
    });
    this.emit('agent:registered', agentName);
  }

  /**
   * Unregister an agent
   */
  unregister(agentName) {
    console.log(`[MessageBus] Unregistering agent: ${agentName}`);
    this.agents.delete(agentName);
    this.emit('agent:unregistered', agentName);
  }

  /**
   * Send a message and wait for response
   */
  async sendAndWait(message, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const messageId = message.messageId || this.generateMessageId();
      message.messageId = messageId;

      // Store pending message
      this.pendingMessages.set(messageId, {
        resolve,
        reject,
        message,
        timestamp: Date.now()
      });

      // Set timeout
      const timeoutId = setTimeout(() => {
        this.pendingMessages.delete(messageId);
        reject(new Error(`Message timeout: No response from ${message.to} after ${timeout}ms`));
      }, timeout);

      // Send message
      this.send(message).then(response => {
        clearTimeout(timeoutId);
        this.pendingMessages.delete(messageId);
        resolve(response);
      }).catch(error => {
        clearTimeout(timeoutId);
        this.pendingMessages.delete(messageId);
        reject(error);
      });
    });
  }

  /**
   * Send a message to an agent
   */
  async send(message) {
    // Log message
    this.logMessage(message);

    // Validate target agent exists
    if (!this.agents.has(message.to)) {
      throw new Error(`Agent not found: ${message.to}`);
    }

    const targetAgent = this.agents.get(message.to);

    // Check agent status
    if (targetAgent.status !== 'active') {
      throw new Error(`Agent ${message.to} is not active (status: ${targetAgent.status})`);
    }

    // Send message to agent
    try {
      this.emit('message:sending', message);
      const response = await targetAgent.handler(message);
      this.emit('message:delivered', { message, response });
      return response;
    } catch (error) {
      this.emit('message:error', { message, error });
      throw error;
    }
  }

  /**
   * Broadcast a message to multiple agents
   */
  async broadcast(message, agentFilter = null) {
    const targetAgents = agentFilter
      ? Array.from(this.agents.keys()).filter(agentFilter)
      : Array.from(this.agents.keys());

    console.log(`[MessageBus] Broadcasting to ${targetAgents.length} agents`);

    const results = await Promise.allSettled(
      targetAgents.map(agentName =>
        this.send({ ...message, to: agentName })
      )
    );

    return {
      sent: targetAgents.length,
      succeeded: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results
    };
  }

  /**
   * Query all agents for their capabilities
   */
  async queryCapabilities() {
    const capabilities = {};

    for (const [agentName, agentInfo] of this.agents) {
      if (agentInfo.status === 'active') {
        try {
          const response = await this.send({
            to: agentName,
            from: 'system',
            type: 'query',
            payload: { type: 'capabilities' }
          });
          capabilities[agentName] = response;
        } catch (error) {
          capabilities[agentName] = { error: error.message };
        }
      }
    }

    return capabilities;
  }

  /**
   * Get list of registered agents
   */
  getRegisteredAgents() {
    return Array.from(this.agents.entries()).map(([name, info]) => ({
      name,
      status: info.status,
      registeredAt: info.registeredAt
    }));
  }

  /**
   * Update agent status
   */
  updateAgentStatus(agentName, status) {
    if (this.agents.has(agentName)) {
      const agent = this.agents.get(agentName);
      agent.status = status;
      this.emit('agent:status', { agent: agentName, status });
    }
  }

  /**
   * Log message for debugging and audit
   */
  logMessage(message) {
    const logEntry = {
      ...message,
      timestamp: Date.now()
    };

    this.messageLog.push(logEntry);

    // Trim log if too large
    if (this.messageLog.length > this.maxLogSize) {
      this.messageLog = this.messageLog.slice(-this.maxLogSize);
    }
  }

  /**
   * Get message history
   */
  getMessageHistory(filter = {}) {
    let history = [...this.messageLog];

    if (filter.from) {
      history = history.filter(m => m.from === filter.from);
    }
    if (filter.to) {
      history = history.filter(m => m.to === filter.to);
    }
    if (filter.type) {
      history = history.filter(m => m.type === filter.type);
    }
    if (filter.since) {
      history = history.filter(m => m.timestamp >= filter.since);
    }

    return history;
  }

  /**
   * Generate unique message ID
   */
  generateMessageId() {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear message history
   */
  clearHistory() {
    this.messageLog = [];
  }

  /**
   * Emit progress event for orchestrator visibility
   */
  emitProgress(agentName, progress) {
    this.emit('agent:progress', {
      agent: agentName,
      progress,
      timestamp: Date.now()
    });
  }

  /**
   * Emit agent action event
   */
  emitAction(agentName, action) {
    this.emit('agent:action', {
      agent: agentName,
      action,
      timestamp: Date.now()
    });
  }

  /**
   * Emit agent completion event
   */
  emitCompletion(agentName, duration, result) {
    this.emit('agent:completion', {
      agent: agentName,
      duration,
      result,
      timestamp: Date.now()
    });
  }

  /**
   * Emit inter-agent communication event
   */
  emitInterAgentCall(fromAgent, toAgent, action) {
    this.emit('agent:inter-call', {
      from: fromAgent,
      to: toAgent,
      action,
      timestamp: Date.now()
    });
  }
}

module.exports = MessageBus;