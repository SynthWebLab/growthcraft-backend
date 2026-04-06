# Token Rotation Implementation Guide

## Overview

This backend implements a secure token rotation system with automatic refresh, reuse detection, and device tracking. Token rotation is a critical security feature that helps prevent token theft and replay attacks.

## Features

### 1. Automatic Token Rotation
- Tokens are automatically rotated when the `/auth/refresh` endpoint is called
- Old refresh tokens are invalidated immediately after rotation
- New token pairs (access + refresh) are generated with each rotation

### 2. Proactive Auto-Refresh
- Middleware automatically refreshes tokens when access token is about to expire (< 5 minutes)
- Provides seamless user experience without manual refresh calls
- Configurable threshold via `AUTO_REFRESH_THRESHOLD` environment variable

### 3. Token Reuse Detection
- Detects when a refresh token is used multiple times
- Identifies potential token theft or replay attacks
- Automatically invalidates all user sessions when reuse is detected
- Configurable via `TOKEN_REUSE_DETECTION` environment variable

### 4. Device Tracking
- Tracks device information (user agent) for each refresh token
- Supports multiple devices (up to 5 concurrent sessions per user)
- Helps identify suspicious activity across devices

### 5. Token Metadata
- Each refresh token stores:
  - `token`: Hashed refresh token
  - `createdAt`: When the token was created
  - `lastUsedAt`: Last time the token was used
  - `expiresAt`: When the token expires
  - `deviceInfo`: User agent information

## Configuration

### Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Token Rotation Configuration
TOKEN_ROTATION_ENABLED=true
TOKEN_REUSE_DETECTION=true
AUTO_REFRESH_THRESHOLD=5m
MAX_REFRESH_TOKENS_PER_USER=5
```

## API Endpoints

### Refresh Token (Manual)

```http
POST /api/v1/auth/refresh
```

**Request:**
- Cookies: `access_token`, `refreshToken`

**Response (Success):**
```json
{
  "success": true,
  "message": "Token refreshed successfully"
}
```

**Response (Token Reuse Detected):**
```json
{
  "success": false,
  "error": {
    "message": "Security violation detected. Please login again.",
    "code": "TOKEN_REUSE_DETECTED"
  }
}
```

**New Cookies Set:**
- `access_token`: New JWT access token (15 minutes)
- `refreshToken`: New refresh token (30 days)

## How It Works

### Token Rotation Flow

1. **User Login/Register**
   - Generate access token (JWT, 15 min) and refresh token (crypto random, 30 days)
   - Hash and store refresh token in database with metadata
   - Set both tokens as httpOnly cookies

2. **Access Token Expires**
   - Frontend detects 401 error or token expiration
   - Calls `/auth/refresh` endpoint with refresh token cookie

3. **Token Rotation Process**
   - Validate refresh token against database
   - Check for token reuse (if used < 5 seconds ago)
   - Check if token is expired
   - Remove old refresh token from database
   - Generate new token pair
   - Store new hashed refresh token with updated metadata
   - Return new tokens as httpOnly cookies

4. **Auto-Refresh (Optional)**
   - Middleware checks if access token expires in < 5 minutes
   - Automatically rotates tokens in the background
   - User experiences seamless authentication

### Token Reuse Detection

```
Timeline:
T0: User A gets refresh token RT1
T1: User A uses RT1 → Gets RT2 (RT1 invalidated)
T2: Attacker tries to use RT1 → DETECTED!
    → All user sessions invalidated
    → User must login again
```

**Detection Triggers:**
- Token not found in database (already used/rotated)
- Token used multiple times within 5 seconds
- Token used after expiration

**Security Response:**
- Invalidate all refresh tokens for the user
- Clear all cookies
- Force re-authentication
- Log security event

## Security Best Practices

### 1. Token Storage
- ✅ Refresh tokens are hashed before storage (bcrypt)
- ✅ Tokens stored in httpOnly cookies (not accessible via JavaScript)
- ✅ Secure flag enabled in production
- ✅ SameSite attribute prevents CSRF attacks

### 2. Token Rotation
- ✅ Immediate invalidation of old tokens
- ✅ One-time use refresh tokens
- ✅ Automatic cleanup of expired tokens
- ✅ Limited number of concurrent sessions (5 per user)

### 3. Attack Prevention
- ✅ Token reuse detection
- ✅ Rapid reuse detection (< 5 seconds)
- ✅ Automatic session invalidation on suspicious activity
- ✅ Device tracking for forensics

### 4. Monitoring
- ✅ Comprehensive logging of token operations
- ✅ Security event logging
- ✅ Failed refresh attempt tracking

## Usage Examples

### Frontend Integration

```typescript
// Axios interceptor for automatic token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint
        await axios.post('/api/v1/auth/refresh', {}, {
          withCredentials: true // Include cookies
        });

        // Retry original request
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### Testing Token Rotation

```bash
# 1. Login
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  -c cookies.txt

# 2. Wait for access token to expire (or manually expire it)

# 3. Refresh token
curl -X POST http://localhost:5001/api/v1/auth/refresh \
  -b cookies.txt \
  -c cookies.txt

# 4. Try to reuse old refresh token (should fail)
curl -X POST http://localhost:5001/api/v1/auth/refresh \
  -b cookies.txt
```

## Middleware Usage

### Apply Auto-Refresh Middleware

```typescript
// In your app.ts or routes
import { autoRefreshToken } from '@/common/middleware/auto-refresh.middleware';

// Apply globally (before authentication)
app.use(autoRefreshToken);

// Or apply to specific routes
router.use('/api/v1/protected', autoRefreshToken, authenticate);
```

## Database Schema

### User Model - Refresh Tokens

```typescript
interface IRefreshToken {
  token: string;           // Hashed refresh token
  createdAt: Date;         // Creation timestamp
  lastUsedAt?: Date;       // Last usage timestamp
  expiresAt: Date;         // Expiration timestamp
  deviceInfo?: string;     // User agent info
}

interface IUser {
  // ... other fields
  refreshTokens: IRefreshToken[];  // Array of refresh tokens
}
```

## Troubleshooting

### Issue: "Token reuse detected"
**Cause:** Refresh token was used multiple times or after rotation
**Solution:** User must login again. Check for:
- Multiple tabs/windows trying to refresh simultaneously
- Attacker attempting to use stolen token
- Race conditions in frontend code

### Issue: "Cannot identify user"
**Cause:** Access token cookie is missing or corrupted
**Solution:** User must login again

### Issue: Auto-refresh not working
**Cause:** Middleware not applied or threshold too low
**Solution:** 
- Ensure `autoRefreshToken` middleware is applied before protected routes
- Check `AUTO_REFRESH_THRESHOLD` environment variable
- Verify access token expiry time is greater than threshold

## Performance Considerations

- Token validation uses bcrypt comparison (CPU intensive)
- Limit concurrent sessions to 5 per user
- Automatic cleanup of expired tokens on validation
- Consider Redis for high-traffic applications

## Migration from Old System

If upgrading from a simple string-based refresh token system:

1. Update User model to use `IRefreshToken[]` instead of `string[]`
2. Run migration script to convert existing tokens
3. Update token service to use new structure
4. Test thoroughly in staging environment

## Security Checklist

- [ ] JWT secrets are strong and unique
- [ ] Refresh token secrets are different from access token secrets
- [ ] httpOnly cookies enabled
- [ ] Secure flag enabled in production
- [ ] SameSite attribute configured
- [ ] Token reuse detection enabled
- [ ] Logging configured for security events
- [ ] Rate limiting applied to refresh endpoint
- [ ] CORS configured properly
- [ ] HTTPS enabled in production

## Additional Resources

- [OWASP Token Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [RFC 6749 - OAuth 2.0 Token Refresh](https://tools.ietf.org/html/rfc6749#section-6)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
