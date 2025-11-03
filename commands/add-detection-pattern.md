---
name: Add Detection Pattern
description: TDD workflow for adding new detection patterns to Vigil Guard
---

# Add Detection Pattern: $PATTERN_NAME

Complete TDD workflow for adding a new threat detection pattern.

## Steps

### 1. Create Test Fixture
```bash
cd services/workflow
cat > tests/fixtures/$PATTERN_NAME-test.json << 'EOF'
{
  "description": "Description of the attack",
  "prompt": "malicious payload here",
  "expected_status": "BLOCKED",
  "expected_categories": ["YOUR_CATEGORY"],
  "expected_min_score": 85
}
EOF
```

### 2. Add Test Case
Edit `services/workflow/tests/e2e/bypass-scenarios.test.js`:
```javascript
test("Detects $PATTERN_NAME", async () => {
  const result = await testWebhook(fixtures.$PATTERN_NAME.prompt);
  expect(result.status).toBe("BLOCKED");
  expect(result.scoreBreakdown).toHaveProperty("YOUR_CATEGORY");
});
```

### 3. Run Test (Should FAIL)
```bash
npm test -- bypass-scenarios.test.js
```

### 4. Add Pattern via GUI
1. Open http://localhost/ui/config/
2. Navigate to Detection Tuning → rules.config.json
3. Add or update category:
```json
{
  "YOUR_CATEGORY": {
    "base_weight": 50,
    "multiplier": 1.3,
    "patterns": [
      "\\bpattern1\\b",
      "pattern2.*?pattern3"
    ]
  }
}
```
4. Save (automatic backup created)

### 5. Verify Test Passes
```bash
npm test -- bypass-scenarios.test.js
```

### 6. Test in n8n Chat
1. Open http://localhost:5678
2. Navigate to Vigil-Guard-v1.4 workflow
3. Click "Test workflow" → "Chat"
4. Send test prompts
5. Verify scoreBreakdown shows your category

### 7. Monitor in ClickHouse
```bash
docker logs vigil-clickhouse clickhouse-client -q "
  SELECT original_input, status, categories
  FROM n8n_logs.events_processed
  WHERE arrayExists(x -> x = 'YOUR_CATEGORY', categories)
  ORDER BY timestamp DESC
  LIMIT 10
"
```

### 8. Commit Changes
```bash
git add tests/ services/workflow/config/
git commit -m "feat(detection): Add $PATTERN_NAME pattern

Detects [description of threat]
Base weight: 50, Multiplier: 1.3
Test coverage: bypass-scenarios.test.js"
```

## Example Usage
```
/add-detection-pattern emoji-obfuscation
```

## Related Skills
- n8n-vigil-workflow - Pattern configuration
- vigil-testing-e2e - Test creation
