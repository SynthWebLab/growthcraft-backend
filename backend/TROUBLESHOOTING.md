# API Troubleshooting Guide

## Common Issues and Solutions

### 1. "Invalid access token" Error

**Problem:** You're getting authentication errors when trying to use protected routes.

**Possible Causes:**

#### A. Token Expired (Most Common)
Access tokens expire after 15 minutes.

**Solution:** Refresh your token
```bash
curl -X POST http://localhost:5001/api/v1/auth/refresh-token \
  -b cookies.txt \
  -c cookies.txt
```

#### B. Wrong Token Format
Make sure you're sending the token correctly.

**Wrong:**
```bash
curl -X GET http://localhost:5001/api/v1/auth/profile \
  -H "Authorization: YOUR_TOKEN"
```

**Correct:**
```bash
curl -X GET http://localhost:5001/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### C. Token Not Copied Correctly
Make sure you copy the entire token without extra spaces or line breaks.

**Test Your Token:**
```bash
# Save token to variable
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Use it
curl -X GET http://localhost:5001/api/v1/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

### 2. Complete Login → Use Token → Logout Flow

```bash
# Step 1: Login and save response
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }')

# Step 2: Extract access token
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

echo "Access Token: $ACCESS_TOKEN"

# Step 3: Use the token (should work)
curl -X GET http://localhost:5001/api/v1/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Step 4: Logout (should work)
curl -X POST http://localhost:5001/api/v1/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt
```

---

### 3. Token Expired - How to Refresh

```bash
# When you get "Token expired" error, refresh it:
REFRESH_RESPONSE=$(curl -s -X POST http://localhost:5001/api/v1/auth/refresh-token \
  -b cookies.txt \
  -c cookies.txt)

# Extract new access token
NEW_ACCESS_TOKEN=$(echo $REFRESH_RESPONSE | jq -r '.data.accessToken')

echo "New Access Token: $NEW_ACCESS_TOKEN"

# Use new token
curl -X GET http://localhost:5001/api/v1/auth/profile \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN"
```

---

### 4. Database Case Sensitivity Error

**Error:** `db already exists with different case`

**Problem:** MongoDB database name case mismatch.

**Solution:** Update `.env` file to match existing database name:
```bash
# If MongoDB has "growthCraft", use:
MONGODB_URI=mongodb://localhost:27017/growthCraft

# NOT:
MONGODB_URI=mongodb://localhost:27017/growthcraft
```

Then restart the server.

---

### 5. "No token provided" Error

**Problem:** Authorization header is missing or malformed.

**Check:**
1. Header name is `Authorization` (capital A)
2. Value starts with `Bearer ` (with space)
3. Token is included after `Bearer `

**Correct Format:**
```bash
curl -X GET http://localhost:5001/api/v1/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 6. "Forbidden" Error (403)

**Problem:** You don't have permission to access the resource.

**Example:** Student trying to access admin route
```bash
# This will fail if you're a student
curl -X GET http://localhost:5001/api/v1/users \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

**Solution:** 
- Check your role: `GET /api/v1/auth/profile`
- Use an account with appropriate role
- See RBAC_GUIDE.md for role permissions

---

### 7. Validation Errors

**Problem:** Missing or invalid fields in request body.

**Example Error:**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "role",
        "message": "Role is required"
      }
    ]
  }
}
```

**Solution:** Check required fields:

**Register requires:**
- fullName (2-100 chars)
- email (valid email)
- phone (valid phone)
- password (min 8 chars, uppercase, lowercase, number)
- role (student, instructor, admin, super_admin)

**Login requires:**
- email
- password

---

### 8. Server Not Running

**Error:** `Connection refused` or `ECONNREFUSED`

**Solution:**
```bash
# Check if server is running
curl http://localhost:5001/health

# If not, start it
cd backend
npm run dev
```

---

### 9. MongoDB Not Running

**Error:** `MongoServerError: connect ECONNREFUSED`

**Solution:**
```bash
# Windows - Start MongoDB service
net start MongoDB

# Or start mongod manually
mongod

# Check if MongoDB is running
curl http://localhost:27017
# Should return: "It looks like you are trying to access MongoDB over HTTP..."
```

---

### 10. Cookie Issues

**Problem:** Refresh token not being saved/sent.

**Solution:**

**Save cookies:**
```bash
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"user@example.com","password":"SecurePass123"}'
```

**Send cookies:**
```bash
curl -X POST http://localhost:5001/api/v1/auth/refresh-token \
  -b cookies.txt \
  -c cookies.txt
```

**Check cookies file:**
```bash
cat cookies.txt
# Should contain refreshToken
```

---

## Testing Checklist

### Before Testing APIs:

- [ ] MongoDB is running (`mongod` or service)
- [ ] Server is running (`npm run dev`)
- [ ] Health check works (`curl http://localhost:5001/health`)
- [ ] Database name matches in `.env`

### When Testing Protected Routes:

- [ ] You have a valid access token
- [ ] Token is not expired (< 15 minutes old)
- [ ] Authorization header format is correct: `Bearer TOKEN`
- [ ] Your role has permission for the route

### When Token Expires:

- [ ] Use refresh token endpoint
- [ ] Cookies are being sent (`-b cookies.txt`)
- [ ] Update your access token variable
- [ ] Retry the request with new token

---

## Quick Debug Commands

### Check if server is running:
```bash
curl http://localhost:5001/health
```

### Check if MongoDB is running:
```bash
curl http://localhost:27017
```

### Test login and extract token:
```bash
curl -s -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"SecurePass123"}' \
  | jq
```

### Decode JWT token (without verification):
```bash
# Install jwt-cli: npm install -g jwt-cli
jwt decode YOUR_TOKEN
```

### Check token expiration:
```bash
# The token payload contains 'exp' (expiration timestamp)
echo "YOUR_TOKEN" | cut -d'.' -f2 | base64 -d | jq
```

---

## Error Code Reference

| Code | Meaning | Solution |
|------|---------|----------|
| `NO_TOKEN` | Authorization header missing | Add `Authorization: Bearer TOKEN` |
| `EMPTY_TOKEN` | Token is empty | Check token value |
| `TOKEN_EXPIRED` | Access token expired | Use refresh token endpoint |
| `INVALID_TOKEN_FORMAT` | Token format is wrong | Check JWT format |
| `INVALID_TOKEN` | Token is invalid | Login again |
| `FORBIDDEN` | No permission | Check role permissions |
| `VALIDATION_ERROR` | Invalid input | Check required fields |
| `USER_EXISTS` | Email already registered | Use different email |
| `USER_NOT_FOUND` | User doesn't exist | Check user ID |
| `AUTHENTICATION_FAILED` | Wrong credentials | Check email/password |

---

## Still Having Issues?

1. Check server logs for detailed error messages
2. Verify all environment variables in `.env`
3. Ensure MongoDB database name matches exactly (case-sensitive)
4. Try registering a new user and testing with fresh tokens
5. Check that you're using the correct port (5001)
