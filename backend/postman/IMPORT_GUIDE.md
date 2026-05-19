# 📦 How to Import Postman Collection

## Step 1: Open Postman

Launch Postman application on your computer.

## Step 2: Import Collection

1. Click the **Import** button (top left)
2. Click **Upload Files**
3. Navigate to: `backend/postman/`
4. Select: `GrowthCraft-Auth-APIs.postman_collection.json`
5. Click **Open**
6. Click **Import**

## Step 3: Verify Import

You should see a new collection:
- **Name:** GrowthCraft - Authentication APIs
- **Folders:**
  - Auth Flow (5 requests)
  - Error Scenarios (3 requests)
  - Other Auth Endpoints (3 requests)

## Step 4: Check Variables

The collection includes pre-configured variables:
- `base_url`: http://localhost:5001/api/v1
- `test_email`: sandipan.goswami@synthweb.in
- `test_password`: Test123!

## Step 5: Start Testing

1. Make sure server is running: `npm run dev`
2. Run requests in order (1 → 2 → 3 → 4)
3. Check email for OTP after step 1
4. Replace OTP in step 3 with actual OTP from email

## ✅ You're Ready!

Start with "1. Register User" request.
