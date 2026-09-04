# Batch Management Feature - Quick Reference

## 🎯 Feature Overview

Admin operators (SuperAdmin/Ops) can create, update, and manage batches for courses, training programs, and bootcamps. Students and visitors can view available batches through a public API.

## 🚀 Quick Start

### Admin Operations

```bash
# 1. Create a batch
POST /api/v1/admin/batches
{
  "batchType": "Course",
  "parentId": "60d5ec49f1b2c8b1f8e4e1a1",
  "startDate": "2026-07-01",
  "endDate": "2026-09-30",
  "capacity": 30,
  "fee": 15000,
  "mode": "Online"
}

# 2. Make it public (change status)
PATCH /api/v1/admin/batches/:id
{ "status": "Open" }

# 3. Assign mentor
PATCH /api/v1/admin/batches/:id/mentor
{ "mentorId": "..." }
```

### Public Access (No Auth)

```bash
# List available batches
GET /api/v1/batches?courseId=...
```

## 📋 Endpoints

### Admin (Auth + SuperAdmin/Ops)
- `POST /api/v1/admin/batches` - Create batch
- `GET /api/v1/admin/batches` - List all batches
- `GET /api/v1/admin/batches/:id` - Get batch details
- `PATCH /api/v1/admin/batches/:id` - Update batch
- `PATCH /api/v1/admin/batches/:id/mentor` - Assign mentor

### Public (No Auth)
- `GET /api/v1/batches` - List available batches (Open/Filling, future dates)

## 🔑 Key Features

✅ **Auto-generated batch codes**: `AAMD-20260701` (from course title + date)
✅ **Custom code override**: Operators can set custom codes
✅ **Status management**: Draft → Open → Filling → Full → InProgress → Completed
✅ **RBAC**: SuperAdmin and Ops roles only
✅ **Public filtering**: Only shows Open/Filling batches with future dates
✅ **Mentor assignment**: Separate endpoint for flexibility

## 📚 Documentation

- **API Docs**: `docs/BATCH_API.md` - Complete endpoint documentation
- **Testing Guide**: `docs/BATCH_TESTING_GUIDE.md` - Step-by-step testing
- **Implementation**: `docs/BATCH_IMPLEMENTATION_SUMMARY.md` - Technical details
- **Postman**: `postman/Batch-Management-Examples.json` - Ready-to-use collection

## 🧪 Testing

```bash
# Build and verify
npm run build

# Import Postman collection
postman/Batch-Management-Examples.json

# Or use curl - see docs/BATCH_TESTING_GUIDE.md
```

## 🔐 Roles Required

### Admin Endpoints
- `SUPER_ADMIN` (super_admin)
- `OPS` (ops)

### Public Endpoints
- No authentication required

## 🎓 Batch Status Flow

```
Draft (not public)
  ↓
Open (public, accepting enrollments)
  ↓
Filling (public, nearing capacity)
  ↓
Full (not public)
  ↓
InProgress (ongoing)
  ↓
Completed (finished)
```

## 💡 Common Use Cases

### Use Case 1: Create and Publish a Batch
1. Create batch with Draft status
2. Update status to Open
3. Assign mentor
4. Batch is now visible on public API

### Use Case 2: Filter Batches for a Course
```bash
GET /api/v1/batches?courseId=60d5ec49f1b2c8b1f8e4e1a1
```

### Use Case 3: Update Batch Capacity
```bash
PATCH /api/v1/admin/batches/:id
{ "capacity": 35 }
```

## ⚠️ Important Notes

- Draft batches are NOT visible on public API
- Only batches with `startDate >= today` appear in public API
- Capacity cannot be reduced below current `enrolledCount`
- Batch codes must be unique
- `endDate` must be >= `startDate`

## 🔧 Files Modified

**New Roles Added:**
- `src/common/constants/user.constants.ts`

**Services:**
- `src/modules/admin/services/batch.service.ts`

**Controllers:**
- `src/modules/admin/controllers/batch.controller.ts`
- `src/modules/public/controllers/batch.controller.ts` (NEW)

**Routes:**
- `src/modules/admin/routes/admin.routes.ts`
- `src/modules/public/routes/batch.routes.ts` (NEW)

## 🎉 All Acceptance Criteria Met

✅ Create batch with status="Draft" and auto-generated code
✅ Update status to Open makes batch publicly listable
✅ Assign mentor updates assignedMentorId
✅ Public API returns only Open/Filling batches with future dates

## 📞 Need Help?

Check the detailed documentation:
1. `docs/BATCH_API.md` - API reference
2. `docs/BATCH_TESTING_GUIDE.md` - Testing instructions
3. `docs/BATCH_IMPLEMENTATION_SUMMARY.md` - Technical implementation

---

**Ready to use!** 🚀
