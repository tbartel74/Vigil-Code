# Expert Command

Route task to technology expert using the Task tool.

## Usage

```
/expert [task description]
/expert [expert-name] [task description]
```

## How It Works

Claude analyzes your task and uses the Task tool with appropriate expert `subagent_type`.

## Available Experts (7)

| Expert | Model | Keywords |
|--------|-------|----------|
| `nats-expert` | opus | nats, jetstream, stream, consumer |
| `security-expert` | opus | security, OWASP, XSS, audit |
| `express-expert` | sonnet | express, api, endpoint, route, redis, cache |
| `testing-expert` | sonnet | test, vitest, TDD, fixture |
| `docker-expert` | sonnet | docker, container, compose, kubernetes, k8s |
| `clickhouse-expert` | sonnet | clickhouse, SQL, analytics |
| `python-expert` | sonnet | python, flask, fastapi, presidio, PII |

## Examples

```
/expert How do I configure NATS JetStream?
→ Uses Task tool with subagent_type="nats-expert"

/expert [docker] Why is port 5678 not accessible?
→ Routes directly to docker-expert
```

## When NOT to Use

- Simple file edits → Use Read/Edit tools directly
- Codebase exploration → Use Explore agent
- Single command execution → Use Bash directly
