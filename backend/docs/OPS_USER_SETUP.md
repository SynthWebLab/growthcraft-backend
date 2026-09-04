# OPS User Setup Guide

This guide explains how to create an OPS (Operations) user to manage batches in GrowthCraft.

## What is OPS?

**OPS** (Operations) is an admin role that can:
- Create and manage batches
- Update batch schedules
- Assign mentors to batches
- Manage course enrollments
- Access admin analytics

## Quick Setup

### Step 1: Create OPS User

Run the seed script to create the OPS user:

```bash
npm run seed:ops
```

This creates:
- **Email**: `ops@growthcraft.com`
- **Password**: `Ops@123456`
- **Role**: `ops`

The user is automatically verified and activated.

### Step 2: Login to Get Access Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ops@growthcraft.com",
    "password": "Ops@123456"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "userId": "...",
      "email": "ops@growthcraft.com",
      "role": "ops",
      "firstName": "Operations",
      "lastName": "Manager"
    }
  }
}
```

The access token is automatically set in an HTTP-only cookie named `access_token`.

### Step 3: Test Batch Management

Now you can use the batch management endpoints:

```bash
# Create a batch
curl -X POST http://localhost:3000/api/v1/admin/batches \
  -H "Cookie: access_token=YOUR_TOKEN_FROM_LOGIN" \
  -H "Content-Type: application/json" \
  -d '{
    "batchType": "Course",
    "parentId": "COURSE_ID_HERE",
    "startDate": "2026-07-01",
    "endDate": "2026-09-30",
    "capacity": 30,
    "fee": 15000,
    "mode": "Online"
  }'
```

## Using with Postman

1. **Import Collection**: Import `postman/Batch-Management-Examples.json`

2. **Login First**: 
   - Use the login request
   - Postman will automatically store the cookie

3. **Use Batch Endpoints**:
   - All subsequent requests will use the stored cookie
   - No need to manually copy tokens

## Using with Bearer Token (Alternative)

If you prefer using Authorization headers instead of cookies:

```bash
# 1. Login and extract token from response
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ops@growthcraft.com",
    "password": "Ops@123456"
  }' | jq -r '.data.user.access_token')

# 2. Use token in Authorization header
curl -X POST http://localhost:3000/api/v1/admin/batches \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

## Creating Additional OPS Users

### Option 1: Manual Database Insert

Use MongoDB Compass or mongosh:

```javascript
// First, hash the password using bcrypt
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash('YourPassword123!', 10);

// Then insert the user
db.users.insertOne({
  firstName: "John",
  lastName: "Operator",
  email: "john.ops@growthcraft.com",
  password: hashedPassword,
  role: "ops",
  isEmailVerified: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Option 2: Modify Seed Script

Edit `scripts/seed-ops-user.ts` to add more users:

```typescript
const opsUsers = [
  {
    firstName: 'Operations',
    lastName: 'Manager',
    email: 'ops@growthcraft.com',
    password: 'Ops@123456',
    role: UserRole.OPS,
  },
  {
    firstName: 'John',
    lastName: 'Operator',
    email: 'john.ops@growthcraft.com',
    password: 'SecurePassword123!',
    role: UserRole.OPS,
  },
];
```

## Security Notes

1. **Change Default Password**: 
   - After first login, change the password using:
   ```bash
   PATCH /api/v1/auth/change-password
   ```

2. **OPS Cannot Self-Register**: 
   - The public `/api/v1/auth/register` endpoint does NOT support OPS role
   - This is intentional for security
   - OPS users must be created through:
     - Seed scripts
     - Direct database insertion
     - Admin panel (future feature)

3. **Token Security**:
   - Access tokens expire (default: 15 minutes)
   - Refresh tokens are used for automatic renewal
   - Tokens are stored in secure HTTP-only cookies

## Troubleshooting

### Error: "User with this email already exists"

The OPS user is already in the database. You can:
- Use the existing user to login
- Delete the user and re-run the seed script:
  ```javascript
  db.users.deleteOne({ email: "ops@growthcraft.com" })
  ```

### Error: "You do not have permission to access this resource"

- Verify the user's role is `'ops'` in the database
- Check the JWT token is valid and not expired
- Ensure you're including the cookie or Authorization header

### Error: "Authentication required"

- Make sure you're logged in
- Check that the cookie is being sent with the request
- Or include the Authorization header: `Authorization: Bearer YOUR_TOKEN`

## Next Steps

1. ✅ Create OPS user with seed script
2. ✅ Login to get access token
3. ✅ Test batch creation endpoint
4. See `docs/BATCH_TESTING_GUIDE.md` for complete testing instructions

## Related Documentation

- **Batch API Reference**: `docs/BATCH_API.md`
- **Testing Guide**: `docs/BATCH_TESTING_GUIDE.md`
- **Postman Collection**: `postman/Batch-Management-Examples.json`
- **Implementation Details**: `docs/BATCH_IMPLEMENTATION_SUMMARY.md`
