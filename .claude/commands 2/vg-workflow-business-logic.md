---
name: vg-workflow-business-logic
description: Pattern management and detection rules configuration for Vigil Guard (project)
---

# Workflow Business Logic Agent

Use this agent for managing detection patterns, rules configuration, and threat categorization:
- Adding new detection patterns to rules.config.json
- Tuning detection thresholds
- Configuring threat categories
- Pattern analysis and optimization
- Rule validation and testing

## What This Agent Does

The workflow business logic agent manages the brain of Vigil Guard:

1. **Add Pattern** - Creates new detection patterns with scoring
2. **Suggest Pattern** - Analyzes text and recommends patterns
3. **Update Config** - Modifies unified_config.json settings
4. **Analyze Detection** - Reviews pattern effectiveness
5. **Tune Thresholds** - Optimizes scoring and decision boundaries
6. **Validate Rules** - Ensures configuration integrity

## When to Use

- Adding new threat detection patterns
- Tuning detection sensitivity
- Configuring pattern categories
- Analyzing false positives/negatives
- Optimizing detection performance

## Example Tasks

"Add SQL injection detection pattern"
"Analyze the PROMPT_LEAK category effectiveness"
"Tune thresholds to reduce false positives"
"Suggest patterns for this attack: [text]"
"Update sanitization configuration"

## Configuration Files Managed

- `rules.config.json` (829 lines, 34 categories)
- `unified_config.json` (246 lines, main settings)
- `pii.conf` (PII detection patterns)

## Related Agents

Works with:
- **vg-test-automation** - Creates tests after adding patterns
- **vg-workflow-infrastructure** - Updates n8n workflow structure
- **vg-pii-detection** - PII-specific pattern configuration

## Usage

Describe the pattern or configuration change you need. The agent will:
1. Analyze requirements
2. Suggest implementation
3. Update configuration files (via Web UI)
4. Validate changes

Ready to configure detection rules!