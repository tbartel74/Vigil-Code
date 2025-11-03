# WORKFLOW VERSION CONTROL - CRITICAL PROCEDURE

**STATUS:** MANDATORY for all workflow changes
**CREATED:** 2025-11-01
**REASON:** Multiple incidents of version mismatches between JSON file and n8n database

---

## THE PROBLEM

n8n workflows are stored in **SQLite database**, NOT in JSON files.

When making changes to workflow:
1. ❌ Editing JSON file alone → n8n doesn't see changes
2. ❌ User importing → may import OLD cached file
3. ❌ Assuming import worked → database still has OLD version

**Result:** Code looks correct in JSON, but n8n executes OLD version from database.

---

## MANDATORY WORKFLOW CHANGE PROCEDURE

### Phase 1: BEFORE Making Changes

```bash
# 1. Export CURRENT state from n8n database
docker cp vigil-n8n:/home/node/.n8n/database.sqlite /tmp/n8n_before_changes.sqlite

# 2. Verify what's actually running
python3 << 'PYEOF'
import sqlite3, json
conn = sqlite3.connect('/tmp/n8n_before_changes.sqlite')
cursor = conn.cursor()
cursor.execute("SELECT name, nodes FROM workflow_entity WHERE name LIKE '%Vigil%'")
row = cursor.fetchone()
if row:
    nodes = json.loads(row[1])
    for node in nodes:
        if node['name'] == 'Build+Sanitize NDJSON':
            code = node['parameters']['jsCode']
            for line in code.split('\n'):
                if 'pipeline_version:' in line:
                    print(f"CURRENT VERSION IN DATABASE: {line.strip()}")
                    break
conn.close()
PYEOF

# 3. Create timestamped backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p /Users/tomaszbartel/Documents/Projects/vigil-misc/workflow-backups
cp /tmp/n8n_before_changes.sqlite \
   /Users/tomaszbartel/Documents/Projects/vigil-misc/workflow-backups/n8n_backup_${TIMESTAMP}.sqlite
```

### Phase 2: Making Changes

```bash
# 1. Edit JSON file
# services/workflow/workflows/Vigil-Guard-vX.X.X.json

# 2. VERIFY changes in JSON
python3 << 'PYEOF'
import json
with open('/Users/tomaszbartel/Documents/Projects/Vigil-Guard/services/workflow/workflows/Vigil-Guard-v1.7.0.json', 'r') as f:
    workflow = json.load(f)
    for node in workflow['nodes']:
        if node['name'] == 'Build+Sanitize NDJSON':
            code = node['parameters']['jsCode']
            for line in code.split('\n'):
                if 'pipeline_version:' in line:
                    print(f"VERSION IN JSON FILE: {line.strip()}")
                    break
PYEOF

# 3. Create checksum for verification
shasum -a 256 services/workflow/workflows/Vigil-Guard-v1.7.0.json > /tmp/workflow_checksum.txt
cat /tmp/workflow_checksum.txt
```

### Phase 3: User Import Instructions

**CRITICAL:** Tell user to:

1. **Clear browser cache** (Cmd+Shift+R on macOS)
2. **Open n8n:** http://localhost:5678
3. **Close any open workflows** (to prevent import conflicts)
4. **Menu → Import from File**
5. **Select file:** `/Users/tomaszbartel/Documents/Projects/Vigil-Guard/services/workflow/workflows/Vigil-Guard-v1.7.0.json`
6. **Choose:** "Update existing" + "Replace workflows with matching ID"
7. **DO NOT navigate away** until import completes
8. **Verify import:**
   - Open workflow "Vigil Guard v1.7.0"
   - Find node "Build+Sanitize NDJSON"
   - Open code editor
   - Search for `pipeline_version`
   - **Must show:** `"v1.7.0"` (not `"v1.6.11"`)
9. **Activate workflow** (toggle in top-right)

### Phase 4: VERIFICATION (MANDATORY)

```bash
# 1. Export database AFTER import
docker cp vigil-n8n:/home/node/.n8n/database.sqlite /tmp/n8n_after_import.sqlite

# 2. Verify version in database
python3 << 'PYEOF'
import sqlite3, json
conn = sqlite3.connect('/tmp/n8n_after_import.sqlite')
cursor = conn.cursor()
cursor.execute("SELECT nodes FROM workflow_entity WHERE name LIKE '%1.7.0%'")
row = cursor.fetchone()
if row:
    nodes = json.loads(row[0])
    for node in nodes:
        if node['name'] == 'Build+Sanitize NDJSON':
            code = node['parameters']['jsCode']
            for line in code.split('\n'):
                if 'pipeline_version:' in line:
                    print(f"DATABASE AFTER IMPORT: {line.strip()}")
                    if 'v1.7.0' in line:
                        print("✅ VERIFICATION PASSED")
                    else:
                        print("❌ VERIFICATION FAILED - version mismatch!")
                    break
conn.close()
PYEOF

# 3. Functional test
CLICKHOUSE_PASSWORD=$(grep CLICKHOUSE_PASSWORD /Users/tomaszbartel/Documents/Projects/Vigil-Guard/.env | cut -d'=' -f2)
SESSION_ID="verify_v170_$(date +%s)"

echo "Sending test request..."
curl -s -X POST http://localhost:5678/webhook/42f773e2-7ebf-42f7-a993-8be016d218e1 \
  -H "Content-Type: application/json" \
  -d "{\"chatInput\":\"Test email@example.com\",\"sessionId\":\"$SESSION_ID\"}" > /dev/null

sleep 4

echo "Checking ClickHouse..."
docker exec vigil-clickhouse clickhouse-client -q "
SELECT
  pipeline_version,
  final_status,
  pii_sanitized
FROM n8n_logs.events_processed
WHERE sessionId = '$SESSION_ID'
FORMAT Vertical
"

# EXPECTED:
# pipeline_version: v1.7.0  ← MUST match JSON file
# final_status: SANITIZED   ← If PII detected
# pii_sanitized: 1          ← If PII detected
```

---

## VERIFICATION CHECKLIST

Before marking workflow change as complete:

- [ ] JSON file version verified (Python script)
- [ ] n8n database version verified BEFORE import
- [ ] User cleared browser cache before import
- [ ] User confirmed visual verification in n8n GUI
- [ ] n8n database version verified AFTER import
- [ ] Versions match: JSON file = n8n database
- [ ] Functional test passed (ClickHouse shows correct version)
- [ ] Backup created with timestamp

---

## ROLLBACK PROCEDURE

If verification fails:

```bash
# 1. Restore backup
BACKUP_FILE="/Users/tomaszbartel/Documents/Projects/vigil-misc/workflow-backups/n8n_backup_YYYYMMDD_HHMMSS.sqlite"

docker-compose stop n8n
docker cp "$BACKUP_FILE" vigil-n8n:/home/node/.n8n/database.sqlite
docker-compose start n8n

# 2. Wait for n8n to start
sleep 10

# 3. Verify rollback
curl -s http://localhost:5678/healthz
```

---

## COMMON MISTAKES TO AVOID

### ❌ Mistake 1: Editing JSON without verification
**Problem:** Assume sed/Python edit worked
**Solution:** ALWAYS run verification script AFTER editing

### ❌ Mistake 2: Assuming user import worked
**Problem:** User says "imported" but database has old version
**Solution:** ALWAYS run post-import verification script

### ❌ Mistake 3: Browser cache
**Problem:** User imports, but browser uses cached old file
**Solution:** Tell user to clear cache (Cmd+Shift+R) before import

### ❌ Mistake 4: Not checking actual database
**Problem:** Only check JSON file, not what n8n executes
**Solution:** ALWAYS export and check SQLite database

### ❌ Mistake 5: Multiple workflow versions active
**Problem:** Both v1.6.11 and v1.7.0 active, wrong one executes
**Solution:** Verify only ONE workflow is active with correct version

---

## SKILL INTEGRATION

This procedure MUST be called from `n8n-vigil-workflow` skill.

**Trigger:** ANY workflow code change

**Required commands:**
- `/verify-workflow-version` → Run Phase 1 + Phase 4
- `/export-workflow-state` → Export current database state
- `/backup-workflow` → Create timestamped backup

---

## DOCUMENTATION REFERENCES

- n8n database location: `/home/node/.n8n/database.sqlite`
- Workflow JSON: `services/workflow/workflows/Vigil-Guard-vX.X.X.json`
- Backup location: `/Users/tomaszbartel/Documents/Projects/vigil-misc/workflow-backups/`
- ClickHouse verification: `pipeline_version` column in `events_processed` table

---

**LAST UPDATED:** 2025-11-01
**NEXT REVIEW:** After any workflow version mismatch incident
