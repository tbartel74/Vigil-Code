# Audit Code Command

Run comprehensive code audits using the code-audit-expert agent with Vigil Guard project context.

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
2. Load code-audit-vigil skill for Vigil Guard mappings
3. Check .claude/state/progress.json for any existing audit state
4. Initialize audit metadata (timestamp, scope, version)
```

### Step 2: Run Audit

For each category (or selected categories):

```
1. Execute category-specific checks
2. Run batch operations (grep, find, npm audit)
3. Calculate score based on checklist
4. Assign rating (🟢 OK / 🟡 NEEDS_IMPROVEMENT / 🔴 CRITICAL)
5. Record findings (positive, warnings, critical)
```

### Step 3: Generate Report

```
1. Aggregate scores across categories
2. Calculate total score and grade
3. Identify top 5-10 leverage points
4. Sort by Impact × Effort
5. Generate executive summary
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

## Examples

### Example 1: Full Audit

```
/audit-code

🎯 Task: Full Code Audit

📋 Scope: 10 categories, 75 max points

⏳ Running audit...

## Audit Summary

| Category | Score | Rating | Key Finding |
|----------|-------|--------|-------------|
| Structure | 8/10 | 🟢 | Clear service boundaries |
| Readability | 7/10 | 🟢 | 3 files need splitting |
| Testability | 9/10 | 🟢 | 165 tests, OWASP compliant |
| CI/CD | 4/5 | 🟢 | GitHub Actions configured |
| Security | 8/10 | 🟢 | 0 critical vulnerabilities |
| Observability | 4/5 | 🟢 | ClickHouse + Grafana |
| Tech Debt | 6/10 | 🟡 | 23 TODOs found |
| Documentation | 4/5 | 🟢 | 20+ docs |
| Performance | 4/5 | 🟢 | 40-node pipeline optimized |
| DDD | 4/5 | 🟢 | Microservices architecture |
| **TOTAL** | **62/75** | **Grade: B** | |

## Top 5 Leverage Points

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 1 | Reduce TODOs in workflow | HIGH | MEDIUM |
| 2 | Split server.ts (823 lines) | MEDIUM | LOW |
| 3 | Add integration tests for auth | HIGH | MEDIUM |
| 4 | Document API endpoints | MEDIUM | LOW |
| 5 | Add health check to proxy | LOW | LOW |

📁 Reports saved:
   • .claude/state/audit-report.json
   • docs/AUDIT_SUMMARY.md

✨ Audit completed in 45 seconds
```

### Example 2: Quick Audit

```
/audit-code --quick

🎯 Task: Quick Code Audit

📋 Scope: Security + Testability + Tech Debt (30 max points)

⏳ Running quick audit...

## Quick Audit Summary

| Category | Score | Rating |
|----------|-------|--------|
| Security | 8/10 | 🟢 |
| Testability | 9/10 | 🟢 |
| Tech Debt | 6/10 | 🟡 |
| **TOTAL** | **23/30** | **Grade: B** |

## Critical Findings

### 🟡 Tech Debt
- 23 TODO/FIXME comments
- 5 @ts-ignore without explanation

### 🟢 Security
- 0 critical npm vulnerabilities
- JWT properly configured
- Rate limiting enabled

✨ Quick audit completed in 12 seconds
```

### Example 3: Single Category

```
/audit-code --category=security --verbose

🎯 Task: Security Deep-Dive Audit

📋 Scope: Security category only (10 max points)

## Security Audit

### Authentication & Authorization
- [x] Passwords hashed with bcrypt (12 rounds) ✅
- [x] JWT configured with RS256 ✅
- [x] Session timeout: 24 hours ✅
- [x] Rate limiting: 5 attempts / 15 min ✅

### Input Validation
- [x] Parameterized queries ✅
- [x] XSS prevention (React auto-escape) ✅
- [x] Path traversal protection ✅
- [ ] CSRF tokens ⚠️ (missing)

### Secrets Management
- [x] .env in .gitignore ✅
- [x] No hardcoded secrets ✅
- [x] Secrets auto-generated ✅

### Dependencies
- [x] npm audit: 0 critical, 2 moderate ✅
- [ ] Dependabot not configured ⚠️

## Score: 8/10 🟢 OK

### Recommendations
1. Add CSRF tokens to forms
2. Configure Dependabot for auto-updates

✨ Security audit completed in 8 seconds
```

## Vigil Guard-Specific Checks

This command automatically includes Vigil Guard-specific checks:

- **NATS Worker Pipeline:** Worker configuration and message flow
- **Presidio Integration:** Dual-language PII detection
- **ClickHouse Schema:** TTL and partitioning
- **Detection Patterns:** ReDoS vulnerability check
- **OWASP AITG:** APP-01/APP-02 compliance

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
| OK | 🟢 | Meets standards | Maintenance mode |
| NEEDS_IMPROVEMENT | 🟡 | Needs improvement | Fix this sprint |
| CRITICAL | 🔴 | Critical issue | Immediate action |

## Grading Scale

| Score % | Grade | Status |
|---------|-------|--------|
| 90-100 | A | Excellent |
| 75-89 | B | Good |
| 60-74 | C | Acceptable |
| 40-59 | D | Poor |
| 0-39 | F | Failing |
