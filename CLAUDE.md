# CLAUDE.md - Project Template

This file provides guidance to Claude Code when working with your project.

> **Note:** Copy this file to your project and customize sections marked with `[YOUR PROJECT]`.

---

## Project Overview

**[YOUR PROJECT NAME]** - Brief description of your project.

### Key Technologies
- [Technology 1]
- [Technology 2]
- [Technology 3]

---

## Golden Rules for Code Generation

> **Goal:** Generated code must look like it was written by an experienced developer, not by a language model.

### 1. Code Over Comments
- Don't add comments if code is self-explanatory
- Comments only when design decision is not obvious

### 2. Specific Names, Not Generic
- Forbidden names: `data`, `result`, `handler`, `process`, `manager`, `utils`, `helper`
- Prefer names that reflect intent, not type

### 3. Small Functions, Single Responsibility
- Function should do one thing
- Fit in 20-40 lines
- If you use "and/or/while also" → split it

### 4. No Academic Perfection
- Prefer simpler code over excessive abstraction
- Solution for current use case, not generic framework

### 5. Consistency Over "Best Practice"
- Adapt to repo style
- Don't refactor the entire project style incidentally

### 6. Realistic Error Handling
- Handle real errors, not all theoretical cases
- No "defensive overcoding"

### 7. Logic First, Validation Later
- First: core logic
- Then: validation, guards

### 8. Code Written As If Someone Reads It Tomorrow
- Every line makes sense and can be defended
- Zero "because that's how generation worked"

---

## Agent System v4.1

> **Philosophy:** Skills = HOW (procedures), Agents = WHO (technology expertise)

### Technology Experts (7)

| Expert | Use For |
|--------|---------|
| `nats-expert` | JetStream, streams, consumers, KV store |
| `security-expert` | OWASP, vulnerabilities, audits |
| `express-expert` | API, middleware, JWT auth |
| `testing-expert` | Vitest, TDD, fixtures, mocking |
| `clickhouse-expert` | Analytics, SQL queries |
| `docker-expert` | Containers, compose, orchestration |
| `python-expert` | Flask, FastAPI, Presidio PII |

### Memory System

Cross-session persistence in `.claude/memory/`:
- `learnings.json` - Lessons learned (patterns, gotchas)
- `preferences.json` - User preferences
- `decisions.json` - Architectural decisions made

### When to Use Agents

| Task | Use Agent? |
|------|------------|
| Complex domain task | Yes - invoke expert |
| Simple file edit | No - direct |
| Multi-step workflow | Yes - use skills |

---

## Checkpoint Protocol

### ALWAYS ask user before:
- Any architectural decision
- Adding/removing dependencies
- Deleting or significantly refactoring code
- Modifying configuration files
- Creating new directories or major files

### Quick Reference

| Action | Ask First? |
|--------|-----------|
| Read files | No |
| Small edits (<10 lines) | No |
| New functions/classes | Yes |
| New dependencies | Yes |
| Delete code | Yes |
| Architectural changes | Yes |

---

## Critical Rules

### English Only
All content in this repository MUST be in English:
- Source code, comments, documentation
- Commit messages, PR descriptions
- Log messages, error messages

### ZERO AI Attribution
**ABSOLUTE PROHIBITION** on placing any AI attribution in ANY file.

Forbidden patterns:
```
Generated with [Claude Code]
Co-Authored-By: Claude <noreply@anthropic.com>
Created by Claude/GPT/Copilot/AI
```

### Conventional Commits

All commits MUST follow format:
```
<type>(<scope>): <description>
```

Types: feat, fix, refactor, docs, test, chore, perf, security

---

## Essential Commands

```bash
# [YOUR PROJECT] - Add your essential commands here
pnpm install          # Install dependencies
pnpm dev              # Start development
pnpm test             # Run tests
pnpm lint             # Lint code
```

---

## Repository Structure

```
[YOUR PROJECT]/
├── .claude/              # Agent System v4.1
│   ├── agents/           # Technology experts (7)
│   ├── skills/           # Procedural skills
│   ├── commands/         # Slash commands
│   ├── hooks/            # Automation hooks
│   ├── memory/           # Cross-session persistence
│   ├── core/             # Protocols
│   └── state/            # Session state
├── src/                  # [YOUR PROJECT] Source code
├── tests/                # [YOUR PROJECT] Tests
└── docs/                 # [YOUR PROJECT] Documentation
```

---

## Task Completion Checklist

- [ ] Code written and tested
- [ ] Tests passing
- [ ] Lint clean
- [ ] Documentation updated (if API changed)
- [ ] No security vulnerabilities
- [ ] No hardcoded secrets
- [ ] Conventional Commits format
- [ ] No AI attribution
- [ ] All content in English

---

## Troubleshooting

### Common Issues

**Port in use:** `lsof -i :PORT` then `kill -9 <PID>`

**Service won't start:** Check logs for the specific service

**Environment check:** Verify all required env vars are set

---

**Last Updated:** 2026-02-01
**Version:** 4.1.0 (Agent System v4.1)
