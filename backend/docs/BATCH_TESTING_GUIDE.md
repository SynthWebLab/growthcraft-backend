# Batch Management Testing Guide

This guide helps you test the Batch Management API endpoints.

## Prerequisites

1. **Backend server running**: `npm run dev` in the backend directory
2. **Database connection**: MongoDB and Redis must be running
3. **Authentication**: You need a valid JWT token with SuperAdmin or Ops role for admin endpoints
4. **Test data**: At least one course, training program, or bootcamp in the database

## Setup

### 1. Get Authentication Token

First, authenticate as a user with SuperAdmin or Ops role:

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

Save the `access_token` from the response.

### 2. Get a Course/Bootcamp ID

You need a valid parent entity ID to create a batch:

```bash
# Get courses
curl http://localhost:3000/api/v1/courses

# Or get bootcamps
curl http://localhost:3000/api/v1/bootcamps
```

Save a course/bootcamp `_id` to use as `parentId`.

## Testing Admin Endpoints

### Test 1: Create a Batch (Auto-generated Code)

```bash
curl -X POST http://localhost:3000/api/v1/admin/batches \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batchType": "Course",
    "parentId": "COURSE_ID_HERE",
    "startDate": "2026-07-01",
    "endDate": "2026-09-30",
    "capacity": 30,
    "fee": 15000,
    "mode": "Online",
    "venue": "Virtual Classroom"
  }'
```

**Expected Result**: Status 201, batch created with auto-generated code like `AAMD-20260701`

### Test 2: Create a Batch (Custom Code)

```bash
curl -X POST http://localhost:3000/api/v1/admin/batches \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batchType": "Course",
    "parentId": "COURSE_ID_HERE",
    "startDate": "2026-08-01",
    "endDate": "2026-10-31",
    "capacity": 25,
    "fee": 12000,
    "mode": "Hybrid",
    "venue": "Bangalore Campus",
    "code": "DSA-AUG-2026"
  }'
```

**Expected Result**: Status 201, batch created with custom code `DSA-AUG-2026`

### Test 3: List All Batches

```bash
curl -X GET "http://localhost:3000/api/v1/admin/batches?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Result**: Status 200, paginated list of all batches

### Test 4: List Batches with Filters

```bash
# Filter by status
curl -X GET "http://localhost:3000/api/v1/admin/batches?status=Draft" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Filter by course
curl -X GET "http://localhost:3000/api/v1/admin/batches?courseId=COURSE_ID_HERE" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Filter by batch type
curl -X GET "http://localhost:3000/api/v1/admin/batches?batchType=Course" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Result**: Status 200, filtered list of batches

### Test 5: Get Batch by ID

```bash
curl -X GET http://localhost:3000/api/v1/admin/batches/BATCH_ID_HERE \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Result**: Status 200, detailed batch information with populated references

### Test 6: Update Batch Status to Open

```bash
curl -X PATCH http://localhost:3000/api/v1/admin/batches/BATCH_ID_HERE \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Open"
  }'
```

**Expected Result**: Status 200, batch status updated to "Open" (now publicly visible)

### Test 7: Update Batch Details

```bash
curl -X PATCH http://localhost:3000/api/v1/admin/batches/BATCH_ID_HERE \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "capacity": 35,
    "fee": 16000,
    "mode": "Hybrid",
    "venue": "Online + Delhi Campus"
  }'
```

**Expected Result**: Status 200, batch details updated

### Test 8: Assign Mentor to Batch

```bash
curl -X PATCH http://localhost:3000/api/v1/admin/batches/BATCH_ID_HERE/mentor \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mentorId": "MENTOR_ID_HERE"
  }'
```

**Expected Result**: Status 200, mentor assigned to batch

**Note**: Mentor notification will be added in Epic 14

## Testing Public Endpoints

### Test 9: List Public Batches (No Auth)

```bash
curl -X GET "http://localhost:3000/api/v1/batches?page=1&limit=10"
```

**Expected Result**: Status 200, list of batches with status "Open" or "Filling" and future start dates

### Test 10: List Public Batches by Course

```bash
curl -X GET "http://localhost:3000/api/v1/batches?courseId=COURSE_ID_HERE"
```

**Expected Result**: Status 200, filtered list of available batches for the course

### Test 11: Verify Draft Batches Are Not Public

Create a batch with status "Draft" (Test 1 or 2), then:

```bash
# This should NOT include the draft batch
curl -X GET "http://localhost:3000/api/v1/batches?courseId=COURSE_ID_HERE"
```

**Expected Result**: Draft batch is not in the public list

## Testing Validation and Error Handling

### Test 12: Create Batch with Invalid Data

```bash
# Missing required fields
curl -X POST http://localhost:3000/api/v1/admin/batches \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batchType": "Course"
  }'
```

**Expected Result**: Status 400, validation errors for missing fields

### Test 13: Create Batch with Invalid Date Range

```bash
curl -X POST http://localhost:3000/api/v1/admin/batches \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batchType": "Course",
    "parentId": "COURSE_ID_HERE",
    "startDate": "2026-09-30",
    "endDate": "2026-07-01",
    "capacity": 30,
    "fee": 15000,
    "mode": "Online"
  }'
```

**Expected Result**: Status 400, validation error "End date must be on or after start date"

### Test 14: Create Batch with Duplicate Code

```bash
# First create a batch with code "TEST-2026"
curl -X POST http://localhost:3000/api/v1/admin/batches \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batchType": "Course",
    "parentId": "COURSE_ID_HERE",
    "startDate": "2026-07-01",
    "endDate": "2026-09-30",
    "capacity": 30,
    "fee": 15000,
    "mode": "Online",
    "code": "TEST-2026"
  }'

# Try to create another batch with the same code
curl -X POST http://localhost:3000/api/v1/admin/batches \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batchType": "Course",
    "parentId": "COURSE_ID_HERE",
    "startDate": "2026-08-01",
    "endDate": "2026-10-31",
    "capacity": 25,
    "fee": 12000,
    "mode": "Online",
    "code": "TEST-2026"
  }'
```

**Expected Result**: Second request returns status 400, error "Batch code 'TEST-2026' is already in use"

### Test 15: Reduce Capacity Below Enrolled Count

First, you'll need to manually set `enrolledCount` in the database (or wait for enrollment feature), then:

```bash
curl -X PATCH http://localhost:3000/api/v1/admin/batches/BATCH_ID_HERE \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "capacity": 5
  }'
```

**Expected Result**: If enrolled count is > 5, status 400 with error "Capacity cannot be less than current enrolled count"

### Test 16: Access Admin Endpoint Without Auth

```bash
curl -X GET http://localhost:3000/api/v1/admin/batches
```

**Expected Result**: Status 401, "Authentication required"

### Test 17: Access Admin Endpoint with Wrong Role

Login as a student or mentor (not SuperAdmin/Ops), then:

```bash
curl -X GET http://localhost:3000/api/v1/admin/batches \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

**Expected Result**: Status 403, "You do not have permission to access this resource"

## Complete Workflow Test

Follow this complete workflow to test the entire feature:

```bash
# 1. Create a batch (Draft status)
BATCH_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/admin/batches \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batchType": "Course",
    "parentId": "COURSE_ID_HERE",
    "startDate": "2026-07-01",
    "endDate": "2026-09-30",
    "capacity": 30,
    "fee": 15000,
    "mode": "Online",
    "venue": "Virtual Classroom"
  }')

echo "Batch created: $BATCH_RESPONSE"

# Extract batch ID (use jq if available)
BATCH_ID=$(echo $BATCH_RESPONSE | jq -r '.data.batch._id')

# 2. Verify batch is NOT in public list
curl -s http://localhost:3000/api/v1/batches | jq

# 3. Update batch status to Open
curl -s -X PATCH http://localhost:3000/api/v1/admin/batches/$BATCH_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "Open"}' | jq

# 4. Verify batch IS now in public list
curl -s http://localhost:3000/api/v1/batches | jq

# 5. Assign mentor
curl -s -X PATCH http://localhost:3000/api/v1/admin/batches/$BATCH_ID/mentor \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mentorId": "MENTOR_ID_HERE"}' | jq

# 6. Get batch details
curl -s http://localhost:3000/api/v1/admin/batches/$BATCH_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" | jq
```

## Using Postman

Import the Postman collection from `postman/Batch-Management-Examples.json`:

1. Open Postman
2. Click "Import"
3. Select the `Batch-Management-Examples.json` file
4. Set the `baseUrl` variable to your server URL (default: `http://localhost:3000`)
5. Add your JWT token to the collection/environment variables
6. Run the requests in order

## Troubleshooting

### "Authentication required" error
- Ensure you have a valid JWT token
- Check that the token is not expired
- Verify the token is included in the Authorization header: `Authorization: Bearer YOUR_TOKEN`

### "You do not have permission" error
- Verify your user has SuperAdmin or Ops role
- Check the user.constants.ts file to ensure roles are properly defined

### "Batch code already in use" error
- Use a different custom code or let the system auto-generate one
- Check existing batches to see which codes are already used

### "Invalid ObjectId format" error
- Ensure the parentId/mentorId is a valid MongoDB ObjectId
- Check that the ID exists in the database

### "End date must be on or after start date" error
- Verify your date format is correct (ISO 8601: YYYY-MM-DD)
- Ensure endDate >= startDate

## Next Steps

After verifying all tests pass:

1. Test with real mentor profiles once mentor registration is implemented
2. Test enrollment flow integration (Epic for course enrollment)
3. Implement and test mentor notifications (Epic 14)
4. Test automatic status transitions based on capacity and dates
5. Add batch analytics and reporting features
