# Quick Start Guide

## Prerequisites
- MongoDB running on `localhost:27017`
- Node.js installed
- Dependencies installed (`npm install`)

## Start the Server

```bash
npm run dev
```

Server will start on: `http://localhost:5001`

## Test the Authentication API

### 1. Register a New User

```bash
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+91 9876543210",
    "password": "SecurePass123"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

Copy the `accessToken` from the response.

### 3. Get Profile (Protected)

```bash
curl -X GET http://localhost:5001/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## What's Implemented

✅ User Registration with validation
✅ User Login with JWT tokens
✅ Password hashing with bcrypt
✅ JWT access & refresh tokens
✅ Protected routes with authentication middleware
✅ User profile endpoint
✅ MongoDB User model
✅ Input validation
✅ Error handling
✅ Security headers (helmet, cors)

## API Endpoints

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/profile` - Get user profile (protected)

## Environment Variables

Check `.env` file for configuration:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT access token secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- `JWT_EXPIRES_IN` - Access token expiry (15m)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiry (7d)

## Next Steps

You can now:
1. Connect your frontend registration form to `/api/v1/auth/register`
2. Store the access token in localStorage/sessionStorage
3. Include the token in Authorization header for protected routes
4. Implement token refresh logic when access token expires
