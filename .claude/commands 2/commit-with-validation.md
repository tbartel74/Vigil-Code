---
name: Commit with Validation
description: Pre-commit validation and git commit workflow
---

# Commit with Validation

Run validation checks before committing changes.

## Steps

### 1. Check Git Status
```bash
echo "========================================="
echo "Git Status"
echo "========================================="
git status
echo ""
```

### 2. TypeScript Type Checking
```bash
echo "========================================="
echo "TypeScript Validation"
echo "========================================="

if [ -f "services/web-ui/backend/package.json" ]; then
  echo "Checking backend..."
  cd services/web-ui/backend
  npx tsc --noEmit || exit 1
  cd ../../..
fi

if [ -f "services/web-ui/frontend/package.json" ]; then
  echo "Checking frontend..."
  cd services/web-ui/frontend
  npx tsc --noEmit || exit 1
  cd ../../..
fi

echo "✅ TypeScript validation passed"
echo ""
```

### 3. Run Tests
```bash
echo "========================================="
echo "Running Tests"
echo "========================================="

if [ -f "services/workflow/package.json" ]; then
  cd services/workflow
  npm test || exit 1
  cd ../..
fi

echo "✅ Tests passed"
echo ""
```

### 4. Verify No Secrets
```bash
echo "========================================="
echo "Checking for Secrets"
echo "========================================="

# Check for common secret patterns
git diff --cached | grep -E "(password|api_key|secret|token).*=.*[a-zA-Z0-9]{20,}" && {
  echo "⚠️  WARNING: Possible secret detected in staged changes"
  echo "Review carefully before committing"
  read -p "Continue? (y/N) " -n 1 -r
  echo
  [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
}

echo "✅ No obvious secrets detected"
echo ""
```

### 5. Stage and Commit
```bash
echo "========================================="
echo "Staging Changes"
echo "========================================="

git add .

echo ""
echo "Files to be committed:"
git diff --cached --name-only

echo ""
read -p "Commit message: " COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
  echo "❌ Commit message required"
  exit 1
fi

git commit -m "$COMMIT_MSG"

echo ""
echo "✅ Committed successfully"
echo ""
echo "Next steps:"
echo "  - Review commit: git show"
echo "  - Push to remote: git push"
```

## Quick Commit (Skip Tests)
For documentation-only changes:
```bash
git add .
git commit -m "docs: Update documentation"
```

## Example Usage
```
/commit-with-validation
```

## Related Agents
- vg-test-automation - Test execution
- vg-security-compliance - Secret detection
