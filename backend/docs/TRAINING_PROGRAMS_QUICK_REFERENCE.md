# Training Programs API - Quick Reference Card

## 🚀 Quick Setup

```bash
# 1. Seed database
cd backend && npx ts-node scripts/seed-training-programs.ts

# 2. Start server
npm run dev

# 3. Import Postman collection
# File: backend/postman/Training-Programs-API.postman_collection.json
```

---

## 📋 API Endpoints Summary

### PUBLIC (12 endpoints - No auth required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/training-programs` | List all programs |
| GET | `/training-programs?domain=X&level=Y` | Filter programs |
| GET | `/training-programs?search=keyword` | Search programs |
| GET | `/training-programs/filters/domains` | Get all domains |
| GET | `/training-programs/popular?limit=6` | Popular programs |
| GET | `/training-programs/:slug` | Get program by slug |
| GET | `/training-programs/:slug/similar` | Similar programs |
| GET | `/training-programs/:slug/details` | Complete details |
| GET | `/training-programs/:slug/overview` | Overview only |
| GET | `/training-programs/:slug/syllabus` | Syllabus only |
| GET | `/training-programs/:slug/mentors` | Mentors only |
| GET | `/training-programs/:slug/faqs` | FAQs only |

### PROTECTED (5 endpoints - Auth required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/training-programs/:id/enroll` | Enroll in program |
| POST | `/training-programs/:id/request-callback` | Request callback |
| GET | `/training-programs/enrollments/my-enrollments` | My enrollments |
| GET | `/training-programs/callbacks/my-requests` | My callbacks |
| GET | `/training-programs/:id/enrollment-status` | Check status |

---

## 🔥 Most Used Commands

### Get All Programs
```bash
curl http://localhost:3000/api/v1/training-programs
```

### Filter by Domain
```bash
curl "http://localhost:3000/api/v1/training-programs?domain=Web%20Development"
```

### Get Program Details
```bash
curl http://localhost:3000/api/v1/training-programs/full-stack-web-development/details
```

### Enroll (with auth)
```bash
curl -X POST http://localhost:3000/api/v1/training-programs/PROGRAM_ID/enroll \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"John Doe","email":"john@test.com","phone":"+919876543210"}'
```

---

## 📊 Filter Parameters

| Parameter | Values | Example |
|-----------|--------|---------|
| `domain` | Any domain name | `Web Development`, `Design` |
| `level` | `Beginner`, `Intermediate`, `Advanced` | `?level=Beginner` |
| `status` | `active`, `coming-soon`, `draft` | `?status=active` |
| `search` | Any text | `?search=react` |
| `page` | Number | `?page=1` |
| `limit` | Number | `?limit=12` |
| `sortBy` | `enrollmentCount`, `rating`, `price`, `createdAt` | `?sortBy=rating` |
| `sortOrder` | `asc`, `desc` | `?sortOrder=desc` |

---

## 🎯 Available Program Slugs

1. `full-stack-web-development` - 60 days, ₹12,999
2. `uiux-design-internship` - 30 days, ₹9,999
3. `data-science-analytics` - 60 days, ₹14,999
4. `mobile-app-development` - 40 days, ₹13,999
5. `digital-marketing-growth` - 30 days, ₹8,999
6. `ai-machine-learning` - 60 days, ₹16,999
7. `backend-engineering` - 40 days, ₹13,999
8. `product-management` - 30 days, ₹11,999
9. `blockchain-development` - 60 days, ₹17,999

**Coming Soon:**
- `devops-cloud-engineering`
- `cybersecurity-internship`
- `game-development`

---

## 🔐 Authentication

### Get Token (Login first)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpass"}'
```

### Use Token
```bash
-H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📦 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "statusCode": 400,
    "code": "ERROR_CODE"
  }
}
```

---

## 🎨 Postman Setup

### Import Collection
1. Open Postman
2. Click Import
3. Select file: `backend/postman/Training-Programs-API.postman_collection.json`

### Set Variables
- `baseUrl`: `http://localhost:3000/api/v1`
- `authToken`: Your JWT token (get from login)
- `programId`: A program ID (get from list API)

### Get Program ID
1. Run "Get All Programs" request
2. Copy `_id` from any program
3. Set as `programId` variable

---

## ✅ Testing Checklist

- [ ] Database seeded (12 programs created)
- [ ] Server running on port 3000
- [ ] GET all programs works
- [ ] GET program by slug works
- [ ] GET program details works
- [ ] Search works
- [ ] Filters work
- [ ] Login and get token
- [ ] POST enroll works
- [ ] POST callback works
- [ ] GET my enrollments works

---

## 🐛 Common Issues

### "Training program not found"
- Run seed script: `npx ts-node scripts/seed-training-programs.ts`

### "Unauthorized"
- Get fresh token from login endpoint

### "Validation failed"
- Check request body has all required fields
- Phone format: `+919876543210`

### "Already enrolled"
- User already enrolled, use different program

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `TRAINING_PROGRAMS_API.md` | Full API documentation |
| `TRAINING_PROGRAMS_CURL_EXAMPLES.md` | All cURL commands |
| `TRAINING_PROGRAMS_QUICK_START.md` | 5-minute setup guide |
| `TRAINING_PROGRAMS_IMPLEMENTATION_SUMMARY.md` | Technical details |
| `postman/Training-Programs-API.postman_collection.json` | Postman collection |

---

## 🔗 Base URL

```
http://localhost:3000/api/v1/training-programs
```

---

## 💡 Pro Tips

1. **Use Postman variables** for `programId` and `authToken`
2. **Test public endpoints first** before protected ones
3. **Check enrollment status** before enrolling again
4. **Use jq** for pretty JSON in terminal: `curl ... | jq`
5. **Save test credentials** in Postman environment

---

**Quick Links:**
- Full cURL Examples: `TRAINING_PROGRAMS_CURL_EXAMPLES.md`
- Postman Collection: `postman/Training-Programs-API.postman_collection.json`
- API Documentation: `TRAINING_PROGRAMS_API.md`
