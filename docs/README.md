# GrowthCraft Documentation

## 📚 Documentation Files

This folder contains the complete documentation for the GrowthCraft EdTech SaaS platform.

### Available Documentation

1. **[BACKEND_STRUCTURE.md](./BACKEND_STRUCTURE.md)** - Complete backend folder structure
   - Auth module structure
   - Common utilities (middleware, errors, responses)
   - Database layer
   - Configuration
   - Layered architecture explanation
   - 45 files total

2. **[FRONTEND_STRUCTURE.md](./FRONTEND_STRUCTURE.md)** - Complete frontend folder structure
   - Next.js 14 App Router
   - Auth feature module
   - Components (UI, auth, layout, common)
   - API layer (client, endpoints, interceptors)
   - Constants, errors, hooks, types
   - Middleware for route protection
   - 32 files total

---

## 🚀 Quick Start

### For Backend Developers
Read [BACKEND_STRUCTURE.md](./BACKEND_STRUCTURE.md) to understand:
- How the auth module is organized
- Layered architecture (Routes → Controllers → Services → Repositories)
- Where to add new features
- How data flows through the system

### For Frontend Developers
Read [FRONTEND_STRUCTURE.md](./FRONTEND_STRUCTURE.md) to understand:
- How Next.js 14 App Router works
- How the auth feature is organized
- Where components, hooks, and services go
- How to make API calls
- How middleware protects routes

---

## 🏗️ Architecture Overview

### Backend (Node.js + Express + TypeScript + MongoDB)
```
Routes → Middleware → Controllers → Services → Repositories → Database
```

### Frontend (Next.js 14 + TypeScript + Tailwind + Shadcn)
```
Pages → Components → Hooks → Services → API Client → Backend
```

---

## 📁 Project Structure

```
growthcraft/
├── backend/          # Backend API
│   └── src/
│       ├── modules/  # Feature modules (auth, courses, etc.)
│       ├── common/   # Shared utilities
│       ├── database/ # Database layer
│       └── config/   # Configuration
│
├── frontend/         # Frontend app
│   └── src/
│       ├── app/      # Next.js pages
│       ├── features/ # Feature modules (auth, courses, etc.)
│       ├── components/ # UI components
│       ├── lib/      # Core utilities (API, constants, errors)
│       ├── hooks/    # Global hooks
│       └── types/    # Global types
│
└── docs/             # Documentation (this folder)
    ├── README.md     # This file
    ├── BACKEND_STRUCTURE.md
    └── FRONTEND_STRUCTURE.md
```

---

## 🎯 Key Principles

### 1. Feature-Based Organization
- Each feature (auth, courses, etc.) is self-contained
- Easy to add new features
- Clear module boundaries

### 2. Layered Architecture
- Clear separation of concerns
- Each layer has a single responsibility
- Easy to test and maintain

### 3. DRY (Don't Repeat Yourself)
- Shared utilities in `/common` (backend) and `/lib` (frontend)
- No code duplication
- Centralized constants, errors, and types

### 4. Type Safety
- Strict TypeScript everywhere
- No `any` types
- Shared types between frontend and backend (future)

### 5. Scalability
- Easy to extract features into microservices
- Horizontal scaling ready
- Production-ready architecture

---

## 📝 Documentation Standards

Each documentation file includes:
- Complete folder structure
- Explanation of each folder's purpose
- File-by-file breakdown
- Data flow examples
- Import examples
- Key principles
- How to add new features

---

## 🔄 Keeping Documentation Updated

When adding new features or files:
1. Update the relevant structure document (BACKEND_STRUCTURE.md or FRONTEND_STRUCTURE.md)
2. Add explanations for new folders/files
3. Update file counts
4. Add examples if needed

---

## 💡 Tips

### Finding Files
- Backend: Feature files in `/modules/[feature]`, shared files in `/common`
- Frontend: Feature files in `/features/[feature]`, shared files in `/lib`

### Adding New Features
- Follow the same structure as existing features (auth)
- Keep features self-contained
- Use shared utilities from `/common` (backend) or `/lib` (frontend)

### Import Paths
- Backend: Use relative imports or path aliases
- Frontend: Use `@/` alias (e.g., `@/features/auth/hooks/useAuth`)

---

**Last Updated**: March 30, 2026
**Version**: 1.0
