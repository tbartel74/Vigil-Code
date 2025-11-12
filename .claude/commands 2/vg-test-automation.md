---
name: vg-test-automation
description: TDD workflow for adding new detection patterns to Vigil Guard (project)
---

# Test Automation Agent

Use this agent for test-driven development workflow in Vigil Guard:
- Creating test fixtures for new attack patterns
- Running test suites (smoke, bypass, E2E)
- Verifying pattern effectiveness
- Analyzing test coverage
- Managing test infrastructure

## What This Agent Does

The test automation agent handles the complete TDD cycle:

1. **Create Test** - Generates test fixtures and test cases
2. **Run Test** - Executes tests using Vitest
3. **Verify Test** - Validates pattern detection works correctly
4. **Analyze Results** - Reports coverage and identifies gaps

## When to Use

- Adding new detection patterns (TDD approach)
- Running full test suite
- Debugging failing tests
- Verifying pattern coverage
- Test infrastructure changes

## Example Tasks

"Create test for SQL injection detection"
"Run the full test suite and report results"
"Verify XSS pattern detection is working"
"Add test case for prompt extraction attack"

## Related Agents

Works with:
- **vg-workflow-business-logic** - Pattern configuration after test creation
- **vg-workflow-infrastructure** - n8n workflow validation

## Usage

Simply describe what you want to test or verify. The agent will:
1. Classify your request
2. Execute appropriate test actions
3. Report results with recommendations

Ready to work with tests!