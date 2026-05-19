# Frontend Folder Structure - GrowthCraft

## Complete Structure

```
frontend/src/
├── app/                                # Next.js 14 App Router
│   ├── (auth)/                         # Auth route group
│   │   ├── login/
│   │   │   └── page.tsx                # Login page
│   │   ├── register/
│   │   │   └── page.tsx                # Register page
│   │   └── layout.tsx                  # Auth layout
│   ├── favicon.ico                     # Favicon
│   ├── globals.css                     # Global styles (Tailwind)
│   ├── layout.tsx                      # Root layout
│   └── page.tsx                        # Homepage
│
├── features/                           # Feature Modules
│   └── auth/                           # Auth Feature
│       ├── constants/
│       │   └── auth.constants.ts       # Auth constants (error messages, etc.)
│       ├── hooks/
│       │   ├── useAuth.ts              # Main auth hook (login, logout, user state)
│       │   ├── useLogin.ts             # Login logic
│       │   ├── useRegister.ts          # Registration logic
│       │   └── useOtp.ts               # OTP logic
│       ├── services/
│       │   └── auth.service.ts         # Auth API calls (login, register, etc.)
│       ├── types/
│       │   └── auth.types.ts           # Auth types (User, AuthResponse, etc.)
│       └── validators/
│           └── auth.validator.ts       # Client-side validation (Zod)
│
├── components/                         # UI Components
│   ├── ui/
│   │   └── button.tsx                  # Shadcn UI button
│   ├── auth/
│   │   ├── LoginForm.tsx               # Login form component
│   │   └── RegisterForm.tsx            # Register form component
│   ├── layout/
│   │   └── Header.tsx                  # Header component
│   └── common/
│       └── LoadingSpinner.tsx          # Loading spinner
│
├── lib/                                # Core Utilities
│   ├── api/                            # API Layer
│   │   ├── client.ts                   # Axios instance with interceptors
│   │   ├── endpoints.ts                # ALL API endpoints (auth, courses, etc.)
│   │   ├── interceptors.ts             # Request/response interceptors
│   │   └── types.ts                    # API response types
│   ├── constants/
│   │   ├── roles.constant.ts           # UserRole enum (Student, Mentor, etc.)
│   │   ├── routes.constant.ts          # Frontend route paths
│   │   └── api-status.constant.ts      # API status codes
│   ├── errors/
│   │   ├── ApiError.ts                 # API error class
│   │   ├── ValidationError.ts          # Validation error class
│   │   └── error-handler.ts            # Global error handler
│   └── utils.ts                        # Utility functions (cn, etc.)
│
├── hooks/                              # Global Hooks
│   ├── useDebounce.ts                  # Debounce hook
│   └── useLocalStorage.ts              # LocalStorage hook
│
├── types/                              # Global Types
│   ├── common.types.ts                 # Common types (Pagination, etc.)
│   ├── api.types.ts                    # API types
│   └── models.types.ts                 # Domain models (User, Course, etc.)
│
└── middleware.ts                       # Next.js middleware (route protection)
```

---

## Folder Explanations

### `/app/` - Next.js 14 App Router

**Purpose**: File-based routing, pages, and layouts

#### Route Groups

- **(auth)**: Auth pages (login, register) - parentheses don't affect URL
- **(public)**: Public pages (can be added later)
- **(protected)**: Protected pages (can be added later)

#### Files

- **page.tsx**: Defines a route (e.g., `app/login/page.tsx` → `/login`)
- **layout.tsx**: Shared layout for routes
- **globals.css**: Global styles (Tailwind CSS)

**Example**:

```
app/(auth)/login/page.tsx  →  /login
app/(auth)/register/page.tsx  →  /register
app/page.tsx  →  /
```

---

### `/features/auth/` - Auth Feature Module

**Purpose**: Self-contained auth feature with all related logic

#### `/constants/` - Auth Constants

- Error messages
- Success messages
- Auth-specific constants
- NO magic strings

#### `/hooks/` - Auth Hooks

- **useAuth.ts**: Main auth hook
  - Manages user state
  - Provides login/logout functions
  - Checks authentication status
- **useLogin.ts**: Login logic
  - Handles login form submission
  - Manages loading state
  - Handles errors
- **useRegister.ts**: Registration logic
  - Handles registration form
  - Manages loading state
  - Handles errors
- **useOtp.ts**: OTP logic
  - Send OTP
  - Verify OTP
  - Manages OTP state

#### `/services/` - API Services

- **auth.service.ts**: Makes API calls to backend
  - `login(credentials)` → POST /api/v1/auth/login
  - `register(data)` → POST /api/v1/auth/register
  - `logout()` → POST /api/v1/auth/logout
  - `refreshToken()` → POST /api/v1/auth/refresh

#### `/types/` - Auth Types

- **auth.types.ts**: TypeScript types
  - `User` type
  - `AuthResponse` type
  - `LoginData` type
  - `RegisterData` type

#### `/validators/` - Client Validation

- **auth.validator.ts**: Zod schemas
  - Login form validation
  - Register form validation
  - Client-side validation before API call

---

### `/components/` - UI Components

**Purpose**: Reusable React components

#### `/ui/` - Shadcn UI Components

- Pre-built, accessible components
- **button.tsx**: Button component (from Shadcn)
- More components can be added: input, card, dialog, etc.

#### `/auth/` - Auth Components

- **LoginForm.tsx**: Login form
  - Email/password inputs
  - Submit button
  - Uses `useLogin` hook
- **RegisterForm.tsx**: Registration form
  - Email/password/role inputs
  - Submit button
  - Uses `useRegister` hook

#### `/layout/` - Layout Components

- **Header.tsx**: Header with navigation
- **Footer.tsx**: Footer (can be added)
- **Sidebar.tsx**: Sidebar (can be added)

#### `/common/` - Common Components

- **LoadingSpinner.tsx**: Loading indicator
- **Pagination.tsx**: Pagination (can be added)
- **SearchBar.tsx**: Search bar (can be added)

---

### `/lib/` - Core Utilities

**Purpose**: Shared utilities used across the app

#### `/api/` - API Layer

**Purpose**: Centralized API communication

- **client.ts**: Axios instance
  - Base URL configuration
  - Request interceptors (add auth token)
  - Response interceptors (handle errors, refresh token)
- **endpoints.ts**: ALL API endpoints
  - Auth endpoints (login, register, etc.)
  - Course endpoints (list, detail, etc.)
  - Enrollment endpoints
  - Payment endpoints
  - Single source of truth for all API routes
- **interceptors.ts**: Request/response interceptors
  - Add auth token to requests
  - Handle 401 errors (refresh token)
  - Handle errors globally
- **types.ts**: API response types
  - `ApiResponse<T>` type
  - Error response types

#### `/constants/` - App Constants

- **roles.constant.ts**: UserRole enum

  ```typescript
  enum UserRole {
    STUDENT = "Student",
    MENTOR = "Mentor",
    COLLEGE = "College",
    AMBASSADOR = "Ambassador",
    HIRING_PARTNER = "HiringPartner",
    ADMIN = "Admin",
  }
  ```

- **routes.constant.ts**: Frontend route paths

  ```typescript
  const ROUTES = {
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",
    STUDENT_DASHBOARD: "/student/dashboard",
    // etc.
  };
  ```

- **api-status.constant.ts**: API status codes
  ```typescript
  const API_STATUS = {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    // etc.
  };
  ```

#### `/errors/` - Error Handling

- **ApiError.ts**: API error class

  ```typescript
  class ApiError extends Error {
    statusCode: number;
    code: string;
  }
  ```

- **ValidationError.ts**: Validation error class

  ```typescript
  class ValidationError extends Error {
    errors: ValidationErrorDetail[];
  }
  ```

- **error-handler.ts**: Global error handler
  - Catch all errors
  - Format error messages
  - Log errors (Sentry in production)

#### `utils.ts` - Utility Functions

- **cn()**: Class name merger (from Shadcn)
  ```typescript
  cn("text-red-500", "font-bold"); // → 'text-red-500 font-bold'
  ```
- Other utilities can be added here

---

### `/hooks/` - Global Hooks

**Purpose**: Reusable React hooks used across features

- **useDebounce.ts**: Debounce hook

  ```typescript
  const debouncedValue = useDebounce(searchTerm, 500);
  ```

- **useLocalStorage.ts**: LocalStorage hook

  ```typescript
  const [value, setValue] = useLocalStorage("key", initialValue);
  ```

- **usePagination.ts**: Pagination hook (can be added)
- **useMediaQuery.ts**: Responsive hook (can be added)

---

### `/types/` - Global Types

**Purpose**: Shared TypeScript types used across the app

- **common.types.ts**: Common types

  ```typescript
  type Pagination = {
    page: number;
    limit: number;
    total: number;
  };
  ```

- **api.types.ts**: API types

  ```typescript
  type ApiResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
  };
  ```

- **models.types.ts**: Domain models
  ```typescript
  type User = {
    id: string;
    email: string;
    role: UserRole;
    // etc.
  };
  ```

---

### `middleware.ts` - Next.js Middleware

**Purpose**: Route protection and authentication

- Runs BEFORE every page loads
- Checks if user is authenticated
- Redirects unauthenticated users to login
- Redirects authenticated users away from login page
- Role-based access control (RBAC)

**Example**:

```typescript
export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;

  // Protect /student routes
  if (request.nextUrl.pathname.startsWith("/student") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}
```

---

## Data Flow

### Example: User Login

```
1. User visits /login
   ↓
2. LoginForm.tsx renders
   ↓
3. User submits form
   ↓
4. useLogin() hook called
   ↓
5. auth.service.ts makes API call
   ↓
6. lib/api/client.ts sends request
   ↓
7. Backend validates and returns JWT
   ↓
8. Token stored in httpOnly cookie
   ↓
9. User redirected to /student/dashboard
   ↓
10. middleware.ts checks token
   ↓
11. User sees dashboard
```

---

## Import Examples

### Clean Imports with Path Aliases

```typescript
// In any component/page
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useLogin } from "@/features/auth/hooks/useLogin";
import { User } from "@/features/auth/types/auth.types";
import { authService } from "@/features/auth/services/auth.service";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { UserRole } from "@/lib/constants/roles.constant";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/auth/LoginForm";
```

**Note**: `@/` is an alias for `src/` (configured in `tsconfig.json`)

---

## Key Principles

### 1. Feature-Based Organization

- Each feature is self-contained
- Easy to add new features
- Clear boundaries

### 2. Separation of Concerns

- **Pages** (`/app`): Routing and page structure
- **Components** (`/components`): UI rendering
- **Hooks** (`/features/*/hooks`): Business logic
- **Services** (`/features/*/services`): API calls
- **Types** (`/features/*/types`): Type definitions

### 3. DRY (Don't Repeat Yourself)

- Shared API client in `/lib/api`
- Shared constants in `/lib/constants`
- Shared hooks in `/hooks`
- Shared types in `/types`

### 4. Type Safety

- Strict TypeScript everywhere
- Types for all API responses
- Types for all props
- NO `any` types

### 5. Next.js Best Practices

- App Router (file-based routing)
- Server Components by default
- Client Components when needed (`'use client'`)
- Middleware for route protection

---

## Adding New Features

To add a new feature (e.g., courses):

```
frontend/src/features/courses/
├── constants/
│   └── course.constants.ts
├── hooks/
│   ├── useCourses.ts
│   └── useCourseDetail.ts
├── services/
│   └── course.service.ts
├── types/
│   └── course.types.ts
└── validators/
    └── course.validator.ts
```

Then add course endpoints to `lib/api/endpoints.ts`:

```typescript
COURSES: {
  LIST: '/api/v1/courses',
  DETAIL: (id: string) => `/api/v1/courses/${id}`,
}
```

Same structure, self-contained, easy to maintain!

---

## File Count: 32 Files

- **App**: 7 files (pages, layouts)
- **Auth Feature**: 8 files
- **Components**: 5 files
- **API Layer**: 4 files
- **Constants**: 3 files
- **Errors**: 3 files
- **Hooks**: 2 files
- **Types**: 3 files
- **Middleware**: 1 file
- **Utils**: 1 file (Shadcn default)

Production-ready, scalable, maintainable! 🚀
