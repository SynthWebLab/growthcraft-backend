# OTP-Based Email Verification System

## Overview
The email verification system uses a 6-digit OTP (One-Time Password) sent via email for enhanced security and better user experience.

## Features

### Security Features
1. **6-Digit OTP**: Random numeric code (100000-999999)
2. **Hashed Storage**: OTPs are hashed using SHA-256 before database storage
3. **Time-Limited**: OTPs expire after 10 minutes
4. **Attempt Limiting**: Maximum 5 verification attempts per OTP
5. **Rate Limiting**: 2-minute cooldown between OTP requests
6. **Auto-Invalidation**: OTP is cleared after max attempts exceeded

### User Experience Features
1. **Clear Email Design**: Professional, easy-to-read OTP email
2. **Remaining Attempts**: Users are informed of remaining attempts
3. **Helpful Error Messages**: Specific feedback for different error scenarios
4. **Idempotent**: Already verified emails return success without error
5. **Welcome Email**: Automatic welcome email after successful verification

## API Endpoints

### 1. Register User (Sends OTP)
**POST** `/api/v1/auth/register`

Automatically sends OTP email upon successful registration.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123!",
  "role": "student"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "student",
      "isEmailVerified": false
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

### 2. Verify Email with OTP
**POST** `/api/v1/auth/verify-email`

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
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

**Error Responses:**

**400 - Missing Fields:**
```json
{
  "success": false,
  "error": {
    "message": "Email and OTP are required",
    "code": "MISSING_FIELDS"
  }
}
```

**400 - Invalid Format:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid OTP format. OTP must be 6 digits.",
    "code": "INVALID_OTP_FORMAT"
  }
}
```

**400 - Invalid OTP:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid OTP. You have 4 attempts remaining.",
    "code": "VERIFICATION_FAILED"
  }
}
```

**400 - OTP Expired:**
```json
{
  "success": false,
  "error": {
    "message": "OTP has expired. Please request a new one.",
    "code": "VERIFICATION_FAILED"
  }
}
```

**400 - Max Attempts:**
```json
{
  "success": false,
  "error": {
    "message": "Maximum verification attempts exceeded. Please request a new OTP.",
    "code": "VERIFICATION_FAILED"
  }
}
```

**404 - User Not Found:**
```json
{
  "success": false,
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND"
  }
}
```

### 3. Resend Verification OTP
**POST** `/api/v1/auth/resend-verification`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Verification OTP sent successfully"
}
```

**Error Responses:**

**400 - Already Verified:**
```json
{
  "success": false,
  "error": {
    "message": "Email is already verified",
    "code": "RESEND_FAILED"
  }
}
```

**429 - Rate Limited:**
```json
{
  "success": false,
  "error": {
    "message": "Please wait 45 seconds before requesting another OTP",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

## Database Schema

### User Model Updates
```typescript
{
  emailVerificationOTP: String,           // Hashed OTP
  emailVerificationOTPExpires: Date,      // Expiration timestamp
  emailVerificationOTPAttempts: Number,   // Failed attempt counter
}
```

## Email Template

The OTP email includes:
- Large, easy-to-read OTP code
- Expiration time (10 minutes)
- Security warnings
- Attempt limit information
- Professional branding

## Security Considerations

### OTP Generation
```typescript
// Generates random 6-digit number
const otp = Math.floor(100000 + Math.random() * 900000).toString();
```

### OTP Hashing
```typescript
// SHA-256 hash before storage
const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
```

### Attempt Limiting
- Maximum 5 attempts per OTP
- Counter increments on each failed attempt
- OTP is cleared after max attempts
- Counter resets when new OTP is generated

### Rate Limiting
- 2-minute cooldown between OTP requests
- Prevents email spam
- Returns remaining wait time in error message

### Expiration
- OTPs expire after 10 minutes
- Expired OTPs cannot be used
- User must request new OTP

## Flow Diagram

```
1. User Registers
   ↓
2. System generates 6-digit OTP
   ↓
3. System hashes OTP (SHA-256)
   ↓
4. System stores hashed OTP in database
   ↓
5. System sends plain OTP via email
   ↓
6. User receives email with OTP
   ↓
7. User submits email + OTP
   ↓
8. System hashes submitted OTP
   ↓
9. System compares hashes
   ↓
10a. Match → Email verified ✓
10b. No match → Increment attempts, show remaining
   ↓
11. If verified → Send welcome email
```

## Testing

### Test OTP Verification Flow

1. **Register a user:**
```bash
POST /api/v1/auth/register
{
  "fullName": "Test User",
  "email": "test@example.com",
  "phone": "+1234567890",
  "password": "Test123!",
  "role": "student"
}
```

2. **Check email for OTP** (6-digit code)

3. **Verify email:**
```bash
POST /api/v1/auth/verify-email
{
  "email": "test@example.com",
  "otp": "123456"
}
```

4. **Test invalid OTP:**
```bash
POST /api/v1/auth/verify-email
{
  "email": "test@example.com",
  "otp": "000000"
}
```

5. **Resend OTP:**
```bash
POST /api/v1/auth/resend-verification
{
  "email": "test@example.com"
}
```

### Test Rate Limiting
```bash
# Send first request
POST /api/v1/auth/resend-verification
{"email": "test@example.com"}

# Immediately send second request (should fail)
POST /api/v1/auth/resend-verification
{"email": "test@example.com"}
```

### Test Attempt Limiting
```bash
# Try wrong OTP 5 times
for i in {1..5}; do
  curl -X POST /api/v1/auth/verify-email \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","otp":"000000"}'
done

# 6th attempt should require new OTP
```

## Frontend Integration

### Registration Flow
```typescript
// 1. Register user
const response = await fetch('/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    password: 'SecurePass123!',
    role: 'student'
  })
});

// 2. Show OTP input form
// User checks email and enters OTP

// 3. Verify OTP
const verifyResponse = await fetch('/api/v1/auth/verify-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    otp: '123456'
  })
});
```

### Resend OTP
```typescript
const resendOTP = async (email: string) => {
  try {
    const response = await fetch('/api/v1/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    if (response.status === 429) {
      // Show rate limit message
      const data = await response.json();
      alert(data.error.message);
    }
  } catch (error) {
    console.error('Resend failed:', error);
  }
};
```

### Error Handling
```typescript
const verifyOTP = async (email: string, otp: string) => {
  try {
    const response = await fetch('/api/v1/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      if (data.error.code === 'VERIFICATION_FAILED') {
        // Show specific error message
        if (data.error.message.includes('attempts remaining')) {
          // Show remaining attempts
        } else if (data.error.message.includes('expired')) {
          // Show resend button
        } else if (data.error.message.includes('Maximum')) {
          // Force resend
        }
      }
    }
  } catch (error) {
    console.error('Verification failed:', error);
  }
};
```

## Best Practices

1. **Always use HTTPS** - OTPs in requests must be encrypted
2. **Clear OTP input after submission** - Prevent reuse
3. **Show countdown timer** - Display OTP expiration time
4. **Disable resend button** - During cooldown period
5. **Log verification attempts** - For security monitoring
6. **Monitor failed attempts** - Detect potential attacks
7. **Use secure random generation** - For OTP creation
8. **Hash before storage** - Never store plain OTPs

## Advantages Over Token-Based

1. **Better UX**: Users don't need to click links
2. **Mobile-Friendly**: Easy to copy-paste from email
3. **Shorter Expiry**: 10 minutes vs 24 hours
4. **Attempt Limiting**: Built-in brute force protection
5. **No URL Issues**: No problems with email clients breaking links
6. **Clearer Security**: Users understand OTP concept better

## Migration from Token-Based

If migrating from token-based verification:

1. Keep old token fields for backward compatibility
2. Add new OTP fields to User model
3. Update registration to use OTP
4. Deprecate old token endpoint
5. Send migration email to existing unverified users

## Future Enhancements

1. **SMS OTP**: Add phone verification option
2. **Backup Codes**: Generate backup codes for account recovery
3. **Biometric Verification**: Add fingerprint/face ID support
4. **2FA Integration**: Use OTP system for two-factor auth
5. **Analytics Dashboard**: Track verification success rates
