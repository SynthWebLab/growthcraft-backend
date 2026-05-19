# 🧪 Reservation API Testing Guide

Complete step-by-step guide for testing the Reservation API in Postman.

---

## 📋 Prerequisites

1. ✅ Backend server running on `http://localhost:5001`
2. ✅ MongoDB connected with bootcamp/course data
3. ✅ Postman installed

---

## 🚀 Quick Start

### **Step 1: Import Postman Collection**

1. Open Postman
2. Click **Import** button (top left)
3. Select **File** tab
4. Navigate to: `backend/postman/Reservation-API-Examples.json`
5. Click **Import**

You should see a collection named **"Reservation API - Complete Testing"** with 6 folders.

---

## 📝 Testing Workflow

### **STEP 1: Get Bootcamp/Course IDs**

Before creating reservations, you need actual IDs from your database.

#### **1.1 Get Bootcamp IDs**

**Request:**
```
GET http://localhost:5001/api/v1/bootcamps?limit=10
```

**In Postman:**
1. Open folder: `1. Get Bootcamp IDs (Setup)`
2. Click: `Get All Bootcamps`
3. Click: **Send**
4. Copy an `_id` from the response (e.g., `"675a8f3a1b4c2d3e4f5a6b7c"`)

**Example Response:**
```json
{
  "items": [
    {
      "_id": "675a8f3a1b4c2d3e4f5a6b7c",
      "title": "Full-Stack MERN Bootcamp — Batch 7",
      "slug": "mern-batch-7",
      "maxSeats": 30,
      "enrolledCount": 0,
      "availableSeats": 30
    }
  ]
}
```

**✅ Copy the `_id` value** - you'll need it for creating reservations.

#### **1.2 Get Course IDs (Optional)**

**Request:**
```
GET http://localhost:5001/api/v1/courses?limit=10
```

Same process as bootcamps - copy an `_id` from the response.

---

### **STEP 2: Create Your First Reservation**

#### **2.1 Update the Request Body**

1. Open folder: `2. Create Reservations`
2. Click: `Create Bootcamp Reservation - User 1`
3. Click on **Body** tab
4. Replace `REPLACE_WITH_BOOTCAMP_ID` with the actual ID you copied

**Before:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "itemType": "bootcamp",
  "itemId": "REPLACE_WITH_BOOTCAMP_ID",
  "notes": "Looking forward to this bootcamp",
  "source": "web"
}
```

**After:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "itemType": "bootcamp",
  "itemId": "675a8f3a1b4c2d3e4f5a6b7c",
  "notes": "Looking forward to this bootcamp",
  "source": "web"
}
```

#### **2.2 Send the Request**

1. Make sure **Body** type is set to **raw** and **JSON** (dropdown on right)
2. Click: **Send**

**✅ Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Reservation created successfully",
  "data": {
    "reservation": {
      "_id": "675a9f4b2c5d3e4f5a6b7c8d",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "itemType": "bootcamp",
      "itemId": "675a8f3a1b4c2d3e4f5a6b7c",
      "itemTitle": "Full-Stack MERN Bootcamp — Batch 7",
      "status": "Pending",
      "reservedAt": "2026-05-11T12:00:00.000Z",
      "expiresAt": "2026-05-12T12:00:00.000Z",
      "amount": 24999,
      "notes": "Looking forward to this bootcamp",
      "source": "web",
      "createdAt": "2026-05-11T12:00:00.000Z",
      "updatedAt": "2026-05-11T12:00:00.000Z"
    }
  }
}
```

**✅ Copy the reservation `_id`** - you'll need it for confirm/cancel operations.

---

### **STEP 3: Test Duplicate Prevention**

Try to create the same reservation again (same email + same bootcamp).

1. Click: `Duplicate Reservation (409 Error)` in folder `6. Error Scenarios`
2. Update the `itemId` with your bootcamp ID
3. Click: **Send**

**✅ Expected Response (409 Conflict):**
```json
{
  "success": false,
  "error": {
    "message": "You already have an active reservation for this bootcamp",
    "code": "CONFLICT_ERROR",
    "statusCode": 409
  }
}
```

**✅ This is correct behavior!** The system prevents duplicate reservations.

---

### **STEP 4: Create Reservation with Different Email**

1. Click: `Create Bootcamp Reservation - User 2`
2. Update the `itemId` with your bootcamp ID
3. Click: **Send**

**✅ Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Reservation created successfully",
  "data": {
    "reservation": {
      "_id": "675a9f4b2c5d3e4f5a6b7c8e",
      "name": "Jane Smith",
      "email": "jane.smith@example.com",
      ...
    }
  }
}
```

**✅ Success!** Different email = new reservation allowed.

---

### **STEP 5: Get Reservation by ID**

1. Open folder: `3. Get Reservations`
2. Click: `Get Reservation by ID`
3. Replace `REPLACE_WITH_RESERVATION_ID` in URL with actual reservation ID
4. Click: **Send**

**URL Example:**
```
http://localhost:5001/api/v1/reservations/675a9f4b2c5d3e4f5a6b7c8d
```

**✅ Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reservation": {
      "_id": "675a9f4b2c5d3e4f5a6b7c8d",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "status": "Pending",
      ...
    }
  }
}
```

---

### **STEP 6: Get Reservations by Email**

1. Click: `Get Reservations by Email`
2. Update email in URL if needed
3. Click: **Send**

**URL Example:**
```
http://localhost:5001/api/v1/reservations/email/john.doe@example.com
```

**✅ Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reservations": [
      {
        "_id": "675a9f4b2c5d3e4f5a6b7c8d",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "status": "Pending",
        ...
      }
    ],
    "count": 1
  }
}
```

---

### **STEP 7: Confirm Reservation**

1. Open folder: `4. Confirm Reservations`
2. Click: `Confirm Reservation`
3. Replace `REPLACE_WITH_RESERVATION_ID` in URL with actual reservation ID
4. Click: **Send**

**URL Example:**
```
http://localhost:5001/api/v1/reservations/675a9f4b2c5d3e4f5a6b7c8d/confirm
```

**✅ Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Reservation confirmed successfully",
  "data": {
    "reservation": {
      "_id": "675a9f4b2c5d3e4f5a6b7c8d",
      "status": "Confirmed",
      "confirmedAt": "2026-05-11T13:00:00.000Z",
      ...
    }
  }
}
```

---

### **STEP 8: Cancel Reservation**

1. Open folder: `5. Cancel Reservations`
2. Click: `Cancel Reservation`
3. Replace `REPLACE_WITH_RESERVATION_ID` in URL with actual reservation ID
4. Click: **Send**

**URL Example:**
```
http://localhost:5001/api/v1/reservations/675a9f4b2c5d3e4f5a6b7c8e/cancel
```

**✅ Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Reservation cancelled successfully",
  "data": {
    "reservation": {
      "_id": "675a9f4b2c5d3e4f5a6b7c8e",
      "status": "Cancelled",
      "cancelledAt": "2026-05-11T14:00:00.000Z",
      ...
    }
  }
}
```

---

## 🧪 Test All Error Scenarios

Open folder: `6. Error Scenarios` and test each request:

### **1. Duplicate Reservation (409)**
- Same email + same bootcamp = Conflict error
- ✅ Expected: `"You already have an active reservation for this bootcamp"`

### **2. Invalid Email (400)**
- Email: `"invalid-email"` (no @ symbol)
- ✅ Expected: `"Please provide a valid email address"`

### **3. Invalid Item Type (400)**
- itemType: `"invalid"` (not "course" or "bootcamp")
- ✅ Expected: `"Item type must be either \"course\" or \"bootcamp\""`

### **4. Invalid Item ID (400)**
- itemId: `"invalid-id"` (not MongoDB ObjectId)
- ✅ Expected: `"Please provide a valid item ID"`

### **5. Non-existent Bootcamp (404)**
- itemId: `"507f1f77bcf86cd799439011"` (valid format but doesn't exist)
- ✅ Expected: `"Bootcamp not found"`

### **6. Confirm Already Confirmed (400)**
- Try to confirm a reservation that's already confirmed
- ✅ Expected: `"Only pending reservations can be confirmed"`

### **7. Cancel Already Cancelled (400)**
- Try to cancel a reservation that's already cancelled
- ✅ Expected: `"Reservation is already cancelled"`

---

## 🎯 Complete Testing Checklist

### **Happy Path**
- [ ] Get bootcamp IDs
- [ ] Create reservation for bootcamp
- [ ] Create reservation for course
- [ ] Get reservation by ID
- [ ] Get reservations by email
- [ ] Confirm reservation
- [ ] Cancel reservation

### **Error Handling**
- [ ] Duplicate reservation (409)
- [ ] Invalid email (400)
- [ ] Invalid item type (400)
- [ ] Invalid item ID (400)
- [ ] Non-existent bootcamp (404)
- [ ] Confirm already confirmed (400)
- [ ] Cancel already cancelled (400)

### **Business Logic**
- [ ] Enrolled count increments on reservation
- [ ] Enrolled count decrements on cancellation
- [ ] Reservation expires after 24 hours
- [ ] Cannot reserve if no seats available
- [ ] Cannot have duplicate active reservations

---

## 🔧 Common Issues & Solutions

### **Issue 1: "Route not found" (404)**

**Problem:** URL has newline characters
```
POST /api/v1/reservations%0A%0A
```

**Solution:**
1. Check URL bar - should be: `http://localhost:5001/api/v1/reservations`
2. No trailing newlines or spaces
3. Press Enter to ensure URL is clean

---

### **Issue 2: "Validation failed" (400)**

**Problem:** Body format is wrong

**Solution:**
1. Click **Body** tab
2. Select **raw** radio button (not `x-www-form-urlencoded`)
3. Select **JSON** from dropdown (right side)
4. Ensure JSON is valid (use JSON validator)

---

### **Issue 3: "Duplicate reservation" (409)**

**Problem:** You already created a reservation with this email + bootcamp

**Solution:**
1. Use a different email address, OR
2. Use a different bootcamp/course ID, OR
3. Cancel the existing reservation first

---

### **Issue 4: "Bootcamp not found" (404)**

**Problem:** The bootcamp ID doesn't exist in database

**Solution:**
1. Run: `GET /api/v1/bootcamps` to get valid IDs
2. Copy an actual `_id` from the response
3. Use that ID in your reservation request

---

### **Issue 5: Server not responding**

**Problem:** Backend server is not running

**Solution:**
```bash
cd backend
npm run dev
```

Wait for:
```
✓ Database connected successfully
✓ Redis connected successfully
Server running on port 5001
```

---

## 📊 Testing Scenarios

### **Scenario 1: New User Reserves Seat**
1. User visits bootcamp page
2. Clicks "Reserve Seat" button
3. Fills form: name, email, phone
4. Submits form
5. ✅ Reservation created (status: Pending)
6. ✅ Enrolled count incremented
7. ✅ User receives confirmation email (future)

### **Scenario 2: User Confirms Reservation**
1. User receives confirmation link (future)
2. Clicks link
3. Completes payment (future)
4. ✅ Reservation confirmed (status: Confirmed)
5. ✅ User receives confirmation email

### **Scenario 3: User Cancels Reservation**
1. User visits "My Reservations" page
2. Clicks "Cancel" button
3. Confirms cancellation
4. ✅ Reservation cancelled (status: Cancelled)
5. ✅ Enrolled count decremented
6. ✅ User receives cancellation email (future)

### **Scenario 4: Reservation Expires**
1. User creates reservation
2. 24 hours pass
3. User doesn't confirm
4. ✅ Cron job marks as expired (status: Expired)
5. ✅ Enrolled count decremented
6. ✅ User receives expiry notification (future)

---

## 🚀 PowerShell Testing (Alternative)

If you prefer command-line testing:

### **Create Reservation**
```powershell
$body = @{
    name = "John Doe"
    email = "john.doe@example.com"
    phone = "+1234567890"
    itemType = "bootcamp"
    itemId = "REPLACE_WITH_BOOTCAMP_ID"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5001/api/v1/reservations" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body | ConvertTo-Json -Depth 10
```

### **Get Reservation by ID**
```powershell
Invoke-RestMethod -Uri "http://localhost:5001/api/v1/reservations/RESERVATION_ID" `
    -Method GET | ConvertTo-Json -Depth 10
```

### **Confirm Reservation**
```powershell
Invoke-RestMethod -Uri "http://localhost:5001/api/v1/reservations/RESERVATION_ID/confirm" `
    -Method POST | ConvertTo-Json -Depth 10
```

---

## ✅ Success Criteria

Your testing is complete when:

1. ✅ All happy path scenarios work
2. ✅ All error scenarios return correct error codes
3. ✅ Enrolled count increments/decrements correctly
4. ✅ Duplicate prevention works
5. ✅ Validation catches invalid inputs
6. ✅ Status transitions work (Pending → Confirmed/Cancelled/Expired)

---

## 📞 Need Help?

If you encounter issues:

1. Check server logs: `backend/logs/app.log`
2. Check error logs: `backend/logs/error.log`
3. Verify MongoDB connection
4. Verify Redis connection
5. Check that bootcamp/course data exists

---

**Status:** ✅ **READY FOR TESTING**  
**Date:** May 11, 2026  
**Version:** 1.0.0
