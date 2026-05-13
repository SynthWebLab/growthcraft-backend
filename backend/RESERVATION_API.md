# Reservation API Documentation

Complete API documentation for seat reservation system for courses and bootcamps.

---

## 📋 Overview

The Reservation API allows users to reserve seats for courses and bootcamps. Reservations expire after 24 hours if not confirmed.

### **Base URL**
```
http://localhost:5001/api/v1/reservations
```

### **Authentication**
No authentication required for creating reservations (public endpoint).

---

## 🎯 Endpoints

### 1. **Create Reservation**

Reserve a seat for a course or bootcamp.

**Endpoint:** `POST /api/v1/reservations`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "itemType": "bootcamp",
  "itemId": "507f1f77bcf86cd799439011",
  "notes": "Looking forward to this bootcamp",
  "source": "web"
}
```

**Required Fields:**
- `name` (string, 2-100 chars) - Full name
- `email` (string, valid email) - Email address
- `phone` (string) - Phone number
- `itemType` (string: "course" | "bootcamp") - Type of item
- `itemId` (string, MongoDB ObjectId) - Course or Bootcamp ID

**Optional Fields:**
- `notes` (string, max 500 chars) - Additional notes
- `source` (string: "web" | "mobile" | "admin") - Source of reservation

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Reservation created successfully",
  "data": {
    "reservation": {
      "_id": "675a8f3a1b4c2d3e4f5a6b7c",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "itemType": "bootcamp",
      "itemId": "507f1f77bcf86cd799439011",
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

**Error Responses:**

**400 Bad Request** - Validation error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "value": "invalid-email"
    }
  ]
}
```

**404 Not Found** - Course/Bootcamp not found
```json
{
  "success": false,
  "message": "Bootcamp not found"
}
```

**409 Conflict** - No seats available or duplicate reservation
```json
{
  "success": false,
  "message": "No seats available for this bootcamp"
}
```

---

### 2. **Get Reservation by ID**

Get details of a specific reservation.

**Endpoint:** `GET /api/v1/reservations/:id`

**Parameters:**
- `id` (path parameter) - Reservation ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reservation": {
      "_id": "675a8f3a1b4c2d3e4f5a6b7c",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "itemType": "bootcamp",
      "itemId": "507f1f77bcf86cd799439011",
      "itemTitle": "Full-Stack MERN Bootcamp — Batch 7",
      "status": "Pending",
      "reservedAt": "2026-05-11T12:00:00.000Z",
      "expiresAt": "2026-05-12T12:00:00.000Z",
      "amount": 24999,
      "createdAt": "2026-05-11T12:00:00.000Z",
      "updatedAt": "2026-05-11T12:00:00.000Z"
    }
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Reservation not found"
}
```

---

### 3. **Get Reservations by Email**

Get all reservations for a specific email address.

**Endpoint:** `GET /api/v1/reservations/email/:email`

**Parameters:**
- `email` (path parameter) - Email address

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reservations": [
      {
        "_id": "675a8f3a1b4c2d3e4f5a6b7c",
        "name": "John Doe",
        "email": "john@example.com",
        "itemType": "bootcamp",
        "itemTitle": "Full-Stack MERN Bootcamp — Batch 7",
        "status": "Pending",
        "reservedAt": "2026-05-11T12:00:00.000Z",
        "expiresAt": "2026-05-12T12:00:00.000Z",
        "amount": 24999
      },
      {
        "_id": "675a8f3a1b4c2d3e4f5a6b7d",
        "name": "John Doe",
        "email": "john@example.com",
        "itemType": "course",
        "itemTitle": "JavaScript Zero to Hero",
        "status": "Confirmed",
        "reservedAt": "2026-05-10T10:00:00.000Z",
        "confirmedAt": "2026-05-10T11:00:00.000Z",
        "amount": 4499
      }
    ],
    "count": 2
  }
}
```

---

### 4. **Confirm Reservation**

Confirm a pending reservation.

**Endpoint:** `POST /api/v1/reservations/:id/confirm`

**Parameters:**
- `id` (path parameter) - Reservation ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Reservation confirmed successfully",
  "data": {
    "reservation": {
      "_id": "675a8f3a1b4c2d3e4f5a6b7c",
      "status": "Confirmed",
      "confirmedAt": "2026-05-11T13:00:00.000Z",
      ...
    }
  }
}
```

**Error Responses:**

**400 Bad Request** - Cannot confirm
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "status",
      "message": "Reservation is already Confirmed",
      "value": "Confirmed"
    }
  ]
}
```

**400 Bad Request** - Expired
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "expiresAt",
      "message": "Reservation expired on 2026-05-12T12:00:00.000Z",
      "value": "2026-05-12T12:00:00.000Z"
    }
  ]
}
```

---

### 5. **Cancel Reservation**

Cancel a reservation.

**Endpoint:** `POST /api/v1/reservations/:id/cancel`

**Parameters:**
- `id` (path parameter) - Reservation ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Reservation cancelled successfully",
  "data": {
    "reservation": {
      "_id": "675a8f3a1b4c2d3e4f5a6b7c",
      "status": "Cancelled",
      "cancelledAt": "2026-05-11T14:00:00.000Z",
      ...
    }
  }
}
```

---

## 📊 Reservation Status Flow

```
Pending → Confirmed (payment completed)
Pending → Cancelled (user cancels)
Pending → Expired (24 hours passed)
```

### **Status Types:**
- `Pending` - Reservation created, awaiting confirmation
- `Confirmed` - Reservation confirmed (payment completed)
- `Cancelled` - Reservation cancelled by user
- `Expired` - Reservation expired (24 hours passed)

---

## 🧪 Testing Examples

### **Create Reservation for Bootcamp**
```bash
curl -X POST http://localhost:5001/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "itemType": "bootcamp",
    "itemId": "BOOTCAMP_ID_HERE"
  }'
```

### **Create Reservation for Course**
```bash
curl -X POST http://localhost:5001/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+0987654321",
    "itemType": "course",
    "itemId": "COURSE_ID_HERE"
  }'
```

### **Get Reservation by ID**
```bash
curl -X GET http://localhost:5001/api/v1/reservations/RESERVATION_ID_HERE
```

### **Get Reservations by Email**
```bash
curl -X GET http://localhost:5001/api/v1/reservations/email/john@example.com
```

### **Confirm Reservation**
```bash
curl -X POST http://localhost:5001/api/v1/reservations/RESERVATION_ID_HERE/confirm
```

### **Cancel Reservation**
```bash
curl -X POST http://localhost:5001/api/v1/reservations/RESERVATION_ID_HERE/cancel
```

---

## 🎯 Frontend Integration

### **React Example - Reserve Seat**
```typescript
async function reserveSeat(data: {
  name: string;
  email: string;
  phone: string;
  itemType: 'course' | 'bootcamp';
  itemId: string;
}) {
  try {
    const response = await fetch('/api/v1/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      console.log('Reservation created:', result.data.reservation);
      // Show success message
      // Redirect to confirmation page
    } else {
      console.error('Reservation failed:', result.message);
      // Show error message
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage
reserveSeat({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  itemType: 'bootcamp',
  itemId: '507f1f77bcf86cd799439011',
});
```

### **React Hook Example**
```typescript
import { useState } from 'react';

function useReservation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReservation = async (data: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data.reservation;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createReservation, loading, error };
}

// Usage in component
function ReservationForm() {
  const { createReservation, loading, error } = useReservation();

  const handleSubmit = async (formData: any) => {
    try {
      const reservation = await createReservation(formData);
      console.log('Success:', reservation);
      // Show success message
    } catch (err) {
      console.error('Error:', err);
      // Error is already set in state
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Reserving...' : 'Reserve Seat'}
      </button>
    </form>
  );
}
```

---

## ⚙️ Business Rules

### **Reservation Creation**
1. ✅ User can reserve a seat for any active course/bootcamp
2. ✅ User cannot reserve if no seats available
3. ✅ User cannot have duplicate active reservations for same item
4. ✅ Reservation expires after 24 hours if not confirmed
5. ✅ Enrolled count increments immediately upon reservation

### **Reservation Confirmation**
1. ✅ Only pending reservations can be confirmed
2. ✅ Expired reservations cannot be confirmed
3. ✅ Confirmation timestamp is recorded

### **Reservation Cancellation**
1. ✅ Any reservation can be cancelled (except already cancelled)
2. ✅ Enrolled count decrements upon cancellation
3. ✅ Cancellation timestamp is recorded

### **Seat Management**
1. ✅ `enrolledCount` increments on reservation creation
2. ✅ `enrolledCount` decrements on cancellation
3. ✅ `availableSeats` = `maxSeats` - `enrolledCount`
4. ✅ Cannot reserve if `availableSeats` = 0

---

## 🔔 Notifications (Future Enhancement)

### **Email Notifications**
- ✅ Reservation created → Send confirmation email
- ✅ Reservation confirmed → Send confirmation email
- ✅ Reservation expiring soon → Send reminder (23 hours)
- ✅ Reservation expired → Send expiry notification
- ✅ Reservation cancelled → Send cancellation email

### **SMS Notifications** (Optional)
- Send SMS for important updates

---

## 📈 Analytics (Future Enhancement)

Track:
- Total reservations created
- Conversion rate (pending → confirmed)
- Cancellation rate
- Popular courses/bootcamps
- Peak reservation times

---

## ✅ Validation Rules

### **Name**
- Required
- 2-100 characters
- Trimmed

### **Email**
- Required
- Valid email format
- Normalized (lowercase)
- Trimmed

### **Phone**
- Required
- Valid phone format (numbers, +, -, spaces, parentheses)
- Trimmed

### **Item Type**
- Required
- Must be "course" or "bootcamp"

### **Item ID**
- Required
- Valid MongoDB ObjectId

### **Notes**
- Optional
- Max 500 characters

---

## 🚀 Production Considerations

### **Rate Limiting**
- Limit reservation creation to prevent abuse
- Example: 5 reservations per email per hour

### **Cron Jobs**
- Run hourly to expire old pending reservations
- Send reminder emails 1 hour before expiry

### **Monitoring**
- Track reservation success/failure rates
- Monitor seat availability
- Alert when bootcamps are full

### **Security**
- Validate all inputs
- Prevent duplicate reservations
- Rate limit API endpoints

---

**Status:** ✅ **READY FOR TESTING**  
**Date:** May 11, 2026
