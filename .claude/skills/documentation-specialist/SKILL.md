---
name: documentation-specialist
description: Complete documentation management for enterprise projects. README generation, API docs, documentation sync, user guides, changelogs.
---

# Documentation Specialist

Complete documentation management for enterprise projects. Handles README generation, API documentation, sync, user guides, and changelogs.

## When to Use This Skill

- Creating README for a new project/service
- Generating API documentation from Express routes
- Updating documentation after code changes
- Synchronizing version numbers across files
- Creating user guides and technical documentation
- Generating changelogs from git history
- Documentation audits and gap analysis

## Documentation Structure

```
docs/
├── QUICKSTART.md              # 5-minute setup guide
├── USER_GUIDE.md              # Complete user manual
├── API.md                     # REST API reference
├── ARCHITECTURE.md            # System architecture
├── CONFIGURATION.md           # Environment variables
├── AUTHENTICATION.md          # Auth & RBAC guide
├── DOCKER.md                  # Container setup
├── TROUBLESHOOTING.md         # Common issues
├── api/
│   └── openapi.yaml           # OpenAPI spec
├── adr/                       # Architecture decisions
└── runbooks/                  # Operational procedures

README.md                      # Project overview
CHANGELOG.md                   # Release history
CONTRIBUTING.md                # Contributor guide
SECURITY.md                    # Security policy
```

---

## 1. README Generation

### Project Discovery
```yaml
scan_for:
  - package.json, pyproject.toml, Cargo.toml, go.mod
  - tsconfig.json, Dockerfile, .env.example
```

### Service README Template
```markdown
# {Service Name}

{Description of service role in the pipeline}

## Architecture Role

\`\`\`
[Previous Service] -> [{Service Name}] -> [Next Service]
\`\`\`

## Configuration

### Environment Variables
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| DATABASE_URL | Yes | - | Database connection URL |

## Development
\`\`\`bash
pnpm dev    # Run locally
pnpm test   # Run tests
\`\`\`
```

### Quick Reference
```bash
# Generate README for current directory
"Generate a README for this project"

# Generate for specific service
"Create README for services/my-worker"

# Update existing README
"Update the README with new API endpoints"
```

---

## 2. API Documentation

### Route Discovery
```typescript
// Scan locations
glob_patterns:
  - "apps/api/src/routes/**/*.ts"
  - "src/routes/**/*.ts"

// Parse patterns
patterns:
  - "router.(get|post|put|delete|patch)"
  - "app.(get|post|put|delete|patch)"
```

### Markdown API.md Template
```markdown
# API Reference

Base URL: \`http://localhost:8787\`

## Authentication

\`\`\`
Authorization: Bearer <API_KEY>
\`\`\`

---

## Endpoints

### POST /v1/analyze

Analyze input text.

**Request:**
\`\`\`json
{
  "text": "string",
  "mode": "fast|full"
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "request_id": "uuid",
  "decision": "ALLOW|BLOCK",
  "score": 25,
  "duration_ms": 150
}
\`\`\`

**Error Responses:**
| Status | Description |
|--------|-------------|
| 400 | Invalid request body |
| 401 | Missing or invalid auth token |
| 429 | Rate limit exceeded |
```

### OpenAPI 3.0 Template
```yaml
openapi: 3.0.3
info:
  title: Your API
  version: 1.0.0
paths:
  /v1/analyze:
    post:
      summary: Analyze input text
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AnalyzeRequest'
```

---

## 3. Documentation Sync

### Version Update
```bash
# Update all version references
OLD_VERSION="0.9.0"
NEW_VERSION="1.0.0"
find docs/ -name "*.md" -type f -exec sed -i '' "s/$OLD_VERSION/$NEW_VERSION/g" {} \;
```

### Sync Workflow
```yaml
trigger: git commit or tag
actions:
  1. Parse commit for affected components
  2. Map components to documentation files
  3. Run freshness checks
  4. Flag outdated sections
  5. Update version references
```

### Check Version Consistency
```bash
grep -rn "v[0-9]\+\.[0-9]\+\.[0-9]\+" docs/ | sort -u
```

---

## 4. User Guides & Technical Docs

### User Guide Template
```markdown
# User Guide

## Quick Start
- Prerequisites
- Installation
- First Run

## Core Features
- Feature 1 walkthrough
- Feature 2 walkthrough

## Configuration
- Basic configuration
- Advanced options

## Troubleshooting
- Common issues
- FAQ
```

### Changelog Format (Keep a Changelog)
```markdown
## [Unreleased]

### Added
- New feature X

### Changed
- Modified behavior Y

### Fixed
- Bug fix Z

### Security
- Security improvement

## [1.0.0] - 2025-01-14
### Added
- Initial release
```

### Extract from Git
```bash
git log --oneline --since="2025-01-01" | \
  grep -E "^[a-f0-9]+ (feat|fix|refactor|docs|security):"
```

---

## Integration Workflows

### On Code Change
```yaml
trigger: git commit
actions:
  1. Parse commit message
  2. Identify affected docs
  3. Update API.md if routes changed
  4. Update README if dependencies changed
  5. Flag sections needing review
```

### On Release
```yaml
trigger: git tag
actions:
  1. Update all version references
  2. Generate CHANGELOG from commits
  3. Update README badges
  4. Verify API.md matches routes
  5. Commit: "docs: prepare for release"
```

---

## Quick Reference

```bash
# Full documentation suite
"Generate complete documentation"

# Specific types
"Generate user guide for configuration"
"Create technical documentation for workers"
"Generate changelog for last sprint"
"Create contributing guide"

# Documentation audit
"Audit existing documentation for gaps"
"Check for outdated documentation"
"Validate documentation links"

# Update documentation
"Update docs after API changes"
"Sync documentation versions to 1.0.0"
```

## Documentation Quality Checklist

- [ ] All sections complete
- [ ] Code examples tested
- [ ] Links validated
- [ ] Versions consistent
- [ ] No spelling errors
- [ ] Consistent formatting
- [ ] API examples accurate

## Key Files

| File | Purpose |
|------|---------|
| `docs/*.md` | Main documentation |
| `services/*/README.md` | Service docs |
| `apps/*/README.md` | App docs |
| `README.md` | Project overview |
| `CHANGELOG.md` | Release history |

## Critical Rules

- Keep docs in sync with code
- Use semantic versioning consistently
- Include code examples for all APIs
- Test examples before committing
- Update CHANGELOG for every release
- Never leave TODO comments in published docs

---

**Last Updated:** 2025-01-14
**Version:** 1.0.0
