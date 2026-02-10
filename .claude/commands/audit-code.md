# Audit Code Command

Run comprehensive code audits using the security-expert agent with project context.

## Usage

```bash
/audit-code                      # Full audit (all 10 categories)
/audit-code --quick              # Quick audit (Security + Tests + Tech Debt)
/audit-code --category=security  # Single category deep-dive
/audit-code --category=testability --verbose  # Detailed single category
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--quick` | Run Security + Testability + Tech Debt only | `false` |
| `--category=<name>` | Audit single category | all |
| `--verbose` | Include detailed findings | `false` |
| `--output=json` | Output format (json, markdown, both) | `both` |
| `--save` | Save report to files | `true` |
| `--actionable-only` | Show only issues with fix recommendations | `false` |
| `--min-severity=<level>` | Filter by severity (LOW/MEDIUM/HIGH/CRITICAL) | `LOW` |
| `--exclude=<checks>` | Exclude check types (comma-separated) | none |
| `--summary-only` | Scores and top 5 issues only | `false` |

### Severity Levels

| Level | Description | Examples |
|-------|-------------|----------|
| `LOW` | Style preferences, informational | File size warnings, naming conventions |
| `MEDIUM` | Should fix this sprint | TODOs, missing tests, minor complexity |
| `HIGH` | Fix before release | Security warnings, critical test gaps |
| `CRITICAL` | Immediate action required | Vulnerabilities, exposed secrets |

### Excludable Check Types

| Check ID | Category | Description |
|----------|----------|-------------|
| `file-size` | Readability | File exceeds line limit |
| `function-length` | Readability | Function exceeds 40 lines |
| `todo-comments` | Tech Debt | TODO/FIXME comments |
| `ts-ignore` | Tech Debt | @ts-ignore without explanation |
| `cyclomatic` | Readability | High cyclomatic complexity |
| `npm-moderate` | Security | Moderate npm vulnerabilities |
| `missing-test` | Testability | Untested function |
| `missing-doc` | Documentation | Missing docstring |

### Category Names

| Name | Points | Description |
|------|--------|-------------|
| `structure` | 10 | Architecture & organization |
| `readability` | 10 | Code quality & style |
| `testability` | 10 | Test coverage & quality |
| `cicd` | 5 | CI/CD & repo quality |
| `security` | 10 | DevSecOps & vulnerabilities |
| `observability` | 5 | Logging & monitoring |
| `techdebt` | 10 | Refactoring opportunities |
| `documentation` | 5 | Docs completeness |
| `performance` | 5 | Speed & scalability |
| `ddd` | 5 | Domain modeling |

## Execution Protocol

When this command is invoked, follow these steps:

### Step 1: Load Context

```
1. Read CLAUDE.md for project constraints
2. Check .claude/state/progress.json for any existing audit state
3. Initialize audit metadata (timestamp, scope, version)
```

### Step 2: Run Audit

For each category (or selected categories):

```
1. Execute category-specific checks
2. Run batch operations (grep, find, npm audit)
3. Calculate score based on checklist
4. Assign rating (OK / NEEDS_IMPROVEMENT / CRITICAL)
5. Assign severity to each finding (LOW/MEDIUM/HIGH/CRITICAL)
6. Record findings (positive, warnings, critical)
7. Apply filters:
   - If --actionable-only: Keep only findings with recommendation field
   - If --min-severity: Filter out findings below threshold
   - If --exclude: Remove findings matching excluded check types
```

### Step 3: Generate Report

```
1. Aggregate scores across categories
2. Calculate total score and grade
3. If --summary-only:
   - Show only category scores and top 5 leverage points
   - Skip detailed findings section
4. Identify top 5-10 leverage points (from filtered results)
5. Sort by Impact x Effort
6. Generate executive summary
```

### Step 4: Save Output

```
1. Write .claude/state/audit-report.json
2. Write docs/AUDIT_SUMMARY.md
3. Update progress.json with audit completion
4. Display summary to user
```

## Category Quick Reference

### Full Audit (75 points max)

| # | Category | Points | Primary Checks |
|---|----------|--------|----------------|
| 1 | Structure | 10 | Directory layout, circular deps |
| 2 | Readability | 10 | File length, naming, style |
| 3 | Testability | 10 | Coverage, test quality |
| 4 | CI/CD | 5 | Workflows, automation |
| 5 | Security | 10 | Vulnerabilities, auth |
| 6 | Observability | 5 | Logging, monitoring |
| 7 | Tech Debt | 10 | TODOs, code smells |
| 8 | Documentation | 5 | README, API docs |
| 9 | Performance | 5 | Queries, caching |
| 10 | DDD | 5 | Domain modeling |

### Quick Audit (30 points max)

| # | Category | Points | Focus |
|---|----------|--------|-------|
| 1 | Security | 10 | npm audit, secrets |
| 2 | Testability | 10 | Test count, coverage |
| 3 | Tech Debt | 10 | TODOs, @ts-ignore |

## Output Files

### audit-report.json

Location: `.claude/state/audit-report.json`

Machine-readable JSON with full audit data, scores, and findings.

### AUDIT_SUMMARY.md

Location: `docs/AUDIT_SUMMARY.md`

Human-readable markdown summary for documentation.

## Rating System

| Rating | Symbol | Meaning | Action |
|--------|--------|---------|--------|
| OK | Green | Meets standards | Maintenance mode |
| NEEDS_IMPROVEMENT | Yellow | Needs improvement | Fix this sprint |
| CRITICAL | Red | Critical issue | Immediate action |

## Grading Scale

| Score % | Grade | Status |
|---------|-------|--------|
| 90-100 | A | Excellent |
| 75-89 | B | Good |
| 60-74 | C | Acceptable |
| 40-59 | D | Poor |
| 0-39 | F | Failing |
