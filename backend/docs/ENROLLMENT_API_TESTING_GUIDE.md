# Enrollment API Testing Guide (GC-601-T2)

## Overview
This guide helps you test the **POST /api/v1/admin/enrollments** endpoint.

---

## Quick Setup

### 1. Import Postman Collection
Import `postman/Enrollment-API-Examples.json` into Postman

### 2. Set Environment Variables
Create a Postman environment with:
```
baseUrl = http://localhost:5002
```

### 3. Start the Server
```bash
cd backend
npm run dev
```

---

## Testing Flow

### Step 1: Get Admin Access Token

**Request:**
```http
POST {{baseUrl}}/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@growthcraft.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "...",
      "role": "SuperAdmin"
    }
  }
}
```

**Save the `accessToken` for subsequent requests.**

---

### Step 2: Get Student ID

**Request:**
```http
GET {{baseUrl}}/api/v1/admin/users?role=Student&limit=5
Authorization: Bearer <admin_token>
```

Or create a new student:
```http
POST {{baseUrl}}/api/v1/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+919876543210",
  "password": "Student@123",
  "role": "Student"
}
```

**Copy the student's `_id`**

---

### Step 3: Get Batch ID

**Request:**
```http
GET {{baseUrl}}/api/v1/admin/batches?status=Open&limit=10
Authorization: Bearer <admin_token>
```

Or create a new batch:
```http
POST {{baseUrl}}/api/v1/admin/batches
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "batchType": "Course",
  "parentId": "<courseId>",
  "startDate": "2026-07-01",
  "endDate": "2026-09-30",
  "capacity": 30,
  "fee": 15000,
  "mode": "Online",
  "venue": "Virtual Classroom"
}
```

**Copy the batch's `_id`**

---

### Step 4: Create Enrollment (Basic)

**Request:**
```http
POST {{baseUrl}}/api/v1/admin/enrollments
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "studentUserId": "<student_id>",
  "batchId": "<batch_id>",
  "feeQuoted": 15000.00
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Enrollment created successfully",
  "data": {
    "enrollment": {
      "_id": "676f3a...",
      "studentUserId": "676e2b...",
      "batchId": "676e1a...",
      "status": "Pending",
      "feeQuoted": "15000.00",
      "feeCollected": "0.00",
      "attendancePercent": 0,
      "avgRubricScore": 0,
      "enrolledAt": "2026-06-08T10:30:00.000Z",
      "completedAt": null,
      "createdAt": "2026-06-08T10:30:00.000Z",
      "updatedAt": "2026-06-08T10:30:00.000Z"
    }
  }
}
```

---

### Step 5: Create Enrollment with Razorpay Payment Link

**Request:**
```http
POST {{baseUrl}}/api/v1/admin/enrollments
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "studentUserId": "<student_id>",
  "batchId": "<batch_id>",
  "feeQuoted": 15000.00,
  "paymentMethod": "razorpay"
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Enrollment created successfully",
  "data": {
    "enrollment": { /* same as above */ },
    "paymentLink": {
      "id": "plink_mock_676f3a...",
      "url": "https://razorpay.com/pay/mock_676f3a...",
      "amount": 15000,
      "currency": "INR",
      "expiresAt": "2026-06-09T10:30:00.000Z"
    }
  }
}
```

**Note:** Payment link is currently a mock. Real Razorpay integration will be in Epic 13.

---

## Verify Database Changes

### 1. Check Enrollment Created
```javascript
// In MongoDB shell or Compass
db.enrollments.findOne({ studentUserId: ObjectId("<student_id>") })
```

Expected:
- `status: "Pending"`
- `feeQuoted: Decimal128("15000.00")`
- `feeCollected: Decimal128("0.00")`

### 2. Check Batch enrolledCount Incremented
```javascript
db.batches.findOne({ _id: ObjectId("<batch_id>") })
```

Expected:
- `enrolledCount` increased by 1

---

## Error Case Testing

### Duplicate Enrollment
Try enrolling the same student in the same batch twice:

**Response (400 Bad Request):**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "errors": [
      {
        "field": "studentUserId",
        "message": "Student is already enrolled in this batch",
        "value": {
          "studentUserId": "...",
          "batchId": "..."
        }
      }
    ]
  }
}
```

### Batch Full (Capacity Reached)
1. Check batch capacity: `db.batches.findOne({ _id: ... })`
2. Enroll students until `enrolledCount >= capacity`
3. Try to enroll one more student

**Response (400 Bad Request):**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "errors": [
      {
        "field": "batchId",
        "message": "Batch WEBDEV-JUL-2026 has reached maximum capacity (30)"
      }
    ]
  }
}
```

### Non-existent Student
**Response (404 Not Found):**
```json
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "statusCode": 404
  }
}
```

### Invalid ObjectId Format
**Response (400 Bad Request):**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "errors": [
      {
        "field": "studentUserId",
        "message": "Invalid studentUserId format"
      }
    ]
  }
}
```

### Unauthorized Access
No token or invalid token:

**Response (401 Unauthorized):**
```json
{
  "error": {
    "message": "No authorization token provided",
    "code": "UNAUTHORIZED",
    "statusCode": 401
  }
}
```

### Forbidden (Non-Admin Role)
Student trying to access admin endpoint:

**Response (403 Forbidden):**
```json
{
  "error": {
    "message": "Access denied. Required roles: SuperAdmin, Ops",
    "code": "FORBIDDEN",
    "statusCode": 403
  }
}
```

---

## Manual Testing Checklist

- [ ] Admin can create enrollment with valid data
- [ ] Enrollment status is set to "Pending"
- [ ] feeCollected is initialized to 0
- [ ] enrolledAt timestamp is set
- [ ] Batch.enrolledCount is incremented atomically
- [ ] Payment link is generated when paymentMethod = "razorpay"
- [ ] Duplicate enrollment is prevented (unique constraint)
- [ ] Batch capacity validation works
- [ ] Non-existent student returns 404
- [ ] Non-existent batch returns 404
- [ ] Invalid ObjectId format returns 400
- [ ] Negative fee returns validation error
- [ ] Fee > 999,999.99 returns validation error
- [ ] Missing required fields returns validation error
- [ ] Unauthorized access returns 401
- [ ] Non-admin role returns 403

---

## Race Condition Testing

To test atomic enrolledCount increment:

1. Use a tool like Apache JMeter or Postman Runner
2. Send 5 concurrent enrollment requests for different students in the same batch
3. Verify `batch.enrolledCount` increased by exactly 5 (not 3 or 7 due to race condition)

**Without atomic increment:** Count might be incorrect  
**With atomic increment (implemented):** Count will be exactly correct

---

## Curl Examples

### Basic Enrollment
```bash
curl -X POST http://localhost:5002/api/v1/admin/enrollments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "studentUserId": "676e2b1234567890abcdef12",
    "batchId": "676e1a1234567890abcdef34",
    "feeQuoted": 15000.00
  }'
```

### With Razorpay Payment Link
```bash
curl -X POST http://localhost:5002/api/v1/admin/enrollments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "studentUserId": "676e2b1234567890abcdef12",
    "batchId": "676e1a1234567890abcdef34",
    "feeQuoted": 15000.00,
    "paymentMethod": "razorpay"
  }'
```

---

## Next Steps After Testing

Once enrollment creation is working:
- **GC-601-T3**: Implement GET endpoints (list enrollments, get by ID)
- **GC-601-T4**: Implement nightly job for computing attendance & rubric scores
- **GC-601-T5**: Integrate with Epic 13 (real Razorpay payment)
- **GC-601-T6**: Implement payment confirmation webhook

---

## Troubleshooting

### Server not starting
```bash
# Check if MongoDB is running
mongosh

# Check if port 5002 is available
netstat -ano | findstr :5002

# Check environment variables
cat backend/.env
```

### Token expired
Re-login to get a new token

### Batch not found
Make sure the batch status is not "Cancelled" or "Completed"

### Student not found
Verify the student exists and has role "Student"
