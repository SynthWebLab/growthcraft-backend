# 🚀 Quick Test Guide - Batch Update APIs

## ✅ Server is Running!
- Server URL: `http://localhost:5002`
- MongoDB: Connected ✅
- Redis: Connected ✅

## 🔐 Authentication (HttpOnly Cookies)

Your auth system uses HttpOnly cookies for security, so tokens aren't returned in the response body.

### OPS User Credentials
```
Email: ops@growthcraft.com
Password: Ops@123456
Role: ops (has access to batch APIs)
```

---

## 📱 Testing with Postman (RECOMMENDED)

### Step 1: Login
1. Open Postman
2. Create a new request:
   - **Method:** POST
   - **URL:** `http://localhost:5002/api/v1/auth/login`
   - **Headers:** `Content-Type: application/json`
   - **Body (raw JSON):**
   ```json
   {
     "email": "ops@growthcraft.com",
     "password": "Ops@123456"
   }
   ```
3. Click **Send**
4. ✅ Postman will automatically store the cookies

### Step 2: Get Batches
1. Create a new request:
   - **Method:** GET
   - **URL:** `http://localhost:5002/api/v1/admin/batches`
2. Click **Send**
3. ✅ Cookies are sent automatically

### Step 3: Update Batch Venue
1. First, get a batch ID from the previous request
2. Create a new request:
   - **Method:** PATCH
   - **URL:** `http://localhost:5002/api/v1/admin/batches/{BATCH_ID}`
   - **Headers:** `Content-Type: application/json`
   - **Body (raw JSON):**
   ```json
   {
     "venue": "Building A, Room 101 - Updated via Postman"
   }
   ```
3. Click **Send**

### Step 4: Update Batch Status
```json
{
  "status": "Open"
}
```

### Step 5: Assign Mentor
- **Method:** PATCH
- **URL:** `http://localhost:5002/api/v1/admin/batches/{BATCH_ID}/mentor`
- **Body:**
```json
{
  "mentorId": "{VALID_MENTOR_ID}"
}
```

---

## 🧪 Automated Test (Direct Database)

Since the auth uses cookies, use the automated test script that bypasses HTTP:

```bash
npx ts-node -r tsconfig-paths/register scripts/test-batch-updates.ts
```

This script:
- ✅ Tests all batch update functionality
- ✅ Tests status transitions
- ✅ Tests mentor assignment
- ✅ Tests notification creation
- ✅ Runs directly against database

**Result:** All tests PASSED ✅

---

## 📋 Test Status Summary

### ✅ What's Working:
1. Server is running on port 5002
2. MongoDB connected
3. Redis connected
4. OPS user exists with correct credentials
5. Login endpoint working (returns cookies)
6. All batch service methods tested and working
7. Status transitions enforced correctly
8. Notifications created successfully

### ⚠️  Note about Authentication:
- Tokens are sent as **HttpOnly cookies** (more secure)
- Cookies are NOT visible in response body
- Use Postman/browser (handles cookies automatically)
- Or use the automated test script (bypasses HTTP)

---

## 🎯 Quick Postman Test Sequence

1. **Login** → POST `/api/v1/auth/login` with ops credentials
2. **List Batches** → GET `/api/v1/admin/batches`
3. **Get Batch** → GET `/api/v1/admin/batches/{id}`
4. **Update Venue** → PATCH `/api/v1/admin/batches/{id}` with `{"venue":"New Location"}`
5. **Update Status** → PATCH `/api/v1/admin/batches/{id}` with `{"status":"Open"}`
6. **Assign Mentor** → PATCH `/api/v1/admin/batches/{id}/mentor` with `{"mentorId":"..."}`

---

## 🐛 Troubleshooting

### "User validation failed: role: `admin` is not a valid enum value"
✅ **FIXED** - Use `ops@growthcraft.com` instead (admin role deprecated)

### "Authentication error"
- Make sure you logged in first in Postman
- Postman will handle cookies automatically
- Don't manually copy/paste tokens (they're in cookies)

### "Batch not found"
- Use GET `/api/v1/admin/batches` to get valid batch IDs first
- Or run the test script to create a test batch

---

## ✨ Ready to Test!

Everything is set up and working. Use Postman for manual testing or run the automated test script.

**Server URL:** http://localhost:5002  
**Login:** ops@growthcraft.com / Ops@123456  
**Batch APIs:** `/api/v1/admin/batches`

🎉 Happy Testing!
