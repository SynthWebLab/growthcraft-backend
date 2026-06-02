# Batch Management Feature - Complete Guide

## 🚀 Quick Start (3 Steps)

### 1️⃣ Create OPS User
```bash
npm run seed:ops
```
Creates: `ops@growthcraft.com` / `Ops@123456`

### 2️⃣ Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ops@growthcraft.com",
    "password": "Ops@123456"
  }'
```

### 3️⃣ Create a Batch
```bash
curl -X POST http://localhost:3000/api/v1/admin/batches \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batchType": "Course",
    "parentId": "YOUR_COURSE_ID",
    "startDate": "2026-07-01",
    "endDate": "2026-09-30",
    "capacity": 30,
    "fee": 15000,
    "mode": "Online"
  }'
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **OPS_USER_SETUP.md** | How to create and use OPS user |
| **docs/BATCH_API.md** | Complete API reference |
| **docs/BATCH_TESTING_GUIDE.md** | Step-by-step testing |
| **docs/BATCH_IMPLEMENTATION_SUMMARY.md** | Technical details |
| **postman/Batch-Management-Examples.json** | Postman collection |

---

## 🎯 What's Implemented

### Admin Endpoints (Auth Required: OPS or SuperAdmin)
- ✅ `POST /api/v1/admin/batches` - Create batch
- ✅ `GET /api/v1/admin/batches` - List all batches
- ✅ `GET /api/v1/admin/batches/:id` - Get batch details
- ✅ `PATCH /api/v1/admin/batches/:id` - Update batch
- ✅ `PATCH /api/v1/admin/batches/:id/mentor` - Assign mentor

### Public Endpoint (No Auth Required)
- ✅ `GET /api/v1/batches` - List available batches

---

## 🔑 Key Features

### Auto-Generated Batch Codes
```
Course: "Algo Ace: Mastering DSA"
Date: July 1, 2026
Code: AAMD-20260701
```

### Custom Code Override
```json
{
  "code": "DSA-JULY-2026"
}
```

### Batch Status Flow
```
Draft (not public) 
  → Open (public) 
  → Filling (public) 
  → Full 
  → InProgress 
  → Completed
```

### Public Filtering
- Only shows Open/Filling batches
- Only shows batches with startDate >= today
- Filters by courseId, bootcampId, or trainingProgramId

---

## 🛠️ NPM Scripts

```bash
# Create OPS user
npm run seed:ops

# Build project
npm run build

# Run development server
npm run dev

# Seed courses (for testing)
npm run seed:courses
```

---

## 📋 Testing Workflow

1. **Setup Database**
   ```bash
   npm run seed:courses      # Create sample courses
   npm run seed:ops          # Create OPS user
   ```

2. **Login**
   ```bash
   POST /api/v1/auth/login
   ```

3. **Create Draft Batch**
   ```bash
   POST /api/v1/admin/batches
   ```

4. **Verify Not Public** (should return empty)
   ```bash
   GET /api/v1/batches
   ```

5. **Update to Open**
   ```bash
   PATCH /api/v1/admin/batches/:id
   { "status": "Open" }
   ```

6. **Verify Now Public** (should return the batch)
   ```bash
   GET /api/v1/batches
   ```

7. **Assign Mentor**
   ```bash
   PATCH /api/v1/admin/batches/:id/mentor
   { "mentorId": "..." }
   ```

---

## 🔐 Security

### OPS Role
- Level 5 in role hierarchy
- Can manage batches, courses, bootcamps
- Cannot manage users or system settings
- Does not have a profile model (admin-only account)

### Authentication Flow
1. Login → Get JWT access token (15 min expiry)
2. Token stored in secure HTTP-only cookie
3. Token used for all admin endpoints
4. Refresh token for automatic renewal (7 days)

### Why OPS Can't Self-Register
- Security best practice
- Admin roles should be created through controlled process
- Use seed script or direct database insertion
- Prevents unauthorized admin account creation

---

## 🐛 Troubleshooting

### "User already exists"
The OPS user was already created. Just login with existing credentials.

### "You do not have permission"
- Check user role is `'ops'` in database
- Verify JWT token is valid
- Ensure cookie/Authorization header is sent

### "Authentication required"
- Login first to get access token
- Check token hasn't expired
- Verify cookie is being sent

---

## 🔄 Merge Considerations

### Before Merging
This branch adds:
- OPS role (you have SUPER_ADMIN in another branch)
- Batch CRUD endpoints
- Public batch listing

### After Merging
Your branch will have both:
- ✅ OPS role (this branch)
- ✅ SUPER_ADMIN role (your branch)
- ✅ Both can access admin/batches endpoints

### Conflict Resolution
If there are conflicts in `user.constants.ts`:
- Keep both OPS and SUPER_ADMIN roles
- Maintain role hierarchy (OPS=5, SUPER_ADMIN=6)
- Merge both permission sets

---

## 📞 Support

For detailed information, see:
- **OPS Setup**: `OPS_USER_SETUP.md`
- **API Docs**: `docs/BATCH_API.md`
- **Testing**: `docs/BATCH_TESTING_GUIDE.md`
- **Technical**: `docs/BATCH_IMPLEMENTATION_SUMMARY.md`

---

**Ready to test!** 🎉

Run `npm run seed:ops` to get started.
