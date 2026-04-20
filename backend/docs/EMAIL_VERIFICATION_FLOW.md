# Email Verification Required Flow

## Overview
Users **MUST verify their email** before they can login. Registration creates the account and sends an OTP, but login is blocked until email verification is complete.

## Complete Flow

### 1. User Registration
**Endpoint**: `POST /api/v1/auth/register`

**Request**:
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123!",
  "role": "student"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "...",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "student",
      "isEmailVerified": false
    },
    "requiresEmailVerification": true
  }
}
```

**What Happens**:
1. ✅ User account is created in database
2. ✅ 6-digit OTP is generated
3. ✅ OTP is hashed and stored
4. ✅ OTP email is sent to user
5. ✅ User receives tokens (for development)
6. ⚠️ `isEmailVerified` is `false`
7. ⚠️ User **CANNOT login yet**

### 2. User Receives Email
User receives an email with:
- 6-digit OTP code (e.g., 382279)
- 10-minute expiration notice
- Security warnings
- Attempt limit (5 attempts)

### 3. User Attempts Login (BLOCKED)
**Endpoint**: `POST /api/v1/auth/login`

**Request**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (403 Forbidden)**:
```json
{
  "success": false,
  "error": {
    "message": "Email not verified. Please verify your email before logging in.",
    "code": "EMAIL_NOT_VERIFIED"
  }
}
```

**Result**: ❌ Login is **BLOCKED** until email is verified

### 4. User Verifies Email
**Endpoint**: `POST /api/v1/auth/verify-email`

**Request**:
```json
{
  "email": "john@example.com",
  "otp": "382279"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "email": "john@example.com",
      "fullName": "John Doe"
    }
  }
}
```

**What Happens**:
1. ✅ OTP is validated
2. ✅ `isEmailVerified` is set to `true`
3. ✅ OTP is cleared from database
4. ✅ Welcome email is sent
5. ✅ User can now login

### 5. User Logs In Successfully
**Endpoint**: `POST /api/v1/auth/login`

**Request**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "student",
      "isEmailVerified": true
    }
  }
}
```

**Result**: ✅ Login **SUCCESSFUL** - User is authenticated

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    REGISTRATION FLOW                         │
└─────────────────────────────────────────────────────────────┘

1. User Submits Registration
   ↓
2. System Creates Account
   • isEmailVerified = false
   • Generate OTP
   • Hash OTP
   • Store in database
   ↓
3. System Sends OTP Email
   • 6-digit code
   • 10-minute expiry
   ↓
4. User Receives Email
   • Reads OTP: 382279
   ↓
5. User Tries to Login
   ↓
6. System Checks isEmailVerified
   ↓
   ├─ false → ❌ BLOCK LOGIN (403)
   │           "Email not verified"
   │
   └─ true → ✅ ALLOW LOGIN (200)

┌─────────────────────────────────────────────────────────────┐
│                  VERIFICATION FLOW                           │
└─────────────────────────────────────────────────────────────┘

1. User Enters OTP
   ↓
2. POST /auth/verify-email
   { email, otp }
   ↓
3. System Validates
   • Hash submitted OTP
   • Compare with stored hash
   • Check expiration
   • Check attempts (max 5)
   ↓
4. If Valid:
   • Set isEmailVerified = true
   • Clear OTP from database
   • Send welcome email
   ↓
5. User Can Now Login ✅
```

## Error Scenarios

### Scenario 1: Login Without Verification
```
POST /auth/login
→ 403 Forbidden
→ "Email not verified. Please verify your email before logging in."
→ Code: EMAIL_NOT_VERIFIED
```

### Scenario 2: Invalid OTP
```
POST /auth/verify-email
{ "email": "john@example.com", "otp": "000000" }
→ 400 Bad Request
→ "Invalid OTP. You have 4 attempts remaining."
→ Code: VERIFICATION_FAILED
```

### Scenario 3: Expired OTP
```
POST /auth/verify-email (after 10 minutes)
→ 400 Bad Request
→ "OTP has expired. Please request a new one."
→ Code: VERIFICATION_FAILED
```

### Scenario 4: Max Attempts Exceeded
```
POST /auth/verify-email (6th attempt)
→ 400 Bad Request
→ "Maximum verification attempts exceeded. Please request a new OTP."
→ Code: VERIFICATION_FAILED
```

## Resend OTP Flow

If user doesn't receive OTP or it expires:

**Endpoint**: `POST /api/v1/auth/resend-verification`

**Request**:
```json
{
  "email": "john@example.com"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Verification OTP sent successfully"
}
```

**What Happens**:
1. ✅ New OTP is generated
2. ✅ Old OTP is invalidated
3. ✅ Attempt counter is reset
4. ✅ New expiration time (10 minutes)
5. ✅ New OTP email is sent

**Rate Limiting**: 2-minute cooldown between requests

## Frontend Implementation

### Registration Page
```typescript
const handleRegister = async (formData) => {
  try {
    const response = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Show success message
      alert(data.message); // "Please check your email to verify your account."
      
      // Redirect to verification page
      if (data.data.requiresEmailVerification) {
        router.push(`/verify-email?email=${formData.email}`);
      }
    }
  } catch (error) {
    console.error('Registration failed:', error);
  }
};
```

### Verification Page
```typescript
const handleVerifyOTP = async (email, otp) => {
  try {
    const response = await fetch('/api/v1/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Show success message
      alert('Email verified successfully!');
      
      // Redirect to login
      router.push('/login');
    }
  } catch (error) {
    if (error.response?.status === 400) {
      // Show error message with remaining attempts
      alert(error.response.data.error.message);
    }
  }
};
```

### Login Page
```typescript
const handleLogin = async (email, password) => {
  try {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Login successful
      router.push('/dashboard');
    }
  } catch (error) {
    if (error.response?.status === 403) {
      // Email not verified
      const errorCode = error.response.data.error.code;
      
      if (errorCode === 'EMAIL_NOT_VERIFIED') {
        alert('Please verify your email first');
        router.push(`/verify-email?email=${email}`);
      }
    }
  }
};
```

## Security Features

### 1. Email Verification Required
- ✅ Users cannot login without verification
- ✅ Prevents fake account creation
- ✅ Ensures valid email addresses

### 2. OTP Security
- ✅ 6-digit random code (900,000 combinations)
- ✅ SHA-256 hashed before storage
- ✅ 10-minute expiration
- ✅ Maximum 5 attempts
- ✅ Auto-cleared after max attempts

### 3. Rate Limiting
- ✅ 2-minute cooldown on resend
- ✅ Prevents email spam
- ✅ Protects against abuse

### 4. Error Handling
- ✅ Clear error messages
- ✅ Specific error codes
- ✅ Remaining attempts shown
- ✅ Proper HTTP status codes

## Testing

### Test Complete Flow
```bash
# 1. Start server
npm run dev

# 2. Register user
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "password": "Test123!",
    "role": "student"
  }'

# 3. Try to login (should fail with 403)
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# 4. Check email for OTP

# 5. Verify email
curl -X POST http://localhost:5001/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'

# 6. Login again (should succeed with 200)
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

## Summary

✅ **Registration**: Creates account, sends OTP, but user cannot login yet
✅ **Email Verification**: Required before login is allowed
✅ **Login Block**: 403 error if email not verified
✅ **OTP Validation**: Secure 6-digit code with expiration and attempt limits
✅ **Resend OTP**: Available with rate limiting
✅ **Welcome Email**: Sent after successful verification

**Status**: Fully implemented and working! 🎉
