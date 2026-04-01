# Complete cURL Commands for All APIs

## Prerequisites
- Server running on `http://localhost:5001`
- MongoDB running
- Use `-c cookies.txt` to save cookies
- Use `-b cookies.txt` to send cookies

---

## 1. Register New User

**Role is REQUIRED** - Must specify one of: `student`, `instructor`, `admin`, `super_admin`

```bash
# Register as Student
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+91 9876543210",
    "password": "SecurePass123",
    "role": "student"
  }'

# Register as Instructor
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "fullName": "Jane Instructor",
    "email": "jane@example.com",
    "phone": "+91 9876543211",
    "password": "SecurePass123",
    "role": "instructor"
  }'

# Register as Admin
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "fullName": "Admin User",
    "email": "admin@example.com",
    "phone": "+91 9876543212",
    "password": "SecurePass123",
    "role": "admin"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "65abc123...",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+91 9876543210",
      "role": "student",
      "isEmailVerified": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Cookie Set:** `refreshToken` (HttpOnly, 7 days)

---

## 2. Login User

```bash
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "65abc123...",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+91 9876543210",
      "role": "student",
      "isEmailVerified": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Cookie Set:** `refreshToken` (HttpOnly, 7 days)

**Save the accessToken for next requests!**

---

## 3. Get User Profile (Protected)

```bash
curl -X GET http://localhost:5001/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Example with actual token:**
```bash
curl -X GET http://localhost:5001/api/v1/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWFiYzEyMyIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNjk5OTk5OTk5LCJleHAiOjE3MDAwMDA4OTl9.abc123..."
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "65abc123...",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+91 9876543210",
      "role": "student",
      "isEmailVerified": false,
      "isActive": true,
      "createdAt": "2024-04-01T10:00:00.000Z",
      "updatedAt": "2024-04-01T10:00:00.000Z"
    }
  }
}
```

---

## 4. Refresh Access Token (Using Cookie)

```bash
curl -X POST http://localhost:5001/api/v1/auth/refresh-token \
  -b cookies.txt \
  -c cookies.txt
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_TOKEN..."
  }
}
```

**Cookie Updated:** New `refreshToken` (HttpOnly, 7 days)

---

## 5. Refresh Access Token (Using Body)

```bash
curl -X POST http://localhost:5001/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_TOKEN..."
  }
}
```

---

## 6. Logout (Current Device)

```bash
curl -X POST http://localhost:5001/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Cookie Cleared:** `refreshToken` removed

---

## 7. Logout All Devices

```bash
curl -X POST http://localhost:5001/api/v1/auth/logout-all \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out from all devices successfully"
}
```

---

## 8. Get All Users (Admin Only)

```bash
curl -X GET http://localhost:5001/api/v1/users \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "65abc123...",
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+91 9876543210",
        "role": "student",
        "isEmailVerified": false,
        "isActive": true,
        "createdAt": "2024-04-01T10:00:00.000Z",
        "updatedAt": "2024-04-01T10:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

---

## 9. Get User By ID

```bash
curl -X GET http://localhost:5001/api/v1/users/USER_ID_HERE \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Example:**
```bash
curl -X GET http://localhost:5001/api/v1/users/65abc123def456 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "65abc123...",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+91 9876543210",
      "role": "student",
      "isEmailVerified": false,
      "isActive": true,
      "createdAt": "2024-04-01T10:00:00.000Z",
      "updatedAt": "2024-04-01T10:00:00.000Z"
    }
  }
}
```

---

## 10. Update User Profile

```bash
curl -X PATCH http://localhost:5001/api/v1/users/USER_ID_HERE \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Updated",
    "phone": "+91 9876500000"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "_id": "65abc123...",
      "fullName": "John Updated",
      "email": "john.doe@example.com",
      "phone": "+91 9876500000",
      "role": "student",
      "isEmailVerified": false,
      "isActive": true,
      "createdAt": "2024-04-01T10:00:00.000Z",
      "updatedAt": "2024-04-01T10:30:00.000Z"
    }
  }
}
```

---

## 11. Delete User (Admin Only)

```bash
curl -X DELETE http://localhost:5001/api/v1/users/USER_ID_HERE \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN_HERE"
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Complete Workflow Example

### Step 1: Register
```bash
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "fullName": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+91 9876543211",
    "password": "SecurePass123"
  }'
```

**Copy the `accessToken` from response**

### Step 2: Use Access Token
```bash
# Replace YOUR_ACCESS_TOKEN with the token from Step 1
export ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:5001/api/v1/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Step 3: Wait 15+ Minutes (Token Expires)
```bash
# This will fail with 401
curl -X GET http://localhost:5001/api/v1/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid or expired token",
    "code": "INVALID_TOKEN"
  }
}
```

### Step 4: Refresh Token
```bash
curl -X POST http://localhost:5001/api/v1/auth/refresh-token \
  -b cookies.txt \
  -c cookies.txt
```

**Copy the new `accessToken` from response**

### Step 5: Use New Access Token
```bash
export ACCESS_TOKEN="NEW_TOKEN_HERE"

curl -X GET http://localhost:5001/api/v1/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## Testing with Variables (Bash Script)

```bash
#!/bin/bash

# 1. Register/Login
RESPONSE=$(curl -s -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }')

# 2. Extract access token
ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.data.accessToken')
USER_ID=$(echo $RESPONSE | jq -r '.data.user.id')

echo "Access Token: $ACCESS_TOKEN"
echo "User ID: $USER_ID"

# 3. Get profile
curl -X GET http://localhost:5001/api/v1/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 4. Update profile
curl -X PATCH http://localhost:5001/api/v1/users/$USER_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Updated"
  }'

# 5. Refresh token
NEW_RESPONSE=$(curl -s -X POST http://localhost:5001/api/v1/auth/refresh-token \
  -b cookies.txt \
  -c cookies.txt)

NEW_ACCESS_TOKEN=$(echo $NEW_RESPONSE | jq -r '.data.accessToken')
echo "New Access Token: $NEW_ACCESS_TOKEN"

# 6. Logout
curl -X POST http://localhost:5001/api/v1/auth/logout \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN" \
  -b cookies.txt
```

---

## Error Responses

### 400 - Validation Error
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Please provide a valid email"
      }
    ]
  }
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "Invalid or expired token",
    "code": "INVALID_TOKEN"
  }
}
```

### 403 - Forbidden
```json
{
  "success": false,
  "error": {
    "message": "You do not have permission to access this resource",
    "code": "FORBIDDEN"
  }
}
```

### 404 - Not Found
```json
{
  "success": false,
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND"
  }
}
```

### 409 - Conflict
```json
{
  "success": false,
  "error": {
    "message": "User with this email already exists",
    "code": "USER_EXISTS"
  }
}
```

---

## Tips

1. **Save cookies**: Use `-c cookies.txt` to save refresh token
2. **Send cookies**: Use `-b cookies.txt` to send refresh token
3. **Pretty print**: Add `| jq` to format JSON output
4. **Save token**: Store access token in environment variable
5. **Verbose mode**: Add `-v` flag to see headers and cookies
6. **Silent mode**: Add `-s` flag to hide progress bar

### Example with jq (pretty print):
```bash
curl -s -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123"}' \
  | jq
```

### Example with verbose:
```bash
curl -v -X GET http://localhost:5001/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```
