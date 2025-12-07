# Expert Command

Route task to appropriate technology expert based on intelligent keyword matching.

## Usage

```
/expert [task description]
/expert [expert-name] [task description]
```

## Routing Logic

### Automatic Routing (Recommended)
The command analyzes your task and routes to the best expert based on **trigger keywords**:

```
/expert Add health check to Express API
→ Detects: "API", "Express" → Routes to express-expert
```

### Direct Routing
Force routing to specific expert with bracket syntax:

```
/expert [docker] Why is my container not networking?
→ Bypasses detection → Routes directly to docker-expert
```

## Expert Directory with Triggers

| Expert | Triggers | Model |
|--------|----------|-------|
| `orchestrator` | multi-step, coordinate, workflow, multiple experts | opus |
| `n8n-expert` | n8n, workflow, Code node, webhook, automation, node | sonnet |
| `react-expert` | react, component, hook, useState, useEffect, vite, frontend, jsx | sonnet |
| `express-expert` | express, api, endpoint, middleware, route, backend, node.js, REST | sonnet |
| `vitest-expert` | test, vitest, jest, TDD, fixture, mock, assertion, coverage | sonnet |
| `clickhouse-expert` | clickhouse, analytics, SQL, MergeTree, query, schema, database, Grafana | sonnet |
| `docker-expert` | docker, container, compose, dockerfile, volume, network, image | sonnet |
| `presidio-expert` | presidio, PII, entity, recognizer, anonymization, PESEL, NIP, personal data | sonnet |
| `security-expert` | security, OWASP, vulnerability, injection, XSS, authentication, authorization, audit | sonnet |
| `git-expert` | git, commit, branch, merge, rebase, PR, pull request, GitHub | sonnet |
| `python-expert` | python, flask, fastapi, pip, pytest, async, pandas, spacy | sonnet |
| `tailwind-expert` | tailwind, CSS, styling, responsive, dark mode, utility, design | sonnet |
| `kubernetes-expert` | kubernetes, k8s, kubectl, pod, deployment, service, namespace, cluster, node, CrashLoopBackOff, ingress, configmap, secret, pvc, statefulset, daemonset | sonnet |
| `helm-expert` | helm, chart, values.yaml, Chart.yaml, release, repository, template, helm install, helm upgrade, subchart, helmfile | sonnet |
| `nats-expert` | nats, jetstream, message queue, stream, consumer, pub/sub, request-reply, exactly-once, ack, work queue, durable | sonnet |
| `redis-expert` | redis, cache, rate limit, session, sorted set, TTL, cluster, sentinel, lua script, pub/sub, expiration | sonnet |

## Execution Protocol

When this command is invoked:

### Step 1: Classification
```
1. Parse task description for trigger keywords
2. Match against expert trigger lists
3. Determine if single or multi-expert task
4. Select strategy: single | sequential | parallel
```

### Step 2: Expert Invocation (v3.1)
For each expert, use Task tool with OODA protocol:

```javascript
Task(
  prompt: `You are ${expertName}, a world-class expert in ${technology}.

           Read .claude/agents/${expertName}/AGENT.md for your full knowledge base.
           Read .claude/state/progress.json for workflow context.
           Read .claude/core/protocols.md for OODA and error handling.

           Task: ${taskDescription}

           Follow OODA Protocol:
           1. 🔍 OBSERVE: Read current state, examine relevant files
           2. 🧭 ORIENT: Consider 2+ approaches, assess confidence
           3. 🎯 DECIDE: Choose action with reasoning
           4. ▶️ ACT: Execute and update progress.json

           After completion:
           - Update progress.json with OODA state and results
           - Create checkpoint if step complete
           - Report any errors with error codes (E001-E304)
           - Return structured output with status`,
  subagent_type: "general-purpose",
  model: expertModel  // From frontmatter: "sonnet" or "opus"
)
```

### Step 3: Parallel Execution (When Applicable)
If experts are independent, invoke in parallel:

```javascript
// Multiple Task calls in single message
Task(prompt: "vitest-expert: Create test fixture...", model: "sonnet")
Task(prompt: "n8n-expert: Add pattern to workflow...", model: "sonnet")
```

## Examples

### Single Expert (Direct)
```
/expert How do I create a custom recognizer in Presidio?

🤖 Invoking: presidio-expert (model: sonnet)

To create a custom recognizer in Presidio:
[expert response]

📚 Source: https://microsoft.github.io/presidio/
```

### Multi-Expert (Sequential)
```
/expert Add SQL injection detection with tests

🎯 Task: Add SQL injection detection with tests

📋 Classification:
   • Primary: vitest-expert
   • Supporting: n8n-expert
   • Strategy: sequential (TDD workflow)

🧪 Step 1/3: vitest-expert (model: sonnet)
   ├─ ▶️  Action: create_fixture
   ├─ 📝 Creating test fixture for SQL injection...
   └─ ✅ Completed (1.2s)

⚙️  Step 2/3: n8n-expert (model: sonnet)
   ├─ ▶️  Action: add_pattern
   ├─ 🔍 Fetching docs... (verifying Code node syntax)
   ├─ 📝 Adding pattern to workflow...
   └─ ✅ Completed (0.8s)

🧪 Step 3/3: vitest-expert (model: sonnet)
   ├─ ▶️  Action: run_tests
   ├─ 📝 Verifying pattern detection...
   └─ ✅ Completed (2.1s)

════════════════════════════════════════════════════════════
✨ Task Completed in 4.1s

📋 Summary:
   SQL injection detection pattern added with passing tests

📁 Artifacts:
   • tests/fixtures/sql-injection.json (created)
   • workflow Code node updated

🤝 Coordinated 2 experts:
   • vitest-expert (2 actions)
   • n8n-expert (1 action)
════════════════════════════════════════════════════════════
```

### Multi-Expert (Parallel)
```
/expert Create API endpoint with React component

🎯 Task: Create API endpoint with React component

📋 Classification:
   • Experts: express-expert, react-expert
   • Strategy: parallel (independent work)

⚡ Executing in parallel...

🔧 express-expert (model: sonnet)
   ├─ ▶️  Action: create_endpoint
   └─ ✅ Completed

⚛️  react-expert (model: sonnet)
   ├─ ▶️  Action: create_component
   └─ ✅ Completed

✨ Task Completed
```

## State Management (v3.1)

Multi-step workflows use `.claude/state/progress.json` with OODA tracking:

```json
{
  "schema_version": "3.1",
  "workflow_id": "wf-20251127-abc123",
  "task": {
    "original_request": "Add SQL injection detection with tests",
    "summary": "TDD workflow for SQL injection pattern"
  },
  "classification": {
    "primary_expert": "vitest-expert",
    "supporting_experts": ["n8n-expert"],
    "strategy": "sequential",
    "estimated_steps": 3
  },
  "status": "in_progress",
  "current_step": 2,
  "token_budget": {
    "allocated": 25000,
    "used": 8500,
    "remaining": 16500
  },
  "steps": [
    {
      "step": 1,
      "expert": "vitest-expert",
      "action": "create_fixture",
      "status": "completed",
      "ooda": {
        "observe": "No SQL injection tests exist in tests/fixtures/",
        "orient": "Create fixture first (TDD). Options: UNION attacks, OR 1=1, DROP TABLE",
        "decide": "Create comprehensive fixture with 5 attack vectors. Confidence: HIGH",
        "act": "Write tool to create tests/fixtures/sql-injection.json"
      },
      "duration_ms": 1200,
      "tokens_used": 3200,
      "artifacts": ["tests/fixtures/sql-injection.json"]
    }
  ],
  "checkpoints": [
    {
      "id": "cp-001",
      "step_id": 1,
      "timestamp": "2025-12-01T10:01:30Z",
      "type": "step_complete",
      "files_modified": ["tests/fixtures/sql-injection.json"],
      "restorable": true
    }
  ],
  "retry_policy": {
    "max_retries": 3,
    "current_retries": 0,
    "backoff_seconds": [5, 15, 45]
  },
  "errors": []
}
```

## When NOT to Use /expert

- **Simple file edits**: Use Read/Edit tools directly
- **Codebase exploration**: Use Explore agent
- **Documentation updates**: Direct editing is faster
- **Single command execution**: Use Bash directly

## 3-Tier Knowledge Model

Each expert has access to:

1. **Tier 1 (Core)**: In-context knowledge - handles 80% of tasks
2. **Tier 2 (Docs)**: WebFetch official documentation when uncertain
3. **Tier 3 (Community)**: WebSearch for edge cases and workarounds

Experts will indicate when they consult documentation:
```
🔍 Let me verify this in the documentation...
[WebFetch: https://docs.n8n.io/...]
✅ Confirmed: [solution]
📚 Source: [url]
```
