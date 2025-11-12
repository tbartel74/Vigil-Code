/**
 * Task Classifier - Intelligent task analysis and routing
 * Analyzes user requests and determines appropriate agents and workflows
 */

class TaskClassifier {
  constructor() {
    this.patterns = this.initializePatterns();
    this.workflowTemplates = this.initializeWorkflows();
  }

  /**
   * Initialize task patterns for classification
   */
  initializePatterns() {
    return {
      // Pattern addition/detection
      detection: {
        keywords: ['add detection', 'detect', 'pattern', 'rule', 'threat', 'injection', 'attack'],
        agents: ['vg-workflow-business-logic', 'vg-test-automation'],
        workflow: 'PATTERN_ADDITION'
      },

      // PII detection
      pii: {
        keywords: ['pii', 'personal', 'data', 'privacy', 'redact', 'mask', 'pesel', 'credit card'],
        agents: ['vg-pii-detection', 'vg-workflow-business-logic'],
        workflow: 'PII_ENTITY_ADDITION'
      },

      // Testing
      testing: {
        keywords: ['test', 'verify', 'validate', 'check', 'run tests', 'coverage'],
        agents: ['vg-test-automation'],
        workflow: 'TEST_EXECUTION'
      },

      // Security audit
      security: {
        keywords: ['security', 'audit', 'vulnerability', 'scan', 'owasp', 'cve'],
        agents: ['vg-security-compliance'],
        workflow: 'SECURITY_AUDIT'
      },

      // Frontend/UI
      frontend: {
        keywords: ['ui', 'frontend', 'react', 'component', 'interface', 'display', 'button', 'form'],
        agents: ['vg-frontend-ui'],
        workflow: null
      },

      // Backend/API
      backend: {
        keywords: ['api', 'backend', 'endpoint', 'auth', 'jwt', 'database', 'server'],
        agents: ['vg-backend-api'],
        workflow: null
      },

      // Analytics
      analytics: {
        keywords: ['clickhouse', 'grafana', 'dashboard', 'metrics', 'logs', 'query', 'analytics'],
        agents: ['vg-data-analytics'],
        workflow: null
      },

      // Deployment
      deployment: {
        keywords: ['deploy', 'docker', 'container', 'build', 'restart', 'service'],
        agents: ['vg-infrastructure-deployment'],
        workflow: 'SERVICE_DEPLOYMENT'
      },

      // Documentation
      documentation: {
        keywords: ['document', 'docs', 'readme', 'guide', 'explain', 'description'],
        agents: ['vg-documentation'],
        workflow: null
      },

      // Workflow/n8n
      workflow: {
        keywords: ['n8n', 'workflow', 'node', 'webhook', 'pipeline'],
        agents: ['vg-workflow-infrastructure'],
        workflow: null
      }
    };
  }

  /**
   * Initialize workflow templates
   */
  initializeWorkflows() {
    return {
      PATTERN_ADDITION: {
        name: 'Pattern Addition Workflow',
        steps: [
          { agent: 'vg-test-automation', action: 'create_test', parallel: false },
          { agent: 'vg-test-automation', action: 'run_test', parallel: false },
          { agent: 'vg-workflow-business-logic', action: 'add_pattern', parallel: false },
          { agent: 'vg-test-automation', action: 'verify_test', parallel: false }
        ]
      },

      PII_ENTITY_ADDITION: {
        name: 'PII Entity Addition Workflow',
        steps: [
          { agent: 'vg-pii-detection', action: 'analyze_entity', parallel: false },
          { agent: 'vg-workflow-business-logic', action: 'update_config', parallel: false },
          { agent: 'vg-test-automation', action: 'test_pii', parallel: false }
        ]
      },

      SECURITY_AUDIT: {
        name: 'Security Audit Workflow',
        steps: [
          { agent: 'vg-security-compliance', action: 'npm_audit', parallel: true },
          { agent: 'vg-security-compliance', action: 'secret_scan', parallel: true },
          { agent: 'vg-security-compliance', action: 'redos_check', parallel: true },
          { agent: 'vg-security-compliance', action: 'auth_review', parallel: true }
        ]
      },

      TEST_EXECUTION: {
        name: 'Test Execution Workflow',
        steps: [
          { agent: 'vg-test-automation', action: 'run_suite', parallel: false },
          { agent: 'vg-test-automation', action: 'analyze_results', parallel: false }
        ]
      },

      SERVICE_DEPLOYMENT: {
        name: 'Service Deployment Workflow',
        steps: [
          { agent: 'vg-infrastructure-deployment', action: 'build_containers', parallel: false },
          { agent: 'vg-infrastructure-deployment', action: 'deploy_service', parallel: false },
          { agent: 'vg-infrastructure-deployment', action: 'health_check', parallel: false }
        ]
      }
    };
  }

  /**
   * Classify a task based on user input
   */
  async classify(userInput) {
    const input = userInput.toLowerCase();
    const classification = {
      input: userInput,
      confidence: 0,
      category: null,
      agents: [],
      workflow: null,
      keywords: [],
      multiAgent: false
    };

    // Check each pattern
    const matches = [];
    for (const [category, pattern] of Object.entries(this.patterns)) {
      const matchedKeywords = pattern.keywords.filter(keyword =>
        input.includes(keyword)
      );

      if (matchedKeywords.length > 0) {
        matches.push({
          category,
          score: matchedKeywords.length,
          keywords: matchedKeywords,
          agents: pattern.agents,
          workflow: pattern.workflow
        });
      }
    }

    // Sort by score
    matches.sort((a, b) => b.score - a.score);

    if (matches.length === 0) {
      classification.confidence = 0;
      classification.category = 'unknown';
      return classification;
    }

    // Primary match
    const primary = matches[0];
    classification.category = primary.category;
    classification.agents = primary.agents;
    classification.workflow = primary.workflow;
    classification.keywords = primary.keywords;
    classification.confidence = Math.min(primary.score * 0.3, 1);

    // Check for multi-agent requirement
    if (matches.length > 1 && matches[1].score >= primary.score * 0.6) {
      // Secondary category is significant
      classification.multiAgent = true;
      classification.secondaryCategory = matches[1].category;
      classification.agents = [...new Set([...primary.agents, ...matches[1].agents])];
    }

    // Boost confidence for exact workflow matches
    if (classification.workflow) {
      classification.confidence = Math.min(classification.confidence + 0.3, 1);
    }

    return classification;
  }

  /**
   * Determine execution strategy
   */
  determineStrategy(classification) {
    const strategy = {
      type: 'single', // single, workflow, parallel, sequential
      agents: [],
      workflow: null,
      steps: []
    };

    // If workflow exists, use it
    if (classification.workflow && this.workflowTemplates[classification.workflow]) {
      strategy.type = 'workflow';
      strategy.workflow = classification.workflow;
      strategy.steps = this.workflowTemplates[classification.workflow].steps;
      return strategy;
    }

    // Multi-agent without workflow
    if (classification.multiAgent || classification.agents.length > 1) {
      strategy.type = 'parallel';
      strategy.agents = classification.agents;
      return strategy;
    }

    // Single agent
    strategy.type = 'single';
    strategy.agents = classification.agents;
    return strategy;
  }

  /**
   * Get workflow template
   */
  getWorkflowTemplate(workflowName) {
    return this.workflowTemplates[workflowName] || null;
  }

  /**
   * Analyze task complexity
   */
  analyzeComplexity(userInput) {
    const analysis = {
      estimatedSteps: 1,
      requiresUserInput: false,
      parallelizable: false,
      estimatedDuration: 'short' // short, medium, long
    };

    const input = userInput.toLowerCase();

    // Check for multi-step indicators
    if (input.includes(' and ') || input.includes(' then ') || input.includes(' also ')) {
      analysis.estimatedSteps += 2;
    }

    // Check for user input requirements
    if (input.includes('ask') || input.includes('confirm') || input.includes('review')) {
      analysis.requiresUserInput = true;
    }

    // Check for parallel indicators
    if (input.includes('all ') || input.includes('multiple') || input.includes('every')) {
      analysis.parallelizable = true;
    }

    // Estimate duration
    if (analysis.estimatedSteps > 3) {
      analysis.estimatedDuration = 'long';
    } else if (analysis.estimatedSteps > 1) {
      analysis.estimatedDuration = 'medium';
    }

    return analysis;
  }

  /**
   * Suggest agents for a task
   */
  suggestAgents(userInput) {
    const classification = this.classify(userInput);
    const strategy = this.determineStrategy(classification);

    return {
      primary: classification.agents,
      workflow: classification.workflow,
      confidence: classification.confidence,
      strategy: strategy.type,
      reasoning: this.explainClassification(classification)
    };
  }

  /**
   * Explain classification decision
   */
  explainClassification(classification) {
    const reasons = [];

    if (classification.confidence === 0) {
      return 'Unable to classify task - no matching patterns found';
    }

    reasons.push(`Detected ${classification.category} task based on keywords: ${classification.keywords.join(', ')}`);

    if (classification.workflow) {
      reasons.push(`Matched to ${classification.workflow} workflow template`);
    }

    if (classification.multiAgent) {
      reasons.push(`Multi-agent task detected - will coordinate ${classification.agents.length} agents`);
    }

    reasons.push(`Confidence level: ${Math.round(classification.confidence * 100)}%`);

    return reasons.join('. ');
  }
}

module.exports = TaskClassifier;