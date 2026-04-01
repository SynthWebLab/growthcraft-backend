# Frontend Integration Guide - Cookie-Based Auth

## Next.js 14 App Router + TypeScript + Redux Toolkit

This guide shows how to integrate the cookie-based authentication system with your Next.js frontend.

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── student/
│   │   │   ├── mentor/
│   │   │   ├── admin/
│   │   │   └── layout.tsx
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── axios.ts              # Axios instance with interceptors
│   │   └── api/
│   │       └── auth.ts           # Auth API functions
│   ├── store/
│   │   ├── store.ts              # Redux store
│   │   └── slices/
│   │       └── authSlice.ts      # Auth state management
│   ├── hooks/
│   │   └── useAuth.ts            # Auth hook
│   ├── components/
│   │   └── ProtectedRoute.tsx    # Route protection
│   └── types/
│       └── auth.types.ts         # TypeScript types
```

## 1. Axios Configuration

### lib/axios.ts

```typescript
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1',
  withCredentials: true, // CRITICAL: Send cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Track if we're currently refreshing
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

// Response interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is not 401 or request already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => api(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Call refresh endpoint
      await api.post('/auth/refresh');

      // Process queued requests
      processQueue();

      // Retry original request
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed, clear queue and redirect to login
      processQueue(refreshError as Error);

      // Clear any auth state
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
```

## 2. TypeScript Types

### types/auth.types.ts

```typescript
export enum UserRole {
  STUDENT = 'student',
  MENTOR = 'mentor',
  COLLEGE = 'college',
  AMBASSADOR = 'ambassador',
  HIRING_PARTNER = 'hiring_partner',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}
```

## 3. Auth API Functions

### lib/api/auth.ts

```typescript
import api from '../axios';
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
} from '@/types/auth.types';

export const authApi = {
  // Register new user
  register: async (data: RegisterData): Promise<User> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data.data.user;
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<User> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data.data.user;
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await api.get<AuthResponse>('/auth/profile');
    return response.data.data.user;
  },

  // Refresh tokens (called automatically by interceptor)
  refresh: async (): Promise<void> => {
    await api.post('/auth/refresh');
  },

  // Logout from current device
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  // Logout from all devices
  logoutAll: async (): Promise<void> => {
    await api.post('/auth/logout-all');
  },
};
```

## 4. Redux Store Setup

### store/store.ts

```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### store/slices/authSlice.ts

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '@/lib/api/auth';
import {
  User,
  LoginCredentials,
  RegisterData,
} from '@/types/auth.types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterData, { rejectWithValue }) => {
    try {
      const user = await authApi.register(data);
      return user;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Registration failed'
      );
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const user = await authApi.login(credentials);
      return user;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Login failed'
      );
    }
  }
);

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authApi.getProfile();
      return user;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch profile'
      );
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Logout failed'
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get Profile
    builder
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(getProfile.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearError, clearAuth } = authSlice.actions;
export default authSlice.reducer;
```

## 5. Custom Auth Hook

### hooks/useAuth.ts

```typescript
'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState, AppDispatch } from '@/store/store';
import { getProfile, logout as logoutAction } from '@/store/slices/authSlice';
import { UserRole } from '@/types/auth.types';

export const useAuth = (requiredRole?: UserRole) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    // Fetch user profile on mount if not authenticated
    if (!isAuthenticated && !isLoading) {
      dispatch(getProfile());
    }
  }, [dispatch, isAuthenticated, isLoading]);

  useEffect(() => {
    // Check role-based access
    if (!isLoading && isAuthenticated && requiredRole) {
      if (user?.role !== requiredRole) {
        router.push('/unauthorized');
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router]);

  const logout = async () => {
    await dispatch(logoutAction());
    router.push('/login');
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
  };
};
```

## 6. Protected Route Component

### components/ProtectedRoute.tsx

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/auth.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (requiredRole && user?.role !== requiredRole) {
        router.push('/unauthorized');
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
```

## 7. Login Page

### app/(auth)/login/page.tsx

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '@/store/slices/authSlice';
import { AppDispatch, RootState } from '@/store/store';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await dispatch(login(formData)).unwrap();
      router.push('/dashboard');
    } catch (err) {
      // Error is handled by Redux
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Sign In</h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

## 8. Dashboard Layout with Protection

### app/(dashboard)/layout.tsx

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold">GrowthCraft</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {user?.fullName} ({user?.role})
                </span>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
```

## 9. Role-Specific Dashboard

### app/(dashboard)/admin/page.tsx

```typescript
'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { UserRole } from '@/types/auth.types';

export default function AdminDashboard() {
  return (
    <ProtectedRoute requiredRole={UserRole.ADMIN}>
      <div>
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <p>Only admins can see this page.</p>
      </div>
    </ProtectedRoute>
  );
}
```

## 10. Environment Variables

### .env.local

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
```

### .env.production

```env
NEXT_PUBLIC_API_URL=https://api.growthcraft.com/api/v1
```

## Key Points

1. **NO manual token storage** - Cookies are automatic
2. **withCredentials: true** - Required for cookies
3. **Automatic refresh** - Interceptor handles 401 errors
4. **Queue management** - Prevents multiple refresh calls
5. **Type safety** - Full TypeScript support
6. **Redux integration** - Centralized state management
7. **Role-based access** - Protected routes by role
8. **Loading states** - Proper UX during auth checks

## Testing

```typescript
// Test login
const testLogin = async () => {
  try {
    const user = await authApi.login({
      email: 'test@example.com',
      password: 'password123',
    });
    console.log('Logged in:', user);
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Test protected request
const testProtected = async () => {
  try {
    const user = await authApi.getProfile();
    console.log('Profile:', user);
  } catch (error) {
    console.error('Failed:', error);
  }
};
```

This implementation provides a complete, production-ready authentication system with automatic token refresh, role-based access control, and seamless user experience.
