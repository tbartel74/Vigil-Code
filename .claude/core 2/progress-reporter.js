/**
 * Progress Reporter - Real-time visibility for orchestration
 * Formats orchestrator actions for Claude Code UI
 */

class ProgressReporter {
  constructor() {
    this.startTime = null;
    this.logs = [];
    this.indentLevel = 0;
  }

  /**
   * Start tracking a new task
   */
  startTask(taskDescription) {
    this.startTime = Date.now();
    this.logs = [];
    this.indentLevel = 0;

    console.log('\n🎯 Task: ' + taskDescription);
    console.log('═'.repeat(60));
  }

  /**
   * Report task classification result
   */
  reportClassification(classification) {
    const { category, confidence, agents, workflow } = classification;

    console.log(`📊 Classification:`);
    console.log(`   • Category: ${category}`);
    console.log(`   • Confidence: ${(confidence * 100).toFixed(0)}%`);
    console.log(`   • Agents: ${agents.join(', ')}`);
    if (workflow) {
      console.log(`   • Workflow: ${workflow}`);
    }
    console.log('');
  }

  /**
   * Report execution strategy
   */
  reportStrategy(strategy) {
    const emoji = {
      single: '🎯',
      parallel: '⚡',
      sequential: '📝',
      workflow: '🎭'
    };

    console.log(`${emoji[strategy] || '🔧'} Strategy: ${strategy.toUpperCase()}`);
    console.log('');
  }

  /**
   * Report agent invocation
   */
  startAgent(agentName) {
    this.indentLevel = 1;
    const icon = this._getAgentIcon(agentName);
    console.log(`${icon} Invoking: ${agentName}`);
  }

  /**
   * Report agent action
   */
  reportAction(agentName, action) {
    const indent = '   '.repeat(this.indentLevel);
    console.log(`${indent}├─ ▶️  Action: ${action}`);
  }

  /**
   * Report progress within an agent
   */
  reportProgress(agentName, progress) {
    const indent = '   '.repeat(this.indentLevel);
    const { percentage, message } = progress;

    if (percentage !== undefined) {
      const bar = this._createProgressBar(percentage);
      console.log(`${indent}├─ ${bar} ${percentage}% - ${message}`);
    } else {
      console.log(`${indent}├─ 📝 ${message}`);
    }
  }

  /**
   * Report agent completion
   */
  completeAgent(agentName, duration, result) {
    const indent = '   '.repeat(this.indentLevel);
    const durationStr = this._formatDuration(duration);

    if (result.success) {
      console.log(`${indent}└─ ✅ Completed (${durationStr})`);
    } else {
      console.log(`${indent}└─ ❌ Failed (${durationStr})`);
    }

    if (result.summary) {
      console.log(`${indent}   ${result.summary}`);
    }

    console.log('');
    this.indentLevel = Math.max(0, this.indentLevel - 1);
  }

  /**
   * Report inter-agent communication
   */
  reportInterAgentCall(fromAgent, toAgent, action) {
    const indent = '   '.repeat(this.indentLevel + 1);
    console.log(`${indent}↪️  ${fromAgent} → ${toAgent} (${action})`);
    this.indentLevel++;
  }

  /**
   * Report workflow step
   */
  reportWorkflowStep(stepNumber, totalSteps, stepDescription) {
    console.log(`\n📍 Step ${stepNumber}/${totalSteps}: ${stepDescription}`);
    console.log('─'.repeat(60));
  }

  /**
   * Report parallel execution
   */
  reportParallelExecution(agents) {
    console.log(`⚡ Executing ${agents.length} agents in parallel:`);
    agents.forEach((agent, index) => {
      console.log(`   ${index + 1}. ${agent}`);
    });
    console.log('');
  }

  /**
   * Report error
   */
  reportError(agentName, error) {
    const indent = '   '.repeat(this.indentLevel);
    console.log(`${indent}❌ Error in ${agentName}:`);
    console.log(`${indent}   ${error.message}`);

    if (error.details) {
      console.log(`${indent}   Details: ${error.details}`);
    }
    console.log('');
  }

  /**
   * Report retry attempt
   */
  reportRetry(agentName, attempt, maxAttempts) {
    const indent = '   '.repeat(this.indentLevel);
    console.log(`${indent}🔄 Retry ${attempt}/${maxAttempts} for ${agentName}`);
  }

  /**
   * Complete task and show summary
   */
  completeTask(result) {
    const totalDuration = Date.now() - this.startTime;
    const durationStr = this._formatDuration(totalDuration);

    console.log('═'.repeat(60));
    console.log(`\n✨ Task Completed in ${durationStr}`);
    console.log('');

    if (result.summary) {
      console.log('📋 Summary:');
      console.log(`   ${result.summary}`);
      console.log('');
    }

    if (result.metadata) {
      const { agents, strategy, steps } = result.metadata;

      if (agents && agents.length > 1) {
        console.log(`🤝 Coordinated ${agents.length} agents:`);
        agents.forEach(agent => console.log(`   • ${agent}`));
        console.log('');
      }

      if (steps && steps > 1) {
        console.log(`📊 Executed ${steps} workflow steps`);
        console.log('');
      }
    }

    if (result.nextSteps && result.nextSteps.length > 0) {
      console.log('💡 Next Steps:');
      result.nextSteps.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
      console.log('');
    }
  }

  /**
   * Fail task and show error summary
   */
  failTask(error) {
    const totalDuration = Date.now() - this.startTime;
    const durationStr = this._formatDuration(totalDuration);

    console.log('═'.repeat(60));
    console.log(`\n💥 Task Failed after ${durationStr}`);
    console.log('');
    console.log(`❌ Error: ${error.message}`);

    if (error.agent) {
      console.log(`   Agent: ${error.agent}`);
    }

    if (error.details) {
      console.log(`   Details: ${error.details}`);
    }

    console.log('');
  }

  /**
   * Create ASCII progress bar
   */
  _createProgressBar(percentage) {
    const width = 20;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;

    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
  }

  /**
   * Format duration in human-readable form
   */
  _formatDuration(ms) {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Get icon for agent type
   */
  _getAgentIcon(agentName) {
    const icons = {
      'vg-test-automation': '🧪',
      'vg-workflow-business-logic': '⚙️',
      'vg-pii-detection': '🔒',
      'vg-backend-api': '🔌',
      'vg-frontend-ui': '🎨',
      'vg-data-analytics': '📊',
      'vg-workflow-infrastructure': '🏗️',
      'vg-infrastructure-deployment': '🚀',
      'vg-security-compliance': '🛡️',
      'vg-documentation': '📚'
    };

    return icons[agentName] || '🤖';
  }

  /**
   * Log message for debugging
   */
  debug(message) {
    if (process.env.DEBUG_ORCHESTRATOR) {
      console.log(`[DEBUG] ${message}`);
    }
  }
}

module.exports = ProgressReporter;
