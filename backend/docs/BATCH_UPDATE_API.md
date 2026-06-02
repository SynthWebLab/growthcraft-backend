# Batch Update API Documentation

## Overview

This document describes the two PATCH endpoints for updating batches:
1. **Generic PATCH** - Updates venue, capacity, and status with enforced transitions
2. **Mentor PATCH** - Assigns a mentor to a batch and triggers a notification

---

## 1. Generic Batch Update

### Endpoint
```
PATCH /api/v1/admin/batches/:id
```

### Description
Updates batch details including venue, capacity, and status. Status transitions are strictly enforced based on the current batch status.

### Authentication
- **Required**: Yes
- **Roles**: SuperAdmin, Ops

### Request Parameters

#### Path Parameters
| Parameter | Type   | Required | Description           |
|-----------|--------|----------|-----------------------|
| id        | string | Yes      | MongoDB ObjectId of batch |

#### Request Body
| Field    | Type   | Required | Description                                    |
|----------|--------|----------|------------------------------------------------|
| venue    | string | No       | Physical location or online platform details   |
| capacity | number | No       | Maximum number of students (must be ≥ enrolledCount) |
| status   | string | No       | New batch status (must follow allowed transitions) |

### Status Transitions

The following status transitions are enforced:

| Current Status | Allowed Next States                |
|----------------|------------------------------------|
| Draft          | Open, Cancelled                    |
| Open           | Filling, Cancelled                 |
| Filling        | Full, Cancelled                    |
| Full           | InProgress, Cancelled              |
| InProgress     | Completed, Cancelled               |
| Completed      | Cancelled                          |
| Cancelled      | (No transitions allowed)           |

**Note**: Any status can transition to `Cancelled`.

### Example Requests

#### Update Venue
```json
{
  "venue": "Building A, Room 101, Tech Campus"
}
```

#### Update Capacity
```json
{
  "capacity": 50
}
```

#### Update Status
```json
{
  "status": "Open"
}
```

#### Update Multiple Fields
```json
{
  "venue": "Online - Zoom Platform",
  "capacity": 100,
  "status": "Open"
}
```

### Response

#### Success (200 OK)
```json
{
  "success": true,
  "message": "Batch updated successfully",
  "data": {
    "batch": {
      "_id": "507f1f77bcf86cd799439011",
      "batchType": "Course",
      "courseId": "507f191e810c19729de860ea",
      "code": "CS-WD-2024-Q1",
      "startDate": "2024-04-01T00:00:00.000Z",
      "endDate": "2024-06-30T00:00:00.000Z",
      "venue": "Building A, Room 101, Tech Campus",
      "mode": "Offline",
      "capacity": 50,
      "enrolledCount": 23,
      "status": "Open",
      "fee": "50000",
      "createdAt": "2024-03-01T10:00:00.000Z",
      "updatedAt": "2024-03-15T14:30:00.000Z"
    }
  }
}
```

### Error Responses

#### Invalid Status Transition (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "status",
      "message": "Invalid status transition from Open to Completed",
      "value": "Completed"
    }
  ]
}
```

#### Capacity Less Than Enrolled Count (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "capacity",
      "message": "Capacity cannot be less than enrolled count (23)",
      "value": 20
    }
  ]
}
```

#### Batch Not Found (404)
```json
{
  "success": false,
  "message": "Resource not found",
  "errors": [
    {
      "message": "Batch not found"
    }
  ]
}
```

---

## 2. Assign Mentor to Batch

### Endpoint
```
PATCH /api/v1/admin/batches/:id/mentor
```

### Description
Assigns a mentor to a batch and creates a notification for the assigned mentor. This endpoint validates that the mentor exists before assignment.

### Authentication
- **Required**: Yes
- **Roles**: SuperAdmin, Ops

### Request Parameters

#### Path Parameters
| Parameter | Type   | Required | Description           |
|-----------|--------|----------|-----------------------|
| id        | string | Yes      | MongoDB ObjectId of batch |

#### Request Body
| Field    | Type   | Required | Description                          |
|----------|--------|----------|--------------------------------------|
| mentorId | string | Yes      | MongoDB ObjectId of mentor profile   |

### Example Request
```json
{
  "mentorId": "507f191e810c19729de860ea"
}
```

### Response

#### Success (200 OK)
```json
{
  "success": true,
  "message": "Mentor assigned successfully",
  "data": {
    "batch": {
      "_id": "507f1f77bcf86cd799439011",
      "batchType": "Course",
      "courseId": "507f191e810c19729de860ea",
      "code": "CS-WD-2024-Q1",
      "startDate": "2024-04-01T00:00:00.000Z",
      "endDate": "2024-06-30T00:00:00.000Z",
      "venue": "Building A, Room 101",
      "mode": "Offline",
      "capacity": 50,
      "enrolledCount": 23,
      "status": "Open",
      "assignedMentorId": "507f191e810c19729de860ea",
      "fee": "50000",
      "createdAt": "2024-03-01T10:00:00.000Z",
      "updatedAt": "2024-03-15T14:30:00.000Z"
    }
  }
}
```

### Notification Created

When a mentor is assigned, a notification is automatically created with the following structure:

```json
{
  "type": "batch.assigned",
  "userId": "507f191e810c19729de860ea",
  "data": {
    "batchId": "507f1f77bcf86cd799439011",
    "batchCode": "CS-WD-2024-Q1",
    "startDate": "2024-04-01T00:00:00.000Z",
    "endDate": "2024-06-30T00:00:00.000Z",
    "batchType": "Course"
  },
  "readAt": null,
  "createdAt": "2024-03-15T14:30:00.000Z"
}
```

### Error Responses

#### Mentor Not Found (404)
```json
{
  "success": false,
  "message": "Resource not found",
  "errors": [
    {
      "message": "Mentor not found"
    }
  ]
}
```

#### Batch Not Found (404)
```json
{
  "success": false,
  "message": "Resource not found",
  "errors": [
    {
      "message": "Batch not found"
    }
  ]
}
```

#### Invalid Mentor ID Format (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "mentorId",
      "message": "Invalid mentor ID format"
    }
  ]
}
```

---

## Testing with Postman

### 1. Generic Update Example

**Request:**
```http
PATCH http://localhost:3000/api/v1/admin/batches/507f1f77bcf86cd799439011
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "venue": "Online - Google Meet",
  "capacity": 75,
  "status": "Open"
}
```

### 2. Assign Mentor Example

**Request:**
```http
PATCH http://localhost:3000/api/v1/admin/batches/507f1f77bcf86cd799439011/mentor
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "mentorId": "507f191e810c19729de860ea"
}
```

---

## Business Logic

### Generic Update Endpoint
1. Validates batch ID format
2. Retrieves batch from database
3. Validates capacity constraint: new capacity ≥ current enrolledCount
4. Validates status transition based on `allowedStatusTransitions` map
5. Updates allowed fields: venue, capacity, status
6. Saves batch and logs the update

### Mentor Assignment Endpoint
1. Validates batch ID and mentor ID formats
2. Fetches batch and mentor profile in parallel
3. Validates both resources exist
4. Assigns mentor to batch
5. Creates a notification with type `batch.assigned`
6. Saves batch and logs the assignment

---

## Implementation Notes

### Status Transition Enforcement
Status transitions are enforced using a predefined map in the service layer:

```typescript
const allowedStatusTransitions: Record<BatchStatus, BatchStatus[]> = {
  [BatchStatus.DRAFT]: [BatchStatus.OPEN, BatchStatus.CANCELLED],
  [BatchStatus.OPEN]: [BatchStatus.FILLING, BatchStatus.CANCELLED],
  [BatchStatus.FILLING]: [BatchStatus.FULL, BatchStatus.CANCELLED],
  [BatchStatus.FULL]: [BatchStatus.IN_PROGRESS, BatchStatus.CANCELLED],
  [BatchStatus.IN_PROGRESS]: [BatchStatus.COMPLETED, BatchStatus.CANCELLED],
  [BatchStatus.COMPLETED]: [BatchStatus.CANCELLED],
  [BatchStatus.CANCELLED]: [],
};
```

### Notification System
The mentor assignment triggers a notification that:
- Uses type `batch.assigned` for easy filtering
- Includes batch details in the `data` field
- Is created atomically with the mentor assignment
- Can be consumed by frontend notification systems

### Validation Strategy
- **Zod schemas** validate request structure and types
- **Service layer** enforces business rules (status transitions, capacity constraints)
- **Model validators** ensure data integrity at database level
