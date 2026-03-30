# Husky Git Hooks

## Current Configuration

### Development Mode (Current)
The hooks are configured for **development mode** to allow faster iteration:

- **pre-commit**: ✅ Strict (linting, formatting, type-check)
- **commit-msg**: ✅ Strict (validates commit message format)
- **pre-push**: ⚠️ Lenient (warns but doesn't block)

### Hooks Explained

#### 1. pre-commit
**Runs before every commit**

```bash
✅ Lints staged files (ESLint)
✅ Formats code (Prettier)
✅ Type checks entire project
❌ Blocks commit if errors found
```

**This is STRICT** - ensures code quality before committing.

#### 2. commit-msg
**Validates commit message format**

```bash
✅ Enforces conventional commits
❌ Blocks commit if format is wrong
```

**Format**: `type(scope): subject`

**Examples**:
```bash
✅ feat(auth): add login endpoint
✅ fix(database): resolve connection issue
✅ docs(readme): update setup guide
❌ added login (wrong format)
```

#### 3. pre-push (Development)
**Runs before pushing to remote**

```bash
⚠️ Runs tests (warns if fail)
✅ Type checks (blocks if fail)
⚠️ Builds project (warns if fail)
```

**This is LENIENT** - allows pushing even if tests/build fail (for WIP branches).

#### 3. pre-push.production (Strict)
**Production-ready version**

```bash
✅ Runs tests (blocks if fail)
✅ Type checks (blocks if fail)
✅ Builds project (blocks if fail)
✅ Lints code (blocks if fail)
```

**This is STRICT** - ensures everything works before pushing.

---

## Switching to Production Mode

When you're ready for stricter checks (recommended before production):

### Windows (PowerShell)
```powershell
cd backend\.husky
Remove-Item pre-push
Copy-Item pre-push.production pre-push
```

### macOS/Linux
```bash
cd backend/.husky
rm pre-push
cp pre-push.production pre-push
chmod +x pre-push
```

---

## Hook Behavior

### Development Mode (Current)
```bash
git commit -m "feat(auth): add login"
# ✅ Lints and formats code
# ✅ Type checks
# ❌ Blocks if errors

git push
# ⚠️ Runs tests (warns if fail)
# ✅ Type checks (blocks if fail)
# ⚠️ Builds (warns if fail)
# ✅ Allows push even with warnings
```

### Production Mode
```bash
git commit -m "feat(auth): add login"
# ✅ Lints and formats code
# ✅ Type checks
# ❌ Blocks if errors

git push
# ✅ Runs tests (blocks if fail)
# ✅ Type checks (blocks if fail)
# ✅ Builds (blocks if fail)
# ✅ Lints (blocks if fail)
# ❌ Blocks push if any check fails
```

---

## Skipping Hooks (Emergency Only)

### Skip pre-commit
```bash
git commit --no-verify -m "emergency fix"
```

### Skip pre-push
```bash
git push --no-verify
```

⚠️ **Warning**: Only use `--no-verify` in emergencies!

---

## Customizing Hooks

### Make pre-push stricter
Edit `pre-push` and change:
```bash
npm test || {
  echo "⚠️  Tests failed"
}
```

To:
```bash
npm test || {
  echo "❌ Tests failed! Push aborted."
  exit 1
}
```

### Make pre-push more lenient
Edit `pre-push` and change:
```bash
npm run type-check || {
  echo "❌ Type check failed!"
  exit 1
}
```

To:
```bash
npm run type-check || {
  echo "⚠️  Type check failed"
}
```

---

## Troubleshooting

### Hooks not running
```bash
# Reinstall hooks
cd backend
npm run prepare
```

### Make hooks executable (macOS/Linux)
```bash
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
chmod +x .husky/pre-push
```

### Disable hooks temporarily
```bash
# Set environment variable
export HUSKY=0

# Or rename .husky folder
mv .husky .husky.disabled
```

---

## Best Practices

### During Development
- ✅ Use lenient pre-push (current setup)
- ✅ Keep pre-commit strict
- ✅ Always follow commit message format
- ✅ Fix type errors immediately

### Before Production
- ✅ Switch to strict pre-push
- ✅ Ensure all tests pass
- ✅ Fix all linting errors
- ✅ Verify build succeeds

### In CI/CD
- ✅ Run all checks strictly
- ✅ Block merge if any check fails
- ✅ Require code review
- ✅ Run integration tests

---

## Recommended Timeline

### Week 1-2: Development Mode ✅ (Current)
- Fast iteration
- Lenient pre-push
- Focus on building features

### Week 3+: Production Mode
- Switch to strict pre-push
- All checks must pass
- Ready for production

---

## Files

| File | Purpose | Mode |
|------|---------|------|
| `pre-commit` | Lint, format, type-check | Strict |
| `commit-msg` | Validate commit message | Strict |
| `pre-push` | Tests, type-check, build | Lenient |
| `pre-push.production` | All checks strict | Strict |

---

## Summary

**Current Setup**: Development-friendly
- ✅ Strict pre-commit (code quality)
- ✅ Strict commit-msg (clear history)
- ⚠️ Lenient pre-push (fast iteration)

**Production Setup**: Use `pre-push.production`
- ✅ All checks strict
- ❌ No push if any check fails
- ✅ Production-ready code only

---

**Switch to production mode when ready!** 🚀