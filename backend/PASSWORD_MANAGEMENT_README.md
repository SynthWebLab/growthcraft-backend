# Password Management APIs

## Implemented Features

### 1. Forgot Password
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token

### 2. Change Password
- `POST /api/v1/auth/change-password` - Change password (authenticated)

### 3. Logout
- `POST /api/v1/auth/logout` - Logout current session
- `POST /api/v1/auth/logout-all` - Logout all sessions

## Password Requirements

All passwords must have:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## Testing

### Forgot Password
```bash
curl -X POST http://localhost:5000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

### Change Password
```bash
# Login first
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"user@example.com","password":"OldPass123!"}'

# Change password
curl -X POST http://localhost:5000/api/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"currentPassword":"OldPass123!","newPassword":"NewPass123!"}'
```

### Logout
```bash
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

## Postman Collections

- `postman/Forgot-Password-Examples.json` - 9 test cases
- `postman/Change-Password-Examples.json` - 9 test cases

## Implementation

- Centralized password validation in `src/common/validators/password.validator.ts`
- Consistent validation across registration, reset, and change password
- DTOs for type safety
- Comprehensive error handling
