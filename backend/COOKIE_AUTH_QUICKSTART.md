# Cookie-Based Authentication - Quick Start Guide

## What Changed?

Your authentication system now uses **secure httpOnly cookies** instead of Authorization headers. This is more secure and provides better UX.

## Key Differences

### Before (Bearer Token)
```typescript
// Frontend manually stored tokens
localStorage.setItem('accessToken', token);

// Frontend manually sent tokens
headers: { Authorization: `Bearer ${token}` }
```

### After (Cookie-Based)
```typescript
// Backend automatically sets cookies
res.cookie('access_token', token, { httpOnly: true });

// Browser automatically sends cookies
// NO manual token handling needed!
```

## Backend Changes

### 1. Token Generation
- **Access Token**: JWT (15 min) → stored in `access_token` cookie
- **Refresh Token**: Crypto random (30 days) → hashed in DB, raw in `refreshToken` cookie

### 2. Authentication Middleware
```typescript
// OLD: Read from Authorization header
const token = req.headers.authorization?.split(' ')[1];

// NEW: Read from cookie
const token = req.cookies.access_token;
```

### 3. Cookie Configuration
```typescript
{
  httpOnly: true,        // JavaScript cannot access
  secure: true,          // HTTPS only (production)
  sameSite: 'none',      // Cross-site (production)
  path: '/',
  maxAge: <duration>
}
```

## Frontend Changes

### 1. Axios Configuration
```typescript
const api = axios.create({
  baseURL: 'http://localhost:5001/api/v1',
  withCredentials: true,  // CRITICAL: Send cookies
});
```

### 2. Remove Manual Token Handling
```typescript
// ❌ DELETE THIS
localStorage.setItem('accessToken', token);
localStorage.getItem('accessToken');
headers: { Authorization: `Bearer ${token}` }

// ✅ DO NOTHING - Cookies are automatic!
```

### 3. Automatic Token Refresh
```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      await api.post('/auth/refresh');  // Rotates tokens
      return api(originalRequest);       // Retry original request
    }
    return Promise.reject(error);
  }
);
```

## Testing

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Test Login
```bash
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt -v
```

Look for `Set-Cookie` headers:
```
Set-Cookie: access_token=eyJhbGc...; HttpOnly; Path=/
Set-Cookie: refreshToken=a1b2c3...; HttpOnly; Path=/
```

### 3. Test Protected Route
```bash
curl -X GET http://localhost:5001/api/v1/auth/profile \
  -b cookies.txt
```

### 4. Test Refresh
```bash
# Wait 15+ minutes for access token to expire, then:
curl -X GET http://localhost:5001/api/v1/auth/profile \
  -b cookies.txt
# Should return 401

curl -X POST http://localhost:5001/api/v1/auth/refresh \
  -b cookies.txt -c cookies.txt
# Should return new tokens

curl -X GET http://localhost:5001/api/v1/auth/profile \
  -b cookies.txt
# Should work now
```

### 5. Test Logout
```bash
curl -X POST http://localhost:5001/api/v1/auth/logout \
  -b cookies.txt -v
```

Look for `Set-Cookie` with expired dates (clears cookies).

## API Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/auth/register` | POST | No | Register new user |
| `/auth/login` | POST | No | Login user |
| `/auth/refresh` | POST | Cookie | Rotate tokens |
| `/auth/logout` | POST | Yes | Logout current device |
| `/auth/logout-all` | POST | Yes | Logout all devices |
| `/auth/profile` | GET | Yes | Get user profile |

## Common Issues

### Issue: Cookies not being set
**Solution**: Check CORS configuration
```typescript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,  // MUST be true
}));
```

### Issue: 401 on protected routes
**Solution**: Verify cookies are sent
- Open DevTools → Network → Request → Cookies
- Should see `access_token` cookie

### Issue: Refresh not working
**Solution**: Check both cookies exist
- `access_token` (can be expired)
- `refreshToken` (must be valid)

### Issue: CORS errors
**Solution**: 
1. Cannot use `origin: '*'` with credentials
2. Must specify exact origin URL
3. Frontend must use `withCredentials: true`

## Security Features

✅ **XSS Protection**: httpOnly cookies prevent JavaScript access  
✅ **CSRF Protection**: SameSite attribute prevents cross-site attacks  
✅ **Token Rotation**: Refresh tokens rotated on every use  
✅ **Hashed Storage**: Refresh tokens hashed in database  
✅ **Short-lived Access**: 15-minute access tokens limit exposure  
✅ **Multi-device**: Support up to 5 devices per user  

## Environment Variables

```env
# Backend
NODE_ENV=production
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
COOKIE_SECRET=your-cookie-secret
```

```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
```

## Migration Checklist

### Backend
- [x] Update `.env` with 30d refresh expiry
- [x] Implement `TokenService` with crypto tokens
- [x] Update `AuthService` to use `TokenService`
- [x] Update `AuthController` to set cookies
- [x] Update `authenticate` middleware to read cookies
- [x] Test all endpoints with curl

### Frontend
- [ ] Install axios: `npm install axios`
- [ ] Create `lib/axios.ts` with interceptor
- [ ] Add `withCredentials: true`
- [ ] Remove localStorage token logic
- [ ] Remove Authorization headers
- [ ] Test login flow
- [ ] Test protected routes
- [ ] Test automatic refresh

## Next Steps

1. **Read Full Documentation**
   - `COOKIE_AUTH_IMPLEMENTATION.md` - Complete backend guide
   - `FRONTEND_INTEGRATION.md` - Complete frontend guide

2. **Implement Frontend**
   - Follow `FRONTEND_INTEGRATION.md`
   - Set up Redux store
   - Create auth hooks
   - Add protected routes

3. **Test Everything**
   - Login/logout flows
   - Token refresh
   - Protected routes
   - Role-based access

4. **Deploy**
   - Set `NODE_ENV=production`
   - Enable HTTPS
   - Update CORS origins
   - Test in production

## Support

- Check `TROUBLESHOOTING.md` for common issues
- Review application logs for errors
- Test with curl commands above
- Verify cookies in browser DevTools

---

**Remember**: With cookie-based auth, the frontend does NOTHING with tokens. The browser handles everything automatically!
