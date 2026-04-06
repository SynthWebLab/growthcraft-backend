# Token Rotation - Quick Start Guide

## What's New?

Your backend now has **automatic token rotation** with security features:

✅ Tokens automatically rotate on refresh  
✅ Old tokens are immediately invalidated  
✅ Token reuse detection prevents attacks  
✅ Auto-refresh keeps users logged in seamlessly  
✅ Device tracking for security monitoring  

## Key Changes

### 1. Enhanced Refresh Token Structure

**Before:**
```typescript
refreshTokens: string[]  // Simple array of hashed tokens
```

**After:**
```typescript
refreshTokens: IRefreshToken[]  // Array with metadata

interface IRefreshToken {
  token: string;        // Hashed token
  createdAt: Date;      // When created
  lastUsedAt?: Date;    // Last used
  expiresAt: Date;      // Expiration
  deviceInfo?: string;  // User agent
}
```

### 2. Token Rotation on Every Refresh

When `/auth/refresh` is called:
1. Validates old refresh token
2. Checks for reuse (security)
3. Removes old token
4. Generates new token pair
5. Stores new token with metadata

### 3. Auto-Refresh Middleware (Optional)

Add to your routes for seamless token refresh:

```typescript
import { autoRefreshToken } from '@/common/middleware/auto-refresh.middleware';

// Apply before protected routes
app.use(autoRefreshToken);
```

## Environment Variables

Add to your `.env`:

```env
# Token Rotation Configuration
TOKEN_ROTATION_ENABLED=true
TOKEN_REUSE_DETECTION=true
AUTO_REFRESH_THRESHOLD=5m
MAX_REFRESH_TOKENS_PER_USER=5
```

## API Usage

### Refresh Endpoint

```bash
POST /api/v1/auth/refresh
```

**Cookies Required:**
- `access_token` (can be expired)
- `refreshToken`

**Success Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully"
}
```

**New cookies automatically set:**
- `access_token` (new, 15 min)
- `refreshToken` (new, 30 days)

### Security Response (Token Reuse)

```json
{
  "success": false,
  "error": {
    "message": "Security violation detected. Please login again.",
    "code": "TOKEN_REUSE_DETECTED"
  }
}
```

## Frontend Integration

### React/Axios Example

```typescript
import axios from 'axios';

// Configure axios to include cookies
axios.defaults.withCredentials = true;

// Interceptor for automatic token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh tokens
        await axios.post('/api/v1/auth/refresh');
        
        // Retry original request
        return axios(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### Fetch API Example

```typescript
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let response = await fetch(url, {
    ...options,
    credentials: 'include', // Include cookies
  });

  // If 401, try to refresh
  if (response.status === 401) {
    const refreshResponse = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshResponse.ok) {
      // Retry original request
      response = await fetch(url, {
        ...options,
        credentials: 'include',
      });
    } else {
      // Redirect to login
      window.location.href = '/login';
    }
  }

  return response;
}
```

## Testing

### Test Token Rotation

```bash
# 1. Login
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}' \
  -c cookies.txt -v

# 2. Refresh token (should succeed)
curl -X POST http://localhost:5001/api/v1/auth/refresh \
  -b cookies.txt -c cookies.txt -v

# 3. Try to reuse old token (should fail with TOKEN_REUSE_DETECTED)
curl -X POST http://localhost:5001/api/v1/auth/refresh \
  -b cookies.txt -v
```

### Test Auto-Refresh

```bash
# 1. Login
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}' \
  -c cookies.txt

# 2. Wait 10+ minutes (or modify JWT_EXPIRES_IN to 1m for testing)

# 3. Access protected route (auto-refresh should happen)
curl -X GET http://localhost:5001/api/v1/auth/profile \
  -b cookies.txt -c cookies.txt
```

## Security Features

### Token Reuse Detection

If a refresh token is used twice:
1. System detects reuse
2. All user sessions are invalidated
3. User must login again
4. Security event is logged

**Why?** This prevents token theft attacks where an attacker steals a refresh token.

### Device Tracking

Each refresh token stores device info (user agent):
- Helps identify suspicious activity
- Supports multiple devices (up to 5)
- Useful for security audits

### Automatic Cleanup

- Expired tokens are automatically removed
- Limits to 5 tokens per user
- Prevents database bloat

## Common Issues

### "Token reuse detected"
**Cause:** Multiple tabs/windows refreshing simultaneously or token theft  
**Fix:** Implement proper token refresh logic in frontend (use a single refresh promise)

### "Cannot identify user"
**Cause:** Access token cookie missing  
**Fix:** Ensure cookies are included in requests (`withCredentials: true`)

### Auto-refresh not working
**Cause:** Middleware not applied  
**Fix:** Add `autoRefreshToken` middleware before protected routes

## Migration Checklist

If you have existing users:

- [ ] Backup database
- [ ] Update User model
- [ ] Deploy new code
- [ ] Existing users will get new token structure on next login
- [ ] Monitor logs for any issues

## Performance Tips

- Token validation uses bcrypt (CPU intensive)
- Consider Redis for high-traffic apps
- Limit concurrent sessions (default: 5)
- Use auto-refresh to reduce manual refresh calls

## Next Steps

1. ✅ Token rotation is now active
2. Add `autoRefreshToken` middleware to your routes (optional)
3. Update frontend to handle token refresh
4. Test thoroughly
5. Monitor logs for security events

## Need Help?

- Full documentation: `TOKEN_ROTATION_GUIDE.md`
- Token guide: `TOKEN_GUIDE.md`
- API reference: `QUICK_API_REFERENCE.md`
