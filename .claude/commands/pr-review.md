---
description: Full PR review - comprehensive code review for pull requests
---

Perform a comprehensive pull request review. Analyze all changes between the current branch and main:

## Steps:

1. **Get PR context:**
   ```bash
   git log main..HEAD --oneline
   git diff main...HEAD --stat
   ```

2. **Review each changed file** for:
   - Code quality and style compliance
   - Security vulnerabilities (OWASP Top 10)
   - Potential bugs or logic errors
   - Performance implications
   - Test coverage (are new features tested?)
   - Backward compatibility
   - Documentation accuracy

3. **Check for common issues:**
   - Hardcoded secrets or credentials
   - Missing input validation
   - SQL injection / XSS vulnerabilities
   - Unhandled error cases
   - Memory leaks or resource cleanup

4. **Provide structured feedback:**
   - 🔴 **Critical** - Must fix before merge
   - 🟡 **Warning** - Should fix, but not blocking
   - 🟢 **Suggestion** - Nice to have improvements
   - ℹ️ **Info** - FYI, no action needed

5. **Summary:**
   - Overall assessment (APPROVE / REQUEST_CHANGES / COMMENT)
   - List of files reviewed
   - Key findings

Read CLAUDE.md for project-specific conventions and requirements.
