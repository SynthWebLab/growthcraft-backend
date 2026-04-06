# GrowthCraft Backend

Backend API for GrowthCraft EdTech SaaS Platform

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Security**: Helmet, CORS, bcryptjs
- **Logging**: Winston
- **Testing**: Jest
- **Code Quality**: ESLint, Prettier, Husky

## 📋 Prerequisites

- Node.js >= 18.x
- MongoDB >= 6.x
- npm or yarn

## 🛠️ Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit `.env` and configure your environment variables.

3. **Initialize Husky** (Git hooks):
```bash
npm run prepare
```

## 🔧 Configuration

### Environment Variables

Required variables in `.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/growthcraft
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
```

See `.env.example` for all available options.

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Type Checking
```bash
npm run type-check
```

## 🧪 Testing

### Run all tests
```bash
npm test
```

### Watch mode
```bash
npm run test:watch
```

### Coverage report
```bash
npm test -- --coverage
```

## 🎨 Code Quality

### Linting
```bash
# Check for errors
npm run lint

# Fix errors automatically
npm run lint:fix
```

### Formatting
```bash
# Check formatting
npm run format:check

# Format code
npm run format
```

## 🪝 Git Hooks (Husky)

Husky is configured with the following hooks:

### Pre-commit
- Runs lint-staged (ESLint + Prettier on staged files)
- Type checks TypeScript
- Ensures code quality before commit

### Commit Message
- Validates commit message format
- Enforces conventional commits

**Format**: `type(scope): subject`

**Types**: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

**Examples**:
```bash
git commit -m "feat(auth): add login endpoint"
git commit -m "fix(database): resolve connection timeout"
git commit -m "docs(readme): update installation steps"
```

### Pre-push
- Runs all tests
- Builds the project
- Ensures everything works before pushing

## 📁 Project Structure

```
backend/
├── src/
│   ├── modules/          # Feature modules (auth, courses, etc.)
│   ├── common/           # Shared utilities
│   │   ├── middleware/   # Express middleware
│   │   ├── errors/       # Error classes
│   │   ├── responses/    # Response helpers
│   │   ├── constants/    # App constants
│   │   └── utils/        # Utility functions
│   ├── database/         # Database layer
│   │   ├── models/       # Mongoose models
│   │   └── connection.ts # DB connection
│   ├── config/           # Configuration
│   ├── app.ts            # Express app setup
│   └── server.ts         # Server entry point
├── .husky/               # Git hooks
├── logs/                 # Application logs
├── dist/                 # Build output
└── tests/                # Test files
```

## 🔐 Security Features

- JWT authentication with access & refresh tokens
- **Automatic token rotation** with reuse detection
- **Auto-refresh middleware** for seamless authentication
- Password hashing with bcryptjs
- httpOnly secure cookies
- Device tracking for security monitoring
- Helmet for security headers
- CORS configuration
- Rate limiting
- Input sanitization
- Environment variable validation

### Token Rotation

The backend implements secure token rotation:
- Automatic rotation on every refresh
- Token reuse detection prevents attacks
- Device tracking for each session
- Support for multiple devices (up to 5)
- Auto-refresh when tokens are about to expire

📖 See [TOKEN_ROTATION_QUICKSTART.md](./TOKEN_ROTATION_QUICKSTART.md) for implementation details

## 📝 API Documentation

API documentation will be available at:
- Development: `http://localhost:5000/api-docs`
- Production: TBD

## 🐛 Debugging

### View Logs
```bash
# Application logs
tail -f logs/app.log

# Error logs
tail -f logs/error.log
```

### Debug Mode
Set `LOG_LEVEL=debug` in `.env` for detailed logs.

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
NODE_ENV=production npm start
```

## 📊 Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run lint` | Check code for errors |
| `npm run lint:fix` | Fix linting errors |
| `npm run format` | Format code with Prettier |
| `npm run type-check` | Check TypeScript types |
| `npm run prepare` | Install Husky hooks |

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Ensure all tests pass
4. Commit with conventional commit format
5. Push and create a pull request

## 📄 License

MIT

## 👥 Team

GrowthCraft Development Team