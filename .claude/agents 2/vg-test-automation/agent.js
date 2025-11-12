/**
 * Test Automation Agent - Executable agent for test management
 * Handles test creation, execution, and verification autonomously
 */

const BaseAgent = require('../../core/base-agent');
const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class TestAutomationAgent extends BaseAgent {
  constructor() {
    super({
      name: 'vg-test-automation',
      version: '2.0.0',
      description: 'Autonomous test automation and verification agent',
      capabilities: [
        'create_test',
        'run_test',
        'verify_test',
        'analyze_results',
        'test_pii',
        'run_suite'
      ],
      dependencies: ['workflow-business-logic']
    });

    this.testDir = path.join(process.cwd(), 'services', 'workflow', 'tests');
    this.fixtureDir = path.join(this.testDir, 'fixtures');
  }

  /**
   * Main execution entry point
   */
  async execute(task) {
    this.log(`Executing task: ${task.action}`);

    switch (task.action) {
      case 'create_test':
        return await this.createTest(task);

      case 'run_test':
        return await this.runTest(task);

      case 'verify_test':
        return await this.verifyTest(task);

      case 'analyze_results':
        return await this.analyzeResults(task);

      case 'test_pii':
        return await this.testPII(task);

      case 'run_suite':
        return await this.runTestSuite(task);

      default:
        // Autonomous decision making
        return await this.handleAutonomously(task);
    }
  }

  /**
   * Create a new test based on requirements
   */
  async createTest(task) {
    this.log('Creating new test...');

    const { pattern, category, testName } = task.payload || {};

    // Autonomous decision: Determine test structure
    const testStructure = await this.determineTestStructure(pattern, category);

    // Create fixture file
    const fixturePath = await this.createFixture(testName, pattern);

    // Create test file
    const testPath = await this.createTestFile(testName, testStructure);

    // Report progress
    await this.reportProgress({
      percentage: 50,
      message: 'Test files created'
    });

    return {
      success: true,
      testPath,
      fixturePath,
      message: `Created test ${testName} for ${category} pattern`
    };
  }

  /**
   * Run specific test
   */
  async runTest(task) {
    const { testFile, testName } = task.payload || {};

    this.log(`Running test: ${testFile || testName}`);

    try {
      // Change to test directory
      process.chdir(path.join(process.cwd(), 'services', 'workflow'));

      // Run test
      const command = testFile
        ? `npm test -- ${testFile}`
        : `npm test -- --grep "${testName}"`;

      const output = execSync(command, { encoding: 'utf8' });

      // Parse results
      const results = this.parseTestOutput(output);

      // Check if test passed
      const success = !output.includes('FAIL') && output.includes('PASS');

      return {
        success,
        results,
        output: output.substring(0, 1000) // Truncate for response
      };

    } catch (error) {
      // Test failed
      const output = error.stdout?.toString() || error.message;
      const results = this.parseTestOutput(output);

      // Autonomous decision: Should we involve workflow-business-logic agent?
      if (this.shouldInvolveWorkflowAgent(results)) {
        const workflowResponse = await this.invokeAgent('workflow-business-logic', {
          action: 'suggest_pattern',
          context: results,
          error: output
        });

        return {
          success: false,
          results,
          suggestion: workflowResponse.result,
          message: 'Test failed. Pattern suggestion retrieved from workflow agent.'
        };
      }

      return {
        success: false,
        results,
        output: output.substring(0, 1000)
      };
    }
  }

  /**
   * Verify test results
   */
  async verifyTest(task) {
    const { testName, expectedResult } = task.payload || {};

    this.log(`Verifying test: ${testName}`);

    // Run test and get results
    const runResult = await this.runTest({
      payload: { testName }
    });

    // Compare with expected
    const verification = {
      passed: runResult.success === expectedResult,
      actual: runResult.success,
      expected: expectedResult,
      details: runResult.results
    };

    if (!verification.passed) {
      // Autonomous action: Debug failure
      const debugInfo = await this.debugTestFailure(testName, runResult);
      verification.debug = debugInfo;
    }

    return verification;
  }

  /**
   * Analyze test results
   */
  async analyzeResults(task) {
    const { results } = task.payload || {};

    this.log('Analyzing test results...');

    const analysis = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      coverage: 0,
      failurePatterns: [],
      recommendations: []
    };

    // Parse results
    if (typeof results === 'string') {
      const parsed = this.parseTestOutput(results);
      Object.assign(analysis, parsed);
    } else {
      Object.assign(analysis, results);
    }

    // Identify failure patterns
    analysis.failurePatterns = this.identifyFailurePatterns(analysis);

    // Generate recommendations
    analysis.recommendations = await this.generateRecommendations(analysis);

    return analysis;
  }

  /**
   * Test PII detection
   */
  async testPII(task) {
    const { entity, testData } = task.payload || {};

    this.log(`Testing PII detection for: ${entity}`);

    // Create PII test fixture
    const fixture = {
      entity,
      testData: testData || this.generatePIITestData(entity),
      expectedDetection: true
    };

    // Run PII test
    const testFile = 'pii-detection-comprehensive.test.js';
    const result = await this.runTest({
      payload: { testFile }
    });

    // Autonomous decision: If PII not detected, involve pii-detection agent
    if (!result.success) {
      const piiAgent = await this.invokeAgent('pii-detection', {
        action: 'analyze_entity',
        entity,
        testData: fixture.testData
      });

      return {
        success: false,
        fixture,
        result,
        piiAnalysis: piiAgent.result,
        message: 'PII detection test failed. Analysis from PII agent included.'
      };
    }

    return {
      success: true,
      fixture,
      result
    };
  }

  /**
   * Run full test suite
   */
  async runTestSuite(task) {
    const { suite } = task.payload || {};

    this.log(`Running test suite: ${suite || 'all'}`);

    try {
      process.chdir(path.join(process.cwd(), 'services', 'workflow'));

      const command = suite
        ? `npm test -- --suite ${suite}`
        : 'npm test';

      const output = execSync(command, {
        encoding: 'utf8',
        timeout: 120000 // 2 minutes timeout
      });

      const results = this.parseTestOutput(output);

      // Generate coverage report
      const coverage = await this.generateCoverageReport();

      return {
        success: true,
        results,
        coverage,
        summary: this.generateTestSummary(results)
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        output: error.stdout?.toString().substring(0, 2000)
      };
    }
  }

  /**
   * Handle task autonomously
   */
  async handleAutonomously(task) {
    this.log('Making autonomous decision for task...');

    const taskText = task.task || task.payload?.description || '';

    // Analyze task to determine action
    if (taskText.includes('test') && taskText.includes('create')) {
      return await this.createTest(task);
    } else if (taskText.includes('run') || taskText.includes('execute')) {
      return await this.runTestSuite(task);
    } else if (taskText.includes('verify') || taskText.includes('check')) {
      return await this.verifyTest(task);
    } else if (taskText.includes('pii') || taskText.includes('privacy')) {
      return await this.testPII(task);
    } else {
      // Default: run all tests and analyze
      const runResult = await this.runTestSuite(task);
      const analysis = await this.analyzeResults({
        payload: { results: runResult.results }
      });

      return {
        run: runResult,
        analysis,
        message: 'Autonomously ran test suite and analyzed results'
      };
    }
  }

  /**
   * Helper: Determine test structure
   */
  async determineTestStructure(pattern, category) {
    return {
      imports: ['vitest', 'webhook-helper'],
      describe: `${category} Detection`,
      tests: [
        {
          name: `should detect ${pattern}`,
          type: 'positive'
        },
        {
          name: `should not false positive on legitimate content`,
          type: 'negative'
        }
      ]
    };
  }

  /**
   * Helper: Create fixture file
   */
  async createFixture(testName, pattern) {
    const fixture = {
      name: testName,
      pattern,
      testCases: [
        {
          input: pattern,
          expected: 'BLOCK',
          description: 'Direct pattern match'
        }
      ]
    };

    const fixturePath = path.join(this.fixtureDir, `${testName}.json`);
    await fs.writeFile(fixturePath, JSON.stringify(fixture, null, 2));

    return fixturePath;
  }

  /**
   * Helper: Create test file
   */
  async createTestFile(testName, structure) {
    const testContent = this.generateTestCode(testName, structure);
    const testPath = path.join(this.testDir, 'e2e', `${testName}.test.js`);

    await fs.writeFile(testPath, testContent);
    return testPath;
  }

  /**
   * Helper: Generate test code
   */
  generateTestCode(testName, structure) {
    return `/**
 * Auto-generated test by Test Automation Agent
 * Test: ${testName}
 */

const { describe, it, expect } = require('vitest');
const { sendToWebhook } = require('../helpers/webhook');

describe('${structure.describe}', () => {
${structure.tests.map(test => `
  it('${test.name}', async () => {
    const response = await sendToWebhook({
      chatInput: 'test input',
      sessionId: 'test-${Date.now()}'
    });

    expect(response.decision).toBeDefined();
  });
`).join('')}
});
`;
  }

  /**
   * Helper: Parse test output
   */
  parseTestOutput(output) {
    const results = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    };

    // Extract test counts from output
    const passMatch = output.match(/(\d+) passed/);
    const failMatch = output.match(/(\d+) failed/);
    const skipMatch = output.match(/(\d+) skipped/);

    if (passMatch) results.passed = parseInt(passMatch[1]);
    if (failMatch) results.failed = parseInt(failMatch[1]);
    if (skipMatch) results.skipped = parseInt(skipMatch[1]);

    results.totalTests = results.passed + results.failed + results.skipped;

    return results;
  }

  /**
   * Helper: Should involve workflow agent
   */
  shouldInvolveWorkflowAgent(results) {
    // Autonomous decision logic
    return results.failed > 0 && results.passed < results.totalTests * 0.5;
  }

  /**
   * Helper: Debug test failure
   */
  async debugTestFailure(testName, runResult) {
    return {
      testName,
      failure: runResult.results,
      possibleCauses: [
        'Pattern not configured correctly',
        'Threshold too high',
        'Test data issue'
      ],
      suggestedActions: [
        'Check pattern in rules.config.json',
        'Verify webhook is active',
        'Review test fixture data'
      ]
    };
  }

  /**
   * Helper: Identify failure patterns
   */
  identifyFailurePatterns(analysis) {
    const patterns = [];

    if (analysis.failed > analysis.passed) {
      patterns.push('majority_failure');
    }

    if (analysis.failed > 0 && analysis.passed === 0) {
      patterns.push('total_failure');
    }

    if (analysis.skipped > 0) {
      patterns.push('tests_skipped');
    }

    return patterns;
  }

  /**
   * Helper: Generate recommendations
   */
  async generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.failurePatterns.includes('majority_failure')) {
      recommendations.push('Review test environment configuration');
      recommendations.push('Check if workflow is active');
    }

    if (analysis.failurePatterns.includes('total_failure')) {
      recommendations.push('Critical: All tests failing - check service health');
    }

    if (analysis.coverage < 80) {
      recommendations.push('Increase test coverage to at least 80%');
    }

    return recommendations;
  }

  /**
   * Helper: Generate PII test data
   */
  generatePIITestData(entity) {
    const testData = {
      'EMAIL': 'test@example.com',
      'PHONE': '555-1234',
      'SSN': '123-45-6789',
      'CREDIT_CARD': '4111111111111111',
      'PESEL': '44051401359'
    };

    return testData[entity] || 'test data';
  }

  /**
   * Helper: Generate coverage report
   */
  async generateCoverageReport() {
    try {
      const output = execSync('npm run test:coverage', {
        encoding: 'utf8',
        cwd: path.join(process.cwd(), 'services', 'workflow')
      });

      // Extract coverage percentage
      const match = output.match(/All files[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s*([\d.]+)/);
      return match ? parseFloat(match[1]) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Helper: Generate test summary
   */
  generateTestSummary(results) {
    const passRate = results.totalTests > 0
      ? (results.passed / results.totalTests * 100).toFixed(1)
      : 0;

    return `Tests: ${results.passed}/${results.totalTests} passed (${passRate}%)`;
  }
}

module.exports = TestAutomationAgent;