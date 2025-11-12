/**
 * Workflow Business Logic Agent - Manages detection patterns and rules
 * Handles pattern suggestions, configuration updates, and threshold tuning
 */

const BaseAgent = require('../../core/base-agent');
const fs = require('fs').promises;
const path = require('path');

class WorkflowBusinessLogicAgent extends BaseAgent {
  constructor() {
    super({
      name: 'vg-workflow-business-logic',
      version: '2.0.0',
      description: 'Autonomous workflow configuration and pattern management agent',
      capabilities: [
        'add_pattern',
        'suggest_pattern',
        'update_config',
        'analyze_detection',
        'tune_thresholds',
        'validate_rules'
      ],
      dependencies: []
    });

    this.configDir = path.join(process.cwd(), 'services', 'workflow', 'config');
    this.rulesFile = path.join(this.configDir, 'rules.config.json');
    this.unifiedConfigFile = path.join(this.configDir, 'unified_config.json');
    this.categories = this.initializeCategories();
  }

  /**
   * Initialize threat categories
   */
  initializeCategories() {
    return {
      'PROMPT_LEAK': { weight: 95, sanitize: true },
      'PROMPT_INJECTION': { weight: 90, sanitize: true },
      'JAILBREAK_ATTEMPT': { weight: 85, sanitize: true },
      'PII_EXPOSURE': { weight: 80, sanitize: true },
      'HARMFUL_CONTENT': { weight: 75, sanitize: true },
      'MALICIOUS_INSTRUCTIONS': { weight: 70, sanitize: true },
      'CODE_INJECTION': { weight: 65, sanitize: true },
      'SQL_XSS_ATTACKS': { weight: 60, sanitize: true },
      'CONVERSATION_HIJACK': { weight: 55, sanitize: true },
      'ROLE_PLAY': { weight: 50, sanitize: false }
    };
  }

  /**
   * Main execution entry point
   */
  async execute(task) {
    this.log(`Executing task: ${task.action}`);

    switch (task.action) {
      case 'add_pattern':
        return await this.addPattern(task);

      case 'suggest_pattern':
        return await this.suggestPattern(task);

      case 'update_config':
        return await this.updateConfig(task);

      case 'analyze_detection':
        return await this.analyzeDetection(task);

      case 'tune_thresholds':
        return await this.tuneThresholds(task);

      case 'validate_rules':
        return await this.validateRules(task);

      default:
        return await this.handleAutonomously(task);
    }
  }

  /**
   * Add a new detection pattern
   */
  async addPattern(task) {
    const { pattern, category, description } = task.payload || {};

    this.log(`Adding pattern to category: ${category}`);

    try {
      // Load current rules
      const rules = await this.loadRules();

      // Validate category exists
      if (!rules[category]) {
        // Autonomous decision: Create new category
        const categoryConfig = await this.createCategory(category);
        rules[category] = categoryConfig;
      }

      // Validate pattern doesn't already exist
      if (this.patternExists(rules[category], pattern)) {
        return {
          success: false,
          message: 'Pattern already exists in this category',
          existing: pattern
        };
      }

      // Add pattern
      if (!rules[category].patterns) {
        rules[category].patterns = [];
      }

      rules[category].patterns.push({
        pattern,
        description: description || 'Auto-added pattern',
        addedAt: new Date().toISOString(),
        addedBy: 'workflow-business-logic-agent'
      });

      // Save rules
      await this.saveRules(rules);

      // Report progress
      await this.reportProgress({
        percentage: 100,
        message: `Pattern added to ${category}`
      });

      return {
        success: true,
        category,
        pattern,
        totalPatterns: rules[category].patterns.length
      };

    } catch (error) {
      this.log(`Failed to add pattern: ${error.message}`, 'error');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Suggest patterns based on context
   */
  async suggestPattern(task) {
    const { context, error, testFailure } = task.payload || {};

    this.log('Analyzing context for pattern suggestions...');

    const suggestions = [];

    // Analyze error or test failure
    const analysis = this.analyzeFailureContext(context || error || testFailure);

    // Generate pattern suggestions
    if (analysis.type === 'false_negative') {
      // Attack not detected
      suggestions.push({
        action: 'add',
        pattern: this.generatePattern(analysis.input),
        category: this.determineCategory(analysis.input),
        confidence: 0.8
      });
    } else if (analysis.type === 'false_positive') {
      // Legitimate content blocked
      suggestions.push({
        action: 'modify',
        pattern: this.refinePattern(analysis.existingPattern),
        category: analysis.category,
        confidence: 0.7
      });
    } else if (analysis.type === 'threshold') {
      // Scoring issue
      suggestions.push({
        action: 'tune',
        threshold: this.calculateOptimalThreshold(analysis),
        confidence: 0.9
      });
    }

    // Autonomous decision: Validate suggestions
    const validated = await this.validateSuggestions(suggestions);

    return {
      suggestions: validated,
      analysis,
      recommendation: this.generateRecommendation(validated)
    };
  }

  /**
   * Update configuration
   */
  async updateConfig(task) {
    const { configType, updates } = task.payload || {};

    this.log(`Updating configuration: ${configType}`);

    try {
      let config;
      let configFile;

      // Determine which config to update
      if (configType === 'rules') {
        configFile = this.rulesFile;
        config = await this.loadRules();
      } else {
        configFile = this.unifiedConfigFile;
        config = await this.loadUnifiedConfig();
      }

      // Apply updates
      const updatedConfig = this.applyUpdates(config, updates);

      // Validate configuration
      const validation = await this.validateConfig(updatedConfig);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Save configuration
      await fs.writeFile(configFile, JSON.stringify(updatedConfig, null, 2));

      // Autonomous action: Notify dependent agents
      await this.notifyDependentAgents(configType, updates);

      return {
        success: true,
        configType,
        updates: Object.keys(updates).length,
        validation
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze detection effectiveness
   */
  async analyzeDetection(task) {
    const { logs, timeRange } = task.payload || {};

    this.log('Analyzing detection effectiveness...');

    const analysis = {
      totalEvents: 0,
      blocked: 0,
      allowed: 0,
      sanitized: 0,
      categories: {},
      patterns: {},
      effectiveness: 0,
      recommendations: []
    };

    // Process logs (simplified for example)
    if (logs && Array.isArray(logs)) {
      analysis.totalEvents = logs.length;
      analysis.blocked = logs.filter(l => l.decision === 'BLOCK').length;
      analysis.allowed = logs.filter(l => l.decision === 'ALLOW').length;
      analysis.sanitized = logs.filter(l => l.decision?.includes('SANITIZE')).length;

      // Calculate effectiveness
      analysis.effectiveness = (analysis.blocked + analysis.sanitized) / analysis.totalEvents;

      // Category breakdown
      for (const log of logs) {
        if (log.category) {
          if (!analysis.categories[log.category]) {
            analysis.categories[log.category] = 0;
          }
          analysis.categories[log.category]++;
        }
      }
    }

    // Generate recommendations
    if (analysis.effectiveness < 0.7) {
      analysis.recommendations.push('Detection rate below 70% - consider adding more patterns');
    }

    if (analysis.blocked > analysis.totalEvents * 0.5) {
      analysis.recommendations.push('High block rate - review for false positives');
    }

    // Autonomous decision: Invoke analytics agent for deeper analysis
    if (analysis.totalEvents > 1000) {
      const analyticsResponse = await this.invokeAgent('data-analytics', {
        action: 'deep_analysis',
        data: logs,
        timeRange
      });
      analysis.deepAnalysis = analyticsResponse.result;
    }

    return analysis;
  }

  /**
   * Tune detection thresholds
   */
  async tuneThresholds(task) {
    const { targetMetrics } = task.payload || {};

    this.log('Tuning detection thresholds...');

    const config = await this.loadUnifiedConfig();
    const current = {
      blockThreshold: config.thresholds?.block || 85,
      sanitizeLightThreshold: config.thresholds?.sanitizeLight || 30,
      sanitizeHeavyThreshold: config.thresholds?.sanitizeHeavy || 65
    };

    // Calculate optimal thresholds
    const optimal = this.calculateOptimalThresholds(targetMetrics);

    // Apply adjustments gradually
    const adjusted = {
      blockThreshold: this.adjustThreshold(current.blockThreshold, optimal.block),
      sanitizeLightThreshold: this.adjustThreshold(current.sanitizeLightThreshold, optimal.sanitizeLight),
      sanitizeHeavyThreshold: this.adjustThreshold(current.sanitizeHeavyThreshold, optimal.sanitizeHeavy)
    };

    // Update configuration
    config.thresholds = adjusted;
    await this.saveUnifiedConfig(config);

    return {
      success: true,
      previous: current,
      adjusted,
      optimal,
      message: 'Thresholds tuned based on target metrics'
    };
  }

  /**
   * Validate rules configuration
   */
  async validateRules(task) {
    this.log('Validating rules configuration...');

    const rules = await this.loadRules();
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      stats: {
        categories: 0,
        totalPatterns: 0,
        emptyCategories: 0
      }
    };

    // Validate each category
    for (const [category, config] of Object.entries(rules)) {
      validation.stats.categories++;

      if (!config.patterns || config.patterns.length === 0) {
        validation.stats.emptyCategories++;
        validation.warnings.push(`Category ${category} has no patterns`);
      } else {
        validation.stats.totalPatterns += config.patterns.length;

        // Validate patterns
        for (const pattern of config.patterns) {
          const patternValidation = this.validatePattern(pattern);
          if (!patternValidation.valid) {
            validation.errors.push(...patternValidation.errors);
            validation.valid = false;
          }
        }
      }

      // Validate weights
      if (!config.weight || config.weight < 0 || config.weight > 100) {
        validation.errors.push(`Invalid weight for ${category}: ${config.weight}`);
        validation.valid = false;
      }
    }

    // Check for minimum requirements
    if (validation.stats.categories < 5) {
      validation.warnings.push('Less than 5 categories configured');
    }

    if (validation.stats.totalPatterns < 50) {
      validation.warnings.push('Less than 50 total patterns configured');
    }

    return validation;
  }

  /**
   * Handle task autonomously
   */
  async handleAutonomously(task) {
    this.log('Making autonomous decision for task...');

    const taskText = task.task || task.payload?.description || '';

    // Analyze task to determine action
    if (taskText.includes('pattern') && taskText.includes('add')) {
      return await this.addPattern(task);
    } else if (taskText.includes('suggest') || taskText.includes('recommend')) {
      return await this.suggestPattern(task);
    } else if (taskText.includes('config') || taskText.includes('update')) {
      return await this.updateConfig(task);
    } else if (taskText.includes('analyze') || taskText.includes('effectiveness')) {
      return await this.analyzeDetection(task);
    } else if (taskText.includes('threshold') || taskText.includes('tune')) {
      return await this.tuneThresholds(task);
    } else {
      // Default: validate current configuration
      return await this.validateRules(task);
    }
  }

  /**
   * Helper: Load rules
   */
  async loadRules() {
    try {
      const content = await fs.readFile(this.rulesFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      this.log('Failed to load rules, returning empty config', 'warn');
      return {};
    }
  }

  /**
   * Helper: Save rules
   */
  async saveRules(rules) {
    await fs.writeFile(this.rulesFile, JSON.stringify(rules, null, 2));
  }

  /**
   * Helper: Load unified config
   */
  async loadUnifiedConfig() {
    try {
      const content = await fs.readFile(this.unifiedConfigFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return {};
    }
  }

  /**
   * Helper: Save unified config
   */
  async saveUnifiedConfig(config) {
    await fs.writeFile(this.unifiedConfigFile, JSON.stringify(config, null, 2));
  }

  /**
   * Helper: Check if pattern exists
   */
  patternExists(category, pattern) {
    if (!category.patterns) return false;
    return category.patterns.some(p =>
      p.pattern === pattern || p === pattern
    );
  }

  /**
   * Helper: Create new category
   */
  async createCategory(name) {
    // Autonomous decision on category configuration
    const weight = this.estimateCategoryWeight(name);

    return {
      name,
      weight,
      patterns: [],
      sanitize: weight > 50,
      createdAt: new Date().toISOString(),
      createdBy: 'workflow-business-logic-agent'
    };
  }

  /**
   * Helper: Estimate category weight
   */
  estimateCategoryWeight(name) {
    const nameUpper = name.toUpperCase();
    if (nameUpper.includes('INJECTION') || nameUpper.includes('LEAK')) return 85;
    if (nameUpper.includes('HARMFUL') || nameUpper.includes('MALICIOUS')) return 75;
    if (nameUpper.includes('PII') || nameUpper.includes('PRIVACY')) return 70;
    if (nameUpper.includes('SPAM') || nameUpper.includes('ROLE')) return 40;
    return 50; // Default medium weight
  }

  /**
   * Helper: Analyze failure context
   */
  analyzeFailureContext(context) {
    // Simplified analysis logic
    return {
      type: 'false_negative',
      input: context?.input || '',
      category: context?.category || 'UNKNOWN',
      confidence: 0.7
    };
  }

  /**
   * Helper: Generate pattern from input
   */
  generatePattern(input) {
    // Simple pattern generation (would be more sophisticated in production)
    const cleaned = input.toLowerCase().replace(/[^a-z0-9 ]/g, '');
    const keywords = cleaned.split(' ').filter(w => w.length > 3);
    return keywords.slice(0, 3).join('.*');
  }

  /**
   * Helper: Determine category from input
   */
  determineCategory(input) {
    const inputLower = input.toLowerCase();
    if (inputLower.includes('inject') || inputLower.includes('execute')) return 'CODE_INJECTION';
    if (inputLower.includes('prompt') || inputLower.includes('system')) return 'PROMPT_INJECTION';
    if (inputLower.includes('email') || inputLower.includes('phone')) return 'PII_EXPOSURE';
    return 'MALICIOUS_INSTRUCTIONS';
  }

  /**
   * Helper: Notify dependent agents
   */
  async notifyDependentAgents(configType, updates) {
    const notification = {
      type: 'config_update',
      configType,
      updates,
      timestamp: Date.now()
    };

    // Notify test automation agent
    await this.messageBus.send({
      from: this.name,
      to: 'test-automation',
      type: 'notify',
      payload: notification
    });
  }

  /**
   * Other helper methods...
   */
  refinePattern(pattern) { return pattern; }
  calculateOptimalThreshold(analysis) { return 65; }
  validateSuggestions(suggestions) { return suggestions; }
  generateRecommendation(validated) { return 'Apply suggested patterns'; }
  applyUpdates(config, updates) { return { ...config, ...updates }; }
  validateConfig(config) { return { valid: true, errors: [] }; }
  calculateOptimalThresholds(metrics) { return { block: 85, sanitizeLight: 30, sanitizeHeavy: 65 }; }
  adjustThreshold(current, optimal) { return Math.round((current + optimal) / 2); }
  validatePattern(pattern) { return { valid: true, errors: [] }; }
}

module.exports = WorkflowBusinessLogicAgent;