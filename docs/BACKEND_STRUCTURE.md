# Backend Folder Structure - GrowthCraft

## Complete Structure

```
backend/src/
├── modules/
│   └── auth/                           # Auth Feature Module
│       ├── routes/
│       │   └── auth.routes.ts          # Route definitions (POST /login, /register, etc.)
│       ├── controllers/
│       │   └── auth.controller.ts      # HTTP request/response handlers
│       ├── services/
│       │   ├── auth.service.ts         # Business logic (register, login, logout)
│       │   ├── token.service.ts        # JWT generation/validation
│       │   └── password.service.ts     # Password hashing/comparison
│       ├── repositories/
│       │   └── auth.repository.ts      # Database operations (CRUD)
│       ├── dto/
│       │   ├── register.dto.ts         # Registration request DTO
│       │   ├── login.dto.ts            # Login request DTO
│       │   ├── refresh-token.dto.ts    # Refresh token DTO
│       │   ├── verify-email.dto.ts     # Email verification DTO
│       │   ├── forgot-password.dto.ts  # Forgot password DTO
│       │   └── reset-password.dto.ts   # Reset password DTO
│       ├── validators/
│       │   └── auth.validator.ts       # Zod validation schemas
│       ├── interfaces/
│       │   ├── auth.interface.ts       # Auth service contracts
│       │   └── token.interface.ts      # Token payload types
│       └── constants/
│           └── auth.constants.ts       # Auth-specific constants
│
├── common/                             # Shared Utilities
│   ├── middleware/
│   │   ├── authenticate.middleware.ts  # JWT validation
│   │   ├── authorize.middleware.ts     # RBAC check
│   │   ├── validate.middleware.ts      # DTO validation
│   │   ├── error-handler.middleware.ts # Global error handler
│   │   ├── rate-limiter.middleware.ts  # Rate limiting
│   │   └── sanitize.middleware.ts      # Input sanitization
│   ├── errors/
│   │   ├── AppError.ts                 # Base error class
│   │   ├── ValidationError.ts          # Validation errors
│   │   ├── AuthenticationError.ts      # Auth errors (401)
│   │   ├── AuthorizationError.ts       # Permission errors (403)
│   │   ├── NotFoundError.ts            # 404 errors
│   │   ├── ConflictError.ts            # Conflict errors (409)
│   │   └── error-codes.ts              # Error code enums
│   ├── responses/
│   │   ├── success.response.ts         # Success response helper
│   │   ├── error.response.ts           # Error response helper
│   │   └── pagination.response.ts      # Pagination wrapper
│   ├── types/
│   │   ├── express.d.ts                # Express type extensions
│   │   ├── common.types.ts             # Shared types
│   │   └── api.types.ts                # API response types
│   ├── constants/
│   │   ├── roles.constant.ts           # Role enums
│   │   ├── permissions.constant.ts     # Permission enums
│   │   ├── status.constant.ts          # Status enums
│   │   └── http-status.constant.ts     # HTTP status codes
│   ├── utils/
│   │   ├── logger.util.ts              # Winston logger
│   │   ├── env.util.ts                 # Environment validation
│   │   └── async-handler.util.ts       # Async error wrapper
│   └── validators/
│       └── common.validator.ts         # Shared validation schemas
│
├── database/
│   ├── models/
│   │   └── User.model.ts               # Mongoose User schema
│   └── connection.ts                   # MongoDB connection
│
├── config/
│   ├── database.config.ts              # MongoDB config
│   ├── jwt.config.ts                   # JWT config
│   ├── redis.config.ts                 # Redis config
│   └── index.ts                        # Config aggregator
│
├── app.ts                              # Express app setup
└── server.ts                           # Server entry point
```

---

## Folder Explanations

### `/modules/auth/` - Auth Feature Module

**Purpose**: Self-contained auth feature with all related logic

#### `/routes/` - Route Definitions
- Define API endpoints (POST /login, /register, etc.)
- Apply middleware (validate, authenticate, authorize)
- NO business logic

#### `/controllers/` - HTTP Handlers
- Handle HTTP request/response
- Extract data from req.body, req.params, req.query
- Call service methods
- Return formatted responses
- NO business logic, NO database calls

#### `/services/` - Business Logic
- **auth.service.ts**: Main auth logic (register, login, logout)
- **token.service.ts**: JWT operations (generate, verify, decode)
- **password.service.ts**: Password operations (hash, compare)
- Contains ALL business logic
- Calls repositories for data
- NO HTTP logic (req, res)

#### `/repositories/` - Database Operations
- All Mongoose/database operations
- CRUD operations (create, read, update, delete)
- NO business logic

#### `/dto/` - Data Transfer Objects
- TypeScript types for request/response
- Used for validation
- Strict typing

#### `/validators/` - Validation Schemas
- Zod schemas for runtime validation
- Validate request bodies
- Detailed error messages

#### `/interfaces/` - Service Contracts
- TypeScript interfaces for services
- Define method signatures
- Used for dependency injection

#### `/constants/` - Feature Constants
- Auth-specific constants
- Token expiry times
- Salt rounds
- NO magic strings/numbers

---

### `/common/` - Shared Utilities

**Purpose**: Reusable code used across all modules

#### `/middleware/` - Express Middleware
- **authenticate.middleware.ts**: Verify JWT token
- **authorize.middleware.ts**: Check user roles/permissions (RBAC)
- **validate.middleware.ts**: Validate request body with Zod
- **error-handler.middleware.ts**: Global error handling
- **rate-limiter.middleware.ts**: Rate limiting per route
- **sanitize.middleware.ts**: Input sanitization

#### `/errors/` - Error System
- **AppError.ts**: Base error class (all errors extend this)
- **ValidationError.ts**: 400 - Invalid input
- **AuthenticationError.ts**: 401 - Invalid credentials
- **AuthorizationError.ts**: 403 - Insufficient permissions
- **NotFoundError.ts**: 404 - Resource not found
- **ConflictError.ts**: 409 - Duplicate resource
- **error-codes.ts**: Error code enums

#### `/responses/` - Response Helpers
- **success.response.ts**: Standardized success response
- **error.response.ts**: Standardized error response
- **pagination.response.ts**: Pagination wrapper

#### `/types/` - Shared Types
- **express.d.ts**: Extend Express types (add user to Request)
- **common.types.ts**: Common types (Pagination, etc.)
- **api.types.ts**: API response types

#### `/constants/` - App Constants
- **roles.constant.ts**: UserRole enum (Student, Mentor, Admin, etc.)
- **permissions.constant.ts**: Permission enum
- **status.constant.ts**: Status enums
- **http-status.constant.ts**: HTTP status codes

#### `/utils/` - Utility Functions
- **logger.util.ts**: Winston logger setup
- **env.util.ts**: Environment variable validation
- **async-handler.util.ts**: Async error wrapper

#### `/validators/` - Common Validators
- Shared Zod schemas
- Reusable validation logic

---

### `/database/` - Database Layer

#### `/models/` - Mongoose Schemas
- **User.model.ts**: User schema with role, profile, etc.
- Define schema structure
- Add indexes
- Add methods

#### `connection.ts` - Database Connection
- MongoDB connection setup
- Connection error handling

---

### `/config/` - Configuration

- **database.config.ts**: MongoDB connection string, options
- **jwt.config.ts**: JWT secret, expiry times
- **redis.config.ts**: Redis connection
- **index.ts**: Export all configs

---

### Root Files

- **app.ts**: Express app setup (middleware, routes, error handling)
- **server.ts**: Server entry point (start server, connect DB)

---

## Layered Architecture

```
Request Flow:

Client Request
    ↓
Routes (define endpoint)
    ↓
Middleware (validate, authenticate, authorize)
    ↓
Controller (handle HTTP)
    ↓
Service (business logic)
    ↓
Repository (database operations)
    ↓
Database (MongoDB)
    ↓
Response back up the chain
```

---

## Key Principles

### 1. Separation of Concerns
- Routes: Define endpoints
- Controllers: Handle HTTP
- Services: Business logic
- Repositories: Database operations

### 2. DRY (Don't Repeat Yourself)
- Shared middleware in `/common/middleware`
- Shared errors in `/common/errors`
- Shared constants in `/common/constants`
- Shared utilities in `/common/utils`

### 3. SOLID Principles
- **Single Responsibility**: Each file has one job
- **Open/Closed**: Easy to add new features without modifying existing code
- **Liskov Substitution**: Services are interchangeable via interfaces
- **Interface Segregation**: Small, focused interfaces
- **Dependency Inversion**: Depend on abstractions (interfaces), not implementations

### 4. Type Safety
- Strict TypeScript everywhere
- DTOs for all requests
- Interfaces for service contracts
- NO `any` types

---

## Example: User Registration Flow

```
1. POST /api/v1/auth/register
   ↓
2. auth.routes.ts → Apply validate(registerSchema) middleware
   ↓
3. validate.middleware.ts → Validate request body with Zod
   ↓
4. auth.controller.ts → Extract req.body
   ↓
5. auth.service.ts → Check if email exists
   ↓
6. password.service.ts → Hash password
   ↓
7. auth.repository.ts → Create user in database
   ↓
8. token.service.ts → Generate JWT tokens
   ↓
9. auth.service.ts → Return user + tokens
   ↓
10. auth.controller.ts → Format response
   ↓
11. success.response.ts → Standardized response
   ↓
12. Client receives: { success: true, data: { user, tokens } }
```

---

## Adding New Features

To add a new feature (e.g., courses):

```
backend/src/modules/courses/
├── routes/
│   └── course.routes.ts
├── controllers/
│   └── course.controller.ts
├── services/
│   └── course.service.ts
├── repositories/
│   └── course.repository.ts
├── dto/
│   ├── create-course.dto.ts
│   └── update-course.dto.ts
├── validators/
│   └── course.validator.ts
├── interfaces/
│   └── course.interface.ts
└── constants/
    └── course.constants.ts
```

Same structure, self-contained, easy to maintain!

---

## File Count: 45 Files

- **Auth Module**: 18 files
- **Common**: 20 files
- **Database**: 2 files
- **Config**: 4 files
- **Root**: 2 files (app.ts, server.ts)

Production-ready, scalable, maintainable! 🚀
