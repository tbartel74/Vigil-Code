# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the Vigil Guard repository.

## 🚫 KORONNĄ ZASADA #1: n8n WORKFLOW CHANGES NEVER REQUIRE RESTART

**CRITICAL ARCHITECTURE UNDERSTANDING:**

n8n is a **multi-tenant platform** where workflows are **independent from the n8n instance**. When configuration files (`rules.config.json`, `unified_config.json`) are modified:

- ✅ **Changes are IMMEDIATELY available** to workflow execution
- ✅ **n8n reads config files on EVERY execution** (no caching)
- ❌ **NEVER suggest restarting n8n** after config changes
- ❌ **NEVER suggest "re-importing workflow"** as a fix for config changes
- ❌ **NEVER assume workflow needs to be reimported** after editing config files

**Why This Matters:**
1. Config files are read dynamically by workflow Code nodes
2. Each workflow execution loads fresh config from disk
3. n8n instance restart does NOT affect config loading
4. Suggesting restart wastes time and tokens on blind alleys

**When User Says "Zaimportowałem workflow":**
- ✅ **BELIEVE THEM** - workflow IS imported
- ✅ **Move to next phase** (testing, verification)
- ❌ **DO NOT ask to reimport again** - it's a time waste

**Valid Reasons to Restart n8n (RARE):**
- n8n process crashed or frozen
- Database corruption suspected
- Core n8n settings changed (not workflow configs)

**If Tests Fail After Config Changes:**
- ✅ Debug the config files (typos, syntax errors)
- ✅ Check workflow logic (Code node bugs)
- ✅ Verify test expectations
- ❌ DO NOT blame "workflow not imported" - that's a red herring

---

## 🚫 KORONNĄ ZASADA #2: NO AI ATTRIBUTION IN COMMITS

**ABSOLUTELY FORBIDDEN in git commits:**

```bash
# ❌ NEVER INCLUDE:
🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

**This is NON-NEGOTIABLE:**
- NO AI attribution footers in commit messages
- NO "Generated with Claude" lines
- NO "Co-Authored-By: Claude" trailers
- Commits MUST appear as human-authored only

**Git Safety Protocol (commit formatting):**
```bash
# ✅ CORRECT commit message format:
fix(pii): improve entity deduplication

- Fixed sort to prefer longer overlaps
- Added error bubbling for Presidio failures

# ❌ WRONG - has AI attribution:
fix(pii): improve entity deduplication

- Fixed sort to prefer longer overlaps

🤖 Generated with Claude Code  # ← FORBIDDEN
Co-Authored-By: Claude <...>   # ← FORBIDDEN
```

**If AI attribution accidentally added:**
1. STOP immediately
2. Use `git rebase` or `git commit --amend` to rewrite history
3. Remove ALL AI attribution lines
4. Force push if already pushed (after user confirmation)

---

## 🎯 Claude Workflow Protocol - ALWAYS FOLLOW

### 🔄 Project Awareness & Context Management

**CRITICAL: Every new conversation MUST start with:**

1. **Read CLAUDE.md first** - Understand project architecture, constraints, and workflows
2. **Check for task-specific context files IF provided by user in initial message:**
   - User may provide analysis files, planning documents, or TODO lists
   - These are temporary and conversation-specific
   - Use them to understand current focus, but don't assume they exist
3. **Use Master Orchestrator for ALL multi-step tasks** - This is NON-NEGOTIABLE

### 🤖 Agent-First Approach (MANDATORY)

**ALWAYS use agents for tasks. NEVER work directly unless explicitly instructed.**

**Decision Tree:**

```
User Request
    ↓
Is it multi-step OR involves multiple domains?
    ├─ YES → Use Master Orchestrator (`/vg-orchestrate` or Skill `vg-master-orchestrator`)
    │         • Examples: Add detection pattern, run security audit, deploy service
    │         • Master will coordinate specialized agents automatically
    │         • Provides progress tracking and result synthesis
    │
    └─ NO → Is it domain-specific (single concern)?
            ├─ YES → Use specialized agent directly
            │         • Pattern config: `pattern-library-manager`
            │         • Testing: `vigil-testing-e2e`
            │         • PII: `presidio-pii-specialist`
            │         • Security: `vigil-security-patterns`
            │         • Analytics: `clickhouse-grafana-monitoring`
            │
            └─ NO → Simple task (single file edit, documentation lookup)
                    → OK to work directly
                    → But still consider `Explore` agent for codebase navigation
```

**Why Agent-First?**
- ✅ Maintains context across complex operations
- ✅ Prevents token exhaustion on large codebases
- ✅ Enforces TDD workflows automatically
- ✅ Provides built-in error recovery
- ✅ Tracks progress in real-time
- ✅ Reduces redundant questions

**Examples:**

<example>
❌ WRONG:
User: "Add SQL injection detection"
Assistant: Let me search for the pattern file...
*Uses Grep directly, reads multiple files, loses context*

✅ CORRECT:
User: "Add SQL injection detection"
Assistant: I'll use the Master Orchestrator to coordinate this task.
*Invokes `/vg-orchestrate Add SQL injection detection`*
*Orchestrator activates PATTERN_ADDITION workflow*
*vg-test-automation creates fixture → vg-workflow-business-logic adds pattern → verification*
</example>

<example>
❌ WRONG:
User: "Run security audit"
Assistant: Let me check for vulnerabilities...
*Runs npm audit, checks secrets, loses track of findings*

✅ CORRECT:
User: "Run security audit"
Assistant: I'll use the Master Orchestrator for comprehensive security analysis.
*Invokes `/vg-orchestrate Run security audit`*
*Orchestrator runs SECURITY_AUDIT workflow with parallel scanning*
*vg-security-compliance synthesizes findings with priorities*
</example>

### 🎨 Visibility Protocol (MANDATORY)

**CRITICAL: ALL agent-related responses MUST use emoji indicators**

This protocol ensures users can see agent activity in real-time, even when Claude Code UI doesn't natively support agent visibility.

#### Required Emoji Indicators

Use these emoji in EVERY response involving agents:

```
🎯 Task: [description]               # Start of task
🎭 Strategy: [type]                  # Execution strategy (single|parallel|sequential|workflow)
🤖 Invoking agent: vg-[name]        # Agent activation
▶️  Action: [action_name]           # Agent action being performed
📝 [message]                         # Progress update
✅ Completed (X.Xs)                  # Success with duration
❌ Failed: [error]                   # Failure with error message
🔄 Retry [N]/[max]                  # Retry attempt
↪️  [agent1] → [agent2]             # Inter-agent communication
```

#### Example Response Format

```
🎯 Task: Add SQL injection detection

🎭 Strategy: WORKFLOW (PATTERN_ADDITION)

🧪 Step 1/4: Invoking agent: vg-test-automation
   ▶️  Action: create_test
   📝 Creating fixture for SQL injection...
   ✅ Completed (1.2s)

⚙️  Step 2/4: Invoking agent: vg-workflow-business-logic
   ▶️  Action: add_pattern
   📝 Adding pattern to rules.config.json...
   ✅ Completed (0.8s)

🧪 Step 3/4: Invoking agent: vg-test-automation
   ▶️  Action: run_test
   📝 Running test suite...
   ✅ Completed (2.1s)

🧪 Step 4/4: Invoking agent: vg-test-automation
   ▶️  Action: verify_test
   📝 Verifying pattern detection...
   ✅ Completed (1.5s)

════════════════════════════════════════════════════════════
✨ Workflow Completed in 5.6s

📋 Summary:
   SQL injection detection pattern added successfully

🤝 Coordinated 2 agents:
   • vg-test-automation (3 actions)
   • vg-workflow-business-logic (1 action)
════════════════════════════════════════════════════════════
```

#### Why This Matters

**Without emoji indicators:**
- ❌ User sees nothing during execution
- ❌ Cannot tell if Claude is thinking or executing
- ❌ No visibility into which agent is active
- ❌ Cannot debug failures (no agent name in error)

**With emoji indicators:**
- ✅ User sees real-time progress
- ✅ Can identify which agent is executing
- ✅ Can interrupt if needed
- ✅ Can debug failures (knows which agent failed)

#### Real-Time UI State Tracking

**NEW:** Agent system now updates `.claude-code/ui-state.json` in real-time

**Automatic updates:**
- `BaseAgent.updateUIState()` - when agent starts/completes
- `ProgressReporter.updateUIState()` - when workflow starts/completes

**View status anytime:** `/status-agents`

**Example output:**
```
🤖 Vigil Guard Agent System v2.0.1

ACTIVE AGENTS (1):
🔄 test-automation    Running: "verify_pattern" (3.5s elapsed)

IDLE AGENTS (11):
✅ 🔒 pii-detection
   Last: "analyze_entity" (5m ago)
   Success: 23 | Failures: 0

[... 10 more agents ...]

WORKFLOW STATUS:
🎯 Active Workflow: PATTERN_ADDITION
   Strategy: SEQUENTIAL
   Progress: Step 3/4
   Duration: 5.3s elapsed

SYSTEM STATS:
• Total Agent Executions: 127
• Last Updated: 2s ago
```

#### Implementation Notes

- **Console output:** Progress reporter automatically includes emoji
- **UI state file:** Updated automatically by BaseAgent and ProgressReporter
- **Backward compatible:** Graceful degradation if `.claude-code/` missing
- **No performance impact:** UI state updates are async and non-blocking

---

### 📋 Task Tracking (MANDATORY)

**Use TodoWrite for ALL non-trivial tasks (3+ steps):**

1. **Create todos BEFORE starting work**
2. **Mark as in_progress BEFORE beginning each task** (exactly ONE task in_progress at a time)
3. **Mark as completed IMMEDIATELY after finishing** (no batching)
4. **Add discovered sub-tasks during work**

**Example:**
```
User: Add LDAP injection detection
Assistant: Creating todo list:
1. Research LDAP injection patterns (pending)
2. Create test fixture (pending)
3. Add pattern via Web UI (pending)
4. Verify tests pass (pending)

Marking task 1 as in_progress...
```

### 🧱 Code Structure & Quality

**File Size Limits:**
- **JavaScript/TypeScript:** Max 800 lines
- **React Components:** Max 600 lines
- **Test Files:** Max 1000 lines (multiple test suites)
- **Configuration Files:** No limit (rules.config.json is 829 lines)

**When approaching limits:**
1. Extract helper functions to separate modules
2. Split components into smaller, focused components
3. Create utility files for shared logic
4. **Document refactoring in commit message**

**Module Organization (for new features):**
```
services/
  └── new-feature/
      ├── index.js           # Main entry point
      ├── handlers.js        # Business logic
      ├── validators.js      # Input validation
      ├── utils.js           # Helper functions
      └── tests/
          ├── handlers.test.js
          └── validators.test.js
```

### 🧪 Testing Protocol (MANDATORY)

**For ALL new features:**

1. **Create Vitest test FIRST** (TDD workflow)
2. **Test should FAIL initially**
3. **Implement feature**
4. **Test should PASS**
5. **Commit test + implementation together**

**Minimum test coverage:**
- ✅ Happy path (expected use)
- ✅ Edge cases (boundary conditions)
- ✅ Failure cases (error handling)
- ✅ Integration points (if applicable)

**Test file naming:**
```
tests/
  ├── e2e/
  │   ├── bypass-scenarios.test.js      # Attack vectors
  │   ├── false-positives.test.js       # Benign inputs
  │   └── pii-detection.test.js         # PII functionality
  └── fixtures/
      ├── malicious/                     # Attack payloads
      └── benign/                        # Safe inputs
```

**After updating logic:**
- **ALWAYS check if existing tests need updates**
- Run full test suite: `npm test`
- Update failing tests or fix regressions
- **Never commit breaking test changes without fixing**

### ✅ Task Completion Checklist

**Before marking task complete:**

- [ ] Code written and tested
- [ ] Tests passing (`npm test`)
- [ ] Documentation updated (if public API changed)
- [ ] No security vulnerabilities introduced (check OWASP Top 10)
- [ ] No hardcoded secrets or credentials
- [ ] Configuration changes via Web UI (not direct file edits)
- [ ] Git commit follows Conventional Commits format
- [ ] **NO AI attribution in commit message** (see KORONNA ZASADA)

### 📚 Documentation Updates

**Update documentation when:**
- New feature added → Update USER_GUIDE.md
- API endpoint changed → Update API.md
- Detection category added → Update DETECTION_CATEGORIES.md
- Configuration option added → Update relevant section in docs/
- Setup process changed → Update QUICKSTART.md

**Documentation style:**
- Use **bold** for emphasis, not italics
- Code blocks must specify language: \`\`\`bash, \`\`\`javascript
- Include examples for all new features
- Add troubleshooting section if complex

### 🧠 AI Behavior Rules (CRITICAL)

**Context Management:**
- ✅ **ALWAYS prefer agents over direct work** for multi-step tasks
- ✅ **Start with Master Orchestrator** when multiple domains involved
- ✅ **Use Explore agent** for codebase navigation (not Grep/Glob directly)
- ✅ **Read CLAUDE.md at start** of each new conversation
- ❌ **NEVER assume context persists** between agent invocations
- ❌ **NEVER work directly on complex tasks** that agents can handle

**Code Safety:**
- ✅ **Always verify file paths exist** before editing (use Read tool first)
- ✅ **Never delete code** unless explicitly instructed or part of refactoring
- ✅ **Never edit config files directly** - use Web UI (http://localhost/ui/config/)
- ❌ **Never hallucinate function names** - verify they exist first
- ❌ **Never assume library APIs** - check documentation or existing usage

**Security:**
- ✅ **Always check for OWASP Top 10 vulnerabilities** in new code
- ✅ **Always use parameterized queries** (never string concatenation)
- ✅ **Always validate user input** (whitelist approach)
- ✅ **Always hash passwords with bcrypt** (12 rounds minimum)
- ❌ **Never commit secrets** to version control (.env only)
- ❌ **Never bypass authentication checks** in code

**Communication:**
- ✅ **Ask questions if requirements unclear**
- ✅ **Confirm destructive operations** (delete, force push)
- ✅ **Explain complex decisions** in comments
- ❌ **Never make assumptions** about user intent
- ❌ **Never skip clarification** for ambiguous tasks

### 🎨 Style & Conventions

**JavaScript/TypeScript:**
```javascript
// ✅ GOOD: Clear, documented, defensive
/**
 * Analyzes text for PII entities using dual-language detection.
 *
 * @param {string} text - Input text to analyze
 * @param {string[]} languages - Languages to check (default: ["pl", "en"])
 * @returns {Promise<Object>} Detection results with entities
 */
async function analyzePII(text, languages = ["pl", "en"]) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be non-empty string');
  }
  // Reason: Polish first for PESEL detection accuracy
  const results = await Promise.all(
    languages.map(lang => callPresidio(text, lang))
  );
  return deduplicateEntities(results);
}

// ❌ BAD: No validation, unclear logic, no documentation
async function analyze(text, langs) {
  return Promise.all(langs.map(l => call(text, l)));
}
```

**React Components:**
```javascript
// ✅ GOOD: Controlled components with getCurrentValue helper
const value = getCurrentValue(file, mapping, originalValue);
<Select value={value} onChange={handleChange} />

// ❌ BAD: Uncontrolled, shows stale state
<Select value={originalValue} onChange={handleChange} />
```

**Vitest Tests:**
```javascript
// ✅ GOOD: Descriptive, covers edge cases
describe('PII Detection - Polish Entities', () => {
  it('should detect PESEL with correct format', async () => {
    const result = await analyzePII('PESEL: 12345678901', ['pl']);
    expect(result.entities).toContainEqual({
      type: 'PESEL',
      start: 7,
      end: 18,
      score: expect.any(Number)
    });
  });

  it('should reject invalid PESEL checksum', async () => {
    const result = await analyzePII('PESEL: 12345678900', ['pl']);
    expect(result.entities).toHaveLength(0);
  });
});

// ❌ BAD: Vague, no assertions
it('works', async () => {
  const result = await analyze('test');
  expect(result).toBeTruthy();
});
```

### 🚀 Performance Considerations

**When writing code that processes large data:**
- Use streaming for files >10MB
- Implement pagination for API responses >100 items
- Add database indexes for frequent queries
- Cache expensive computations (TTL: 5-15 minutes)
- Use Promise.all() for parallel operations (not sequential await)

**Example:**
```javascript
// ✅ GOOD: Parallel execution
const [plResults, enResults] = await Promise.all([
  analyzePolish(text),
  analyzeEnglish(text)
]);

// ❌ BAD: Sequential (2x slower)
const plResults = await analyzePolish(text);
const enResults = await analyzeEnglish(text);
```

### 🔍 Debugging Protocol

**When investigating issues:**

1. **Use appropriate agent:**
   - Workflow issues → `workflow-json-architect`
   - Test failures → `vigil-testing-e2e`
   - PII problems → `presidio-pii-specialist`
   - Performance → `clickhouse-grafana-monitoring`

2. **Check logs in order:**
   ```bash
   ./scripts/logs.sh web-ui-backend    # Application logs
   docker logs vigil-n8n               # Workflow execution
   docker logs vigil-clickhouse        # Database queries
   ```

3. **Verify service health:**
   ```bash
   ./scripts/status.sh                 # All services
   curl http://localhost:5001/health   # Presidio PII
   curl http://localhost:5002/health   # Language detector
   ```

4. **Reproduce with minimal example:**
   - Create isolated test case
   - Remove unrelated code
   - Document steps to reproduce

**Never:**
- ❌ Make random changes hoping to fix issue
- ❌ Skip verification after fix
- ❌ Ignore error messages without understanding them

---

## 📖 Quick Reference Card

**Most Common Workflows:**

| Task | Command | Agent Used |
|------|---------|-----------|
| Add detection pattern | `/vg-orchestrate Add [pattern] detection` | Master → test-automation + workflow-business-logic |
| Run tests | `cd services/workflow && npm test` | Direct (simple task) |
| Security audit | `/vg-orchestrate Run security audit` | Master → security-compliance (parallel) |
| Deploy service | `/vg-orchestrate Deploy [service]` | Master → infrastructure-deployment |
| PII entity addition | `/vg-orchestrate Add PII entity [type]` | Master → pii-detection + test-automation |
| Config change | Use Web UI: http://localhost/ui/config/ | N/A (GUI-only) |
| Workflow change | Edit JSON + tell user to import | workflow-json-architect |

**Emergency Commands:**
```bash
./scripts/status.sh        # Health check
./scripts/logs.sh          # View all logs
docker-compose restart     # Restart all services
docker-compose down && docker-compose up -d  # Full restart
```

**Files You Should NEVER Edit Directly:**
- `services/workflow/config/rules.config.json`
- `services/workflow/config/unified_config.json`
- `services/workflow/config/pii.conf`
- Any file in `services/workflow/config/` (use Web UI instead)

**Files You SHOULD Edit:**
- Test files in `services/workflow/tests/`
- Workflow JSON in `services/workflow/workflows/`
- React components in `services/web-ui/frontend/src/`
- Express routes in `services/web-ui/backend/src/`

---

## ⚠️ CRITICAL: n8n Workflow Management

**WORKFLOW CHANGES MUST BE SAVED IMMEDIATELY TO JSON FILE:**

1. **n8n does NOT cache workflows** - reads from SQLite database on each execution
2. **ALL changes MUST be saved to workflow JSON file** in repository immediately
3. **NEVER assume changes persist without saving to JSON** - if not in file, they're lost
4. **Import workflow to n8n IMMEDIATELY after saving JSON** - give user explicit instruction
5. **Changes only in database but not in JSON file WILL BE LOST** on next deployment
6. **WHEN USER SAYS "zaimportowałem" - WORKFLOW IS IMPORTED** - do NOT waste tokens telling user to import again
7. **IF STATUS STILL WRONG AFTER IMPORT** - debug the workflow code, NOT the import process

**CRITICAL BUG PATTERN (v1.7.0 Investigation Panel fix):**
- **Problem:** Nodes that create NEW objects must PRESERVE all flags from previous nodes
- **Symptom:** PII detected (`sanitizer_json.pii.has=true`) but `pii_sanitized=0`, `final_status=ALLOWED` instead of `SANITIZED`
- **Root Cause:** Node creates `const result = { new_fields }` without copying `_pii_sanitized`, `pii_classification`, `pii` from input
- **Example:** Finale Decision node created new result object missing v1.7.0 PII flags
- **Fix:** Add to result object before `return`: `_pii_sanitized: ctxItem?.json?._pii_sanitized, pii_classification: ctxItem?.json?.pii_classification, pii: ctxItem?.json?.pii || {}`
- **Verification:** Run `bash /tmp/quick_pii_test.sh` → should show `final_status=SANITIZED` and `pii_sanitized=1`
- **Debug Method:** Export workflow from n8n database, trace execution path, check each Code node for `return [{ json: newObject }]` patterns

**Correct Workflow Update Process:**
```bash
# 1. Export current workflow from n8n (if making incremental changes)
sqlite3 /path/to/n8n/database.sqlite "SELECT nodes, connections, settings FROM workflow_entity WHERE name = 'Workflow Name'"

# 2. Make changes to JSON structure
# 3. Save to services/workflow/workflows/Vigil-Guard-vX.X.X.json

# 4. TELL USER TO IMPORT IMMEDIATELY:
#    "Workflow v1.7.0 jest gotowy do importu.
#     Wgraj plik: services/workflow/workflows/Vigil-Guard-v1.7.0.json
#     do n8n (Menu → Import from File)"

# 5. Test after user imports
```

**How n8n Works (NOT file-based):**
- Workflows stored in SQLite: `/home/node/.n8n/database.sqlite`
- **No automatic file watching** - changes to JSON have NO EFFECT until imported
- Import = User manually loads JSON → copies to database
- Export = User manually saves database → creates JSON file
- **Workflow execution** = Always from database, never from JSON file

**Common Mistake to AVOID:**
```bash
# ❌ WRONG: Editing JSON and assuming n8n will use it
Edit Vigil-Guard-v1.7.0.json
# n8n still uses OLD version from database!

# ✅ CORRECT: Edit JSON + Tell user to import
Edit Vigil-Guard-v1.7.0.json
echo "MUSISZ WGRAĆ ten plik do n8n żeby zmiany zadziałały!"
```

## ⚠️ IMPORTANT: Master-Agent Architecture (v2.0) - NOW IMPLEMENTED

**STATUS UPDATE (2024-11-04): REAL AUTONOMOUS ORCHESTRATION NOW AVAILABLE**

The Master Orchestrator has been **fully implemented** with executable code, replacing the previous documentation-only system. This is a true autonomous agent orchestration system with inter-agent communication.

### Implementation Status

✅ **COMPLETED Components:**
- **Core Infrastructure** - Base agent class, message bus, state manager, progress reporter, task classifier (`/.claude/core/`)
- **Master Orchestrator** - Autonomous routing with real-time visibility (`/.claude/agents/vg-master-orchestrator/`)
- **ALL 11 Agents** - 10 worker agents + 1 meta-agent (vg-master-orchestrator)
  - vg-test-automation, vg-workflow-business-logic, vg-pii-detection
  - vg-backend-api, vg-frontend-ui, vg-data-analytics
  - vg-workflow-infrastructure, vg-infrastructure-deployment
  - vg-security-compliance, vg-documentation
  - vg-master-orchestrator (meta-agent coordinator)
- **21 Slash Commands** - /vg-orchestrate, /orchestrate, /agent-help, etc.
- **18 Skills** - All with YAML headers for auto-activation
- **Demo & Testing** - Interactive CLI and demonstration scripts
- **Progress Reporting** - Real-time visibility of agent operations

✅ **STATUS:** All agents fully implemented, no duplication, production ready

### How to Use the Real Orchestrator

```bash
# 1. Via slash command (recommended)
/orchestrate Add SQL injection detection pattern

# 2. Via interactive CLI (for testing)
cd .claude/agents/vg-master-orchestrator
node init.js

# 3. Run demonstration
node demo.js

# 4. Test full system
node test-full-system.js
```

### Architecture Overview

```
User Request → Master Orchestrator
                ├── Task Classifier (intelligent routing)
                ├── Workflow Executor (template execution)
                ├── Message Bus (async agent communication)
                └── State Manager (workflow persistence)
                     ↓
              Specialized Agents (3 implemented, 7 pending)
```

### Key Features Now Working

1. **Autonomous Agent Communication** - Agents can invoke other agents independently
2. **Parallel Execution** - Multiple agents work simultaneously when possible
3. **Workflow Templates** - Pre-configured multi-step workflows (PATTERN_ADDITION, etc.)
4. **State Persistence** - Workflows maintain state across executions
5. **Error Recovery** - Automatic retry logic with fallback options
6. **Progress Tracking** - Real-time updates during execution

### Available Agents (11/11 Fully Implemented)

#### ✅ Worker Agents (10)
1. **vg-test-automation** - Test creation, execution, fixture generation
2. **vg-workflow-business-logic** - Pattern management, rules.config.json
3. **vg-pii-detection** - Dual-language PII detection (Polish + English)
4. **vg-workflow-infrastructure** - n8n JSON structure, node management
5. **vg-backend-api** - Express.js, JWT auth, ClickHouse queries
6. **vg-frontend-ui** - React components, Tailwind v4, API integration
7. **vg-data-analytics** - ClickHouse schema, Grafana dashboards
8. **vg-infrastructure-deployment** - Docker orchestration, install.sh
9. **vg-security-compliance** - Security scanning, vulnerability fixes
10. **vg-documentation** - Documentation sync, API generation

#### ✅ Meta-Agent (1)
11. **vg-master-orchestrator** - Coordinates all 10 worker agents
    - Task classification and intelligent routing
    - Workflow execution (TDD, Security Audit, PII Entity, etc.)
    - Parallel/sequential coordination
    - Result synthesis with recommendations

**Location:** `.claude/agents/vg-*/` (all with AGENT.md + agent.js)
**Agent Naming Convention:** All Vigil Guard agents use the `vg-` prefix for clear identification

### Working Workflow Templates

The Master Orchestrator executes these workflows autonomously:

- **PATTERN_ADDITION** - TDD approach with 4 sequential steps
- **PII_ENTITY_ADDITION** - Add PII entity (3 agents pending)
- **SECURITY_AUDIT** - Parallel scanning (agents pending)
- **TEST_EXECUTION** - Run and analyze tests
- **SERVICE_DEPLOYMENT** - Deploy services (agents pending)

### Examples

**Simple Request:**
```
User: "Add SQL injection detection"
Master: Activates PATTERN_ADDITION workflow
→ vg-test-automation creates test
→ vg-workflow-business-logic guides pattern addition
→ vg-test-automation verifies
```

**Complex Request:**
```
User: "Run security audit"
Master: Activates SECURITY_AUDIT workflow
→ Parallel: npm audit, secret scan, ReDoS check, auth review
→ vg-security-compliance synthesizes findings
→ Complete report with prioritized fixes
```

### Migration Notes

**From Old Skills (17) to New System:**
- ✅ **11 Agents** (10 worker + 1 meta-agent in `.claude/agents/`)
- ✅ **18 Skills** (domain-specific, auto-activated in `.claude/skills/`)
- ✅ **21 Slash Commands** (quick access in `.claude/commands/`)
- ✅ **5 Core Modules** (shared infrastructure in `.claude/core/`)

**Key Consolidations:**
- `vigil-testing-e2e` + `test-fixture-generator` → `vg-test-automation`
- `n8n-vigil-workflow` + `pattern-library-manager` → `vg-workflow-business-logic`
- `presidio-pii-specialist` + `language-detection-expert` → `vg-pii-detection`
- `docker-vigil-orchestration` + `installation-orchestrator` → `vg-infrastructure-deployment`
- `vigil-security-patterns` + `security-audit-scanner` → `vg-security-compliance`
- Added `vg-master-orchestrator` as first-class agent (was separate `master/` directory)

**Structure Changes (v2.0):**
- ❌ Removed: `master/`, `master-orchestrator/` (duplicates)
- ✅ Added: `agents/vg-master-orchestrator/` (consistent structure)
- ✅ All 18 skills now have YAML headers (auto-activation)
- ✅ Complete documentation in `.claude/README.md`

**Benefits:**
- 0% duplication (was 3 duplicate directories)
- 30-50% faster multi-agent tasks
- Automatic workflow orchestration
- No manual agent selection needed
- Real-time progress visibility
- Production-ready, fully tested

### Real-Time Progress Visibility

**NEW:** The orchestrator now provides live progress reporting during task execution:

```
🎯 Task: Add SQL injection detection
════════════════════════════════════════════════════════
📊 Classification:
   • Category: detection
   • Confidence: 95%
   • Agents: vg-workflow-business-logic, vg-test-automation
   • Workflow: PATTERN_ADDITION

🎭 Strategy: WORKFLOW

🧪 Invoking: vg-test-automation
   ├─ ▶️  Action: create_test
   ├─ 📝 Creating fixture...
   └─ ✅ Completed (1.2s)

⚙️ Invoking: vg-workflow-business-logic
   ├─ ▶️  Action: add_pattern
   ├─ [████████████████░░░░] 80% - Pattern added to configuration
   └─ ✅ Completed (0.8s)

════════════════════════════════════════════════════════
✨ Task Completed in 2.3s

📋 Summary:
   Pattern addition workflow completed successfully

🤝 Coordinated 2 agents:
   • vg-test-automation
   • vg-workflow-business-logic
```

**Features:**
- 🎯 Task classification with confidence scoring
- ⚙️ Agent invocation tracking with icons
- 📊 Progress bars for long-running operations
- ⚡ Parallel execution visualization
- ✅ Success/failure indicators with timing
- 🔄 Retry attempts tracking
- ↪️ Inter-agent communication tracing

## Project Overview

**Vigil Guard v1.6.11** is an enterprise-grade prompt injection detection and defense platform for Large Language Model applications.

### Key Features
- **40-Node Detection Pipeline** (sequential processing)
- **34 Threat Categories** (829-line rules.config.json)
- **Dual-Language PII Detection** (Polish + English via Presidio)
- **Hybrid Language Detection** (entity-based hints + statistical)
- **100+ Test Suite** (Vitest, 85% pass rate)
- **Real-time Monitoring** (Grafana + ClickHouse analytics)
- **Web-Based Configuration** (React + Express, JWT auth)

### Current Version: v1.7.0 (2025-11-01)
- Sanitization Integrity (3-layer defense preventing PII leakage)
- PII Classification tracking (audit trail with ClickHouse columns)
- Browser Fingerprinting (clientId + metadata for session tracking)
- Backward compatible with v1.6.11

---

## Repository Structure

```
vigil-guard/
├── .claude/                         # ⚠️ IN .gitignore, NEVER commit
│   ├── agents/ (11 agents)         # Specialized agents (10 worker + 1 meta)
│   ├── core/ (5 modules)           # Infrastructure (message-bus, state-manager, etc.)
│   ├── skills/ (18 skills)         # Domain-specific guidance (auto-activated)
│   ├── commands/ (21 slash cmds)   # /vg-orchestrate, /add-detection-pattern, etc.
│   ├── README.md                   # Complete .claude/ documentation
│   └── settings.local.json         # Claude Code config
├── services/
│   ├── workflow/                   # n8n detection engine
│   │   ├── config/                 # ⚠️ NEVER edit directly! Use Web UI
│   │   ├── tests/ (100+ tests)    # Vitest E2E test suite
│   │   └── workflows/              # Vigil-Guard-v1.6.11.json
│   ├── web-ui/                     # React + Express configuration interface
│   │   ├── frontend/               # React 18 + Vite + Tailwind v4
│   │   └── backend/                # Express + JWT + SQLite + ClickHouse
│   ├── monitoring/                 # ClickHouse + Grafana
│   ├── presidio-pii-api/           # Dual-language PII (v1.6.11)
│   ├── language-detector/          # Hybrid language detection (v1.0.1)
│   └── proxy/                      # Caddy reverse proxy
├── prompt-guard-api/               # Llama Prompt Guard LLM validation
├── plugin/                         # Chrome extension (manifest v3)
├── docs/                           # 20+ comprehensive guides
├── scripts/                        # install.sh, status.sh, logs.sh
├── docker-compose.yml              # 9 services orchestration
├── vigil_data/                     # Persistent volumes (10-20 GB/year)
├── CLAUDE.md                       # ← This file (in .gitignore)
└── .gitignore                      # Includes .claude/ and CLAUDE.md
```

---

## Key Commands

### Development

```bash
# Install and start all services (5-10 minutes)
./install.sh

# Start individual service development
cd services/web-ui/backend && npm run dev    # Backend (hot reload)
cd services/web-ui/frontend && npm run dev   # Frontend (Vite HMR on :5173)

# Run test suite
cd services/workflow && npm test             # All tests
cd services/workflow && npm test -- bypass-scenarios.test.js  # Specific

# Manage services
./scripts/status.sh         # Check health
./scripts/logs.sh          # View logs
./scripts/restart.sh       # Restart services
```

### Docker Management

```bash
# Start all services
docker-compose up -d

# Rebuild after code changes
docker-compose up --build -d web-ui-frontend

# View logs
docker-compose logs -f web-ui-backend

# Stop all
docker-compose down
```

---

## Critical Constraints

### ⚠️ Configuration Management

**NEVER edit config files directly:**
- ❌ `services/workflow/config/*.json`
- ❌ `services/workflow/config/*.conf`

**ALWAYS use Web UI:**
- ✅ http://localhost/ui/config/
- ✅ ETag concurrency control (prevents conflicts)
- ✅ Automatic backups (max 2 per file)
- ✅ Audit logging (`config/audit.log`)

### ⚠️ Deployment Architecture

**Web UI is served through Caddy reverse proxy:**

```
Client → http://localhost/ui/
  ↓
Caddy (:80) strips /ui prefix via uri strip_prefix
  ↓
Nginx (:80 internal) serves React SPA
```

**Key Points:**
- Vite config: `base: "/ui/"` (assets have /ui/ prefix in HTML)
- Caddy strips /ui before proxying to nginx
- Nginx receives requests WITHOUT /ui/ prefix
- **DO NOT** configure nginx to handle `/ui/` prefix
- Keep nginx config simple: `try_files $uri $uri/ /index.html`

### ⚠️ Controlled Components Pattern (CRITICAL)

**ConfigSection.tsx uses getCurrentValue() helper:**

```typescript
// ❌ WRONG (bug): Select always shows original value
<Select value={resolveOut[i].value} onChange={handleChange} />

// ✅ CORRECT: Merges original + pending changes
<Select value={getCurrentValue(file, mapping, resolveOut[i].value)} onChange={handleChange} />
```

**Location:** `services/web-ui/frontend/src/components/ConfigSection.tsx` lines 59-72

**Symptoms of missing getCurrentValue():**
- Boolean toggles don't switch visually when clicked
- Dropdown selections revert to original value
- Changes ARE tracked in state but UI doesn't reflect them

---

## Architecture Overview

### Service Communication (9 Containers)

```
n8n (:5678)
├── Language Detector (:5002) - Hybrid (entity + statistical)
├── Presidio PII (:5001) - Dual-language (Polish + English)
└── Prompt Guard (:8000) - LLM validation (optional)
    ↓ Logging
ClickHouse (:8123)
    ↓ Queried by
Web UI Backend (:8787) + Grafana (:3001)
    ↓ Served via
Caddy (:80) - Main entry point
```

### Data Flow (40-Node Pipeline)

```
1. Chat Input → Input Validation → Language Detection [v1.6.11]
2. → PII Redaction (dual Presidio) [v1.6.10] → Normalization
3. → Bloom Prefilter → Allowlist Validation
4. → Pattern Matching (34 categories, 829-line rules.config.json)
5. → Decision Engine (score thresholds)
6. → Sanitization Enforcement (Light/Heavy)
7. → [Optional] Prompt Guard LLM
8. → Final Decision → ClickHouse Logging → Output
```

### Decision Thresholds

| Score | Action | Severity | Sanitization |
|-------|--------|----------|-------------|
| 0-29 | ALLOW | Clean | None |
| 30-64 | SANITIZE_LIGHT | Low | 10 categories |
| 65-84 | SANITIZE_HEAVY | Medium | All 34 categories |
| 85-100 | BLOCK | Critical | Rejected |

---

## Access Points

After installation (`./install.sh`):

| Service | URL | Credentials |
|---------|-----|-------------|
| Web UI | http://localhost/ui | admin/[from install.sh] |
| n8n Workflow | http://localhost:5678 | (create on first access) |
| Grafana Dashboard | http://localhost:3001 | admin/[auto-generated] |
| ClickHouse HTTP | http://localhost:8123 | admin/[auto-generated] |

**Credentials Location:** Displayed once during `./install.sh`, stored in `.env` file

---

## Common Workflows

### Add Detection Pattern (TDD)

**Use slash command:** `/add-detection-pattern`

**Or manually:**
1. Create fixture: `tests/fixtures/my-attack.json`
2. Add test: `tests/e2e/bypass-scenarios.test.js`
3. Run test (should FAIL): `npm test`
4. Add pattern via GUI: http://localhost/ui/config/
5. Re-run test (should PASS): `npm test`
6. Commit changes (test + config backup)

### Configuration Change

1. Login to Web UI: http://localhost/ui
2. Navigate to Configuration → [group]
   - Quick Settings
   - Detection Tuning
   - Performance
   - Advanced
   - PII Detection [v1.6+]
3. Modify variables
4. Preview changes (before/after comparison)
5. Save (creates backup + audit log entry)
6. Verify in n8n Chat window: http://localhost:5678

### PII Detection GUI (v1.7.0)

**Component:** `PIISettings.tsx` (510 lines)
**Route:** `/config/pii`
**Navigation:** Standalone section BEFORE "System"

**Structure:**
```
ConfigNav.tsx (lines 31-55)
  ├── Configuration (sections.json)
  │   ├── Overview
  │   ├── Detection & Sensitivity
  │   ├── Performance & Limits
  │   ├── Advanced Processing
  │   ├── File Manager
  │   └── Plugin
  ├── PII Detection (hard-coded) ← v1.7.0
  │   └── PII Detection Configuration
  └── System
      └── Data Retention
```

**API Endpoints (Backend: server.ts):**
- `GET /api/pii-detection/status` - Service health (line 163)
- `GET /api/pii-detection/entity-types` - Available entities (line 209)
- `POST /api/pii-detection/analyze` - Dual-language detection (default, line 293)
- `POST /api/pii-detection/analyze-full` - Explicit dual-language with stats (line 311)

**Key Features:**
- Real-time Presidio service status monitoring
- Entity type configuration (enable/disable 50+ types)
- Language selection (PL, EN)
- Live test panel with `return_decision_process`
- Confidence threshold adjustment (0.0-1.0)
- **Dual-language detection** (v1.7.0+) - Parallel Polish + English analysis with regex fallback

**Dual-Language Architecture (v1.7.0+):**
The Web UI backend now implements comprehensive dual-language PII detection that matches workflow capabilities:

1. **Language Detection** - Hybrid detector analyzes text language (pl/en)
2. **Adaptive PERSON Routing** - Routes PERSON entity to best model based on detected language
3. **Parallel Presidio Calls** - Calls Polish and English models simultaneously
4. **Regex Fallback** - 13 patterns from pii.conf for entities missed by ML models
5. **Entity Deduplication** - Removes overlapping entities, keeps highest-score matches
6. **Language Statistics** - Detailed breakdown showing entity sources (pl/en/regex)

**Implementation Files:**
- `backend/src/piiAnalyzer.ts` (388 lines) - Main dual-language orchestrator
- `backend/src/server.ts` (lines 14, 293-320) - API endpoints
- `backend/src/fileOps.ts` (lines 60-80) - JSON detection for .conf files
- `frontend/src/components/PIISettings.tsx` (line 219) - Test Panel UI
- `frontend/src/routes.tsx` (lines 14, 383) - Route configuration

**Configuration:**
- Default language order: `["pl", "en"]` (Polish FIRST for PESEL detection)
- Test panel uses dual-language by default (all entity sources)
- File: `services/workflow/config/unified_config.json`
- Regex patterns: `services/workflow/config/pii.conf` (JSON format)

**Performance:**
- Average processing time: 15-33ms (Presidio parallel calls)
- Total response time: <100ms (including network + deduplication)
- Entity detection: 10+ entities from 11 types (vs 1 in previous version)

**v1.7.0 Fixes:**
1. **Navigation:** PII Detection moved to standalone section (not in sections.json)
2. **Language order:** Changed from `["en", "pl"]` to `["pl", "en"]` for Polish entity recognition
3. **HTTP 500 fix:** AnalysisExplanation now JSON serializable (Presidio app.py:578-591)
4. **Dual-language GUI:** Test Panel now achieves 100% feature parity with workflow detection

**Important Notes:**
- PIISettings is the ONLY PII component (no old components exist)
- Hard-coded in ConfigNav.tsx, NOT defined in sections.json
- Docker rebuild uses source code, no risk of regression
- Language order is CRITICAL for Test panel functionality
- Dual-language detection is the DEFAULT behavior (legacy mode available via ?mode=legacy)

### User Management

1. Navigate to Administration (requires `can_manage_users`)
2. Add User → Enter details → Select permissions
   - `can_view_monitoring` (Grafana dashboard access)
   - `can_view_configuration` (Config editing)
   - `can_manage_users` (User admin panel)
3. Auto-generated password displayed ONCE
4. User logs in → Forced password change (8+ chars)

---

## Testing Strategy

### Test Suite Overview (v1.6.11: 100+ Tests)

```bash
cd services/workflow

# All tests
npm test

# Specific suites
npm test -- smoke.test.js                    # 3 tests (100% pass)
npm test -- bypass-scenarios.test.js         # 29 tests (52% pass)
npm test -- emoji-obfuscation.test.js        # 28 tests (100% pass)
npm test -- false-positives.test.js          # 15 tests (100% pass)
npm test -- language-detection.test.js       # 50 tests (100%) [NEW v1.6.11]
npm test -- pii-detection-comprehensive.test.js  # 24 tests (100%)

# OWASP AITG payloads
npm test -- owasp-aitg-app-01.test.js        # 50 payloads (direct injection)
npm test -- owasp-aitg-app-02.test.js        # 40 payloads (indirect injection)
npm test -- owasp-aitg-app-07.test.js        # 60 payloads (prompt extraction)

# Coverage report
npm run test:coverage
```

### TDD Best Practices

1. **Write test first** (fixture + test case)
2. **Run test** (should FAIL initially)
3. **Add pattern via GUI** (not by editing files)
4. **Re-run test** (should PASS)
5. **Commit test + config changes** together

**Vitest Configuration:**
- Timeout: 30 seconds (for slow workflow executions)
- Retry: 1 attempt (handles flaky webhook tests)
- Sequence: Sequential (safer for webhook testing, prevents race conditions)

---

## Security Best Practices

### Authentication

- **JWT tokens** (jsonwebtoken ^9.0.2, 24h expiration)
- **bcrypt password hashing** (12 rounds)
- **Rate limiting** (5 login attempts / 15 minutes)
- **Session management** (24 hours, httpOnly cookies)
- **RBAC permissions** (3 levels: monitoring, configuration, admin)

### Input Validation

- **Path traversal protection** (filename whitelist, no `..` or `/`)
- **SQL injection prevention** (parameterized queries, no concatenation)
- **XSS prevention** (React auto-escapes JSX, DOMPurify for HTML)
- **ReDoS protection** (regex review, 1-second timeout per pattern)

### Secret Management

- **Auto-generated passwords** (`openssl rand -base64`)
- **Secrets in .env** (never committed, .gitignore enforced)
- **Masked values in UI** (`p*********3` format)
- **Backend fails on missing secrets** (fail-secure design)

### Audit Logging

- **Config changes** tracked (`config/audit.log` with timestamp, user, file, changes)
- **Authentication events** logged (login, password change, user creation)
- **No sensitive data** in logs (passwords, tokens filtered out)

### Recent Security Fixes (v1.6.11 - Phase 3-4 Audit)

1. **Rate Limiting** (express-rate-limit ^8.1.0)
   - Login: 5 attempts / 15 minutes
   - API: 100 requests / minute

2. **ReDoS Protection**
   - Reviewed 829-line rules.config.json
   - Added 1-second timeout to Pattern_Matching_Engine

3. **Service Health Checks**
   - Standardized HTTP status codes (200/503)
   - Graceful degradation on failures

4. **Version Consistency**
   - Unified pipeline_version across services
   - Docker image tags with SHA256 digests

---

## Performance Targets

- **Test Suite:** <30 seconds total runtime (100+ tests)
- **Webhook Response:** <200ms (local, excludes LLM validation)
- **PII Detection:** <310ms (dual-language Presidio)
- **Language Detection:** <10ms per request
- **ClickHouse Queries:** <100ms (indexed queries)

---

## Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
lsof -i :8123          # Find process
kill -9 <PID>          # Kill process
```

**Service Won't Start:**
```bash
docker-compose logs service-name
docker network inspect vigil-net
docker-compose config  # Verify env vars loaded
```

**CORS Errors:**
- Check backend CORS origin regex: `/^http:\/\/localhost(:\d+)?$/`
- Verify Vite proxy config: `/api` → `http://localhost:8787`

**ETag Conflict (412 Precondition Failed):**
- Refresh config page to get latest ETag
- Check `config/audit.log` for concurrent modifications
- Wait for other user to finish editing

**Test Timeouts:**
- Increase timeout in `vitest.config.js` (default: 30s)
- Verify n8n workflow is active: `curl http://localhost:5678/healthz`
- Check Docker services: `./scripts/status.sh`

**Webhook Not Responding:**
```bash
# 1. Check n8n workflow is active
curl http://localhost:5678/healthz

# 2. Verify webhook URL in tests/helpers/webhook.js

# 3. Check Docker network
docker network inspect vigil-net
```

**PII Not Detected:**
```bash
# 1. Check Presidio service health
curl http://localhost:5001/health

# 2. Check language detector health
curl http://localhost:5002/health

# 3. Test Presidio directly
curl -X POST http://localhost:5001/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "My email is test@example.com", "language": "en", "entities": ["EMAIL"]}'
```

---

## Environment Variables

Required in `.env` (auto-generated by `./install.sh`):

```bash
# ClickHouse
CLICKHOUSE_PASSWORD=<32 chars>       # ⚠️ REQUIRED, no default

# Grafana
GF_SECURITY_ADMIN_PASSWORD=<32 chars>  # ⚠️ REQUIRED
GRAFANA_UID=472  # macOS: $(id -u)
GRAFANA_GID=472  # macOS: $(id -g)

# Backend
SESSION_SECRET=<64 chars>            # ⚠️ REQUIRED, min 64 chars
JWT_SECRET=<32 chars>                # ⚠️ REQUIRED, min 32 chars
WEB_UI_ADMIN_PASSWORD=<24 chars>     # ⚠️ REQUIRED

# Presidio
PII_DETECTION_MODE=balanced          # strict|balanced|permissive
PII_CONTEXT_ENHANCEMENT=true
```

**Password Rotation:**
```bash
# Stop services
docker-compose down

# Delete .env
rm .env

# Re-run installation (generates new secrets)
./install.sh
```

---

## Documentation

Comprehensive guides in `docs/`:

- **QUICKSTART.md** - 5-minute setup guide
- **USER_GUIDE.md** - Complete user manual
- **API.md** - REST API reference
- **DETECTION_CATEGORIES.md** - 34 threat categories explained
- **PII_DETECTION.md** - Dual-language PII system architecture
- **CLICKHOUSE_RETENTION.md** - Data lifecycle management (TTL, partitions)
- **TROUBLESHOOTING.md** - Common issues and solutions

---

## Version History

- **v1.7.9** (2025-11-12) - Aho-Corasick prefilter production release (993 keywords, 77% single-category hits, 160+ tests, OWASP AITG: APP-01 96%, APP-02 82.5%)
- **v1.7.8** (2025-11-12) - AC prefilter integration, unified_config.json expansion (246→4013 lines), 44 detection categories
- **v1.7.7** (2025-11-08) - OWASP AITG-APP-01 hardening (DAN-mode, prompt leak, CBRNE), leet speak expansion (13 new mappings)
- **v1.7.0** (2025-11-01) - Sanitization Integrity (3-layer defense), PII Classification, Browser Fingerprinting
- **v1.6.11** (2025-11-01) - Hybrid language detection, CREDIT_CARD Polish support
- **v1.6.10** (2025-01-30) - Dual-language PII (parallel Presidio calls)
- **v1.6.0** (2025-01-29) - Microsoft Presidio integration (50+ entity types)
- **v1.5.0** (2025-10-27) - MEDICAL_MISUSE category, improved PROMPT_LEAK
- **v1.4.0** (2025-10-18) - Browser extension, enhanced SQL_XSS_ATTACKS
- **v1.3.0** (2025-10-13) - Investigation Panel, E2E test suite
- **v1.2.0** (2025-10-01) - Authentication & RBAC
- **v1.1.0** (2025-09-20) - Grafana monitoring, ClickHouse logging
- **v1.0.0** (2025-09-10) - Initial release

---

## Contributing

Before making changes:

1. **Read CONTRIBUTING.md** (14KB comprehensive guide)
2. **Run tests:** `cd services/workflow && npm test`
3. **Use TDD workflow** for detection patterns
4. **Never edit config files directly** (use Web UI)
5. **Follow security checklist** (see vigil-security-patterns skill)
6. **Add tests for new features** (maintain >85% pass rate)
7. **Update documentation** (relevant .md files in docs/)

### Code Review Checklist

```markdown
## Security Review

- [ ] No hardcoded credentials
- [ ] Passwords hashed with bcrypt (12 rounds)
- [ ] JWT secrets ≥32 characters (from .env)
- [ ] Token expiration configured (24h)
- [ ] Permission checks on protected routes

## Input Validation

- [ ] All user input validated
- [ ] Filename sanitization (path traversal prevention)
- [ ] SQL queries parameterized (no concatenation)
- [ ] XSS prevention (DOMPurify for HTML)

## Configuration

- [ ] Secrets in .env (not committed)
- [ ] Auto-generated passwords (openssl)
- [ ] Backend fails on missing secrets
- [ ] CORS origin restricted (localhost dev, domain prod)

## Testing

- [ ] Tests written before implementation (TDD)
- [ ] All tests passing (`npm test`)
- [ ] Coverage ≥85% for new code
- [ ] False positive rate <5%
```

---

## License

**MIT License** - See LICENSE file

**Third-Party:**
- Meta Llama Prompt Guard 2: Llama 4 Community License (model must be downloaded separately via `./scripts/download-llama-model.sh`)
- Microsoft Presidio: Apache License 2.0
- spaCy: MIT License

---

**Last Updated:** 2025-11-01
**Maintained By:** Vigil Guard Team
**Documentation Version:** 1.6.11

---

## Master Orchestrator FAQ

### When Should Claude Use the Orchestrator?

**ALWAYS use the orchestrator (via `/vg-orchestrate` or Skill `vg-master-orchestrator`) when:**
- Task requires **multiple agents** or coordination between services
- Implementing **TDD workflows** (test → code → verify pattern)
- Running **security audits** (parallel scanning + synthesis)
- Adding **detection patterns** with tests
- **Deploying services** with health checks
- Any task mentioning "orchestrate", "coordinate", or "multiple steps"

**DON'T use orchestrator for:**
- Single-file edits or simple code changes
- Reading/analyzing existing code
- Documentation-only updates
- Single bash commands

### How to Use the Orchestrator

**Option 1: Slash Command (Recommended)**
```bash
/vg-orchestrate Add SQL injection detection pattern
/orchestrate Run security audit
```

**Option 2: Skill Invocation**
```
Use Skill tool with skill "vg-master-orchestrator"
```

**Option 3: Manual Testing**
```bash
cd .claude/agents/vg-master-orchestrator
node init.js
# Interactive CLI with commands: help, status, agents, test
```

### Orchestrator Capabilities

**10 Worker Agents Available:**
1. `vg-workflow-business-logic` - Pattern management, rules.config.json
2. `vg-workflow-infrastructure` - n8n JSON structure, migrations
3. `vg-test-automation` - Test creation, execution, verification
4. `vg-backend-api` - Express.js, JWT, ClickHouse queries
5. `vg-frontend-ui` - React components, Tailwind CSS v4
6. `vg-data-analytics` - ClickHouse schema, Grafana dashboards
7. `vg-pii-detection` - Dual-language PII (Polish + English)
8. `vg-infrastructure-deployment` - Docker orchestration, install.sh
9. `vg-security-compliance` - Security scanning, vulnerability fixes
10. `vg-documentation` - Documentation sync, API generation

**5 Pre-configured Workflows:**
- `PATTERN_ADDITION` - TDD approach (test → run → add → verify)
- `PII_ENTITY_ADDITION` - Add PII entity type (analyze → config → test)
- `SECURITY_AUDIT` - Parallel scanning (npm + secrets + ReDoS + auth)
- `TEST_EXECUTION` - Run suite → analyze results
- `SERVICE_DEPLOYMENT` - Build → deploy → health check

### Progress Reporting

The orchestrator provides **real-time progress** visible in Claude Code:
- 🎯 Task classification with confidence scores
- ⚙️ Agent invocation tracking
- 📊 Progress bars for long operations
- ✅ Success/failure indicators with timing
- 🔄 Retry attempts tracking

### Troubleshooting Orchestrator

**Orchestrator won't start:**
```bash
# Check if .claude/package.json exists (should have "type": "commonjs")
ls -la .claude/package.json

# Test manually
cd .claude/agents/vg-master-orchestrator
node init.js
```

**Expected output:**
```
[READY] Orchestrator initialized successfully
System Status:
  • Agents loaded: 10
  • Active workflows: 0
  • Message bus ready: Yes
```

**Agents not loading:**
- Verify all 10 agent directories exist in `.claude/agents/vg-*/`
- Check each has `agent.js` file
- Review error messages in orchestrator output

**Workflows not working:**
- All workflow definitions are in `.claude/core/workflows.js`
- Task classifier uses same definitions (single source of truth)
- Check task keywords match classifier patterns

### Configuration Files

**Core Infrastructure:**
- `.claude/core/task-classifier.js` - Intelligent task routing
- `.claude/core/workflows.js` - Centralized workflow definitions
- `.claude/core/message-bus.js` - Inter-agent communication
- `.claude/core/state-manager.js` - Workflow persistence
- `.claude/core/progress-reporter.js` - Real-time progress tracking

**Orchestrator Files:**
- `.claude/agents/vg-master-orchestrator/orchestrator.js` - Main orchestration logic
- `.claude/agents/vg-master-orchestrator/agent.js` - Meta-agent (can be invoked by other agents)
- `.claude/agents/vg-master-orchestrator/workflow-executor.js` - Template execution
- `.claude/agents/vg-master-orchestrator/init.js` - Interactive CLI

**Settings:**
- `.claude/settings.local.json` - Approved commands for auto-execution
- `.claude/package.json` - CommonJS mode (required for Node.js)

---

## Quick Reference

### Essential URLs (After Installation)
- Web UI: http://localhost/ui
- n8n Workflow: http://localhost:5678
- Grafana: http://localhost:3001
- ClickHouse: http://localhost:8123

### Essential Commands
```bash
./install.sh          # Initial setup
./scripts/status.sh   # Check health
./scripts/logs.sh     # View logs
docker-compose up -d  # Start all
npm test             # Run tests (in services/workflow/)
```

### Essential Files (Never Edit Directly!)
- `services/workflow/config/rules.config.json` (829 lines, 34 categories)
- `services/workflow/config/unified_config.json` (246 lines, main settings)
- Use Web UI: http://localhost/ui/config/

### Skills Reference
- Testing → `vigil-testing-e2e`
- Analytics → `clickhouse-grafana-monitoring`
- Patterns → `n8n-vigil-workflow`
- Security → `vigil-security-patterns`
- Docker → `docker-vigil-orchestration`
- Frontend → `react-tailwind-vigil-ui`
