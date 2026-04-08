# 🧪 Postman Testing Guide - MongoDB Atlas Verification

## Test User Registration & Verify in MongoDB Atlas

### Step 1: Create User in Postman

**Request:**

```
POST http://localhost:5001/api/v1/auth/register
```

**Headers:**

```
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Expected Response (201 Created):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "isEmailVerified": false,
      "createdAt": "2026-04-08T06:50:00.000Z",
      "updatedAt": "2026-04-08T06:50:00.000Z"
    }
  }
}
```

---

### Step 2: Verify in MongoDB Atlas

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com
2. **Navigate to your cluster**: Click "GrowthCraftCluster"
3. **Browse Collections**: Click the "Browse Collections" button
4. **Find your database**: Look for `growthCraft` database
5. **Check users collection**: Click on `users` collection
6. **See your user**: You should see the user document with:
   - `_id`: MongoDB ObjectId
   - `email`: john.doe@example.com
   - `password`: Hashed password (bcrypt)
   - `firstName`: John
   - `lastName`: Doe
   - `role`: student
   - `isEmailVerified`: false
   - `createdAt` & `updatedAt`: Timestamps

---

### Step 3: Test Login

**Request:**

```
POST http://localhost:5001/api/v1/auth/login
```

**Headers:**

```
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Expected Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student"
    }
  }
}
```

**Note:** Tokens are set as HTTP-only cookies automatically!

---

### Step 4: Get User Profile (Protected Route)

**Request:**

```
GET http://localhost:5001/api/v1/auth/profile
```

**Headers:**

```
Content-Type: application/json
Cookie: accessToken=<token_from_login>; refreshToken=<token_from_login>
```

**Note:** If you're using Postman, cookies are automatically sent after login!

**Expected Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student"
    }
  }
}
```

---

## 🔍 What Happens Behind the Scenes

### When You Register:

1. ✅ Postman sends request to your backend
2. ✅ Backend validates the data
3. ✅ Password is hashed with bcrypt
4. ✅ User document is saved to **MongoDB Atlas**
5. ✅ Tokens are generated and stored in **Redis (Upstash)**
6. ✅ Response sent back with user data

### When You Login:

1. ✅ Backend checks MongoDB Atlas for user
2. ✅ Verifies password hash
3. ✅ Generates JWT tokens
4. ✅ Stores refresh token in Redis
5. ✅ Sets HTTP-only cookies
6. ✅ Returns user data

---

## 📊 Monitoring

### MongoDB Atlas:

- **Browse Collections** → See all users
- **Metrics** → Monitor database operations
- **Performance Advisor** → Get optimization tips

### Redis (Upstash):

- **Data Browser** → See stored tokens
- **Monitor** → Watch real-time operations
- **Usage** → Track commands and storage

---

## 🧪 Additional Test Cases

### Test 1: Duplicate Email (Should Fail)

Try registering the same email again:

```json
{
  "email": "john.doe@example.com",
  "password": "AnotherPass123!",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Expected Response (409 Conflict):**

```json
{
  "success": false,
  "message": "User already exists"
}
```

### Test 2: Invalid Email Format

```json
{
  "email": "invalid-email",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Expected Response (400 Bad Request):**

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Test 3: Weak Password

```json
{
  "email": "test2@example.com",
  "password": "123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Expected Response (400 Bad Request):**

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

---

## 🎯 Quick Checklist

- [ ] Server running on port 5001
- [ ] MongoDB Atlas connected
- [ ] Redis (Upstash) connected
- [ ] Postman installed
- [ ] Created user via POST /api/v1/auth/register
- [ ] Verified user in MongoDB Atlas "Browse Collections"
- [ ] Logged in via POST /api/v1/auth/login
- [ ] Got profile via GET /api/v1/auth/profile
- [ ] Checked Redis dashboard for session tokens

---

## 🚀 You're All Set!

Your backend is fully connected to:

- ✅ MongoDB Atlas (storing users)
- ✅ Redis Upstash (storing sessions/tokens)
- ✅ Ready for production deployment!
