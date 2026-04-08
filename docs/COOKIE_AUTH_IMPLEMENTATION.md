# Cookie-Based Authentication Implementation Guide

## Overview

This document describes the production-grade cookie-based authentication system implemented for GrowthCraft EdTech SaaS platform.

## Architecture

### Token Strategy

#### Access Token (JWT)

- **Type**: JSON Web Token (JWT)
- **Expiry**: 15 minutes
- **Storage**: `access_token` httpOnly cookie
- **Purpose**: Authenticate API requests
- **Contains**: userId, email, role

#### Refresh Token (Crypto Random)

- **Type**: Cryptographically secure random token (128 hex characters)
- **Expiry**: 30 days
- **Storage**:
  - Raw token in `refreshToken` httpOnly cookie
  - Hashed version (bcrypt) in MongoDB
- **Purpose**: Rotate access tokens without re-login

### Cookie Configuration

```typescript
// Production Settings
{
  httpOnly: true,        // Prevents JavaScript access (XSS protection)
  secure: true,          // HTTPS only in production
  sameSite: 'none',      // Cross-site requests (for separate frontend/backend)
  path: '/',             // Available to all routes
  maxAge: <duration>     // Cookie expiration
}

// Development Settings
{
  httpOnly: true,
  secure: false,         // Allow HTTP in development
  sameSite: 'lax',       // Relaxed for local development
  path: '/',
  maxAge: <duration>
}
```

## Authentication Flows

### 1. User Registration/Login Flow

```
┌─────────┐                 ┌─────────┐                 ┌──────────┐
│ Client  │                 │ Backend │                 │ Database │
└────┬────┘                 └────┬────┘                 └────┬─────┘
     │                           │                           │
     │ POST /api/v1/auth/login   │                           │
     │ { email, password }       │                           │
     ├──────────────────────────>│                           │
     │                           │                           │
     │                           │ Validate credentials      │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │ Generate JWT access token │
     │                           │ Generate crypto refresh   │
     │                           │                           │
     │                           │ Hash refresh token        │
     │                           ├──────────────────────────>│
     │                           │ Store hashed token        │
     │                           │                           │
     │ Set-Cookie: access_token  │                           │
     │ Set-Cookie: refreshToken  │                           │
     │<──────────────────────────┤                           │
     │ { user: {...} }           │                           │
     │                           │                           │
```

### 2. Protected Request Flow

```
┌─────────┐                 ┌─────────┐
│ Client  │                 │ Backend │
└────┬────┘                 └────┬────┘
     │                           │
     │ GET /api/v1/protected     │
     │ Cookie: access_token      │
     ├──────────────────────────>│
     │                           │
     │                           │ Read access_token cookie
     │                           │ Verify JWT signature
     │                           │ Check expiration
     │                           │ Extract user payload
     │                           │ Attach req.user
     │                           │ Check RBAC permissions
     │                           │
     │ { data: {...} }           │
     │<──────────────────────────┤
     │                           │
```

### 3. Token Refresh Flow

```
┌─────────┐                 ┌─────────┐                 ┌──────────┐
│ Client  │                 │ Backend │                 │ Database │
└────┬────┘                 └────┬────┘                 └────┬─────┘
     │                           │                           │
     │ GET /api/v1/protected     │                           │
     │ Cookie: access_token      │                           │
     ├──────────────────────────>│                           │
     │                           │                           │
     │                           │ Verify JWT (EXPIRED)      │
     │                           │                           │
     │ 401 TOKEN_EXPIRED         │                           │
     │<──────────────────────────┤                           │
     │                           │                           │
     │ POST /api/v1/auth/refresh │                           │
     │ Cookie: refreshToken      │                           │
     │ Cookie: access_token      │                           │
     ├──────────────────────────>│                           │
     │                           │                           │
     │                           │ Decode expired JWT        │
     │                           │ Extract userId            │
     │                           │                           │
     │                           │ Get user's hashed tokens  │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │ Compare refresh token     │
     │                           │ with hashed versions      │
     │                           │                           │
     │                           │ Remove old hashed token   │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │ Generate new JWT          │
     │                           │ Generate new crypto token │
     │                           │                           │
     │                           │ Hash new refresh token    │
     │                           ├──────────────────────────>│
     │                           │ Store new hashed token    │
     │                           │                           │
     │ Set-Cookie: access_token  │                           │
     │ Set-Cookie: refreshToken  │                           │
     │<──────────────────────────┤                           │
     │ { success: true }         │                           │
     │                           │                           │
     │ RETRY original request    │                           │
     │ Cookie: access_token      │                           │
     ├──────────────────────────>│                           │
     │                           │                           │
     │ { data: {...} }           │                           │
     │<──────────────────────────┤                           │
     │                           │                           │
```

### 4. Logout Flow

```
┌─────────┐                 ┌─────────┐                 ┌──────────┐
│ Client  │                 │ Backend │                 │ Database │
└────┬────┘                 └────┬────┘                 └────┬─────┘
     │                           │                           │
     │ POST /api/v1/auth/logout  │                           │
     │ Cookie: access_token      │                           │
     │ Cookie: refreshToken      │                           │
     ├──────────────────────────>│                           │
     │                           │                           │
     │                           │ Verify access_token       │
     │                           │ Extract userId            │
     │                           │                           │
     │                           │ Find matching hashed      │
     │                           │ refresh token             │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │ Remove hashed token       │
     │                           ├──────────────────────────>│
     │                           │                           │
     │ Clear-Cookie: access_token│                           │
     │ Clear-Cookie: refreshToken│                           │
     │<──────────────────────────┤                           │
     │ { success: true }         │                           │
     │                           │                           │
```

## API Endpoints

### POST /api/v1/auth/register

Register a new user account.

**Request Body:**

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123!",
  "role": "student"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "student",
      "isEmailVerified": false
    }
  }
}
```

**Cookies Set:**

- `access_token` (15 min)
- `refreshToken` (30 days)

### POST /api/v1/auth/login

Authenticate user and issue tokens.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "student"
    }
  }
}
```

**Cookies Set:**

- `access_token` (15 min)
- `refreshToken` (30 days)

### POST /api/v1/auth/refresh

Rotate tokens using refresh token.

**Request:** Cookies automatically sent by browser

**Response:**

```json
{
  "success": true,
  "message": "Token refreshed successfully"
}
```

**Cookies Set:**

- `access_token` (new, 15 min)
- `refreshToken` (new, 30 days)

### POST /api/v1/auth/logout

Logout from current device.

**Request:** Cookies automatically sent by browser

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Cookies Cleared:**

- `access_token`
- `refreshToken`

### POST /api/v1/auth/logout-all

Logout from all devices.

**Request:** Cookies automatically sent by browser

**Response:**

```json
{
  "success": true,
  "message": "Logged out from all devices successfully"
}
```

**Cookies Cleared:**

- `access_token`
- `refreshToken`

### GET /api/v1/auth/profile

Get current user profile (protected route).

**Request:** Cookies automatically sent by browser

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "student"
    }
  }
}
```

## Security Features

### 1. XSS Protection

- **httpOnly cookies**: JavaScript cannot access tokens
- **No localStorage**: Tokens never exposed to client-side code

### 2. CSRF Protection

- **SameSite attribute**: Prevents cross-site request forgery
- **Production**: `sameSite: 'none'` with `secure: true`
- **Development**: `sameSite: 'lax'`

### 3. Token Rotation

- Refresh tokens are rotated on every use
- Old refresh token is invalidated immediately
- Prevents token reuse attacks

### 4. Hashed Storage

- Refresh tokens hashed with bcrypt before database storage
- Even if database is compromised, tokens cannot be used

### 5. Multiple Device Support

- Users can have up to 5 active refresh tokens
- Each device gets its own refresh token
- Logout affects only current device
- Logout-all invalidates all devices

### 6. Token Expiration

- Short-lived access tokens (15 min) limit exposure window
- Long-lived refresh tokens (30 days) for good UX
- Automatic refresh flow is seamless

## Frontend Integration

### Axios Configuration

```typescript
// lib/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // CRITICAL: Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint
        await api.post('/auth/refresh');

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### API Usage Examples

```typescript
// Login
const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// Get protected data
const getProfile = async () => {
  const response = await api.get('/auth/profile');
  return response.data;
};

// Logout
const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};
```

### Important Frontend Rules

1. **NEVER manually store tokens** in localStorage or sessionStorage
2. **ALWAYS use `withCredentials: true`** in axios config
3. **DO NOT send Authorization header** - cookies are automatic
4. **Handle 401 errors** with automatic refresh retry
5. **Redirect to login** if refresh fails

## CORS Configuration

Backend CORS must allow credentials:

```typescript
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // e.g., 'http://localhost:3000'
    credentials: true, // CRITICAL: Allow cookies
  })
);
```

## Environment Variables

```env
# Backend (.env)
NODE_ENV=production
FRONTEND_URL=https://your-frontend.com

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

COOKIE_SECRET=your-cookie-secret-change-this-in-production
```

```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://your-api.com/api/v1
```

## Testing

### Test Login

```bash
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt
```

### Test Protected Route

```bash
curl -X GET http://localhost:5001/api/v1/auth/profile \
  -b cookies.txt
```

### Test Refresh

```bash
curl -X POST http://localhost:5001/api/v1/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

### Test Logout

```bash
curl -X POST http://localhost:5001/api/v1/auth/logout \
  -b cookies.txt
```

## Troubleshooting

### Cookies Not Being Set

1. Check CORS configuration includes `credentials: true`
2. Verify `withCredentials: true` in axios config
3. Ensure frontend and backend URLs match CORS origin
4. In production, verify HTTPS is enabled

### 401 Errors on Protected Routes

1. Check cookies are being sent (browser DevTools → Network → Cookies)
2. Verify access token hasn't expired (15 min lifetime)
3. Test refresh endpoint manually
4. Check authenticate middleware is applied to route

### Refresh Token Not Working

1. Verify refresh token exists in cookies
2. Check database for hashed refresh tokens
3. Ensure token hasn't expired (30 days)
4. Verify user account is active

### CORS Errors

1. Ensure `credentials: true` in CORS config
2. Cannot use `origin: '*'` with credentials
3. Must specify exact origin URL
4. Check preflight OPTIONS requests succeed

## Role-Based Access Control (RBAC)

The authentication system integrates with RBAC middleware:

```typescript
// Protect route with authentication + authorization
router.get(
  '/admin/users',
  authenticate, // Verify access token
  authorize(['admin']), // Check role
  userController.getAll
);
```

Supported roles:

- `student`
- `mentor`
- `college`
- `ambassador`
- `hiring_partner`
- `admin`

## Best Practices

1. **Always use HTTPS in production**
2. **Rotate JWT secrets regularly**
3. **Monitor failed login attempts**
4. **Implement rate limiting on auth endpoints**
5. **Log security events**
6. **Use strong password requirements**
7. **Implement email verification**
8. **Add 2FA for sensitive roles (admin)**
9. **Set up token expiration monitoring**
10. **Regular security audits**

## Migration from Bearer Token Auth

If migrating from Authorization header approach:

1. Update frontend to remove Authorization header logic
2. Add `withCredentials: true` to axios config
3. Update backend middleware to read from cookies
4. Test all protected routes
5. Update API documentation
6. Notify frontend team of changes

## Support

For issues or questions:

- Check this documentation first
- Review TROUBLESHOOTING.md
- Check application logs
- Test with curl commands above
