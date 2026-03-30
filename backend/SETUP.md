# Backend Setup Guide

## Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
# Minimum required:
# - MONGODB_URI
# - JWT_SECRET
# - JWT_REFRESH_SECRET
```

### Step 3: Initialize Git Hooks
```bash
npm run prepare
```

### Step 4: Start Development Server
```bash
npm run dev
```

Server will start at `http://localhost:5000`

---

## Detailed Setup

### 1. MongoDB Setup

#### Option A: Local MongoDB
```bash
# Install MongoDB (macOS)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify connection
mongosh
```

#### Option B: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Add to `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/growthcraft
```

### 2. Environment Variables

Create `.env` file with these variables:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/growthcraft

# JWT (Generate secure keys)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_SALT_ROUNDS=12
COOKIE_SECRET=your-cookie-secret-min-32-chars

# Frontend
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

#### Generate Secure Keys
```bash
# Generate JWT secrets (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Verify Installation

```bash
# Check TypeScript compilation
npm run type-check

# Run linter
npm run lint

# Run tests
npm test

# Start dev server
npm run dev
```

### 4. Test API

```bash
# Health check
curl http://localhost:5000/health

# Or use browser
open http://localhost:5000/health
```

---

## Husky Setup Details

### What Husky Does

Husky adds Git hooks to ensure code quality:

1. **Pre-commit**: Runs before each commit
   - Lints and formats staged files
   - Type checks TypeScript
   - Prevents bad code from being committed

2. **Commit-msg**: Validates commit message format
   - Enforces conventional commits
   - Example: `feat(auth): add login endpoint`

3. **Pre-push**: Runs before pushing to remote
   - Runs all tests
   - Builds the project
   - Ensures everything works

### Commit Message Format

```
type(scope): subject

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Code style (formatting)
- refactor: Code refactoring
- perf: Performance improvement
- test: Tests
- build: Build system
- ci: CI/CD
- chore: Maintenance

Examples:
✅ feat(auth): add login endpoint
✅ fix(database): resolve connection timeout
✅ docs(readme): update installation steps
❌ added login feature (wrong format)
```

### Skip Hooks (Emergency Only)

```bash
# Skip pre-commit
git commit --no-verify -m "message"

# Skip pre-push
git push --no-verify
```

⚠️ **Warning**: Only skip hooks in emergencies!

---

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution**: Start MongoDB
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### Husky Hooks Not Running

**Solution**: Reinstall hooks
```bash
rm -rf .husky
npm run prepare
```

### TypeScript Errors

**Solution**: Clean and rebuild
```bash
rm -rf dist node_modules
npm install
npm run build
```

### Port Already in Use

**Solution**: Change port in `.env`
```env
PORT=5001
```

Or kill process using port 5000:
```bash
# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### ESLint/Prettier Conflicts

**Solution**: Format all files
```bash
npm run format
npm run lint:fix
```

---

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feat/your-feature
```

### 2. Make Changes
- Write code
- Add tests
- Update documentation

### 3. Commit Changes
```bash
git add .
git commit -m "feat(module): description"
```

Husky will:
- ✅ Lint and format your code
- ✅ Check TypeScript types
- ✅ Validate commit message

### 4. Push Changes
```bash
git push origin feat/your-feature
```

Husky will:
- ✅ Run all tests
- ✅ Build the project

### 5. Create Pull Request
- All checks should pass
- Code is clean and tested
- Ready for review!

---

## Next Steps

1. ✅ Complete backend setup
2. 📝 Read [Backend Structure](../docs/BACKEND_STRUCTURE.md)
3. 🔐 Implement auth module
4. 🧪 Write tests
5. 📚 Add API documentation
6. 🚀 Deploy to production

---

## Need Help?

- Check [README.md](./README.md) for commands
- Read [Backend Structure](../docs/BACKEND_STRUCTURE.md) for architecture
- Review existing code examples
- Ask the team!

Happy coding! 🚀