# Postman Collection - GrowthCraft Authentication APIs

## 📦 Import Collection

1. Open Postman
2. Click **Import** button
3. Select `GrowthCraft-Auth-APIs.postman_collection.json`
4. Collection will be imported with all requests and tests

## 🔧 Environment Variables

The collection uses these variables (already configured):

| Variable | Value | Description |
|----------|-------|-------------|
| `base_url` | `http://localhost:5001/api/v1` | API base URL |
| `test_email` | `sandipan.goswami@synthweb.in` | Test email address |
| `test_password` | `Test123!` | Test password |

You can modify these in Postman's environment settings.

## 🧪 Test Flow

### Complete Authentication Flow

Run requests in this order:

1. **Register User** → Creates account, sends OTP email
2. **Login WITHOUT Verification** → Should fail with 403
3. **Verify Email with OTP** → Enter OTP from email
4. **Login AFTER Verification** → Should succeed with 200
5. **Resend OTP** (Optional) → Get new OTP if needed

### Expected Results

| Step | Status | Result |
|------|--------|--------|
| 1. Register | 201 | User created, OTP sent |
| 2. Login (before) | 403 | Blocked - email not verified |
| 3. Verify | 200 | Email verified successfully |
| 4. Login (after) | 200 | Login successful |

## 📧 Email Verification

After registration, check your email for:

**Email 1: Verification OTP**
- Subject: "Verify Your Email - GrowthCraft"
- Contains: 6-digit OTP code
- Valid for: 10 minutes
- Max attempts: 5

**Email 2: Welcome Message**
- Subject: "Welcome to GrowthCraft! 🎉"
- Sent after: Successful verification

## ✅ Automated Tests

Each request includes automated tests that verify:

- ✅ Correct HTTP status codes
- ✅ Response structure
- ✅ Success/error messages
- ✅ Email verification status
- ✅ Cookie handling

Tests run automatically after each request.

## 🔍 Error Scenarios

The collection includes tests for:

- **Invalid OTP** → 400 with remaining attempts
- **Invalid OTP Format** → 400 with format error
- **Duplicate Registration** → 409 conflict
- **Rate Limiting** → 429 when resending too soon

## 🚀 Quick Start

1. **Start Server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Import Collection** in Postman

3. **Run "Register User"** request

4. **Check Email** for OTP

5. **Run "Verify Email"** with OTP from email

6. **Run "Login"** to complete flow

## 📝 Notes

- Server must be running on `http://localhost:5001`
- Use a real email address to receive OTPs
- OTPs expire after 10 minutes
- Maximum 5 verification attempts per OTP
- 2-minute cooldown between resend requests

## 🎯 Success Indicators

✅ All tests pass (green checkmarks in Postman)  
✅ Cookies are set after login  
✅ Email verification status changes from false to true  
✅ Login blocked before verification, allowed after  

## 📚 Related Documentation

- `../docs/EMAIL_VERIFICATION_FLOW.md` - Complete flow documentation
- `../docs/OTP_EMAIL_VERIFICATION.md` - OTP implementation details
- `../docs/OTP_IMPLEMENTATION_SUMMARY.md` - Technical summary
