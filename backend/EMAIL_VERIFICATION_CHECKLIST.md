# ✅ Email Verification Setup Checklist

Follow these steps to get email verification working!

---

## 📋 Setup Steps

### 1. Install Dependencies ✅
- [x] `nodemailer` installed
- [x] `@types/nodemailer` installed

**Status:** ✅ Already done!

---

### 2. Configure SMTP

- [ ] Choose SMTP provider (Gmail, SendGrid, etc.)
- [ ] Get SMTP credentials
- [ ] Update `backend/.env` file

**Quick Setup (Gmail):**
1. Go to: https://myaccount.google.com/apppasswords
2. Generate App Password
3. Update `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
FRONTEND_URL=http://localhost:3000
```

**See:** `docs/PERSONAL_SMTP_SETUP.md` for detailed instructions

---

### 3. Test Email Configuration

```bash
cd backend
npm run test:email
```

**Expected:** ✅ Email service connected successfully!

**If failed:** See troubleshooting in `docs/PERSONAL_SMTP_SETUP.md`

---

### 4. Send Test Email (Optional)

```bash
npm run test:email -- --send your-email@example.com
```

**Expected:** Email received in inbox

---

### 5. Start Development Server

```bash
npm run dev
```

**Expected:** Server running on http://localhost:5001

---

### 6. Test Registration

**Using cURL:**
```bash
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "your-email@example.com",
    "phone": "+1234567890",
    "password": "Test1234!",
    "role": "student"
  }'
```

**Using Postman/Thunder Client:**
```
POST http://localhost:5001/api/v1/auth/register
Content-Type: application/json

{
  "fullName": "Test User",
  "email": "your-email@example.com",
  "phone": "+1234567890",
  "password": "Test1234!",
  "role": "student"
}
```

**Expected:** 
- 201 response
- Verification email received

---

### 7. Verify Email

- [ ] Check inbox (and spam folder)
- [ ] Click verification link
- [ ] See success message

**Manual test:**
```bash
curl "http://localhost:5001/api/v1/auth/verify-email?token=YOUR_TOKEN"
```

---

### 8. Test Other Endpoints

**Resend Verification:**
```bash
curl -X POST http://localhost:5001/api/v1/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

**Forgot Password:**
```bash
curl -X POST http://localhost:5001/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

**Reset Password:**
```bash
curl -X POST http://localhost:5001/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_TOKEN",
    "newPassword": "NewPass1234!"
  }'
```

---

## 🎨 Customization (Optional)

### Customize Email Templates

Edit: `backend/src/common/services/email.service.ts`

- [ ] Update brand name
- [ ] Change colors
- [ ] Add logo
- [ ] Modify text content

### Customize Token Expiration

Edit: `backend/src/modules/auth/services/auth.service.ts`

- [ ] Change verification expiration (default: 24h)
- [ ] Change reset expiration (default: 1h)

---

## 📚 Documentation Reference

| Document | Purpose |
|----------|---------|
| `docs/QUICK_START_EMAIL.md` | 5-minute quick start guide |
| `docs/PERSONAL_SMTP_SETUP.md` | Personal email setup (Gmail, Outlook, etc.) |
| `docs/EMAIL_SETUP_GUIDE.md` | Complete SMTP provider guide |
| `docs/EMAIL_VERIFICATION_API.md` | API endpoint reference |
| `docs/EMAIL_IMPLEMENTATION_SUMMARY.md` | Technical implementation details |

---

## 🐛 Troubleshooting

### Email not sending?
```bash
npm run test:email
```

### Check logs
```bash
cat backend/logs/app.log
```

### Common issues
- Gmail: Need App Password (not regular password)
- Gmail: Need 2FA enabled first
- Wrong SMTP_HOST or SMTP_PORT
- Firewall blocking SMTP
- Daily sending limit exceeded

**See:** `docs/PERSONAL_SMTP_SETUP.md` → "Common Issues & Solutions"

---

## ✨ What's Included

✅ Email verification on registration
✅ Resend verification email
✅ Password reset via email
✅ Secure token generation (32 bytes)
✅ Token hashing (SHA-256)
✅ Token expiration (24h/1h)
✅ Professional HTML email templates
✅ Multiple SMTP provider support
✅ Test scripts
✅ Complete documentation
✅ Production-ready code

---

## 🚀 Production Checklist

Before deploying to production:

- [ ] Switch to professional email service (SendGrid/Mailgun)
- [ ] Update `FRONTEND_URL` in `.env`
- [ ] Set up domain verification (SPF/DKIM/DMARC)
- [ ] Enable HTTPS for verification links
- [ ] Test email deliverability
- [ ] Monitor email sending
- [ ] Set up email queue (for high volume)
- [ ] Configure rate limiting
- [ ] Review email templates
- [ ] Test on multiple email providers

---

## 📞 Need Help?

1. **Quick Start:** Read `docs/QUICK_START_EMAIL.md`
2. **SMTP Setup:** Read `docs/PERSONAL_SMTP_SETUP.md`
3. **Test Connection:** Run `npm run test:email`
4. **Check Logs:** `backend/logs/app.log`
5. **API Reference:** `docs/EMAIL_VERIFICATION_API.md`

---

## 🎯 Next Steps

1. [ ] Configure SMTP in `.env`
2. [ ] Test email connection
3. [ ] Test registration flow
4. [ ] Customize email templates (optional)
5. [ ] Build frontend verification page
6. [ ] Deploy to production
7. [ ] Monitor email deliverability

---

## 📝 Quick Commands

```bash
# Test SMTP connection
npm run test:email

# Send test email
npm run test:email -- --send your-email@example.com

# Start dev server
npm run dev

# Check TypeScript errors
npm run type-check

# View logs
cat backend/logs/app.log
```

---

## ✅ Status

- [x] Dependencies installed
- [x] Code implemented
- [x] Documentation created
- [ ] SMTP configured
- [ ] Email tested
- [ ] Production ready

**Current Step:** Configure SMTP in `.env` file

**Next:** Run `npm run test:email` to verify configuration

---

Good luck! 🚀
