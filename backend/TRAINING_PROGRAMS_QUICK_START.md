# Training Programs - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Seed the Database

```bash
cd backend
npx ts-node scripts/seed-training-programs.ts
```

You should see:
```
✓ Created 12 training programs
✓ Created 12 training program details
```

### Step 2: Start the Server

```bash
npm run dev
```

### Step 3: Test the APIs

Open your browser or use cURL:

#### Get All Programs
```
http://localhost:3000/api/v1/training-programs
```

#### Get Program Details
```
http://localhost:3000/api/v1/training-programs/full-stack-web-development/details
```

## 📝 Common API Calls

### 1. Browse Programs

```bash
# All active programs
curl http://localhost:3000/api/v1/training-programs

# Filter by domain
curl "http://localhost:3000/api/v1/training-programs?domain=Web%20Development"

# Filter by level
curl "http://localhost:3000/api/v1/training-programs?level=Beginner"

# Search
curl "http://localhost:3000/api/v1/training-programs?search=react"

# Popular programs
curl http://localhost:3000/api/v1/training-programs/popular
```

### 2. Get Program Details

```bash
# Full details
curl http://localhost:3000/api/v1/training-programs/full-stack-web-development/details

# Just overview
curl http://localhost:3000/api/v1/training-programs/full-stack-web-development/overview

# Just syllabus
curl http://localhost:3000/api/v1/training-programs/full-stack-web-development/syllabus

# Just mentors
curl http://localhost:3000/api/v1/training-programs/full-stack-web-development/mentors

# Just FAQs
curl http://localhost:3000/api/v1/training-programs/full-stack-web-development/faqs
```

### 3. Enrollment (Requires Authentication)

First, get a token by logging in, then:

```bash
# Set your token
TOKEN="your_jwt_token_here"

# Get a program ID from the list
PROGRAM_ID="64abc123..."

# Enroll
curl -X POST "http://localhost:3000/api/v1/training-programs/$PROGRAM_ID/enroll" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210"
  }'

# Request callback
curl -X POST "http://localhost:3000/api/v1/training-programs/$PROGRAM_ID/request-callback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210"
  }'
```

## 🎯 Available Programs After Seeding

1. **full-stack-web-development** - 60 days, Intermediate, ₹12,999
2. **uiux-design-internship** - 30 days, Beginner, ₹9,999
3. **data-science-analytics** - 60 days, Intermediate, ₹14,999
4. **devops-cloud-engineering** - 40 days, Advanced, ₹15,999 (Coming Soon)
5. **mobile-app-development** - 40 days, Intermediate, ₹13,999
6. **digital-marketing-growth** - 30 days, Beginner, ₹8,999
7. **ai-machine-learning** - 60 days, Advanced, ₹16,999
8. **backend-engineering** - 40 days, Intermediate, ₹13,999
9. **cybersecurity-internship** - 60 days, Advanced, ₹14,999 (Coming Soon)
10. **product-management** - 30 days, Intermediate, ₹11,999
11. **game-development** - 40 days, Intermediate, ₹15,999 (Coming Soon)
12. **blockchain-development** - 60 days, Advanced, ₹17,999

## 🔍 Quick Verification

### Check if programs were created:

```bash
# Count programs
curl http://localhost:3000/api/v1/training-programs | jq '.data.total'

# Should return: 12
```

### Check if details were created:

```bash
# Get details for first program
curl http://localhost:3000/api/v1/training-programs/full-stack-web-development/details | jq '.data.programDetails'

# Should return complete details object
```

## 🐛 Troubleshooting

### "Training program not found"
- Make sure you ran the seed script
- Check if database connection is working
- Verify MongoDB is running

### "Cannot find module"
- Run `npm install` in backend directory
- Make sure TypeScript is compiled: `npm run build`

### "Unauthorized" errors
- You need to login first to get a JWT token
- Use the token in Authorization header
- Check token expiration

## 📚 Next Steps

1. **Read full documentation**: `TRAINING_PROGRAMS_API.md`
2. **Check implementation details**: `TRAINING_PROGRAMS_IMPLEMENTATION_SUMMARY.md`
3. **Test with Postman**: Create a collection for easier testing
4. **Integrate with frontend**: Use the provided API structure

## 🎨 Frontend Integration Example

```typescript
// Get all programs
const getPrograms = async (filters?: {
  domain?: string;
  level?: string;
  page?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.domain) params.append('domain', filters.domain);
  if (filters?.level) params.append('level', filters.level);
  if (filters?.page) params.append('page', filters.page.toString());
  
  const response = await fetch(
    `http://localhost:3000/api/v1/training-programs?${params}`
  );
  return response.json();
};

// Get program details
const getProgramDetails = async (slug: string) => {
  const response = await fetch(
    `http://localhost:3000/api/v1/training-programs/${slug}/details`
  );
  return response.json();
};

// Enroll in program
const enrollInProgram = async (
  programId: string,
  data: { fullName: string; email: string; phone: string },
  token: string
) => {
  const response = await fetch(
    `http://localhost:3000/api/v1/training-programs/${programId}/enroll`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );
  return response.json();
};
```

## ✅ Checklist

- [ ] Database seeded with 12 programs
- [ ] Server is running
- [ ] Can access GET `/api/v1/training-programs`
- [ ] Can access program details by slug
- [ ] Authentication working for protected routes
- [ ] Enrollment flow tested
- [ ] Callback request flow tested

---

**Need help?** Check the full API documentation in `TRAINING_PROGRAMS_API.md`
