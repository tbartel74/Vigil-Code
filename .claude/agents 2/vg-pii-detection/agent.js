/**
 * PII Detection Agent - Manages PII detection and configuration
 * Handles entity analysis, language detection, and Presidio integration
 */

const BaseAgent = require('../../core/base-agent');
const http = require('http');
const https = require('https');

class PIIDetectionAgent extends BaseAgent {
  constructor() {
    super({
      name: 'vg-pii-detection',
      version: '2.0.0',
      description: 'Autonomous PII detection and privacy protection agent',
      capabilities: [
        'analyze_entity',
        'detect_pii',
        'configure_entities',
        'test_detection',
        'analyze_language',
        'update_patterns'
      ],
      dependencies: ['workflow-business-logic']
    });

    this.presidioUrl = 'http://localhost:5001';
    this.languageDetectorUrl = 'http://localhost:5002';
    this.supportedLanguages = ['en', 'pl'];
    this.entityTypes = this.initializeEntityTypes();
  }

  /**
   * Initialize supported entity types
   */
  initializeEntityTypes() {
    return {
      // International entities (English)
      'EMAIL': { enabled: true, confidence: 0.7, language: 'en' },
      'PHONE_NUMBER': { enabled: true, confidence: 0.7, language: 'en' },
      'CREDIT_CARD': { enabled: true, confidence: 0.8, language: 'en' },
      'SSN': { enabled: true, confidence: 0.85, language: 'en' },
      'PERSON': { enabled: true, confidence: 0.6, language: 'adaptive' },
      'LOCATION': { enabled: true, confidence: 0.6, language: 'en' },
      'ORGANIZATION': { enabled: true, confidence: 0.6, language: 'en' },

      // Polish entities
      'PESEL': { enabled: true, confidence: 0.9, language: 'pl' },
      'NIP': { enabled: true, confidence: 0.85, language: 'pl' },
      'REGON': { enabled: true, confidence: 0.85, language: 'pl' },

      // Medical
      'MEDICAL_LICENSE': { enabled: true, confidence: 0.8, language: 'en' },
      'DISEASE': { enabled: true, confidence: 0.7, language: 'en' },

      // Financial
      'IBAN': { enabled: true, confidence: 0.9, language: 'en' },
      'BANK_ACCOUNT': { enabled: true, confidence: 0.8, language: 'en' }
    };
  }

  /**
   * Main execution entry point
   */
  async execute(task) {
    this.log(`Executing task: ${task.action}`);

    switch (task.action) {
      case 'analyze_entity':
        return await this.analyzeEntity(task);

      case 'detect_pii':
        return await this.detectPII(task);

      case 'configure_entities':
        return await this.configureEntities(task);

      case 'test_detection':
        return await this.testDetection(task);

      case 'analyze_language':
        return await this.analyzeLanguage(task);

      case 'update_patterns':
        return await this.updatePatterns(task);

      default:
        return await this.handleAutonomously(task);
    }
  }

  /**
   * Analyze a specific entity type
   */
  async analyzeEntity(task) {
    const { entity, testData } = task.payload || {};

    this.log(`Analyzing entity: ${entity}`);

    // Get entity configuration
    const entityConfig = this.entityTypes[entity];
    if (!entityConfig) {
      return {
        success: false,
        message: `Unknown entity type: ${entity}`
      };
    }

    // Test detection with sample data
    const testResults = await this.testEntityDetection(entity, testData);

    // Analyze effectiveness
    const analysis = {
      entity,
      config: entityConfig,
      testResults,
      effectiveness: this.calculateEffectiveness(testResults),
      recommendations: []
    };

    // Generate recommendations
    if (analysis.effectiveness < 0.7) {
      analysis.recommendations.push(`Increase confidence threshold for ${entity}`);
      analysis.recommendations.push('Add custom regex patterns for better detection');
    }

    // Autonomous decision: Update configuration if needed
    if (analysis.effectiveness < 0.5 && entityConfig.enabled) {
      await this.updateEntityConfig(entity, {
        confidence: entityConfig.confidence * 0.8 // Lower confidence threshold
      });
      analysis.autoAdjusted = true;
    }

    return analysis;
  }

  /**
   * Detect PII in text (dual-language)
   */
  async detectPII(task) {
    const { text, languages } = task.payload || {};

    this.log('Detecting PII in text...');

    // Step 1: Detect language
    const languageDetection = await this.detectLanguage(text);
    const primaryLanguage = languageDetection.language || 'en';

    // Step 2: Determine detection strategy
    const detectionLanguages = languages || this.determineLanguages(primaryLanguage, text);

    // Step 3: Run parallel detection for each language
    const detectionPromises = detectionLanguages.map(lang =>
      this.runPresidioDetection(text, lang)
    );

    const results = await Promise.allSettled(detectionPromises);

    // Step 4: Merge and deduplicate results
    const mergedEntities = this.mergeDetectionResults(results);

    // Step 5: Apply regex fallback for missed entities
    const regexEntities = await this.applyRegexDetection(text);
    const allEntities = this.deduplicateEntities([...mergedEntities, ...regexEntities]);

    // Step 6: Calculate statistics
    const stats = this.calculateDetectionStats(allEntities, detectionLanguages);

    // Autonomous decision: If high-risk PII detected, notify workflow agent
    if (this.hasHighRiskPII(allEntities)) {
      await this.invokeAgent('workflow-business-logic', {
        action: 'update_config',
        configType: 'rules',
        updates: {
          pii_strict_mode: true
        }
      });
    }

    return {
      success: true,
      entities: allEntities,
      stats,
      languageDetection,
      detectionLanguages,
      hasP: allEntities.length > 0
    };
  }

  /**
   * Configure entity detection settings
   */
  async configureEntities(task) {
    const { entities, action } = task.payload || {};

    this.log(`Configuring entities: ${action}`);

    const changes = [];

    for (const [entityName, config] of Object.entries(entities)) {
      if (this.entityTypes[entityName]) {
        const previous = { ...this.entityTypes[entityName] };
        this.entityTypes[entityName] = { ...previous, ...config };
        changes.push({
          entity: entityName,
          previous,
          current: this.entityTypes[entityName]
        });
      }
    }

    // Persist configuration (in real implementation)
    await this.saveEntityConfiguration();

    return {
      success: true,
      changes,
      message: `Updated ${changes.length} entity configurations`
    };
  }

  /**
   * Test PII detection with sample data
   */
  async testDetection(task) {
    const { testCases } = task.payload || {};

    this.log('Running PII detection tests...');

    const results = [];

    for (const testCase of testCases) {
      const detection = await this.detectPII({
        payload: { text: testCase.input }
      });

      const result = {
        input: testCase.input,
        expected: testCase.expected,
        detected: detection.entities,
        passed: this.compareDetectionResults(testCase.expected, detection.entities)
      };

      results.push(result);
    }

    const summary = {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      accuracy: results.filter(r => r.passed).length / results.length
    };

    // Autonomous action: If accuracy is low, analyze failures
    if (summary.accuracy < 0.8) {
      const failureAnalysis = await this.analyzeFailures(results.filter(r => !r.passed));
      summary.failureAnalysis = failureAnalysis;

      // Invoke test automation agent for comprehensive testing
      const testResponse = await this.invokeAgent('test-automation', {
        action: 'test_pii',
        entity: failureAnalysis.mostFailedEntity,
        testData: failureAnalysis.sampleData
      });
      summary.additionalTesting = testResponse.result;
    }

    return {
      results,
      summary
    };
  }

  /**
   * Analyze language of text
   */
  async analyzeLanguage(task) {
    const { text } = task.payload || {};

    this.log('Analyzing language...');

    const detection = await this.detectLanguage(text);

    // Enhance with entity-based hints
    const entityHints = this.getEntityLanguageHints(text);

    const analysis = {
      detected: detection,
      entityHints,
      recommended: this.determineOptimalLanguage(detection, entityHints),
      confidence: detection.confidence || 0
    };

    return analysis;
  }

  /**
   * Update regex patterns for PII detection
   */
  async updatePatterns(task) {
    const { patterns } = task.payload || {};

    this.log('Updating PII regex patterns...');

    // This would update the pii.conf file in real implementation
    const updates = [];

    for (const [entity, pattern] of Object.entries(patterns)) {
      updates.push({
        entity,
        pattern,
        action: 'updated'
      });
    }

    // Notify workflow agent about pattern updates
    await this.invokeAgent('workflow-business-logic', {
      action: 'update_config',
      configType: 'rules',
      updates: {
        pii_patterns_updated: true,
        timestamp: Date.now()
      }
    });

    return {
      success: true,
      updates,
      message: `Updated ${updates.length} PII patterns`
    };
  }

  /**
   * Handle task autonomously
   */
  async handleAutonomously(task) {
    this.log('Making autonomous decision for PII task...');

    const taskText = task.task || task.payload?.description || '';

    // Analyze task to determine action
    if (taskText.includes('detect') || taskText.includes('find')) {
      return await this.detectPII(task);
    } else if (taskText.includes('test') || taskText.includes('verify')) {
      return await this.testDetection(task);
    } else if (taskText.includes('configure') || taskText.includes('setting')) {
      return await this.configureEntities(task);
    } else if (taskText.includes('language')) {
      return await this.analyzeLanguage(task);
    } else {
      // Default: Run comprehensive PII analysis
      const text = task.payload?.text || taskText;
      const detection = await this.detectPII({
        payload: { text }
      });

      const analysis = await this.analyzeEntity({
        payload: {
          entity: detection.entities[0]?.type || 'PERSON',
          testData: text
        }
      });

      return {
        detection,
        analysis,
        message: 'Autonomous PII analysis completed'
      };
    }
  }

  /**
   * Helper: Detect language using language-detector service
   */
  async detectLanguage(text) {
    return new Promise((resolve) => {
      const data = JSON.stringify({ text });

      const options = {
        hostname: 'localhost',
        port: 5002,
        path: '/detect',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            resolve(result);
          } catch (error) {
            resolve({ language: 'en', confidence: 0.5 });
          }
        });
      });

      req.on('error', (error) => {
        this.log(`Language detection failed: ${error.message}`, 'warn');
        resolve({ language: 'en', confidence: 0.5 });
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Helper: Run Presidio detection
   */
  async runPresidioDetection(text, language) {
    return new Promise((resolve) => {
      const entities = Object.keys(this.entityTypes).filter(e =>
        this.entityTypes[e].enabled &&
        (this.entityTypes[e].language === language || this.entityTypes[e].language === 'adaptive')
      );

      const data = JSON.stringify({
        text,
        language,
        entities,
        return_decision_process: true
      });

      const options = {
        hostname: 'localhost',
        port: 5001,
        path: '/analyze',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            resolve(result);
          } catch (error) {
            resolve({ entities: [] });
          }
        });
      });

      req.on('error', (error) => {
        this.log(`Presidio detection failed: ${error.message}`, 'warn');
        resolve({ entities: [] });
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Other helper methods...
   */
  determineLanguages(primary, text) {
    // Determine which languages to use for detection
    const languages = [primary];
    if (primary === 'pl' && !languages.includes('en')) {
      languages.push('en'); // Always include English for international entities
    }
    return languages;
  }

  mergeDetectionResults(results) {
    const entities = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.entities) {
        entities.push(...result.value.entities);
      }
    }
    return entities;
  }

  applyRegexDetection(text) {
    // Simplified regex detection
    const patterns = {
      'CREDIT_CARD': /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
      'EMAIL': /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      'PESEL': /\b\d{11}\b/g
    };

    const entities = [];
    for (const [type, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          entities.push({
            type,
            value: match,
            confidence: 0.9,
            source: 'regex'
          });
        });
      }
    }
    return entities;
  }

  deduplicateEntities(entities) {
    // Remove duplicate entities, keeping highest confidence
    const unique = {};
    for (const entity of entities) {
      const key = `${entity.type}-${entity.value}`;
      if (!unique[key] || unique[key].confidence < entity.confidence) {
        unique[key] = entity;
      }
    }
    return Object.values(unique);
  }

  calculateDetectionStats(entities, languages) {
    return {
      total: entities.length,
      byType: entities.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {}),
      byLanguage: languages,
      bySource: entities.reduce((acc, e) => {
        const source = e.source || 'presidio';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {})
    };
  }

  hasHighRiskPII(entities) {
    const highRiskTypes = ['SSN', 'CREDIT_CARD', 'PESEL', 'MEDICAL_LICENSE'];
    return entities.some(e => highRiskTypes.includes(e.type));
  }

  testEntityDetection(entity, testData) {
    // Simplified test detection
    return { detected: true, confidence: 0.8 };
  }

  calculateEffectiveness(testResults) {
    return testResults.confidence || 0.5;
  }

  updateEntityConfig(entity, updates) {
    if (this.entityTypes[entity]) {
      Object.assign(this.entityTypes[entity], updates);
    }
  }

  saveEntityConfiguration() {
    // Would persist to file in real implementation
    return Promise.resolve();
  }

  compareDetectionResults(expected, detected) {
    return expected.length === detected.length;
  }

  analyzeFailures(failures) {
    return {
      mostFailedEntity: 'PERSON',
      sampleData: 'John Doe'
    };
  }

  getEntityLanguageHints(text) {
    const hints = [];
    if (text.match(/\b\d{11}\b/)) hints.push('pl'); // PESEL pattern
    if (text.match(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/)) hints.push('en'); // Credit card
    return hints;
  }

  determineOptimalLanguage(detection, hints) {
    if (hints.includes('pl')) return 'pl';
    return detection.language || 'en';
  }
}

module.exports = PIIDetectionAgent;