# Documentation Synchronization Specialist

## Overview
Automated documentation maintenance for Vigil Guard's 59 .md files, ensuring consistency with codebase changes, version updates, and API modifications.

## When to Use This Skill
- Auto-updating docs after code changes
- Synchronizing version numbers across files
- Generating API.md from Express routes
- Flagging outdated documentation sections
- Maintaining cross-reference consistency
- Creating documentation for new features

## Documentation Structure (59 files)

### Core Documentation (docs/)
```
docs/
├── QUICKSTART.md (8KB)           # 5-minute setup guide
├── USER_GUIDE.md (47KB)          # Complete manual
├── API.md (15KB)                 # REST API reference
├── ARCHITECTURE_v1.6.11.md (48KB) # System architecture
├── DETECTION_CATEGORIES.md (17KB) # 34 threat categories
├── PII_DETECTION.md (21KB)       # Dual-language PII
├── CLICKHOUSE_RETENTION.md (12KB) # Data lifecycle
├── CONFIGURATION.md (32KB)       # Variable reference
├── AUTHENTICATION.md (10KB)      # JWT + RBAC
├── SECURITY.md (19KB)            # Best practices
├── DOCKER.md (14KB)              # Container orchestration
├── GRAFANA_SETUP.md (21KB)       # Dashboard setup
├── INSTALLATION.md (16KB)        # Step-by-step
├── MAINTENANCE.md (7.2KB)        # Operations
├── MIGRATION_v*.md               # Version upgrades
├── TROUBLESHOOTING.md (12KB)     # Common issues
└── ... (10+ more)
```

## Common Tasks

### Task 1: Version Number Update

**Trigger:** Version bump in package.json or workflow JSON

```bash
# Detect version change
OLD_VERSION="v1.6.11"
NEW_VERSION="v1.7.0"

# Update all references
find docs/ -name "*.md" -type f -exec sed -i '' "s/$OLD_VERSION/$NEW_VERSION/g" {} \;

# Files typically affected (15+):
# - ARCHITECTURE_v1.6.11.md → rename to v1.7.0
# - USER_GUIDE.md (version references)
# - QUICKSTART.md (version in examples)
# - MIGRATION_v1.7.0.md (new file)
# - CLAUDE.md (version history)
```

**Automation:**
```yaml
on_version_bump:
  1. Grep all .md files for old version
  2. Replace with new version
  3. Rename ARCHITECTURE_v*.md if needed
  4. Create MIGRATION_v*.md from template
  5. Update CLAUDE.md version history
  6. Commit: "docs: update version references to v1.7.0"
```

### Task 2: API Documentation Generation

**Trigger:** New endpoint added to Express backend

```typescript
// Source: services/web-ui/backend/src/server.ts
app.post('/api/retention/cleanup', authMiddleware, retentionCleanup);

// Extract to API.md:
/**
 * POST /api/retention/cleanup
 * Force immediate TTL cleanup
 *
 * Request:
 * {
 *   "table": "all" | "events_raw" | "events_processed"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Cleanup triggered",
 *   "tables_affected": ["events_raw", "events_processed"]
 * }
 *
 * Auth: JWT required
 * Permissions: can_view_configuration
 */
```

**Automation Script:**
```bash
#!/bin/bash
# scripts/generate-api-docs.sh

# Extract routes from server.ts
grep -E "app\.(get|post|put|delete)" services/web-ui/backend/src/server.ts \
  | sed 's/.*app\.\([a-z]*\).*['"'"'"]\/api\/\([^'"'"'"]*\)['"'"'"].*/\1 \/api\/\2/' \
  | sort -u > /tmp/api-endpoints.txt

# Generate markdown table
echo "## API Endpoints" > docs/API_GENERATED.md
echo "" >> docs/API_GENERATED.md
echo "| Method | Endpoint | Auth | Permission |" >> docs/API_GENERATED.md
echo "|--------|----------|------|------------|" >> docs/API_GENERATED.md

# Merge with manual docs
cat docs/API_GENERATED.md docs/API_MANUAL.md > docs/API.md
```

### Task 3: Config Variable Documentation

**Trigger:** New variable added to variables.json

```json
// Source: services/web-ui/frontend/src/spec/variables.json
{
  "name": "events_raw_ttl_days",
  "key": "events_raw_ttl_days",
  "type": "number",
  "default": 90,
  "description": "Retention period for raw events (1-3650 days)",
  "group": "Data Retention"
}

// Generate docs/CONFIGURATION.md section:
### events_raw_ttl_days
- **Type:** Number
- **Default:** 90
- **Range:** 1-3650
- **Group:** Data Retention
- **Description:** Retention period for raw events in ClickHouse

Controls how long raw webhook inputs are stored in `n8n_logs.events_raw`
table before automatic TTL deletion.

**Example:**
```json
{
  "events_raw_ttl_days": 90
}
```
```

**Automation:**
```javascript
// scripts/sync-config-docs.js
const variables = require('../services/web-ui/frontend/src/spec/variables.json');
const fs = require('fs');

let markdown = '# Configuration Variables\n\n';

const groups = {};
variables.forEach(v => {
  if (!groups[v.group]) groups[v.group] = [];
  groups[v.group].push(v);
});

for (const [group, vars] of Object.entries(groups)) {
  markdown += `## ${group}\n\n`;

  vars.forEach(v => {
    markdown += `### ${v.name}\n`;
    markdown += `- **Type:** ${v.type}\n`;
    markdown += `- **Default:** ${v.default}\n`;
    if (v.min !== undefined) markdown += `- **Range:** ${v.min}-${v.max}\n`;
    markdown += `- **Description:** ${v.description}\n\n`;
  });
}

fs.writeFileSync('docs/CONFIGURATION.md', markdown);
console.log('✅ Configuration docs updated');
```

### Task 4: Detect Outdated Sections

**Strategy: Grep for code references in docs**

```bash
#!/bin/bash
# scripts/check-doc-freshness.sh

# Example: Check if docker-compose.yml changes require doc updates
DOCKER_COMPOSE_HASH=$(md5sum docker-compose.yml | awk '{print $1}')
DOC_HASH=$(grep "docker-compose.yml hash:" docs/DOCKER.md | awk '{print $3}')

if [ "$DOCKER_COMPOSE_HASH" != "$DOC_HASH" ]; then
  echo "⚠️  DOCKER.md is outdated (docker-compose.yml changed)"
  echo "Update docs/DOCKER.md and add hash comment:"
  echo "<!-- docker-compose.yml hash: $DOCKER_COMPOSE_HASH -->"
fi

# Example: Check if new services were added
SERVICES_COUNT=$(yq '.services | length' docker-compose.yml)
DOC_SERVICES_COUNT=$(grep -c "^### " docs/DOCKER.md)

if [ "$SERVICES_COUNT" -gt "$DOC_SERVICES_COUNT" ]; then
  echo "⚠️  DOCKER.md missing service documentation"
  echo "Services in docker-compose.yml: $SERVICES_COUNT"
  echo "Services in docs: $DOC_SERVICES_COUNT"
fi
```

### Task 5: Cross-Reference Validation

**Check for broken internal links**

```bash
#!/bin/bash
# scripts/validate-doc-links.sh

# Find all markdown links
grep -roh '\[.*\]([^)]*.md[^)]*)' docs/ | sed 's/.*(\(.*\))/\1/' | sort -u > /tmp/doc-links.txt

# Check if referenced files exist
while read link; do
  # Handle relative paths
  if [[ "$link" == /* ]]; then
    FILE="$link"
  else
    FILE="docs/$link"
  fi

  if [ ! -f "$FILE" ]; then
    echo "❌ Broken link: $link"
    grep -rn "$link" docs/
  fi
done < /tmp/doc-links.txt

echo "✅ Cross-reference validation complete"
```

## Documentation Patterns

### Pattern 1: Incremental Guides

```
QUICKSTART.md (5 min)
    ↓
USER_GUIDE.md (1 hour)
    ↓
ARCHITECTURE.md (deep dive)
```

**Maintain consistency:**
- QUICKSTART examples must work in USER_GUIDE
- USER_GUIDE references ARCHITECTURE for details
- ARCHITECTURE cites code line numbers

### Pattern 2: Feature-Specific Docs

**Template: `docs/FEATURE_NAME.md`**

```markdown
# Feature Name

## Overview
Brief description (2-3 sentences)

## When to Use
- Use case 1
- Use case 2

## Configuration
```json
{
  "setting": "value"
}
```

## Examples
### Example 1: Common scenario
```bash
commands here
```

## Troubleshooting
### Issue 1
**Problem:** Description
**Solution:** Steps to fix

## References
- Related docs: [LINK](./OTHER.md)
- Code: `path/to/file.ts:123`
```

### Pattern 3: Migration Guides

**Template: `docs/MIGRATION_vX.X.X.md`**

```markdown
# Migration Guide: v1.6.11 → v1.7.0

## Breaking Changes
- [ ] ClickHouse schema: Add `pii_sanitized` column
- [ ] Workflow: Import new v1.7.0 JSON
- [ ] Frontend: Clear localStorage (auth token format changed)

## Database Migrations
```sql
-- Run in ClickHouse
ALTER TABLE n8n_logs.events_processed
  ADD COLUMN pii_sanitized UInt8 DEFAULT 0;
```

## Rollback Procedure
```bash
# If issues occur, revert to v1.6.11
docker-compose down
git checkout v1.6.11
docker-compose up -d
```

## Verification
- [ ] Workflow version: `SELECT pipeline_version FROM events_processed LIMIT 1`
- [ ] New column exists: `DESCRIBE events_processed`
- [ ] Frontend loads: http://localhost/ui
```

## Automation Workflows

### Workflow 1: On Code Change

```yaml
trigger: git commit
actions:
  1. Parse commit message for affected components
  2. Map components to documentation files
  3. Run freshness checks on affected docs
  4. Flag outdated sections
  5. Create PR with doc updates or TODO comments
```

**Example:**
```bash
# Commit: "feat(workflow): add browser fingerprinting"
# Triggers:
- Check docs/ARCHITECTURE*.md for "Input_Validator" references
- Check docs/USER_GUIDE.md for "webhook" examples
- Generate MIGRATION_v1.7.0.md section
- Update CLAUDE.md version history
```

### Workflow 2: Weekly Audit

```yaml
schedule: Every Monday 9am
actions:
  1. Run all validation scripts
  2. Check version consistency (15+ files)
  3. Validate cross-references
  4. Generate freshness report
  5. Create GitHub issue if discrepancies found
```

### Workflow 3: Release Preparation

```yaml
trigger: Tag vX.X.X created
actions:
  1. Update all version references
  2. Generate CHANGELOG.md from commits
  3. Create MIGRATION_vX.X.X.md from template
  4. Update README.md badges
  5. Verify API.md matches server.ts routes
  6. Commit: "docs: prepare for vX.X.X release"
```

## Integration with Other Skills

### With `workflow-json-architect`:
```yaml
When: Workflow JSON modified
Action:
  - Update ARCHITECTURE.md (node count, new nodes)
  - Update USER_GUIDE.md (workflow examples)
  - Create MIGRATION.md if breaking changes
```

### With `pattern-library-manager`:
```yaml
When: New detection category added
Action:
  - Update DETECTION_CATEGORIES.md (add section)
  - Update CONFIGURATION.md (new config variables)
  - Update USER_GUIDE.md (detection examples)
```

### With `express-api-developer`:
```yaml
When: New API endpoint added
Action:
  - Regenerate API.md (routes table)
  - Update AUTHENTICATION.md (if auth required)
  - Update USER_GUIDE.md (usage examples)
```

## Metrics & KPIs

```yaml
success_metrics:
  update_lag: <5 minutes (from code change to doc update)
  version_consistency: 100% (no stale version references)
  broken_links: 0
  auto_update_rate: 95% (5% manual review)

quality_metrics:
  freshness_score: >90% (code references match docs)
  completeness: 100% (all public APIs documented)
  cross_reference_accuracy: 100%
```

## Troubleshooting

### Issue: Docs out of sync with code

**Diagnosis:**
```bash
# Check last doc update vs last code change
git log --oneline docs/ | head -5
git log --oneline services/ | head -5

# If code is newer, docs are stale
```

**Solution:**
```bash
# Run all sync scripts
./scripts/generate-api-docs.sh
./scripts/sync-config-docs.js
./scripts/check-doc-freshness.sh
./scripts/validate-doc-links.sh

# Review changes
git diff docs/

# Commit updates
git add docs/
git commit -m "docs: sync with codebase changes"
```

### Issue: Version mismatch across files

**Diagnosis:**
```bash
# Find all version references
grep -rn "v1\.[0-9]\+\.[0-9]\+" docs/ | grep -v "Binary"

# Should all be same version
```

**Solution:**
```bash
# Use sed to replace all at once
OLD="v1.6.11"
NEW="v1.7.0"
find docs/ -name "*.md" -exec sed -i '' "s/$OLD/$NEW/g" {} \;

# Verify
grep -rn "v1\.6\.11" docs/ | wc -l  # Should be 0
```

## Reference Files

### Documentation Sources
- Main docs: `docs/*.md` (26 files)
- Plugin docs: `docs/plugin/*.md` (3 files)
- Service docs: `services/*/README.md`
- Root: `README.md`, `CONTRIBUTING.md`, `CLAUDE.md`

### Automation Scripts
- `scripts/generate-api-docs.sh`
- `scripts/sync-config-docs.js`
- `scripts/check-doc-freshness.sh`
- `scripts/validate-doc-links.sh`

---

**Last Updated:** 2025-11-02
**Documentation Files:** 59 .md files
**Automation Level:** 95% (target)
**Maintained By:** Vigil Guard Documentation Team
