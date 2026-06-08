# Enrollment API Testing (GC-601-T2)

## Automated Testing Script

### Run the Automated Test

```bash
npm run test:enrollment
```

This script will:
- ✅ Connect to MongoDB and find a student + batch
- ✅ Login as admin
- ✅ Create a basic enrollment
- ✅ Verify batch enrolledCount incremented
- ✅ Test duplicate enrollment prevention
- ✅ Create enrollment with Razorpay payment link
- ✅ Test validation errors (negative fee, invalid ID)
- ✅ Test unauthorized access
- ✅ Display detailed test results

### Expected Output

```
🚀 Starting Enrollment API Tests

Base URL: http://localhost:5002
MongoDB: mongodb+srv://...
============================================================

📦 Connecting to MongoDB...
✅ Connected to MongoDB

📝 Step 1: Finding a student...
✅ Found student: John Doe (john@example.com)
   Student ID: 676e2b1234567890abcdef12

📝 Step 2: Finding an open batch...
✅ Found batch: WEBDEV-JUL-2026
   Batch ID: 676e1a1234567890abcdef34
   Capacity: 5/30
   Status: Open

📝 Step 3: Logging in as admin...
✅ Login successful

📝 Step 4: Creating basic enrollment...
✅ Enrollment created successfully
   Enrollment ID: 676f3a...
   Status: Pending
   Fee Quoted: 15000.00
   Fee Collected: 0.00

📝 Step 5: Verifying batch enrolledCount...
✅ Batch enrolledCount incremented: 5 → 6

📝 Step 6: Testing duplicate enrollment...
✅ Duplicate enrollment correctly rejected

📝 Step 7: Creating enrollment with Razorpay...
✅ Enrollment with Razorpay payment link created
   Payment Link: https://razorpay.com/pay/mock_...
   Amount: 20000
   Currency: INR

📝 Step 8: Testing validation errors...
✅ Negative fee correctly rejected
✅ Invalid ObjectId correctly rejected

📝 Step 9: Testing unauthorized access...
✅ Unauthorized access correctly rejected

============================================================
📊 TEST SUMMARY
============================================================

Total Tests: 9
✅ Passed: 9
❌ Failed: 0
Success Rate: 100.0%

============================================================
```

---

## Prerequisites

Before running tests:

### 1. Server Must Be Running
```bash
npm run dev
```

### 2. Database Must Have Data
- At least **1 student** (role: "Student")
- At least **1 open batch** (status: "Open" or "Filling")
- **Admin account** (email: admin@growthcraft.com, password: Admin@123)

### 3. Create Test Data (if needed)

**Create Admin:**
```bash
npm run create:admin
```

**Create Student:**
Use registration endpoint or MongoDB:
```javascript
db.users.insertOne({
  fullName: "Test Student",
  email: "test@student.com",
  password: "$2a$12$hashedpassword",
  phone: "+919876543210",
  role: "Student",
  isEmailVerified: true,
  isActive: true,
  refreshTokens: []
})
```

**Create Batch:**
Use batch API or MongoDB:
```javascript
db.batches.insertOne({
  batchType: "Course",
  courseId: ObjectId("..."),
  code: "TEST-BATCH-001",
  startDate: new Date("2026-07-01"),
  endDate: new Date("2026-09-30"),
  capacity: 30,
  enrolledCount: 0,
  status: "Open",
  mode: "Online",
  fee: NumberDecimal("15000.00")
})
```

---

## Manual Testing (Alternative)

If you prefer manual testing, use the Postman collection:

### Import Postman Collection
```
File > Import > backend/postman/Enrollment-API-Examples.json
```

### Set Environment Variable
```
baseUrl = http://localhost:5002
```

### Run Requests in Order
1. Prerequisites > 1. Login as Admin
2. Prerequisites > 3. Get Available Batches
3. Enrollment - Create > Create Enrollment (Basic)
4. Enrollment - Create > Create Enrollment with Razorpay
5. Error Cases > (run all error tests)

---

## Troubleshooting

### Error: No student found
**Solution:**
```bash
# Create a student via registration
curl -X POST http://localhost:5002/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Student",
    "email": "test@student.com",
    "phone": "+919876543210",
    "password": "Student@123",
    "role": "Student"
  }'
```

### Error: No open batch found
**Solution:**
```bash
# Login as admin and create a batch
# (See batch creation API in batch documentation)
```

### Error: Admin login failed
**Solution:**
```bash
npm run create:admin
```

### Error: Connection refused (ECONNREFUSED)
**Solution:**
```bash
# Make sure server is running
npm run dev
```

---

## What the Test Validates

| Test | Validates |
|------|-----------|
| Admin Login | Authentication works |
| Create Basic Enrollment | Enrollment creation with required fields |
| Batch enrolledCount Increment | Atomic counter update (no race conditions) |
| Duplicate Enrollment Prevention | Unique constraint (studentUserId, batchId) |
| Razorpay Payment Link | Payment integration (mock) |
| Negative Fee Validation | Input validation |
| Invalid ObjectId Validation | Format validation |
| Unauthorized Access | Authentication middleware |

---

## Next Steps After Testing

Once all tests pass:
- ✅ Mark GC-601-T2 as complete
- 🔄 Move to GC-601-T3: GET endpoints (list enrollments)
- 🔄 Move to GC-601-T4: Nightly job for metrics
- 🔄 Move to GC-601-T5: Real Razorpay integration (Epic 13)
