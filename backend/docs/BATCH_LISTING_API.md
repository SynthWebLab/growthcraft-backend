# Batch Listing API Documentation

## Overview

This document describes the batch listing endpoints that allow both administrators and public users to query available batches with various filters.

## Endpoints

### 1. Admin Batch Listing

**Endpoint**: `GET /api/v1/admin/batches`

**Authentication**: Required (SuperAdmin or Ops role)

**Description**: Full administrative access to all batches with comprehensive filtering capabilities.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1, min: 1) |
| `limit` | integer | No | Items per page (default: 10, min: 1, max: 50) |
| `status` | string | No | Filter by batch status (Draft, Open, Filling, Full, InProgress, Completed, Cancelled) |
| `batchType` | string | No | Filter by batch type (Course, TrainingProgram, Bootcamp) |
| `courseId` | string | No | Filter by specific course ID |
| `trainingProgramId` | string | No | Filter by specific training program ID |
| `bootcampId` | string | No | Filter by specific bootcamp ID |
| `mentorId` | string | No | Filter by assigned mentor ID |
| `parentType` | string | No | Filter by parent entity type (Course, TrainingProgram, Bootcamp) |
| `startDate` | string | No | Filter batches starting from this date (ISO 8601 format) |
| `endDate` | string | No | Filter batches starting before this date (ISO 8601 format) |

#### Example Requests

```bash
# Get all batches
curl -X GET "http://localhost:5000/api/v1/admin/batches" \
  -H "Authorization: Bearer <admin-token>"

# Get closed batches
curl -X GET "http://localhost:5000/api/v1/admin/batches?status=Closed" \
  -H "Authorization: Bearer <admin-token>"

# Get batches by mentor
curl -X GET "http://localhost:5000/api/v1/admin/batches?mentorId=66a1234567890abcdef12345" \
  -H "Authorization: Bearer <admin-token>"

# Get all course batches
curl -X GET "http://localhost:5000/api/v1/admin/batches?parentType=Course" \
  -H "Authorization: Bearer <admin-token>"

# Get batches within date range
curl -X GET "http://localhost:5000/api/v1/admin/batches?startDate=2026-01-01&endDate=2026-12-31" \
  -H "Authorization: Bearer <admin-token>"

# Complex filter: Open course batches starting in 2026
curl -X GET "http://localhost:5000/api/v1/admin/batches?status=Open&parentType=Course&startDate=2026-01-01&endDate=2026-12-31&page=1&limit=20" \
  -H "Authorization: Bearer <admin-token>"
```

#### Response Format

```json
{
  "success": true,
  "message": "Batches retrieved successfully",
  "data": [
    {
      "_id": "66a1234567890abcdef12345",
      "batchType": "Course",
      "courseId": {
        "_id": "66a1234567890abcdef12346",
        "title": "Full Stack Development",
        "slug": "full-stack-development"
      },
      "code": "FSD-JAN26-001",
      "startDate": "2026-01-15T00:00:00.000Z",
      "endDate": "2026-06-15T00:00:00.000Z",
      "venue": "Online",
      "mode": "Online",
      "capacity": 30,
      "enrolledCount": 12,
      "status": "Open",
      "assignedMentorId": {
        "_id": "66a1234567890abcdef12347",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com"
      },
      "fee": "5000.00",
      "createdAt": "2025-11-01T10:00:00.000Z",
      "updatedAt": "2025-11-15T14:30:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2026-06-03T12:00:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5
    }
  }
}
```

---

### 2. Public Batch Listing

**Endpoint**: `GET /api/v1/batches`

**Authentication**: Not required (public access)

**Description**: Public-facing endpoint for discovering available batches. Automatically filters to show only Open/Filling batches with future start dates.

**Caching**: Results are cached in Redis for 60 seconds to optimize performance.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1, min: 1) |
| `limit` | integer | No | Items per page (default: 10, min: 1, max: 50) |
| `courseId` | string | No | Filter by specific course ID |
| `trainingProgramId` | string | No | Filter by specific training program ID |
| `bootcampId` | string | No | Filter by specific bootcamp ID |
| `mentorId` | string | No | Filter by assigned mentor ID |
| `parentType` | string | No | Filter by parent entity type (Course, TrainingProgram, Bootcamp) |

#### Automatic Filters (Backend Enforced)

The following filters are **automatically applied** by the backend and cannot be overridden:

- **Status**: Only `Open` or `Filling` batches
- **Start Date**: Only batches with `startDate >= today`

#### Example Requests

```bash
# Get all available batches
curl -X GET "http://localhost:5000/api/v1/batches"

# Get available course batches
curl -X GET "http://localhost:5000/api/v1/batches?parentType=Course"

# Get available batches for specific course
curl -X GET "http://localhost:5000/api/v1/batches?courseId=66a1234567890abcdef12346"

# Get available batches by mentor
curl -X GET "http://localhost:5000/api/v1/batches?mentorId=66a1234567890abcdef12347"

# Get bootcamp batches with pagination
curl -X GET "http://localhost:5000/api/v1/batches?parentType=Bootcamp&page=1&limit=20"
```

#### Response Format

```json
{
  "success": true,
  "message": "Batches retrieved successfully",
  "data": [
    {
      "_id": "66a1234567890abcdef12345",
      "batchType": "Course",
      "courseId": {
        "_id": "66a1234567890abcdef12346",
        "title": "Full Stack Development",
        "slug": "full-stack-development",
        "banner": "https://example.com/banners/fsd.jpg"
      },
      "code": "FSD-JAN26-001",
      "startDate": "2026-01-15T00:00:00.000Z",
      "endDate": "2026-06-15T00:00:00.000Z",
      "venue": "Online",
      "mode": "Online",
      "capacity": 30,
      "enrolledCount": 12,
      "status": "Open",
      "assignedMentorId": {
        "_id": "66a1234567890abcdef12347",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com"
      },
      "fee": "5000.00",
      "createdAt": "2025-11-01T10:00:00.000Z",
      "updatedAt": "2025-11-15T14:30:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2026-06-03T12:00:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 23,
      "totalPages": 3
    }
  }
}
```

---

## Filter Combinations

### Admin Endpoint Combinations

```bash
# All batches by a specific mentor that are currently open
GET /api/v1/admin/batches?mentorId=<id>&status=Open

# All course batches in a date range
GET /api/v1/admin/batches?parentType=Course&startDate=2026-01-01&endDate=2026-12-31

# All cancelled batches for a specific course
GET /api/v1/admin/batches?courseId=<id>&status=Cancelled

# All training program batches assigned to a mentor
GET /api/v1/admin/batches?parentType=TrainingProgram&mentorId=<id>
```

### Public Endpoint Combinations

```bash
# Available course batches
GET /api/v1/batches?parentType=Course

# Available batches for a specific bootcamp
GET /api/v1/batches?bootcampId=<id>

# Available batches by a specific mentor
GET /api/v1/batches?mentorId=<id>

# Available training program batches
GET /api/v1/batches?parentType=TrainingProgram
```

---

## Differences Between Endpoints

| Feature | Admin Endpoint | Public Endpoint |
|---------|---------------|-----------------|
| **Path** | `/api/v1/admin/batches` | `/api/v1/batches` |
| **Authentication** | Required (Admin/Ops) | Not required |
| **Status Filter** | Any status | Only `Open`, `Filling` |
| **Date Filter** | Any date range | Only future dates |
| **Caching** | No caching (real-time) | Redis cache (60s TTL) |
| **Use Case** | Admin management | Student discovery |
| **Date Range Filter** | Yes (`startDate`, `endDate`) | No (auto: future only) |

---

## Error Responses

### 400 Bad Request - Invalid Query Parameters

```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "mentorId",
        "message": "Invalid mentor ID format"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-06-03T12:00:00.000Z"
  }
}
```

### 401 Unauthorized - Admin Endpoint Without Auth

```json
{
  "success": false,
  "error": {
    "statusCode": 401,
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  },
  "meta": {
    "timestamp": "2026-06-03T12:00:00.000Z"
  }
}
```

---

## Caching Strategy (Public Endpoint Only)

### Cache Key Format

```
batches:public:{"page":1,"limit":10,"courseId":"...","mentorId":"...","parentType":"..."}
```

### Cache Behavior

- **TTL**: 60 seconds
- **Cache Hit**: Returns cached data immediately
- **Cache Miss**: Queries database, caches result, returns data
- **Cache Failure**: Falls back to database query (non-blocking)

### Cache Invalidation

The cache is **time-based** (TTL: 60s). For manual invalidation:

```bash
# Clear all public batch caches
npm run clear-cache -- batches:public:*
```

---

## Performance Considerations

### Admin Endpoint

- No caching for real-time data accuracy
- Use pagination for large result sets
- Compound indexes on `status`, `startDate`, `assignedMentorId`

### Public Endpoint

- Redis caching reduces database load
- Sorted by `startDate` (ascending) for user relevance
- Limited to future batches only (smaller result sets)

---

## Implementation Summary

### Task: GC-S402-T3

✅ **Admin Endpoint** (`GET /api/v1/admin/batches`)
  - Pagination support
  - Filters: status, mentorId, parentType, dateRange
  - No caching (real-time data)
  - Authentication required

✅ **Public Endpoint** (`GET /api/v1/batches`)
  - Pagination support
  - Filters: mentorId, parentType
  - Auto-enforced: status (Open/Filling), startDate >= today
  - Redis caching (60s TTL)
  - No authentication required

---

## Testing

See [BATCH_LISTING_TESTING_GUIDE.md](./BATCH_LISTING_TESTING_GUIDE.md) for comprehensive testing examples.
