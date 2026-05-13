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


---

## 🆕 Public Catalogue API Collection

### 📦 New Collection Available!

**File:** `Public-Catalogue-API.postman_collection.json`

Complete collection for public catalogue endpoints (no authentication required):
- **32 API requests** organized into 3 folders
- Courses API (12 requests)
- Bootcamps API (14 requests)
- Real-World Scenarios (6 requests)
- Includes filtering, sorting, search, and pagination

### 🚀 Quick Import

1. Open Postman
2. Click "Import" → "Upload Files"
3. Select `Public-Catalogue-API.postman_collection.json`
4. Done! Start testing immediately

### 📋 What's Included

#### Courses Endpoints
- Get All Courses
- Filter by Category (MERN, UI/UX, DataScience, DevOps)
- Filter by Level (Beginner, Intermediate, Advanced)
- Filter by Price Range
- Filter by Rating
- Search Courses
- Sort by Price/Rating
- Pagination

#### Bootcamps Endpoints
- Get All Bootcamps
- Filter by Status (Open, Closed, Completed)
- Filter by Mode (Online, Offline, Hybrid)
- Filter by Category
- Filter by Price Range
- Search Bootcamps
- Sort by Start Date/Price
- Pagination

#### Real-World Scenarios
- Find Affordable Beginner MERN Courses
- Find Open Online Bootcamps
- Find High-Rated UI/UX Courses
- Find Upcoming Hybrid Bootcamps
- Search JavaScript Learning Options

### ⚙️ Setup

**No authentication required!** Just:

1. **Start Server**
   ```bash
   npm run dev
   ```

2. **Seed Data** (first time only)
   ```bash
   npm run seed:courses
   npm run seed:bootcamps
   ```

3. **Test in Postman**
   - Open any request
   - Click Send
   - See results!

### 🎯 Top 5 Quick Tests

1. **Get All Courses**
   ```
   GET http://localhost:5000/api/v1/courses?limit=10
   ```

2. **Get All Bootcamps**
   ```
   GET http://localhost:5000/api/v1/bootcamps?limit=10
   ```

3. **Get MERN Courses**
   ```
   GET http://localhost:5000/api/v1/courses?category=MERN
   ```

4. **Get Open Bootcamps**
   ```
   GET http://localhost:5000/api/v1/bootcamps?status=Open
   ```

5. **Search JavaScript**
   ```
   GET http://localhost:5000/api/v1/courses?search=javascript
   ```

### 📚 Documentation

- **Import Guide:** `POSTMAN_IMPORT_GUIDE.md` - Detailed instructions
- **Quick Reference:** `../POSTMAN_QUICK_REFERENCE.md` - Copy-paste ready
- **API Docs:** `../PUBLIC_CATALOGUE_API.md` - Complete API reference
- **Testing Guide:** `../API_TESTING_GUIDE.md` - 100+ cURL commands

---

## 🎫 Reservation API Collection

### 📦 New Collection Available!

**File:** `Reservation-API-Examples.json`

Complete collection for seat reservation system:
- **25+ API requests** organized into 6 folders
- Create reservations for courses and bootcamps
- Get reservations by ID or email
- Confirm and cancel reservations
- Test all error scenarios
- No authentication required

### 🚀 Quick Import

1. Open Postman
2. Click "Import" → "Upload Files"
3. Select `Reservation-API-Examples.json`
4. Done! Start testing immediately

### 📋 What's Included

#### 1. Setup (Get IDs)
- Get All Bootcamps
- Get All Courses

#### 2. Create Reservations
- Create Bootcamp Reservation - User 1
- Create Bootcamp Reservation - User 2
- Create Course Reservation
- Create Minimal Reservation

#### 3. Get Reservations
- Get Reservation by ID
- Get Reservations by Email

#### 4. Confirm Reservations
- Confirm Reservation

#### 5. Cancel Reservations
- Cancel Reservation

#### 6. Error Scenarios
- Duplicate Reservation (409)
- Invalid Email (400)
- Invalid Item Type (400)
- Invalid Item ID (400)
- Non-existent Bootcamp (404)
- Confirm Already Confirmed (400)
- Cancel Already Cancelled (400)

### ⚙️ Setup

**No authentication required!** Just:

1. **Start Server**
   ```bash
   npm run dev
   ```

2. **Get Bootcamp/Course IDs**
   ```
   GET http://localhost:5001/api/v1/bootcamps?limit=10
   ```

3. **Create Reservation**
   ```
   POST http://localhost:5001/api/v1/reservations
   Body: { name, email, phone, itemType, itemId }
   ```

### 🎯 Quick Test Flow

1. **Get Bootcamp ID** → Copy `_id` from response
2. **Create Reservation** → Replace `REPLACE_WITH_BOOTCAMP_ID` with actual ID
3. **Get Reservation** → Copy reservation `_id` from create response
4. **Confirm Reservation** → Use reservation ID in URL
5. **Cancel Reservation** → Use different reservation ID

### 📚 Documentation

- **Testing Guide:** `RESERVATION_TESTING_GUIDE.md` - Complete step-by-step guide
- **API Docs:** `../RESERVATION_API.md` - Complete API reference
- **Summary:** `../RESERVATION_API_SUMMARY.md` - Quick overview

### ⚠️ Common Issues

**Issue:** "You already have an active reservation for this bootcamp"  
**Solution:** Use a different email OR different bootcamp ID OR cancel existing reservation

**Issue:** "Route not found"  
**Solution:** Check URL has no trailing newlines - should be exactly `http://localhost:5001/api/v1/reservations`

**Issue:** "Validation failed"  
**Solution:** Body type must be **raw** + **JSON** (not x-www-form-urlencoded)

---

## 📊 All Available Collections

### 1. **Reservation API** ⭐ NEW
- **File:** `Reservation-API-Examples.json`
- **Auth Required:** No
- **Requests:** 25+
- **Use Case:** Seat reservation for courses and bootcamps

### 2. **Public Catalogue API**
- **File:** `Public-Catalogue-API.postman_collection.json`
- **Auth Required:** No
- **Requests:** 32
- **Use Case:** Public course and bootcamp catalogue

### 3. **GrowthCraft Auth APIs**
- **File:** `GrowthCraft-Auth-APIs.postman_collection.json`
- **Auth Required:** Yes (Bearer token)
- **Requests:** 20+
- **Use Case:** User authentication and authorization

### 4. **Individual Test Collections**
- Various JSON files for specific features
- See list above in original documentation

---

## 🎉 Ready to Test!

Choose your collection:
- **Reservation API** → Reserve seats, confirm, cancel ⭐ NEW
- **Public Catalogue** → No auth, test courses/bootcamps
- **Auth APIs** → Test registration, login, verification

Import, test, and explore! 🚀
