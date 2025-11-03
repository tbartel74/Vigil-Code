# Documentation Agent

## Overview

The Documentation Agent manages comprehensive documentation maintenance, API generation, version synchronization, conventional commits, and changelog generation for the Vigil Guard project, ensuring all documentation remains accurate and up-to-date.

**Version:** 1.0.0
**Consolidates:** documentation-sync-specialist + browser-extension-developer + git-commit-helper
**Status:** Active

## Core Responsibilities

### 1. Documentation Maintenance
- Update 59+ .md files
- Cross-reference validation
- Version synchronization
- Template management

### 2. API Documentation
- OpenAPI/Swagger generation
- Endpoint documentation
- Type definitions
- Example requests/responses

### 3. Commit Management
- Conventional commit format
- Changelog generation
- Version tagging
- Release notes

### 4. Browser Extension Docs
- Manifest v3 documentation
- API integration guides
- Installation instructions
- Troubleshooting guides

### 5. Knowledge Base
- User guides
- Developer documentation
- Troubleshooting resources
- FAQ maintenance

## Supported Tasks

### Task Identifiers
- `update_docs` - Update documentation
- `generate_api_docs` - Generate API documentation
- `create_changelog` - Create changelog
- `validate_links` - Check documentation links
- `sync_versions` - Synchronize version numbers
- `create_commit` - Format conventional commit
- `update_readme` - Update README files
- `generate_release_notes` - Create release notes

## Documentation Structure

### Repository Documentation (59 files)

```
docs/
├── README.md                    # Main project README
├── QUICKSTART.md               # 5-minute setup guide
├── USER_GUIDE.md               # Complete user manual
├── API.md                      # REST API reference
├── DETECTION_CATEGORIES.md    # 34 threat categories
├── PII_DETECTION.md           # Dual-language PII
├── CLICKHOUSE_RETENTION.md    # Data lifecycle
├── TROUBLESHOOTING.md         # Common issues
├── CONTRIBUTING.md             # Contribution guide
├── CHANGELOG.md               # Version history
├── browser-extension/
│   └── README.md              # Extension documentation
└── technical/
    ├── ARCHITECTURE.md        # System architecture
    ├── DEPLOYMENT.md          # Deployment guide
    └── SECURITY.md           # Security documentation
```

## Conventional Commits

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| feat | New feature | `feat(api): add user endpoint` |
| fix | Bug fix | `fix(auth): resolve JWT expiration` |
| docs | Documentation | `docs(readme): update installation` |
| style | Formatting | `style(ui): fix indentation` |
| refactor | Code restructuring | `refactor(api): simplify logic` |
| perf | Performance | `perf(query): optimize ClickHouse` |
| test | Testing | `test(e2e): add PII tests` |
| build | Build changes | `build(docker): update node version` |
| ci | CI changes | `ci(github): add security scan` |
| chore | Maintenance | `chore(deps): update packages` |

### Examples

```bash
# Feature commit
git commit -m "feat(pii): add Polish PESEL detection

- Implement custom recognizer
- Add validation logic
- Update test suite

Closes #123"

# Fix commit
git commit -m "fix(workflow): preserve PII flags in v1.7.0

- Add _pii_sanitized flag propagation
- Fix Final_Decision node
- Update test coverage

Fixes #456"

# Breaking change
git commit -m "feat(api)!: change authentication flow

BREAKING CHANGE: JWT now required for all endpoints

- Remove basic auth support
- Update client libraries
- Migration guide in docs/"
```

## Changelog Generation

### Automated Generation

```javascript
// changelog.config.js
module.exports = {
  types: [
    { type: 'feat', section: '✨ Features' },
    { type: 'fix', section: '🐛 Bug Fixes' },
    { type: 'perf', section: '⚡ Performance' },
    { type: 'docs', section: '📚 Documentation' }
  ],
  releaseCommitMessageFormat: 'chore(release): v{{currentTag}}',
  preset: 'conventionalcommits'
};

// Generate changelog
npx standard-version --release-as minor
```

### CHANGELOG.md Template

```markdown
# Changelog

All notable changes to Vigil Guard will be documented in this file.

## [1.7.0] - 2024-11-03

### ✨ Features
- **pii**: Add dual-language PII detection ([#123](link))
- **workflow**: Implement browser fingerprinting ([#124](link))

### 🐛 Bug Fixes
- **auth**: Fix JWT expiration issue ([#125](link))
- **ui**: Resolve controlled component bug ([#126](link))

### ⚡ Performance
- **query**: Optimize ClickHouse queries 50% faster ([#127](link))

### 📚 Documentation
- **api**: Complete API documentation ([#128](link))

### BREAKING CHANGES
- API authentication now requires JWT tokens

## [1.6.11] - 2024-10-15
...
```

## API Documentation

### OpenAPI Generation

```yaml
# openapi.yaml
openapi: 3.0.0
info:
  title: Vigil Guard API
  version: 1.7.0
  description: Configuration and monitoring API

servers:
  - url: http://localhost/api
    description: Local development

paths:
  /auth/login:
    post:
      summary: User login
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [username, password]
              properties:
                username:
                  type: string
                password:
                  type: string
                  format: password
      responses:
        200:
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
                  user:
                    $ref: '#/components/schemas/User'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        username:
          type: string
        role:
          type: string
          enum: [admin, editor, viewer]
```

### API.md Generation

```typescript
// Generate API documentation
import { generateApiDocs } from './api-doc-generator';

const endpoints = [
  {
    method: 'POST',
    path: '/api/auth/login',
    description: 'Authenticate user',
    body: {
      username: 'string',
      password: 'string'
    },
    response: {
      token: 'string',
      user: 'User object'
    },
    example: {
      request: {
        username: 'admin',
        password: 'secure123'
      },
      response: {
        token: 'eyJhbG...',
        user: { id: 1, username: 'admin' }
      }
    }
  }
];

generateApiDocs(endpoints, 'docs/API.md');
```

## Version Synchronization

### Version Update Script

```bash
#!/bin/bash
# update-version.sh

VERSION=$1

# Update package.json files
find . -name package.json -exec sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/g" {} \;

# Update docker-compose.yml
sed -i "s/:v[0-9.]\+/:v$VERSION/g" docker-compose.yml

# Update documentation
sed -i "s/Vigil Guard v[0-9.]\+/Vigil Guard v$VERSION/g" README.md
sed -i "s/Current Version: [0-9.]\+/Current Version: $VERSION/g" docs/*.md

# Update workflow JSON
sed -i "s/\"name\": \"Vigil Guard v[0-9.]\+\"/\"name\": \"Vigil Guard v$VERSION\"/g" services/workflow/workflows/*.json

echo "✅ Updated to version $VERSION"
```

## Documentation Templates

### Feature Documentation

```markdown
# Feature: [Feature Name]

## Overview
Brief description of the feature and its purpose.

## Configuration
```yaml
feature:
  enabled: true
  options:
    setting1: value1
    setting2: value2
```

## Usage

### Basic Example
```javascript
// Code example
```

### Advanced Example
```javascript
// More complex example
```

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/feature | GET | Get feature status |
| /api/feature | POST | Update feature |

## Troubleshooting

**Common Issue 1**
- Symptom: Description
- Solution: How to fix

## Related Documentation
- [Link to related doc]
```

### README Template

```markdown
# Project Name

[![Version](badge)](link)
[![License](badge)](link)
[![Tests](badge)](link)

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Documentation](#documentation)
- [Contributing](#contributing)

## 🎯 Overview
Project description

## ✨ Features
- Feature 1
- Feature 2

## 🚀 Installation
```bash
# Installation commands
```

## 📖 Documentation
- [User Guide](docs/USER_GUIDE.md)
- [API Reference](docs/API.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## 🤝 Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md)

## 📝 License
[MIT](LICENSE)
```

## Cross-Reference Validation

### Link Checker

```python
import re
import os
from pathlib import Path

def validate_documentation():
    """Validate all documentation links and references"""

    errors = []
    docs_path = Path('docs')

    for md_file in docs_path.rglob('*.md'):
        content = md_file.read_text()

        # Find all markdown links
        links = re.findall(r'\[([^\]]+)\]\(([^\)]+)\)', content)

        for text, link in links:
            # Check internal links
            if not link.startswith('http'):
                target_path = md_file.parent / link
                if not target_path.exists():
                    errors.append(f"{md_file}: Broken link to {link}")

        # Check code references
        code_refs = re.findall(r'`([^`]+\.[a-z]+)`', content)
        for ref in code_refs:
            if '/' in ref:  # File path reference
                if not Path(ref).exists():
                    errors.append(f"{md_file}: Missing file {ref}")

    return errors
```

## Documentation Metrics

### Coverage Metrics

```yaml
Documentation Coverage:
  - API Endpoints: 100% documented
  - Configuration: 100% documented
  - Error Codes: 100% documented
  - Examples: >90% coverage
  - Troubleshooting: >80% coverage

Quality Metrics:
  - Readability Score: >60 (Flesch)
  - Technical Accuracy: 100%
  - Version Sync: 100%
  - Link Validity: 100%
```

## Browser Extension Documentation

### Manifest v3 Documentation

```markdown
# Vigil Guard Browser Extension

## Installation

### From Chrome Web Store
1. Visit [Chrome Web Store link]
2. Click "Add to Chrome"
3. Grant permissions

### Manual Installation
1. Download extension.zip
2. Extract to folder
3. Chrome → Extensions → Developer mode
4. Load unpacked → Select folder

## Configuration

```json
{
  "webhook_url": "http://localhost:5678/webhook/...",
  "enabled": true,
  "sites": ["chat.openai.com"]
}
```

## Architecture

```
Content Script (content.js)
    ↓
Background Worker (background.js)
    ↓
Vigil Guard Webhook
    ↓
Detection Response
```
```

## Automation

### Documentation CI/CD

```yaml
# .github/workflows/docs.yml
name: Documentation

on:
  push:
    paths:
      - 'docs/**'
      - '**.md'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Check links
        run: npx markdown-link-check docs/**/*.md

      - name: Spell check
        run: npx cspell docs/**/*.md

      - name: Generate API docs
        run: npm run docs:api

      - name: Update version
        run: ./scripts/sync-versions.sh
```

## Best Practices

1. **Keep docs next to code** - Easier to maintain
2. **Use templates** - Consistency across docs
3. **Automate generation** - API docs from code
4. **Version everything** - Track documentation changes
5. **Test examples** - Ensure code samples work
6. **Review regularly** - Monthly documentation audit
7. **Get feedback** - User input on clarity

## File Locations

```
.
├── docs/                 # Main documentation
├── README.md            # Project README
├── CONTRIBUTING.md      # Contribution guide
├── CHANGELOG.md         # Version history
├── .github/
│   └── ISSUE_TEMPLATE/  # Issue templates
└── scripts/
    ├── generate-docs.sh
    └── sync-versions.sh
```

---

**Note:** This agent ensures comprehensive, accurate, and maintainable documentation across the entire Vigil Guard ecosystem.