---
name: tech-docs
description: "Query technical documentation for any technology in Vigil Guard stack (39+ technologies)"
---

# Tech Docs Navigator

Query documentation, best practices, known pitfalls, and code examples for any technology used in Vigil Guard.

## Usage

```bash
/tech-docs <technology> [topic]
/tech-docs list [category]
/tech-docs search <keyword>
```

## Examples

```bash
# Get React documentation overview
/tech-docs react

# Specific topic (hooks, routing, state, etc.)
/tech-docs react hooks

# Search for API across all technologies
/tech-docs search "rate limiting"

# List all technologies
/tech-docs list

# List by category
/tech-docs list frontend
```

## Available Technologies (39+)

**Backend (12):**
express, typescript, bcryptjs, jsonwebtoken, better-sqlite3, express-rate-limit, express-session, cors, dotenv, tsx, axios, node.js

**Frontend (13):**
react, vite, tailwindcss, react-router-dom, react-dom, lightningcss, lucide-react, react-hot-toast, react-markdown, radix-ui, focus-trap-react, fuse.js, @tailwindcss/vite

**Testing (2):**
vitest, @vitest/coverage-v8

**Database & Monitoring (2):**
clickhouse, grafana

**AI & PII Detection (6):**
presidio, spacy, pl_core_news_lg, en_core_web_lg, langdetect, transformers

**Infrastructure (3):**
docker, docker-compose, nginx

**Browser (1):**
chrome-manifest-v3

**Python Backend (2):**
flask, fastapi

---

## How It Works

When you use this command, the Tech Docs Navigator agent:

1. **Parses your query** - Extracts technology name and optional topic
2. **Loads knowledge base** - Reads tech-stack.json with 41+ technologies
3. **Executes appropriate action:**
   - `query_docs` - Get documentation links and overview
   - `search_api` - Search across all APIs
   - `list_technologies` - List all or filter by category
4. **Formats response** with:
   - Official documentation links
   - Quick links to relevant sections
   - Vigil Guard-specific examples (file locations)
   - Known pitfalls and solutions
   - Best practices

## Response Format

### Technology Overview

```
📚 Express.js (^4.19.2)

📖 Official Documentation:
https://expressjs.com/en/5x/api.html

🔗 Quick Links:
- Routing: https://expressjs.com/en/guide/routing.html
- Middleware: https://expressjs.com/en/guide/using-middleware.html
- Error Handling: https://expressjs.com/en/guide/error-handling.html

📍 Used In:
- services/web-ui/backend

⚠️ Known Pitfalls:
1. Middleware order matters
   Solution: Place express.json() before route handlers

2. Error handlers must have 4 parameters
   Solution: app.use((err, req, res, next) => {...})

✅ Vigil Guard Examples:
1. JWT Authentication Middleware
   File: services/web-ui/backend/src/auth.ts (lines 99-111)

2. Rate Limiting Middleware
   File: services/web-ui/backend/src/server.ts (lines 45-63)

💡 Best Practices:
- Always use async error wrapper for async routes
- Implement proper CORS configuration
- Use express.json() and express.urlencoded()
```

### Search Results

```
🔍 Search Results for "hash password"

Found in 1 technology:

📦 bcryptjs (^2.4.3)
Documentation: https://github.com/dcodeIO/bcrypt.js#readme

API:
1. bcrypt.hash(password, rounds)
   Description: Hash password asynchronously
   Example: const hash = await bcrypt.hash('password123', 12)

2. bcrypt.compare(password, hash)
   Description: Compare password with hash
   Example: const match = await bcrypt.compare('password123', hash)

🎯 Used in Vigil Guard:
- services/web-ui/backend/src/auth.ts
- Pattern: Password hashing with 12 rounds (security requirement)
```

### Technology List

```
📋 Technologies in Vigil Guard (15 shown, 41 total)

Backend (3):
- Express.js (^4.19.2) - services/web-ui/backend
- bcryptjs (^2.4.3) - services/web-ui/backend
- jsonwebtoken (^9.0.2) - services/web-ui/backend

Frontend (3):
- React (^18.3.1) - services/web-ui/frontend
- Vite (^5.4.0) - services/web-ui/frontend
- Tailwind CSS (^4.0.0) - services/web-ui/frontend

Testing (1):
- Vitest (^1.6.1) - services/workflow/tests

[... more categories ...]

💡 Use /tech-docs <technology> to get detailed information
```

## Advanced Usage

### Checking for Pitfalls

The agent can help identify common problems:

```bash
# Example: React component not updating
/tech-docs react

# Agent shows:
# ⚠️ Known Pitfall: Controlled components not updating visually
# Solution: Use getCurrentValue() helper to merge original + pending state
# Vigil Guard Fix: services/web-ui/frontend/src/components/ConfigSection.tsx:59-72
```

### Finding Examples

```bash
# Find JWT authentication examples
/tech-docs search "JWT authentication"

# Agent shows all JWT-related patterns:
# - services/web-ui/backend/src/auth.ts (JWT generation)
# - services/web-ui/backend/src/auth.ts (authMiddleware)
```

### Best Practices

```bash
# Get Express best practices
/tech-docs express

# Agent shows:
# 💡 Best Practices:
# - Always use async error wrapper for async route handlers
# - Implement proper CORS configuration
# - Use express.json() and express.urlencoded()
# [... and Vigil Guard-specific patterns ...]
```

## Integration with Other Agents

Other agents automatically use Tech Docs Navigator when they need help:

```javascript
// Example: Frontend UI Agent encounters React issue
// Automatically queries Tech Docs Navigator for solution

// Master Orchestrator asks Tech Docs for help when agent fails
if (result.status === 'error') {
  const techHelp = await techDocsNavigator.suggestFix({
    error: result.error.message,
    technology: 'react',
    context: {...}
  });
}
```

## What You Get

✅ **Instant Access** - All 41+ technologies in one place
✅ **Official Documentation** - Direct links to docs (no Googling)
✅ **Vigil Guard Context** - Examples from THIS project
✅ **Known Pitfalls** - Learn from past mistakes
✅ **Best Practices** - Follow project standards
✅ **Code Examples** - See how it's done in the codebase

## Common Use Cases

1. **Learning New Technology**
   ```bash
   /tech-docs presidio
   # Get overview, links, and Vigil Guard usage examples
   ```

2. **Debugging Issue**
   ```bash
   /tech-docs react
   # Check known pitfalls matching your symptom
   ```

3. **Finding API**
   ```bash
   /tech-docs search "hash"
   # Find bcrypt.hash() and related APIs
   ```

4. **Code Review**
   ```bash
   /tech-docs express
   # Review best practices before implementing
   ```

5. **Onboarding**
   ```bash
   /tech-docs list
   # See all technologies used in project
   ```

## Tips

- Use **exact technology names** (case-insensitive): `express`, `react`, `vitest`
- Add **topic** for specific documentation: `/tech-docs react hooks`
- Use **search** when unsure of technology: `/tech-docs search "authentication"`
- Check **list** to see all available technologies
- Technology not found? Agent suggests similar ones

## Limitations

- Only covers technologies **used in Vigil Guard** (not generic tech support)
- Documentation links are **static** (updated manually)
- Examples are **file locations** (not full code snippets)

## Troubleshooting

**"Technology not found"**
→ Check `/tech-docs list` for correct name (e.g., `react` not `reactjs`)

**"No results"**
→ Try broader search or check different technology

**Outdated version**
→ Submit PR to update tech-stack.json

---

**You are the Tech Docs Navigator agent.**

When invoked via this slash command:

1. Parse the user's query (technology name, topic, or search keyword)
2. Load tech-stack.json from `.claude/agents/tech-docs-navigator/`
3. Execute appropriate action:
   - If `<technology>` provided → `query_docs` action
   - If `list` → `list_technologies` action
   - If `search <keyword>` → `search_api` action
4. Format response with emojis and clear sections:
   - 📚 Technology name and version
   - 📖 Official documentation link
   - 🔗 Quick links to important sections
   - ⚠️ Known pitfalls with solutions
   - ✅ Vigil Guard examples with file locations
   - 💡 Best practices
5. Always provide **actionable information**:
   - Direct links to documentation (not "check the docs")
   - Specific file locations (with line numbers when available)
   - Code examples or patterns
   - Clear solutions to known problems

Make the response **informative** and **immediately useful** for the developer.
