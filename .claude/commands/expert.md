# Expert Command

Route task to appropriate technology expert.

## Usage

```
/expert [task description]
```

## How It Works

1. **Classification**: Analyze task to determine which expert(s) needed
2. **Routing**: Invoke expert(s) via Task tool
3. **Execution**: Expert applies technology knowledge + project context
4. **Synthesis**: Return results to user

## Available Experts

- `n8n-expert` - n8n workflows and automation
- `react-expert` - React components and hooks
- `express-expert` - Express.js REST APIs
- `vitest-expert` - Testing with Vitest
- `clickhouse-expert` - ClickHouse analytics
- `docker-expert` - Docker and Compose
- `presidio-expert` - PII detection
- `security-expert` - Application security
- `git-expert` - Git and GitHub
- `python-expert` - Python development
- `tailwind-expert` - Tailwind CSS styling

## Examples

```
/expert Add health check to Express API
→ Routes to express-expert

/expert Create test for SQL injection detection
→ Routes to vitest-expert

/expert Optimize ClickHouse query for dashboard
→ Routes to clickhouse-expert

/expert Add dark mode to React component
→ Routes to react-expert + tailwind-expert
```

## Execution Protocol

When this command is invoked:

1. Read the task description
2. Classify which expert(s) are needed
3. For single expert: invoke directly via Task tool
4. For multiple experts: create progress.json and coordinate
5. Report results with proper formatting

## Multi-Expert Workflow

For complex tasks requiring multiple experts:

```
🎯 Task: [description]

📋 Classification:
   • Primary: [expert]
   • Supporting: [experts]
   • Strategy: [sequential/parallel]

🤖 Step 1: [expert-name]
   ├─ ▶️  Action: [action]
   ├─ 📝 [progress]
   └─ ✅ Completed

✨ Task Completed
```
