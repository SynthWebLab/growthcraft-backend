# Quick Start Guide

## ✅ Setup Complete!

Your backend is fully configured with error control via Husky.

---

## 🚀 Start Development

### 1. Configure Environment
```bash
# Edit .env file (already created)
code .env

# Add your MongoDB URI and JWT secrets
```

### 2. Start MongoDB
```bash
# macOS
brew services start mongodb-community

# Or use MongoDB Atlas (cloud)
```

### 3. Start Server
```bash
npm run dev
```

Server runs at: `http://localhost:5000`

---

## 📝 Common Commands

```bash
# Development
npm run dev              # Start dev server with hot reload

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode

# Code Quality
npm run lint             # Check for errors
npm run lint:fix         # Fix errors automatically
npm run format           # Format all code
npm run type-check       # Check TypeScript types

# Build
npm run build            # Build for production
npm start                # Start production server

# Verification
npm run verify-setup     # Verify installation
```

---

## 🪝 Git Workflow

### Commit Changes
```bash
git add .
git commit -m "feat(auth): add login endpoint"
```

**Husky automatically**:
- ✅ Lints your code
- ✅ Formats your code
- ✅ Checks TypeScript types
- ✅ Validates commit message

### Push Changes
```bash
git push
```

**Husky automatically**:
- ⚠️ Runs tests (warns if fail)
- ✅ Type checks (blocks if fail)
- ⚠️ Builds project (warns if fail)

---

## 📋 Commit Message Format

**Format**: `type(scope): subject`

**Types**:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style
- `refactor` - Refactoring
- `test` - Tests
- `chore` - Maintenance

**Examples**:
```bash
✅ git commit -m "feat(auth): add login endpoint"
✅ git commit -m "fix(database): resolve connection timeout"
✅ git commit -m "docs(readme): update setup guide"
❌ git commit -m "added login" # Wrong format!
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Start MongoDB
brew services start mongodb-community

# Or update .env with MongoDB Atlas URI
```

### Port Already in Use
```bash
# Change port in .env
PORT=5001
```

### Husky Hook Fails
```bash
# See what failed
npm run lint
npm run type-check
npm test

# Fix errors and commit again
```

### Skip Hook (Emergency Only)
```bash
git commit --no-verify -m "emergency fix"
git push --no-verify
```

---

## 📚 Documentation

- **[README.md](./README.md)** - Full documentation
- **[SETUP.md](./SETUP.md)** - Detailed setup guide
- **[HUSKY_SETUP.md](./HUSKY_SETUP.md)** - Git hooks explained
- **[.husky/README.md](./.husky/README.md)** - Hook configuration
- **[INSTALLATION_COMPLETE.md](./INSTALLATION_COMPLETE.md)** - What's installed

---

## 🎯 Next Steps

1. ✅ Setup complete
2. 📝 Configure `.env`
3. 🗄️ Start MongoDB
4. 🚀 Run `npm run dev`
5. 🔐 Build auth module
6. 🧪 Write tests
7. 📚 Add more features

---

## 💡 Tips

- **Always format before commit**: `npm run format`
- **Check types frequently**: `npm run type-check`
- **Write tests as you code**: `npm run test:watch`
- **Follow commit format**: Use conventional commits
- **Don't skip hooks**: Let Husky ensure quality

---

## ✨ You're Ready!

```bash
npm run dev
```

Happy coding! 🚀