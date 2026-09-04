# Training Programs API - Complete Testing Resources

## 📦 What You Have

All files are ready for testing the Training Programs API in Postman and with cURL commands.

---

## 🗂️ Files Overview

### 1. **Postman Collection** ⭐
**File**: `backend/postman/Training-Programs-API.postman_collection.json`

**What it contains:**
- 17 pre-configured requests
- All public endpoints (12)
- All protected endpoints (5)
- Environment variables setup
- Request examples with sample data

**How to use:**
1. Import into Postman
2. Set environment variables (`baseUrl`, `authToken`, `programId`)
3. Start testing!

---

### 2. **Complete cURL Examples** 📝
**File**: `TRAINING_PROGRAMS_CURL_EXAMPLES.md`

**What it contains:**
- Every API endpoint with cURL command
- Multiple examples per endpoint
- Expected responses
- Error scenarios
- Complete testing workflow
- Bash test script

**Perfect for:**
- Terminal testing
- CI/CD integration
- Quick verification
- Documentation reference

---

### 3. **Quick Reference Card** 🎯
**File**: `TRAINING_PROGRAMS_QUICK_REFERENCE.md`

**What it contains:**
- One-page API summary
- All endpoints table
- Common commands
- Filter parameters
- Available program slugs
- Quick troubleshooting

**Perfect for:**
- Quick lookup
- Daily reference
- Team onboarding

---

### 4. **Postman Step-by-Step Guide** 📚
**File**: `TRAINING_PROGRAMS_POSTMAN_GUIDE.md`

**What it contains:**
- Detailed Postman setup instructions
- Step-by-step testing guide
- Screenshot expectations
- Troubleshooting in Postman
- Pro tips and tricks

**Perfect for:**
- First-time Postman users
- Detailed walkthrough
- Visual learners

---

### 5. **Quick Start Guide** ⚡
**File**: `TRAINING_PROGRAMS_QUICK_START.md`

**What it contains:**
- 5-minute setup
- Common API calls
- Quick verification
- Frontend integration examples

**Perfect for:**
- Getting started fast
- Frontend developers
- Quick demos

---

### 6. **Full API Documentation** 📖
**File**: `TRAINING_PROGRAMS_API.md`

**What it contains:**
- Complete API specification
- All endpoints documented
- Request/response schemas
- Database models
- Error codes
- Testing examples

**Perfect for:**
- Complete reference
- API contract
- Frontend integration

---

### 7. **Implementation Summary** 🔧
**File**: `TRAINING_PROGRAMS_IMPLEMENTATION_SUMMARY.md`

**What it contains:**
- What was built
- Architecture details
- Files created/modified
- Features implemented
- Next steps

**Perfect for:**
- Technical overview
- Code review
- Project documentation

---

## 🚀 Quick Start (Choose Your Path)

### Path A: Postman Testing (Recommended for Manual Testing)

```bash
# Step 1: Seed database
cd backend
npx ts-node scripts/seed-training-programs.ts

# Step 2: Start server
npm run dev

# Step 3: Follow Postman guide
# Open: TRAINING_PROGRAMS_POSTMAN_GUIDE.md
# Import collection from: postman/Training-Programs-API.postman_collection.json
```

---

### Path B: cURL Testing (Recommended for Automation)

```bash
# Step 1: Seed database
cd backend
npx ts-node scripts/seed-training-programs.ts

# Step 2: Start server
npm run dev

# Step 3: Follow cURL examples
# Open: TRAINING_PROGRAMS_CURL_EXAMPLES.md
# Copy and paste commands
```

---

### Path C: Quick Demo

```bash
# Step 1: Seed database
cd backend
npx ts-node scripts/seed-training-programs.ts

# Step 2: Start server
npm run dev

# Step 3: Test in browser
# Open: http://localhost:3000/api/v1/training-programs
```

---

## 📋 Testing Checklist

### Pre-Testing Setup
- [ ] Database seeded (12 programs)
- [ ] Server running on port 3000
- [ ] MongoDB connected
- [ ] Postman installed (if using Postman)

### Public Endpoints (No Auth Required)
- [ ] **List Programs**: `GET /training-programs`
- [ ] **Filter by Domain**: `GET /training-programs?domain=Web Development`
- [ ] **Filter by Level**: `GET /training-programs?level=Beginner`
- [ ] **Search**: `GET /training-programs?search=react`
- [ ] **Get Domains**: `GET /training-programs/filters/domains`
- [ ] **Popular Programs**: `GET /training-programs/popular`
- [ ] **Get by Slug**: `GET /training-programs/full-stack-web-development`
- [ ] **Similar Programs**: `GET /training-programs/:slug/similar`
- [ ] **Full Details**: `GET /training-programs/:slug/details`
- [ ] **Overview**: `GET /training-programs/:slug/overview`
- [ ] **Syllabus**: `GET /training-programs/:slug/syllabus`
- [ ] **Mentors**: `GET /training-programs/:slug/mentors`
- [ ] **FAQs**: `GET /training-programs/:slug/faqs`

### Protected Endpoints (Auth Required)
- [ ] Login and get JWT token
- [ ] Save token in Postman/environment
- [ ] **Enroll**: `POST /training-programs/:id/enroll`
- [ ] **Request Callback**: `POST /training-programs/:id/request-callback`
- [ ] **My Enrollments**: `GET /training-programs/enrollments/my-enrollments`
- [ ] **My Callbacks**: `GET /training-programs/callbacks/my-requests`
- [ ] **Enrollment Status**: `GET /training-programs/:id/enrollment-status`

### Error Scenarios
- [ ] 404 - Invalid program ID
- [ ] 401 - No auth token
- [ ] 409 - Duplicate enrollment
- [ ] 400 - Invalid request body

---

## 🎯 Most Common Test Cases

### Test Case 1: Browse Programs
```bash
curl http://localhost:3000/api/v1/training-programs
```
**Expected**: 200 OK, 12 programs returned

---

### Test Case 2: Filter Programs
```bash
curl "http://localhost:3000/api/v1/training-programs?domain=Web%20Development&level=Intermediate"
```
**Expected**: 200 OK, filtered programs

---

### Test Case 3: Get Program Details
```bash
curl http://localhost:3000/api/v1/training-programs/full-stack-web-development/details
```
**Expected**: 200 OK, complete details with overview, syllabus, mentors, FAQs

---

### Test Case 4: Search Programs
```bash
curl "http://localhost:3000/api/v1/training-programs?search=react"
```
**Expected**: 200 OK, programs matching "react"

---

### Test Case 5: Enroll in Program (with auth)
```bash
curl -X POST http://localhost:3000/api/v1/training-programs/PROGRAM_ID/enroll \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com","phone":"+919876543210"}'
```
**Expected**: 201 Created, enrollment confirmed

---

### Test Case 6: Check Enrollment Status
```bash
curl http://localhost:3000/api/v1/training-programs/PROGRAM_ID/enrollment-status \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Expected**: 200 OK, `{"isEnrolled": true, "hasCallbackRequest": false}`

---

## 📊 Available Test Data

After seeding, you'll have these programs:

| Slug | Title | Duration | Level | Price |
|------|-------|----------|-------|-------|
| `full-stack-web-development` | Full-Stack Web Development | 60 days | Intermediate | ₹12,999 |
| `uiux-design-internship` | UI/UX Design | 30 days | Beginner | ₹9,999 |
| `data-science-analytics` | Data Science & Analytics | 60 days | Intermediate | ₹14,999 |
| `devops-cloud-engineering` | DevOps & Cloud Engineering | 40 days | Advanced | ₹15,999 |
| `mobile-app-development` | Mobile App Development | 40 days | Intermediate | ₹13,999 |
| `digital-marketing-growth` | Digital Marketing & Growth | 30 days | Beginner | ₹8,999 |
| `ai-machine-learning` | AI & Machine Learning | 60 days | Advanced | ₹16,999 |
| `backend-engineering` | Backend Engineering | 40 days | Intermediate | ₹13,999 |
| `cybersecurity-internship` | Cybersecurity | 60 days | Advanced | ₹14,999 |
| `product-management` | Product Management | 30 days | Intermediate | ₹11,999 |
| `game-development` | Game Development | 40 days | Intermediate | ₹15,999 |
| `blockchain-development` | Blockchain Development | 60 days | Advanced | ₹17,999 |

---

## 🔧 Environment Setup for Postman

### Variables to Set

| Variable | Value | Notes |
|----------|-------|-------|
| `baseUrl` | `http://localhost:3000/api/v1` | Base API URL |
| `authToken` | *Get from login* | JWT token |
| `programId` | *Get from list API* | MongoDB ObjectId |

### How to Get Values

**Get `programId`:**
1. Send request: "Get All Programs"
2. Copy any `_id` from response
3. Set as `programId` variable

**Get `authToken`:**
1. Login via your auth endpoint
2. Copy `token` from response
3. Set as `authToken` variable

---

## 🐛 Common Issues & Solutions

### Issue: "Training program not found"
**Solution**: 
```bash
npx ts-node scripts/seed-training-programs.ts
```

### Issue: "Unauthorized"
**Solution**: Get fresh token from login

### Issue: "Already enrolled"
**Solution**: Use different program or user

### Issue: Server not responding
**Solution**: 
```bash
npm run dev
```

### Issue: MongoDB connection error
**Solution**: Check MongoDB is running

---

## 📸 What Success Looks Like

### Successful Setup
```
✓ Database seeded: 12 programs
✓ Server running: Port 3000
✓ MongoDB connected
✓ All routes registered
```

### Successful API Call
```
Status: 200 OK
Time: 45ms
Size: 12.5 KB
Body: { "success": true, ... }
```

### Successful Enrollment
```
Status: 201 Created
Message: "Successfully enrolled..."
Status: "pending"
```

---

## 🎓 Learning Resources

### For Beginners
1. Start with: `TRAINING_PROGRAMS_QUICK_START.md`
2. Then read: `TRAINING_PROGRAMS_QUICK_REFERENCE.md`
3. Follow: `TRAINING_PROGRAMS_POSTMAN_GUIDE.md`

### For Developers
1. Read: `TRAINING_PROGRAMS_API.md`
2. Review: `TRAINING_PROGRAMS_IMPLEMENTATION_SUMMARY.md`
3. Use: `TRAINING_PROGRAMS_CURL_EXAMPLES.md`

### For QA/Testers
1. Import: Postman collection
2. Follow: `TRAINING_PROGRAMS_POSTMAN_GUIDE.md`
3. Reference: `TRAINING_PROGRAMS_QUICK_REFERENCE.md`

---

## 📞 Support

### Documentation Files (All in `backend/`)

| File | Size | Purpose |
|------|------|---------|
| `TRAINING_PROGRAMS_API.md` | ~15 KB | Complete API docs |
| `TRAINING_PROGRAMS_CURL_EXAMPLES.md` | ~25 KB | All cURL commands |
| `TRAINING_PROGRAMS_QUICK_REFERENCE.md` | ~8 KB | Quick lookup |
| `TRAINING_PROGRAMS_POSTMAN_GUIDE.md` | ~18 KB | Postman walkthrough |
| `TRAINING_PROGRAMS_QUICK_START.md` | ~10 KB | 5-min setup |
| `TRAINING_PROGRAMS_IMPLEMENTATION_SUMMARY.md` | ~12 KB | Technical details |
| `postman/Training-Programs-API.postman_collection.json` | ~12 KB | Postman collection |

---

## ✅ Final Checklist

- [ ] All 7 documentation files reviewed
- [ ] Postman collection imported
- [ ] Environment variables configured
- [ ] Database seeded successfully
- [ ] Server running
- [ ] At least 5 public endpoints tested
- [ ] Auth token obtained
- [ ] At least 2 protected endpoints tested
- [ ] Error scenarios verified
- [ ] Team members can access APIs

---

## 🎉 You're Ready!

You now have everything needed to:
- ✅ Test all 17 API endpoints
- ✅ Use Postman for manual testing
- ✅ Use cURL for automation
- ✅ Understand complete API structure
- ✅ Troubleshoot common issues
- ✅ Onboard team members
- ✅ Integrate with frontend

**Happy Testing! 🚀**

---

**Quick Access:**
- 📦 Postman: `postman/Training-Programs-API.postman_collection.json`
- 📝 cURL: `TRAINING_PROGRAMS_CURL_EXAMPLES.md`
- 🎯 Reference: `TRAINING_PROGRAMS_QUICK_REFERENCE.md`
- 📚 Guide: `TRAINING_PROGRAMS_POSTMAN_GUIDE.md`
