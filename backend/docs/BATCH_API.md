# Batch Management API Documentation

This document describes the Batch Management API endpoints for creating, updating, and listing batches of catalogue items (courses, training programs, bootcamps).

## Table of Contents

- [Overview](#overview)
- [Authentication & Authorization](#authentication--authorization)
- [Admin Endpoints](#admin-endpoints)
- [Public Endpoints](#public-endpoints)
- [Batch Status Flow](#batch-status-flow)
- [Examples](#examples)

## Overview

Batches represent scheduled instances of courses, training programs, or bootcamps with specific:
- Start and end dates
- Capacity and enrollment tracking
- Assigned mentor
- Pricing and mode (Online/Offline/Hybrid)
- Status management (Draft → Open → Filling → Full → InProgress → Completed)

## Authentication & Authorization

### Admin Endpoints
- **Route Prefix**: `/api/v1/admin/batches`
- **Required Roles**: `SuperAdmin` or `Ops`
- **Authentication**: Required (JWT token via cookie or Authorization header)

### Public Endpoints
- **Route Prefix**: `/api/v1/batches`
- **Required Roles**: None (public access)
- **Authentication**: Not required

## Admin Endpoints

### 1. Create Batch

Create a new batch for a course, training program, or bootcamp.

**Endpoint**: `POST /api/v1/admin/batches`

**Request Body**:
```json
{
  "batchType": "Course",
  "parentId": "60d5ec49f1b2c8b1f8e4e1a1",
  "startDate": "2026-07-01",
  "endDate": "2026-09-30",
  "capacity": 30,
  "fee": 15000,
  "mode": "Online",
  "venue": "Virtual Classroom",
  "code": "AAMD-20260701"
}
```

**Field Details**:
- `batchType` (required): `"Course"`, `"TrainingProgram"`, or `"Bootcamp"`
- `parentId` (required): MongoDB ObjectId of the parent entity
- `startDate` (required): ISO date string
- `endDate` (required): ISO date string (must be >= startDate)
- `capacity` (required): Integer, minimum 1
- `fee` (required): Number, minimum 0
- `mode` (required): `"Online"`, `"Offline"`, or `"Hybrid"`
- `venue` (optional): String, location details
- `code` (optional): Custom batch code (auto-generated if not provided)

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Batch created successfully",
  "data": {
    "batch": {
      "_id": "60d5ec49f1b2c8b1f8e4e1a2",
      "batchType": "Course",
      "courseId": "60d5ec49f1b2c8b1f8e4e1a1",
      "code": "AAMD-20260701",
      "startDate": "2026-07-01T00:00:00.000Z",
      "endDate": "2026-09-30T00:00:00.000Z",
      "capacity": 30,
      "enrolledCount": 0,
      "fee": "15000",
      "mode": "Online",
      "venue": "Virtual Classroom",
      "status": "Draft",
      "createdAt": "2026-06-02T10:30:00.000Z",
      "updatedAt": "2026-06-02T10:30:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2026-06-02T10:30:00.000Z"
  }
}
```

**Notes**:
- Batch is created with status `"Draft"` by default
- Batch code is auto-generated from parent title/slug + start date (e.g., `AAMD-20260701` for "Algo Ace Mastering DSA" starting July 1, 2026)
- Operator can override the auto-generated code by providing a custom `code`

---

### 2. List Batches

List all batches with optional filters.

**Endpoint**: `GET /api/v1/admin/batches`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)
- `status` (optional): Filter by status (`Draft`, `Open`, `Filling`, `Full`, `InProgress`, `Completed`, `Cancelled`)
- `batchType` (optional): Filter by type (`Course`, `TrainingProgram`, `Bootcamp`)
- `courseId` (optional): Filter by course ID
- `trainingProgramId` (optional): Filter by training program ID
- `bootcampId` (optional): Filter by bootcamp ID

**Example Request**:
```
GET /api/v1/admin/batches?status=Open&batchType=Course&page=1&limit=10
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Batches retrieved successfully",
  "data": [
    {
      "_id": "60d5ec49f1b2c8b1f8e4e1a2",
      "batchType": "Course",
      "courseId": {
        "_id": "60d5ec49f1b2c8b1f8e4e1a1",
        "title": "Algo Ace: Mastering DSA",
        "slug": "algo-ace-mastering-dsa"
      },
      "code": "AAMD-20260701",
      "startDate": "2026-07-01T00:00:00.000Z",
      "endDate": "2026-09-30T00:00:00.000Z",
      "capacity": 30,
      "enrolledCount": 15,
      "fee": "15000",
      "mode": "Online",
      "status": "Open",
      "assignedMentorId": {
        "_id": "60d5ec49f1b2c8b1f8e4e1a3",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com"
      },
      "createdAt": "2026-06-02T10:30:00.000Z",
      "updatedAt": "2026-06-02T11:00:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2026-06-02T12:00:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

---

### 3. Get Batch by ID

Retrieve a specific batch by its ID.

**Endpoint**: `GET /api/v1/admin/batches/:id`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Batch retrieved successfully",
  "data": {
    "batch": {
      "_id": "60d5ec49f1b2c8b1f8e4e1a2",
      "batchType": "Course",
      "courseId": {
        "_id": "60d5ec49f1b2c8b1f8e4e1a1",
        "title": "Algo Ace: Mastering DSA",
        "slug": "algo-ace-mastering-dsa"
      },
      "code": "AAMD-20260701",
      "startDate": "2026-07-01T00:00:00.000Z",
      "endDate": "2026-09-30T00:00:00.000Z",
      "capacity": 30,
      "enrolledCount": 15,
      "fee": "15000",
      "mode": "Online",
      "venue": "Virtual Classroom",
      "status": "Open",
      "assignedMentorId": {
        "_id": "60d5ec49f1b2c8b1f8e4e1a3",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com"
      },
      "createdAt": "2026-06-02T10:30:00.000Z",
      "updatedAt": "2026-06-02T11:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2026-06-02T12:00:00.000Z"
  }
}
```

---

### 4. Update Batch

Update batch details including status.

**Endpoint**: `PATCH /api/v1/admin/batches/:id`

**Request Body** (all fields optional):
```json
{
  "status": "Open",
  "startDate": "2026-07-05",
  "endDate": "2026-10-05",
  "capacity": 35,
  "fee": 16000,
  "mode": "Hybrid",
  "venue": "Online + Bangalore Campus"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Batch updated successfully",
  "data": {
    "batch": {
      "_id": "60d5ec49f1b2c8b1f8e4e1a2",
      "status": "Open",
      "startDate": "2026-07-05T00:00:00.000Z",
      "endDate": "2026-10-05T00:00:00.000Z",
      "capacity": 35,
      "fee": "16000",
      "mode": "Hybrid",
      "venue": "Online + Bangalore Campus",
      "updatedAt": "2026-06-02T12:30:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2026-06-02T12:30:00.000Z"
  }
}
```

**Notes**:
- When status is changed from `Draft` to `Open`, the batch becomes publicly visible
- Capacity cannot be reduced below current `enrolledCount`
- `endDate` must be >= `startDate`

---

### 5. Assign Mentor to Batch

Assign or reassign a mentor to a batch.

**Endpoint**: `PATCH /api/v1/admin/batches/:id/mentor`

**Request Body**:
```json
{
  "mentorId": "60d5ec49f1b2c8b1f8e4e1a3"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Mentor assigned successfully",
  "data": {
    "batch": {
      "_id": "60d5ec49f1b2c8b1f8e4e1a2",
      "assignedMentorId": "60d5ec49f1b2c8b1f8e4e1a3",
      "updatedAt": "2026-06-02T13:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2026-06-02T13:00:00.000Z"
  }
}
```

**Notes**:
- Mentor assignment is separate from batch creation/update
- Allows reassignment without rewriting the entire batch
- Mentor receives a notification (Epic 14 - to be implemented)

---

## Public Endpoints

### List Public Batches

List batches available for enrollment (status `Open` or `Filling`, start date >= today).

**Endpoint**: `GET /api/v1/batches`

**Query Parameters**:
- `courseId` (optional): Filter by course ID
- `trainingProgramId` (optional): Filter by training program ID
- `bootcampId` (optional): Filter by bootcamp ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)

**Example Request**:
```
GET /api/v1/batches?courseId=60d5ec49f1b2c8b1f8e4e1a1
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Batches retrieved successfully",
  "data": [
    {
      "_id": "60d5ec49f1b2c8b1f8e4e1a2",
      "batchType": "Course",
      "courseId": {
        "_id": "60d5ec49f1b2c8b1f8e4e1a1",
        "title": "Algo Ace: Mastering DSA",
        "slug": "algo-ace-mastering-dsa",
        "banner": "/images/courses/dsa-banner.jpg"
      },
      "code": "AAMD-20260701",
      "startDate": "2026-07-01T00:00:00.000Z",
      "endDate": "2026-09-30T00:00:00.000Z",
      "capacity": 30,
      "enrolledCount": 15,
      "fee": "15000",
      "mode": "Online",
      "venue": "Virtual Classroom",
      "status": "Open",
      "createdAt": "2026-06-02T10:30:00.000Z",
      "updatedAt": "2026-06-02T11:00:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2026-06-02T14:00:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 8,
      "totalPages": 1
    }
  }
}
```

**Notes**:
- Only returns batches with status `Open` or `Filling`
- Only returns batches with `startDate >= today`
- Does not expose `assignedMentorId` for privacy
- No authentication required

---

## Batch Status Flow

1. **Draft**: Initial state when batch is created. Not visible to public.
2. **Open**: Batch is accepting enrollments. Visible on public API.
3. **Filling**: Batch is nearing capacity. Still visible on public API.
4. **Full**: Capacity reached. No longer visible on public API.
5. **InProgress**: Batch has started. No new enrollments.
6. **Completed**: Batch has ended.
7. **Cancelled**: Batch was cancelled.

---

## Examples

### Create a batch for a course

```bash
curl -X POST https://api.growthcraft.com/api/v1/admin/batches \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batchType": "Course",
    "parentId": "60d5ec49f1b2c8b1f8e4e1a1",
    "startDate": "2026-07-01",
    "endDate": "2026-09-30",
    "capacity": 30,
    "fee": 15000,
    "mode": "Online"
  }'
```

### Update batch status to Open

```bash
curl -X PATCH https://api.growthcraft.com/api/v1/admin/batches/60d5ec49f1b2c8b1f8e4e1a2 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Open"
  }'
```

### Assign a mentor

```bash
curl -X PATCH https://api.growthcraft.com/api/v1/admin/batches/60d5ec49f1b2c8b1f8e4e1a2/mentor \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mentorId": "60d5ec49f1b2c8b1f8e4e1a3"
  }'
```

### Get public batches for a specific course

```bash
curl https://api.growthcraft.com/api/v1/batches?courseId=60d5ec49f1b2c8b1f8e4e1a1
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "timestamp": "2026-06-02T14:30:00.000Z",
    "errors": [
      {
        "field": "capacity",
        "message": "Capacity cannot be less than current enrolled count (15)",
        "value": 10
      }
    ]
  }
}
```

Common error codes:
- `VALIDATION_ERROR` (400): Invalid input data
- `NOT_AUTHENTICATED` (401): Missing or invalid authentication token
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Batch or parent entity not found
- `BATCH_NOT_FOUND` (404): Specific batch not found
- `COURSE_NOT_FOUND` (404): Parent course not found
- `RESOURCE_NOT_FOUND` (404): Parent training program or bootcamp not found

---

## Implementation Status

✅ Implemented:
- Create batch with auto-generated code
- Custom batch code override
- List batches with filters (admin)
- Get batch by ID
- Update batch details and status
- Assign mentor to batch
- List public batches (Open/Filling, future dates only)
- RBAC with SuperAdmin and Ops roles

🚧 Pending (Future Epics):
- Mentor notification on assignment (Epic 14)
- Automatic status transitions (e.g., Draft → Open on specific date)
- Enrollment management integration
- Batch capacity auto-update on enrollment
