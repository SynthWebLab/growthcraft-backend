# Training Programs API - cURL Examples

Complete list of cURL commands for testing all Training Programs APIs.

## Prerequisites

1. **Seed the database first:**
   ```bash
   cd backend
   npx ts-node scripts/seed-training-programs.ts
   ```

2. **Start the server:**
   ```bash
   npm run dev
   ```

3. **Get a program ID** (for enrollment/callback):
   - Run the "Get All Programs" command
   - Copy an `_id` from the response
   - Replace `YOUR_PROGRAM_ID` in commands below

4. **Get auth token** (for protected routes):
   - Login using your auth endpoint
   - Copy the JWT token
   - Replace `YOUR_AUTH_TOKEN` in commands below

---

## PUBLIC ENDPOINTS (No Authentication Required)

### 1. Get All Training Programs

```bash
curl -X GET "http://localhost:3000/api/v1/training-programs" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Training programs retrieved successfully",
  "data": {
    "programs": [...],
    "total": 12,
    "page": 1,
    "totalPages": 1
  }
}
```

---

### 2. Get Programs with Filters

#### Filter by Domain
```bash
curl -X GET "http://localhost:3000/api/v1/training-programs?domain=Web%20Development" \
  -H "Content-Type: application/json"
```

#### Filter by Level
```bash
curl -X GET "http://localhost:3000/api/v1/training-programs?level=Beginner" \
  -H "Content-Type: application/json"
```

#### Filter by Status
```bash
curl -X GET "http://localhost:3000/api/v1/training-programs?status=active" \
  -H "Content-Type: application/json"
```

#### Multiple Filters + Pagination
```bash
curl -X GET "http://localhost:3000/api/v1/training-programs?domain=Web%20Development&level=Intermediate&page=1&limit=6" \
  -H "Content-Type: application/json"
```

#### Sort by Price (Ascending)
```bash
curl -X GET "http://localhost:3000/api/v1/training-programs?sortBy=price&sortOrder=asc" \
  -H "Content-Type: application/json"
```

#### Sort by Rating (Descending)
```bash
curl -X GET "http://localhost:3000/api/v1/training-programs?sortBy=rating&sortOrder=desc" \
  -H "Content-Type: application/json"
```

---

### 3. Search Programs

```bash
curl -X GET "http://localhost:3000/api/v1/training-programs?search=react%20development" \
  -H "Content-Type: application/json"
```

**Other search examples:**
```bash
# Search for "data science"
curl -X GET "http://localhost:3000/api/v1/training-programs?search=data%20science" \
  -H "Content-Type: application/json"

# Search for "AI"
curl -X GET "http://localhost:3000/api/v1/training-programs?search=AI" \
  -H "Content-Type: application/json"

# Search for "design"
curl -X GET "http://localhost:3000/api/v1/training-programs?search=design" \
  -H "Content-Type: application/json"
```

---

### 4. Get All Domains

```bash
curl -X GET "http://localhost:3000/api/v1/training-programs/filters/domains" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Domains retrieved successfully",
  "data": {
    "domains": [
      "Web Development",
      "Design",
      "Data Science",
      "DevOps",
      "Mobile Development",
      "Marketing",
      "Artificial Intelligence",
      "Backend Development",
      "Cybersecurity",
      "Product Management",
      "Game Development",
      "Blockchain"
    ]
  }
}
```

---

### 5. Get Popular Programs

```bash
curl -X GET "http://localhost:3000/api/v1/training-programs/popular?limit=6" \
  -H "Content-Type: application/json"
```

**With different limit:**
```bash
# Top 3 programs
curl -X GET "http://localhost:3000/api/v1/training-programs/popular?limit=3" \
  -H "Content-Type: application/json"

# Top 10 programs
curl -X GET "http://localhost:3000/api/v1/training-programs/popular?limit=10" \
  -H "Content-Type: application/json"
```

---

### 6. Get Program by Slug

```bash
curl -X GET "http://localhost:3000/api/v1/training-programs/full-stack-web-development" \
  -H "Content-Type: application/json"
```

**Other program slugs to try:**
```bash
# UI/UX Design
curl -X GET "http://localhost:3000/api/v1/training-programs/uiux-design-internship" \
  -H "Content-Type: application/json"

# Data Science
curl -X GET "http://localhost:3000/api/v1/training-programs/data-science-analytics" \
  -H "Content-Type: application/json"

# AI & ML
curl -X GET "http://localhost:3000/api/v1/training-programs/ai-machine-learning" \
  -H "Content-Type: application/json"

# Mobile Development
curl -X GET "http://localhost:3000/api/v1/training-programs/mobile-app-development" \
  -H "Content-Type: application/json"
```

---

### 7. Get Similar Programs

```bash
curl -X GET "http://localhost:3000/api/v1/training-programs/full-stack-web-development/similar?limit=4" \
  -H "Content-Type: application/json"
```

---

### 8. Get Complete Program Details

```bash
curl -X GET "http://localhost:3000/api/v1/training-programs/full-stack-web-development/details" \
  -H "Content-Type: application/json"
```

**Expected Response Structure:**
```json
{
  "success": true,
  "message": "Training program details retrieved successfully",
  "data": {
    "programDetails": {
      "overview": {
        "aboutProgram": "...",
        "whatYouWillLearn": [...],
        "prerequisites": [...],
        "whatsIncluded": [...]
      },
      "syllabus": [...],
      "mentors": [...],
      "faqs": [...]
    }
  }
}
```

---

### 9. Get Program Overview Only

```bash
curl -X GET "http://localhost:3000/api/v1/training-programs/full-stack-web-development/overview" \
  -H "Content-Type: application/json"
```

---

### 10. Get Program Syllabus Only

```bash
curl -X GET "http://localhost:3000/api/v1/training-programs/full-stack-web-development/syllabus" \
  -H "Content-Type: application/json"
```

---

### 11. Get Program Mentors Only

```bash
curl -X GET "http://localhost:3000/api/v1/training-programs/full-stack-web-development/mentors" \
  -H "Content-Type: application/json"
```

---

### 12. Get Program FAQs Only

```bash
curl -X GET "http://localhost:3000/api/v1/training-programs/full-stack-web-development/faqs" \
  -H "Content-Type: application/json"
```

---

## PROTECTED ENDPOINTS (Authentication Required)

⚠️ **Important:** Replace `YOUR_AUTH_TOKEN` and `YOUR_PROGRAM_ID` with actual values.

### 13. Enroll in Training Program

```bash
curl -X POST "http://localhost:3000/api/v1/training-programs/YOUR_PROGRAM_ID/enroll" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+919876543210"
  }'
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Successfully enrolled in the training program. We will get back to you soon!",
  "data": {
    "enrollment": {
      "_id": "...",
      "userId": "...",
      "programId": "...",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+919876543210",
      "title": "Full-Stack Web Development Internship",
      "status": "pending",
      "paymentStatus": "pending",
      "enrollmentDate": "2026-06-15T10:30:00.000Z"
    }
  }
}
```

**Error Response (Already Enrolled):**
```json
{
  "success": false,
  "message": "You are already enrolled in this training program",
  "error": {
    "statusCode": 409,
    "code": "CONFLICT"
  }
}
```

---

### 14. Request Callback

```bash
curl -X POST "http://localhost:3000/api/v1/training-programs/YOUR_PROGRAM_ID/request-callback" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Smith",
    "email": "jane.smith@example.com",
    "phone": "+919123456789"
  }'
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Thank you! We will get back to you soon within 24 hours.",
  "data": {
    "callbackRequest": {
      "_id": "...",
      "userId": "...",
      "programId": "...",
      "fullName": "Jane Smith",
      "email": "jane.smith@example.com",
      "phone": "+919123456789",
      "title": "Full-Stack Web Development Internship",
      "status": "pending",
      "requestDate": "2026-06-15T10:30:00.000Z"
    }
  }
}
```

---

### 15. Get My Enrollments

```bash
curl -X GET "http://localhost:3000/api/v1/training-programs/enrollments/my-enrollments" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Enrollments retrieved successfully",
  "data": {
    "enrollments": [
      {
        "_id": "...",
        "programId": {
          "_id": "...",
          "title": "Full-Stack Web Development Internship",
          "slug": "full-stack-web-development",
          "thumbnail": "/images/programs/full-stack.jpg",
          "price": 12999,
          "domain": "Web Development",
          "level": "Intermediate",
          "durationDays": 60
        },
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "status": "confirmed",
        "paymentStatus": "completed",
        "enrollmentDate": "2026-06-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

### 16. Get My Callback Requests

```bash
curl -X GET "http://localhost:3000/api/v1/training-programs/callbacks/my-requests" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

---

### 17. Check Enrollment Status

```bash
curl -X GET "http://localhost:3000/api/v1/training-programs/YOUR_PROGRAM_ID/enrollment-status" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Enrollment status retrieved successfully",
  "data": {
    "isEnrolled": true,
    "hasCallbackRequest": false
  }
}
```

---

## COMPLETE TESTING WORKFLOW

### Step 1: Get All Programs and Save a Program ID

```bash
# Get all programs
curl -X GET "http://localhost:3000/api/v1/training-programs" \
  -H "Content-Type: application/json" | jq '.data.programs[0]._id'

# Copy the _id value and set it
PROGRAM_ID="paste_the_id_here"
```

### Step 2: Get Program Details

```bash
# Get basic info
curl -X GET "http://localhost:3000/api/v1/training-programs/full-stack-web-development" \
  -H "Content-Type: application/json"

# Get complete details
curl -X GET "http://localhost:3000/api/v1/training-programs/full-stack-web-development/details" \
  -H "Content-Type: application/json"
```

### Step 3: Login and Get Token

```bash
# Login (use your existing auth endpoint)
curl -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your.email@example.com",
    "password": "your_password"
  }' | jq '.data.token'

# Copy the token
AUTH_TOKEN="paste_token_here"
```

### Step 4: Enroll in Program

```bash
curl -X POST "http://localhost:3000/api/v1/training-programs/$PROGRAM_ID/enroll" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "+919876543210"
  }'
```

### Step 5: Check Enrollment Status

```bash
curl -X GET "http://localhost:3000/api/v1/training-programs/$PROGRAM_ID/enrollment-status" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

### Step 6: Get My Enrollments

```bash
curl -X GET "http://localhost:3000/api/v1/training-programs/enrollments/my-enrollments" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

---

## QUICK TEST SCRIPT

Save this as `test-training-programs.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"

echo "=== Testing Training Programs API ==="
echo ""

echo "1. Getting all programs..."
curl -s "$BASE_URL/training-programs" | jq '.data.total'
echo ""

echo "2. Getting popular programs..."
curl -s "$BASE_URL/training-programs/popular?limit=3" | jq '.data.programs[].title'
echo ""

echo "3. Getting all domains..."
curl -s "$BASE_URL/training-programs/filters/domains" | jq '.data.domains'
echo ""

echo "4. Getting program by slug..."
curl -s "$BASE_URL/training-programs/full-stack-web-development" | jq '.data.program.title'
echo ""

echo "5. Getting program details..."
curl -s "$BASE_URL/training-programs/full-stack-web-development/details" | jq '.data.programDetails.overview.aboutProgram' | head -c 100
echo "..."
echo ""

echo "6. Searching programs..."
curl -s "$BASE_URL/training-programs?search=web" | jq '.data.programs[].title'
echo ""

echo "=== All tests completed ==="
```

Run it:
```bash
chmod +x test-training-programs.sh
./test-training-programs.sh
```

---

## AVAILABLE PROGRAM SLUGS

Use these slugs in your API calls:

1. `full-stack-web-development`
2. `uiux-design-internship`
3. `data-science-analytics`
4. `devops-cloud-engineering`
5. `mobile-app-development`
6. `digital-marketing-growth`
7. `ai-machine-learning`
8. `backend-engineering`
9. `cybersecurity-internship`
10. `product-management`
11. `game-development`
12. `blockchain-development`

---

## TROUBLESHOOTING

### "Training program not found"
- Make sure you ran the seed script
- Check if MongoDB is running
- Verify the program slug is correct

### "Unauthorized" (401)
- Get a fresh JWT token from login
- Check if token is expired
- Ensure Bearer prefix in Authorization header

### "Validation failed" (400)
- Check request body format
- Ensure all required fields are present
- Verify phone number format (E.164 format recommended)

### "You are already enrolled" (409)
- User already enrolled in this program
- Try a different program or user

---

## POSTMAN COLLECTION

Import the provided Postman collection for easier testing:

**File**: `backend/postman/Training-Programs-API.postman_collection.json`

**Variables to set in Postman:**
- `baseUrl`: `http://localhost:3000/api/v1`
- `authToken`: Your JWT token after login
- `programId`: A program ID from the database

---

**Need help?** Check the full API documentation in `TRAINING_PROGRAMS_API.md`
