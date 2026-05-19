# GrowthCraft Backend - Testing Guide

## 🚀 Quick Start

### 1. Start Server
```bash
cd backend
npm run dev
```

Server runs on: `http://localhost:5001`

### 2. Test with Postman

**Import Collection:**
- Open Postman
- Import `postman/GrowthCraft-Auth-APIs.postman_collection.json`
- Run requests in order

**Test Email:** `sandipan.goswami@synthweb.in`

## 📁 Project Structure

```
backend/
├── postman/                          # Postman collections
│   ├── GrowthCraft-Auth-APIs.postman_collection.json
│   └── README.md                     # Postman guide
├── docs/                             # Documentation
│   ├── EMAIL_VERIFICATION_FLOW.md    # Complete flow guide
│   ├── OTP_EMAIL_VERIFICATION.md     # OTP implementation
│   ├── OTP_IMPLEMENTATION_SUMMARY.md # Technical summary
│   └── PERSONAL_SMTP_SETUP.md        # SMTP setup guide
├── scripts/                          # Utility scripts
│   └── test-email.ts                 # Test email service
└── src/                              # Source code
    ├── modules/auth/                 # Authentication module
    ├── common/services/              # Email service
    └── database/models/              # User model with OTP
```

## 🧪 Testing Flow

### Complete Authentication Flow

1. **Register** → User created, OTP sent
2. **Login (blocked)** → 403 error
3. **Verify OTP** → Email verified
4. **Login (success)** → 200 OK

### Test Email Service
```bash
npm run test:email -- your-email@example.com
```

## 📚 Documentation

### Essential Docs (Keep These)

1. **EMAIL_VERIFICATION_FLOW.md**
   - Complete authentication flow
   - API endpoints and responses
   - Error scenarios
   - Frontend integration examples

2. **OTP_EMAIL_VERIFICATION.md**
   - OTP system details
   - Security features
   - Rate limiting
   - Testing guide

3. **OTP_IMPLEMENTATION_SUMMARY.md**
   - Implementation status
   - Code locations
   - Security checklist
   - Production checklist

4. **PERSONAL_SMTP_SETUP.md**
   - SMTP configuration
   - Gmail setup
   - Troubleshooting

### Postman Collection

- **Location:** `postman/GrowthCraft-Auth-APIs.postman_collection.json`
- **Features:**
  - All auth endpoints
  - Automated tests
  - Environment variables
  - Error scenarios

## ✅ What's Implemented

### Authentication APIs
- ✅ POST /auth/register - Register with OTP
- ✅ POST /auth/verify-email - Verify OTP
- ✅ POST /auth/resend-verification - Resend OTP
- ✅ POST /auth/login - Login (requires verification)
- ✅ POST /auth/logout - Logout
- ✅ POST /auth/refresh - Refresh token
- ✅ GET /auth/profile - Get profile

### Security Features
- ✅ OTP-based email verification
- ✅ Login blocked until verified
- ✅ 6-digit random OTP
- ✅ SHA-256 hashing
- ✅ 10-minute expiration
- ✅ 5 attempt limit
- ✅ 2-minute rate limiting
- ✅ Welcome email after verification

### Email Service
- ✅ SMTP configured (Gmail)
- ✅ Verification OTP email
- ✅ Welcome email
- ✅ Password reset email
- ✅ Professional templates

## 🎯 Testing Checklist

- [ ] Server running on port 5001
- [ ] Import Postman collection
- [ ] Run "Register User" → Check email
- [ ] Run "Login" → Get 403 error
- [ ] Run "Verify Email" with OTP
- [ ] Run "Login" → Get 200 success
- [ ] Test "Resend OTP"
- [ ] Test error scenarios

## 📧 Email Testing

**Test Emails:**
- sandipan.goswami@synthweb.in
- jyotismita.deka@synthweb.in
- sourav.deka@synthweb.in

**What to Check:**
1. OTP email received (within 1 minute)
2. OTP is 6 digits
3. Email has professional design
4. Welcome email after verification

## 🔧 Environment Variables

Required in `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
```

## 🐛 Troubleshooting

### Server not starting
```bash
# Check if port 5001 is in use
netstat -ano | findstr :5001

# Kill process if needed
taskkill /PID <PID> /F
```

### Email not received
- Check spam folder
- Verify SMTP credentials
- Run: `npm run test:email -- your-email@example.com`

### OTP verification fails
- Check OTP is 6 digits
- Verify OTP hasn't expired (10 min)
- Check attempt count (max 5)

## 📊 Success Metrics

✅ Registration: 201 Created  
✅ Login (unverified): 403 Forbidden  
✅ Verification: 200 OK  
✅ Login (verified): 200 OK  
✅ Email delivery: < 1 minute  
✅ All Postman tests: Pass  

## 🚀 Ready to Test!

Everything is set up and ready. Start with the Postman collection!
