# Expert Command

Route task to technology expert using the Task tool.

## Usage

```
/expert [task description]
/expert [expert-name] [task description]
```

## How It Works

Claude analyzes your task and uses the Task tool with appropriate expert `subagent_type`.

## Available Experts (2 examples)

| Expert | Model | Keywords |
|--------|-------|----------|
| `security-expert` | opus | security, OWASP, XSS, audit |
| `testing-expert` | sonnet | test, vitest, TDD, fixture |

Add your own experts in `.claude/agents/` for other technologies.

## Examples

```
/expert Run a security audit on the auth module
→ Uses Task tool with subagent_type="security-expert"

/expert [testing] Create test for SQL injection detection
→ Routes directly to testing-expert
```

## When NOT to Use

- Simple file edits → Use Read/Edit tools directly
- Codebase exploration → Use Explore agent
- Single command execution → Use Bash directly
