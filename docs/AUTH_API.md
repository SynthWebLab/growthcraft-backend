# Authentication API Documentation

## Overview

JWT-based authentication system with secure password hashing and token management.

## Endpoints

### 1. Register User

**POST** `/api/v1/auth/register`

Register a new student account.

**Request Body:**

```json
{
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+91 98765 43210",
  "password": "SecurePass123"
}
```

**Validation Rules:**

- `fullName`: 2-100 characters
- `email`: Valid email format
- `phone`: Valid phone number format
- `password`: Min 8 characters, must contain uppercase, lowercase, and number

**Success Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+91 98765 43210",
      "role": "student",
      "isEmailVerified": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (409):**

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

### 2. Login User

**POST** `/api/v1/auth/login`

Authenticate existing user.

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+91 98765 43210",
      "role": "student",
      "isEmailVerified": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401):**

```json
{
  "success": false,
  "error": {
    "message": "Invalid email or password",
    "code": "AUTHENTICATION_FAILED"
  }
}
```

---

### 3. Get User Profile

**GET** `/api/v1/auth/profile`

Get authenticated user's profile (Protected route).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+91 98765 43210",
      "role": "student",
      "isEmailVerified": false
    }
  }
}
```

---

## Security Features

1. **Password Hashing**: bcrypt with 12 salt rounds
2. **JWT Tokens**:
   - Access Token: 15 minutes expiry
   - Refresh Token: 7 days expiry (stored in httpOnly cookie)
3. **Token Payload**: userId, email, role
4. **Protected Routes**: Require valid JWT in Authorization header
5. **Input Validation**: express-validator for all inputs
6. **CORS**: Configured for frontend URL
7. **Helmet**: Security headers enabled

## Token Management

- Access tokens are returned in response body
- Refresh tokens are stored in httpOnly cookies
- Tokens include issuer and audience claims
- Invalid/expired tokens return 401 status

## Testing

Use the `test-auth.http` file with REST Client extension or Postman.

1. Start MongoDB: `mongod`
2. Start server: `npm run dev`
3. Test endpoints using the HTTP file
