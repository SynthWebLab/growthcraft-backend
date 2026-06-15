# Training Programs - Postman Testing Guide

## 📥 Step 1: Import Collection into Postman

1. Open Postman
2. Click **Import** button (top left)
3. Click **Choose Files**
4. Navigate to: `backend/postman/Training-Programs-API.postman_collection.json`
5. Click **Import**

You should see **"Training Programs API"** collection with 17 requests.

---

## ⚙️ Step 2: Setup Environment Variables

### Create Environment
1. Click **Environments** (left sidebar)
2. Click **+** to create new environment
3. Name it: `GrowthCraft Local`

### Add Variables
Add these 3 variables:

| Variable | Initial Value | Current Value |
|----------|--------------|---------------|
| `baseUrl` | `http://localhost:3000/api/v1` | `http://localhost:3000/api/v1` |
| `authToken` | *(leave empty)* | *(leave empty)* |
| `programId` | *(leave empty)* | *(leave empty)* |

4. Click **Save**
5. Select **"GrowthCraft Local"** from environment dropdown (top right)

---

## 🗄️ Step 3: Seed the Database

Open terminal and run:

```bash
cd backend
npx ts-node scripts/seed-training-programs.ts
```

**Expected output:**
```
✓ Created 12 training programs
✓ Created 12 training program details
```

---

## 🚀 Step 4: Start Server

```bash
npm run dev
```

**Expected output:**
```
Server running on port 3000
Database connected
```

---

## 🧪 Step 5: Test Public Endpoints (No Auth)

### Test 1: Get All Programs

1. Open request: **"1. Public - Get All Programs"**
2. Click **Send**
3. You should see `200 OK` status
4. Response contains 12 programs

**Copy a Program ID:**
- Look at the response
- Find any program's `_id` field
- Copy the value (looks like: `667abc123def456789...`)
- Go to **Environments** → **GrowthCraft Local**
- Paste into `programId` variable
- Click **Save**

---

### Test 2: Get Program by Slug

1. Open request: **"6. Public - Get Program by Slug"**
2. Click **Send**
3. Response shows full program details

---

### Test 3: Filter by Domain

1. Open request: **"2. Public - Get Programs with Filters"**
2. In **Params** tab, you can:
   - Enable/disable filters
   - Change `domain` to: `Design`, `Data Science`, etc.
   - Change `level` to: `Beginner`, `Advanced`
3. Click **Send**

---

### Test 4: Search Programs

1. Open request: **"3. Public - Search Programs"**
2. In **Params** tab, change `search` value to:
   - `react` - finds React programs
   - `design` - finds design programs
   - `AI` - finds AI programs
3. Click **Send**

---

### Test 5: Get Program Details

1. Open request: **"8. Public - Get Program Details (All)"**
2. Click **Send**
3. Response includes:
   - Overview
   - Syllabus (week-by-week)
   - Mentors
   - FAQs

---

### Test 6: Get Popular Programs

1. Open request: **"5. Public - Get Popular Programs"**
2. Click **Send**
3. See top programs by enrollment + rating

---

### Test 7: Get All Domains

1. Open request: **"4. Public - Get All Domains"**
2. Click **Send**
3. See list of all available domains

---

## 🔐 Step 6: Get Authentication Token

### Option A: Use Existing Login

1. Create a new request in Postman
2. Method: `POST`
3. URL: `http://localhost:3000/api/v1/auth/login`
4. Body → **raw** → **JSON**:
```json
{
  "email": "your@email.com",
  "password": "yourpassword"
}
```
5. Click **Send**
6. Copy the `token` from response

### Option B: Use Existing Token

If you already have a valid JWT token, use that.

### Save Token

1. Go to **Environments** → **GrowthCraft Local**
2. Paste token into `authToken` variable (both Initial and Current)
3. Click **Save**

---

## 🎓 Step 7: Test Protected Endpoints (With Auth)

### Test 8: Enroll in Program

1. Open request: **"13. Protected - Enroll in Program"**
2. Make sure `{{authToken}}` and `{{programId}}` are set
3. In **Body** tab, modify if needed:
```json
{
  "fullName": "Your Name",
  "email": "your@email.com",
  "phone": "+919876543210"
}
```
4. Click **Send**
5. You should see `201 Created` status

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully enrolled in the training program. We will get back to you soon!",
  "data": {
    "enrollment": {
      "_id": "...",
      "status": "pending",
      "paymentStatus": "pending"
    }
  }
}
```

---

### Test 9: Request Callback

1. Open request: **"14. Protected - Request Callback"**
2. Make sure `{{authToken}}` and `{{programId}}` are set
3. Modify **Body** if needed
4. Click **Send**
5. You should see `201 Created` status

---

### Test 10: Get My Enrollments

1. Open request: **"15. Protected - Get My Enrollments"**
2. Click **Send**
3. See all your enrollments with program details

---

### Test 11: Check Enrollment Status

1. Open request: **"17. Protected - Check Enrollment Status"**
2. Click **Send**
3. Response shows if you're enrolled and have callback requests

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "isEnrolled": true,
    "hasCallbackRequest": false
  }
}
```

---

### Test 12: Get My Callback Requests

1. Open request: **"16. Protected - Get My Callback Requests"**
2. Click **Send**
3. See all your callback requests

---

## 📊 Complete Test Flow

### Scenario: User Browses and Enrolls

```
1. Browse all programs
   → GET /training-programs

2. Filter by domain
   → GET /training-programs?domain=Web Development

3. View program details
   → GET /training-programs/full-stack-web-development

4. Check complete details
   → GET /training-programs/full-stack-web-development/details

5. Login (get token)
   → POST /auth/login

6. Check enrollment status
   → GET /training-programs/{id}/enrollment-status

7. Enroll in program
   → POST /training-programs/{id}/enroll

8. View my enrollments
   → GET /training-programs/enrollments/my-enrollments
```

---

## 🎯 Quick Test Checklist

### Public Endpoints (No Auth)
- [ ] Get all programs works
- [ ] Filter by domain works
- [ ] Filter by level works
- [ ] Search works
- [ ] Get domains works
- [ ] Get popular programs works
- [ ] Get program by slug works
- [ ] Get similar programs works
- [ ] Get program details works
- [ ] Get overview works
- [ ] Get syllabus works
- [ ] Get mentors works
- [ ] Get FAQs works

### Protected Endpoints (With Auth)
- [ ] Login and get token
- [ ] Token saved in environment
- [ ] Program ID saved in environment
- [ ] Enroll in program works
- [ ] Request callback works
- [ ] Get my enrollments works
- [ ] Get my callback requests works
- [ ] Check enrollment status works

---

## 🐛 Troubleshooting in Postman

### "Could not send request"
- Check if server is running: `npm run dev`
- Check URL: `http://localhost:3000/api/v1`

### "404 Not Found"
- Verify endpoint URL
- Check if routes are registered
- Ensure server restarted after changes

### "401 Unauthorized"
- Check `authToken` variable is set
- Token might be expired - get new one
- Verify Authorization header: `Bearer {{authToken}}`

### "400 Bad Request - Validation failed"
- Check request body format
- Ensure all required fields present
- Phone format: `+919876543210`

### "404 Training program not found"
- Run seed script again
- Check `programId` variable is correct MongoDB ObjectId

### "409 Conflict - Already enrolled"
- User already enrolled in this program
- Try different `programId`
- Or use different user account

### Variables not working ({{authToken}} shown as text)
- Select correct environment from dropdown (top right)
- Click eye icon to verify variables are set
- Save environment after changing variables

---

## 💡 Pro Tips for Postman

### 1. Use Collection Runner
- Click **Runner** button
- Select "Training Programs API"
- Run all requests sequentially
- See which ones pass/fail

### 2. Write Tests
Add to **Tests** tab:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has programs", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.programs).to.be.an('array');
});
```

### 3. Auto-Save Token
In Login request **Tests** tab:
```javascript
var jsonData = pm.response.json();
pm.environment.set("authToken", jsonData.data.token);
```

### 4. Auto-Save Program ID
In "Get All Programs" request **Tests** tab:
```javascript
var jsonData = pm.response.json();
if (jsonData.data.programs.length > 0) {
    pm.environment.set("programId", jsonData.data.programs[0]._id);
}
```

### 5. Use Folders
Organize requests:
- 📁 Public Endpoints
  - List & Filter
  - Program Details
  - Search & Popular
- 📁 Protected Endpoints
  - Enrollment
  - My Data

---

## 📸 Expected Results Screenshots

### Success: Get All Programs
```
Status: 200 OK
Response Time: ~50ms
Size: ~15KB

Body:
{
  "success": true,
  "message": "Training programs retrieved successfully",
  "data": {
    "programs": [Array(12)],
    "total": 12,
    "page": 1,
    "totalPages": 1
  }
}
```

### Success: Enroll in Program
```
Status: 201 Created
Response Time: ~100ms

Body:
{
  "success": true,
  "message": "Successfully enrolled...",
  "data": {
    "enrollment": {
      "status": "pending",
      "paymentStatus": "pending",
      ...
    }
  }
}
```

---

## 📚 Additional Resources

| Resource | Location |
|----------|----------|
| Full API Docs | `TRAINING_PROGRAMS_API.md` |
| cURL Examples | `TRAINING_PROGRAMS_CURL_EXAMPLES.md` |
| Quick Reference | `TRAINING_PROGRAMS_QUICK_REFERENCE.md` |
| Quick Start | `TRAINING_PROGRAMS_QUICK_START.md` |
| Implementation | `TRAINING_PROGRAMS_IMPLEMENTATION_SUMMARY.md` |

---

## ✅ You're All Set!

Now you can:
- ✅ Test all public endpoints
- ✅ Test all protected endpoints
- ✅ Filter and search programs
- ✅ Enroll users in programs
- ✅ Track enrollments and callbacks

**Happy Testing! 🚀**
