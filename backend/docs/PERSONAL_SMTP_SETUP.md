# Personal SMTP Setup Guide

Step-by-step guide to set up email verification with your personal email.

---

## Option 1: Gmail (Easiest - Recommended)

### Step 1: Enable 2-Factor Authentication

1. Go to: https://myaccount.google.com/security
2. Click "2-Step Verification"
3. Follow the setup process
4. Verify with your phone

### Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select app: "Mail"
3. Select device: "Other (Custom name)"
4. Enter name: "GrowthCraft Backend"
5. Click "Generate"
6. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### Step 3: Configure .env

Open `backend/.env` and update:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop
```

**Important:** Remove spaces from the app password!

### Step 4: Test

```bash
cd backend
npm run test:email
```

Should see: ✅ Email service connected successfully!

### Step 5: Send Test Email

```bash
npm run test:email -- --send your-email@gmail.com
```

Check your inbox!

---

## Option 2: Outlook/Hotmail

### Step 1: Enable SMTP

1. Go to: https://outlook.live.com/mail/options/mail/accounts
2. Click "Forwarding and POP/IMAP"
3. Enable "Let devices and apps use POP"

### Step 2: Configure .env

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-outlook-password
```

### Step 3: Test

```bash
cd backend
npm run test:email
```

**Note:** If you have 2FA enabled, you'll need to create an app password:
1. Go to: https://account.microsoft.com/security
2. Advanced security options
3. Create new app password

---

## Option 3: Yahoo Mail

### Step 1: Generate App Password

1. Go to: https://login.yahoo.com/account/security
2. Click "Generate app password"
3. Select "Other App"
4. Enter name: "GrowthCraft"
5. Click "Generate"
6. Copy the password

### Step 2: Configure .env

```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

### Step 3: Test

```bash
cd backend
npm run test:email
```

---

## Option 4: Custom Domain Email (cPanel/Plesk)

If you have your own domain with email hosting:

### Step 1: Get SMTP Details

Contact your hosting provider or check cPanel:
1. Login to cPanel
2. Go to "Email Accounts"
3. Click "Configure Email Client"
4. Find SMTP settings

Common settings:
- **Host:** `mail.yourdomain.com` or `smtp.yourdomain.com`
- **Port:** `587` (TLS) or `465` (SSL)
- **Username:** Your full email address
- **Password:** Your email password

### Step 2: Configure .env

```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-email-password
```

### Step 3: Test

```bash
cd backend
npm run test:email
```

---

## Option 5: iCloud Mail

### Step 1: Generate App-Specific Password

1. Go to: https://appleid.apple.com/account/manage
2. Sign in with your Apple ID
3. Security section
4. Click "Generate Password" under App-Specific Passwords
5. Enter label: "GrowthCraft"
6. Copy the password

### Step 2: Configure .env

```env
SMTP_HOST=smtp.mail.me.com
SMTP_PORT=587
SMTP_USER=your-email@icloud.com
SMTP_PASS=your-app-specific-password
```

### Step 3: Test

```bash
cd backend
npm run test:email
```

---

## Option 6: Zoho Mail

### Step 1: Enable IMAP/SMTP

1. Go to: https://mail.zoho.com/zm/#settings/mail/accounts
2. Enable IMAP Access

### Step 2: Configure .env

```env
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=your-email@zoho.com
SMTP_PASS=your-zoho-password
```

### Step 3: Test

```bash
cd backend
npm run test:email
```

---

## Common Issues & Solutions

### Issue 1: "Invalid login" or "Authentication failed"

**Solutions:**
- ✅ Check username is correct (usually full email address)
- ✅ Check password has no extra spaces
- ✅ For Gmail: Use App Password, not regular password
- ✅ For Gmail: Enable 2FA first
- ✅ Check if "Less secure app access" needs to be enabled

### Issue 2: "Connection timeout"

**Solutions:**
- ✅ Check SMTP_HOST is correct
- ✅ Try different port: 587, 465, or 25
- ✅ Check firewall isn't blocking SMTP
- ✅ Try from different network (some ISPs block SMTP)

### Issue 3: "Self-signed certificate"

**Solution:**
Add to `email.service.ts` constructor:

```typescript
this.transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_PORT === 465,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false  // Add this line
  }
});
```

### Issue 4: Emails going to spam

**Solutions:**
- ✅ Use professional email service (SendGrid, Mailgun)
- ✅ Verify your domain (SPF, DKIM, DMARC records)
- ✅ Use a dedicated sending domain
- ✅ Avoid spam trigger words
- ✅ Include unsubscribe link
- ✅ Warm up your sending domain gradually

### Issue 5: "Daily sending limit exceeded"

**Free tier limits:**
- Gmail: 500 emails/day
- Outlook: 300 emails/day
- Yahoo: 500 emails/day

**Solutions:**
- ✅ Upgrade to paid plan
- ✅ Use professional service (SendGrid, Mailgun)
- ✅ Implement email queue with rate limiting

---

## Testing Your Setup

### 1. Test Connection

```bash
cd backend
npm run test:email
```

Expected output:
```
🔍 Testing Email Configuration...

Configuration:
  SMTP Host: smtp.gmail.com
  SMTP Port: 587
  SMTP User: your-email@gmail.com
  SMTP Pass: ***mnop
  Frontend URL: http://localhost:3000

Testing SMTP connection...
✅ Email service connected successfully!
```

### 2. Send Test Email

```bash
npm run test:email -- --send your-email@example.com
```

Expected output:
```
✅ Email service connected successfully!
Sending test email to: your-email@example.com...
✅ Test email sent successfully!
📧 Check your inbox (and spam folder)
```

### 3. Test Registration Flow

Start server:
```bash
npm run dev
```

Register user:
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

Check your email for verification link!

---

## Security Checklist

Before going to production:

- [ ] Using App Password (not regular password)
- [ ] SMTP credentials in `.env` (not committed to git)
- [ ] `.env` file in `.gitignore`
- [ ] Using HTTPS for verification links
- [ ] Email templates don't expose sensitive info
- [ ] Rate limiting enabled
- [ ] Monitoring email delivery
- [ ] Domain verification (SPF/DKIM/DMARC)
- [ ] Using professional email service for production

---

## Production Recommendations

### Don't Use Personal Email for Production

Personal email services (Gmail, Outlook, Yahoo) are great for development but not ideal for production:

❌ Daily sending limits
❌ Higher spam rates
❌ No delivery analytics
❌ No dedicated IP
❌ Limited support

### Use Professional Service Instead

✅ **SendGrid** - 100 emails/day free, then $19.95/month
✅ **Mailgun** - 5,000 emails/month free (first 3 months)
✅ **AWS SES** - 62,000 emails/month free (from EC2)
✅ **Brevo** - 300 emails/day free

See `EMAIL_SETUP_GUIDE.md` for setup instructions.

---

## Quick Reference

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-password-16-chars
```

### Outlook
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=app-password
```

### Custom Domain
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
```

---

## Need Help?

1. **Check logs:** `backend/logs/app.log`
2. **Test connection:** `npm run test:email`
3. **Read docs:** `docs/EMAIL_SETUP_GUIDE.md`
4. **Check provider docs:** Gmail, Outlook, etc.
5. **Common issues:** See troubleshooting section above

---

## Summary

1. Choose your email provider (Gmail recommended for dev)
2. Generate App Password (if required)
3. Update `.env` with SMTP credentials
4. Test connection: `npm run test:email`
5. Send test email: `npm run test:email -- --send your-email@example.com`
6. Start server: `npm run dev`
7. Test registration flow
8. Check your inbox!

That's it! Your email verification is ready to use. 🎉
