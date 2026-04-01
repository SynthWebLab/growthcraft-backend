# Cookie-Based Authentication Testing Guide

## Prerequisites

1. Backend server running on `http://localhost:5001`
2. MongoDB running
3. `curl` installed (or use Postman/Insomnia)

## Test Scenarios

### 1. User Registration

**Request:**
```bash
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "password": "SecurePass123!",
    "role": "student"
  }' \
  -c cookies.txt \
  -v
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "fullName": "Test User",
      "email": "test@example.com",
      "phone": "+1234567890",
      "role": "student",
      "isEmailVerified": false
    }
  }
}
```

**Expected Cookies:**
```
Set-Cookie: access_token=eyJhbGc...; HttpOnly; Path=/; Max-Age=900
Set-Cookie: refreshToken=a1b2c3d4...; HttpOnly; Path=/; Max-Age=2592000
```

**Verify:**
- Status code: 201
- Two `Set-Cookie` headers present
- `access_token` expires in 900 seconds (15 min)
- `refreshToken` expires in 2592000 seconds (30 days)
- Both cookies have `HttpOnly` flag
- User object returned (no tokens in response body)

---

### 2. User Login

**Request:**
```bash
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }' \
  -c cookies.txt \
  -v
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "fullName": "Test User",
      "email": "test@example.com",
      "role": "student"
    }
  }
}
```

**Expected Cookies:**
```
Set-Cookie: access_token=...; HttpOnly; Path=/
Set-Cookie: refreshToken=...; HttpOnly; Path=/
```

**Verify:**
- Status code: 200
- Cookies saved to `cookies.txt`
- No tokens in response body
- User object returned

---

### 3. Access Protected Route

**Request:**
```bash
curl -X GET http://localhost:5001/api/v1/auth/profile \
  -b cookies.txt \
  -v
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "fullName": "Test User",
      "email": "test@example.com",
      "role": "student",
      "isEmailVerified": false,
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**Verify:**
- Status code: 200
- Request includes `Cookie: access_token=...`
- User profile returned

---

### 4. Access Protected Route Without Cookies

**Request:**
```bash
curl -X GET http://localhost:5001/api/v1/auth/profile \
  -v
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "message": "No access token provided",
    "code": "NO_TOKEN"
  }
}
```

**Verify:**
- Status code: 401
- Error message indicates missing token

---

### 5. Token Refresh

**Simulate expired access token:**

Option A: Wait 15 minutes after login

Option B: Manually test refresh endpoint

**Request:**
```bash
curl -X POST http://localhost:5001/api/v1/auth/refresh \
  -b cookies.txt \
  -c cookies.txt \
  -v
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully"
}
```

**Expected Cookies:**
```
Set-Cookie: access_token=<NEW_TOKEN>; HttpOnly; Path=/
Set-Cookie: refreshToken=<NEW_TOKEN>; HttpOnly; Path=/
```

**Verify:**
- Status code: 200
- New cookies set (different from old ones)
- Old refresh token invalidated in database
- Can access protected routes with new cookies

---

### 6. Token Refresh Without Refresh Token

**Request:**
```bash
curl -X POST http://localhost:5001/api/v1/auth/refresh \
  -v
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "message": "Refresh token not provided",
    "code": "NO_REFRESH_TOKEN"
  }
}
```

**Verify:**
- Status code: 401
- Error indicates missing refresh token

---

### 7. Token Refresh with Invalid Token

**Request:**
```bash
curl -X POST http://localhost:5001/api/v1/auth/refresh \
  -H "Cookie: refreshToken=invalid_token; access_token=invalid" \
  -v
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid or expired refresh token",
    "code": "REFRESH_FAILED"
  }
}
```

**Verify:**
- Status code: 401
- Cookies cleared

---

### 8. Logout

**Request:**
```bash
curl -X POST http://localhost:5001/api/v1/auth/logout \
  -b cookies.txt \
  -v
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Expected Cookies:**
```
Set-Cookie: access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
Set-Cookie: refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

**Verify:**
- Status code: 200
- Cookies cleared (expired dates)
- Refresh token removed from database
- Cannot access protected routes anymore

---

### 9. Access Protected Route After Logout

**Request:**
```bash
curl -X GET http://localhost:5001/api/v1/auth/profile \
  -b cookies.txt \
  -v
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "message": "No access token provided",
    "code": "NO_TOKEN"
  }
}
```

**Verify:**
- Status code: 401
- Access denied

---

### 10. Logout from All Devices

**Setup:**
1. Login from multiple "devices" (save cookies to different files)

```bash
# Device 1
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}' \
  -c cookies1.txt

# Device 2
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}' \
  -c cookies2.txt
```

**Request:**
```bash
curl -X POST http://localhost:5001/api/v1/auth/logout-all \
  -b cookies1.txt \
  -v
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Logged out from all devices successfully"
}
```

**Verify:**
```bash
# Try accessing from device 2
curl -X POST http://localhost:5001/api/v1/auth/refresh \
  -b cookies2.txt
# Should fail - all refresh tokens invalidated
```

---

### 11. Role-Based Access Control

**Setup:**
Create admin user:
```bash
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Admin User",
    "email": "admin@example.com",
    "phone": "+1234567890",
    "password": "AdminPass123!",
    "role": "admin"
  }' \
  -c admin_cookies.txt
```

**Test admin-only route:**
```bash
# Assuming you have an admin-only route
curl -X GET http://localhost:5001/api/v1/admin/users \
  -b admin_cookies.txt
# Should succeed

curl -X GET http://localhost:5001/api/v1/admin/users \
  -b cookies.txt
# Should fail (student role)
```

---

### 12. Concurrent Requests During Token Expiry

**Simulate:**
1. Wait until access token is about to expire
2. Make multiple simultaneous requests

```bash
# Terminal 1
curl -X GET http://localhost:5001/api/v1/auth/profile -b cookies.txt &

# Terminal 2
curl -X GET http://localhost:5001/api/v1/auth/profile -b cookies.txt &

# Terminal 3
curl -X GET http://localhost:5001/api/v1/auth/profile -b cookies.txt &
```

**Expected:**
- Only one refresh request should be made
- All requests should eventually succeed
- No race conditions

---

### 13. Token Reuse Detection

**Test:**
1. Login and save refresh token
2. Use refresh token to get new tokens
3. Try using old refresh token again

```bash
# Login
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}' \
  -c cookies_old.txt

# Copy cookies
cp cookies_old.txt cookies_new.txt

# Refresh (rotates token)
curl -X POST http://localhost:5001/api/v1/auth/refresh \
  -b cookies_new.txt \
  -c cookies_new.txt

# Try using old refresh token
curl -X POST http://localhost:5001/api/v1/auth/refresh \
  -b cookies_old.txt
# Should fail - old token invalidated
```

**Expected:**
- Second refresh fails
- Old token no longer valid

---

### 14. Invalid Credentials

**Request:**
```bash
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword"
  }' \
  -v
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid email or password",
    "code": "AUTHENTICATION_FAILED"
  }
}
```

**Verify:**
- Status code: 401
- No cookies set

---

### 15. Duplicate Registration

**Request:**
```bash
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "password": "SecurePass123!",
    "role": "student"
  }' \
  -v
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "message": "User with this email already exists",
    "code": "USER_EXISTS"
  }
}
```

**Verify:**
- Status code: 409
- No cookies set

---

## Automated Test Script

Save as `test_auth.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:5001/api/v1"
EMAIL="test_$(date +%s)@example.com"
PASSWORD="SecurePass123!"

echo "=== Testing Cookie-Based Authentication ==="

# 1. Register
echo -e "\n1. Testing Registration..."
curl -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"fullName\": \"Test User\",
    \"email\": \"$EMAIL\",
    \"phone\": \"+1234567890\",
    \"password\": \"$PASSWORD\",
    \"role\": \"student\"
  }" \
  -c cookies.txt \
  -s | jq .

# 2. Get Profile
echo -e "\n2. Testing Protected Route..."
curl -X GET "$API_URL/auth/profile" \
  -b cookies.txt \
  -s | jq .

# 3. Logout
echo -e "\n3. Testing Logout..."
curl -X POST "$API_URL/auth/logout" \
  -b cookies.txt \
  -s | jq .

# 4. Try accessing after logout
echo -e "\n4. Testing Access After Logout..."
curl -X GET "$API_URL/auth/profile" \
  -b cookies.txt \
  -s | jq .

# 5. Login again
echo -e "\n5. Testing Login..."
curl -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }" \
  -c cookies.txt \
  -s | jq .

# 6. Refresh token
echo -e "\n6. Testing Token Refresh..."
curl -X POST "$API_URL/auth/refresh" \
  -b cookies.txt \
  -c cookies.txt \
  -s | jq .

# 7. Get profile with new token
echo -e "\n7. Testing Protected Route After Refresh..."
curl -X GET "$API_URL/auth/profile" \
  -b cookies.txt \
  -s | jq .

echo -e "\n=== All Tests Complete ==="
```

**Run:**
```bash
chmod +x test_auth.sh
./test_auth.sh
```

---

## Browser Testing (DevTools)

### 1. Check Cookies
1. Open DevTools (F12)
2. Go to Application → Cookies
3. Look for:
   - `access_token` (HttpOnly, Secure in prod)
   - `refreshToken` (HttpOnly, Secure in prod)

### 2. Monitor Network
1. Open DevTools → Network
2. Login
3. Check response headers for `Set-Cookie`
4. Make protected request
5. Check request headers for `Cookie`

### 3. Test Refresh Flow
1. Login
2. Wait 15+ minutes (or manually delete access_token)
3. Make protected request
4. Should see 401 error
5. Frontend should auto-call `/auth/refresh`
6. Original request should retry and succeed

---

## Success Criteria

✅ Registration sets httpOnly cookies  
✅ Login sets httpOnly cookies  
✅ Protected routes require valid access token  
✅ Expired access token returns 401  
✅ Refresh endpoint rotates both tokens  
✅ Old refresh token becomes invalid after rotation  
✅ Logout clears cookies and invalidates refresh token  
✅ Logout-all invalidates all user's refresh tokens  
✅ No tokens exposed in response bodies  
✅ Cookies have HttpOnly flag  
✅ Cookies have Secure flag in production  
✅ CORS allows credentials  
✅ Multiple devices supported (up to 5)  
✅ Role-based access control works  

---

## Troubleshooting

### Cookies not being set
- Check CORS `credentials: true`
- Verify `withCredentials: true` in frontend
- Check `Set-Cookie` headers in response

### 401 on all requests
- Verify cookies exist in request
- Check cookie expiration
- Verify JWT secret matches

### Refresh not working
- Check both cookies present
- Verify refresh token in database
- Check token hasn't expired (30 days)

### CORS errors
- Cannot use `origin: '*'` with credentials
- Must specify exact origin
- Check preflight OPTIONS requests

---

This comprehensive test suite ensures your cookie-based authentication system is working correctly and securely.
