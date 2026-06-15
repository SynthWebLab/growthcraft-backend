# Training Programs API Documentation

## Overview

The Training Programs API provides endpoints for managing 40-day internship programs across different domains. It follows the same pattern as Courses and Events APIs with support for:

- Program listing with filtering and pagination
- Program details with overview, syllabus, mentors, and FAQs
- Enrollment management
- Callback requests

## Base URL

```
/api/v1/training-programs
```

## Authentication

- **Public Routes**: Program listing and details
- **Protected Routes**: Enrollment and callback requests (requires JWT token)

---

## Endpoints

### 1. Get All Training Programs

Get a paginated list of all published training programs with filtering options.

**Endpoint**: `GET /api/v1/training-programs`

**Access**: Public

**Query Parameters**:
- `domain` (string, optional): Filter by domain (e.g., "Web Development")
- `level` (string, optional): Filter by level ("Beginner", "Intermediate", "Advanced")
- `status` (string, optional): Filter by status ("active", "coming-soon", "draft"). Default: "active"
- `search` (string, optional): Full-text search in title and description
- `page` (number, optional): Page number. Default: 1
- `limit` (number, optional): Items per page. Default: 12
- `sortBy` (string, optional): Sort field. Default: "enrollmentCount"
- `sortOrder` (string, optional): Sort order ("asc" or "desc"). Default: "desc"

**Response**:
```json
{
  "success": true,
  "message": "Training programs retrieved successfully",
  "data": {
    "programs": [
      {
        "_id": "64abc123...",
        "slug": "full-stack-web-development",
        "title": "Full-Stack Web Development Internship",
        "description": "Build production-ready web applications...",
        "domain": "Web Development",
        "durationDays": 60,
        "tools": ["React", "Node.js", "MongoDB", "Express"],
        "price": 12999,
        "originalPrice": 18999,
        "status": "active",
        "enrollmentCount": 342,
        "rating": 4.8,
        "level": "Intermediate",
        "thumbnail": "/images/programs/full-stack.jpg",
        "startDate": "2026-07-01T00:00:00.000Z",
        "maxSeats": 50,
        "enrolledCount": 28,
        "createdAt": "2026-06-01T00:00:00.000Z",
        "updatedAt": "2026-06-15T00:00:00.000Z"
      }
    ],
    "total": 12,
    "page": 1,
    "totalPages": 1
  }
}
```

---

### 2. Get Training Program by Slug

Get detailed information about a specific training program.

**Endpoint**: `GET /api/v1/training-programs/:slug`

**Access**: Public

**Parameters**:
- `slug` (string, required): Program slug (e.g., "full-stack-web-development")

**Response**:
```json
{
  "success": true,
  "message": "Training program retrieved successfully",
  "data": {
    "program": {
      "_id": "64abc123...",
      "slug": "full-stack-web-development",
      "title": "Full-Stack Web Development Internship",
      "description": "Build production-ready web applications...",
      "domain": "Web Development",
      "durationDays": 60,
      "tools": ["React", "Node.js", "MongoDB", "Express"],
      "price": 12999,
      "originalPrice": 18999,
      "status": "active",
      "enrollmentCount": 342,
      "rating": 4.8,
      "level": "Intermediate",
      "thumbnail": "/images/programs/full-stack.jpg",
      "startDate": "2026-07-01T00:00:00.000Z",
      "maxSeats": 50,
      "enrolledCount": 28
    }
  }
}
```

---

### 3. Get All Domains

Get a list of all unique domains for filtering.

**Endpoint**: `GET /api/v1/training-programs/filters/domains`

**Access**: Public

**Response**:
```json
{
  "success": true,
  "message": "Domains retrieved successfully",
  "data": {
    "domains": [
      "Web Development",
      "Design",
      "Data Science",
      "DevOps",
      "Mobile Development",
      "Marketing",
      "Artificial Intelligence"
    ]
  }
}
```

---

### 4. Get Popular Training Programs

Get the most popular training programs based on enrollment count and rating.

**Endpoint**: `GET /api/v1/training-programs/popular`

**Access**: Public

**Query Parameters**:
- `limit` (number, optional): Number of programs to return. Default: 6

**Response**:
```json
{
  "success": true,
  "message": "Popular training programs retrieved successfully",
  "data": {
    "programs": [...]
  }
}
```

---

### 5. Get Similar Training Programs

Get training programs similar to the specified one (same domain).

**Endpoint**: `GET /api/v1/training-programs/:slug/similar`

**Access**: Public

**Parameters**:
- `slug` (string, required): Program slug

**Query Parameters**:
- `limit` (number, optional): Number of programs to return. Default: 4

**Response**:
```json
{
  "success": true,
  "message": "Similar training programs retrieved successfully",
  "data": {
    "programs": [...]
  }
}
```

---

### 6. Get Training Program Details

Get complete program details including overview, syllabus, mentors, and FAQs.

**Endpoint**: `GET /api/v1/training-programs/:slug/details`

**Access**: Public

**Response**:
```json
{
  "success": true,
  "message": "Training program details retrieved successfully",
  "data": {
    "programDetails": {
      "_id": "64def456...",
      "programId": "64abc123...",
      "slug": "full-stack-web-development",
      "overview": {
        "aboutProgram": "This comprehensive 60-day internship...",
        "whatYouWillLearn": [
          { "text": "Master React from basics to advanced" },
          { "text": "Build real-world projects" }
        ],
        "prerequisites": [
          { "text": "Basic programming knowledge" }
        ],
        "whatsIncluded": [
          { "text": "Live sessions", "icon": "🎥" },
          { "text": "Hands-on projects", "icon": "💻" }
        ]
      },
      "syllabus": [
        {
          "week": 1,
          "title": "Week 1: HTML, CSS & JavaScript Fundamentals",
          "topics": ["Introduction to React", "Components", "Props"],
          "deliverables": ["Project milestone 1", "Weekly assignment"]
        }
      ],
      "mentors": [
        {
          "name": "Rajesh Kumar",
          "avatar": "/images/mentors/rajesh.jpg",
          "designation": "Senior Engineer",
          "company": "Tech Corp",
          "bio": "Rajesh has over 10 years of experience...",
          "expertise": ["React", "Node.js", "MongoDB"],
          "socialLinks": {
            "linkedin": "https://linkedin.com/in/rajesh-kumar",
            "github": "https://github.com/rajeshkumar"
          }
        }
      ],
      "faqs": [
        {
          "question": "Is this program suitable for beginners?",
          "answer": "This program is designed for intermediate level..."
        }
      ]
    }
  }
}
```

---

### 7. Get Program Overview

Get only the overview section of the program details.

**Endpoint**: `GET /api/v1/training-programs/:slug/overview`

**Access**: Public

---

### 8. Get Program Syllabus

Get only the syllabus section.

**Endpoint**: `GET /api/v1/training-programs/:slug/syllabus`

**Access**: Public

---

### 9. Get Program Mentors

Get only the mentors section.

**Endpoint**: `GET /api/v1/training-programs/:slug/mentors`

**Access**: Public

---

### 10. Get Program FAQs

Get only the FAQs section.

**Endpoint**: `GET /api/v1/training-programs/:slug/faqs`

**Access**: Public

---

### 11. Enroll in Training Program

Enroll the authenticated user in a training program.

**Endpoint**: `POST /api/v1/training-programs/:programId/enroll`

**Access**: Protected (requires authentication)

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Parameters**:
- `programId` (string, required): MongoDB ObjectId of the program

**Request Body**:
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully enrolled in the training program. We will get back to you soon!",
  "data": {
    "enrollment": {
      "_id": "64xyz789...",
      "userId": "64user123...",
      "programId": "64abc123...",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "title": "Full-Stack Web Development Internship",
      "status": "pending",
      "paymentStatus": "pending",
      "enrollmentDate": "2026-06-15T10:30:00.000Z"
    }
  }
}
```

**Error Responses**:
- `409 Conflict`: Already enrolled in this program
- `404 Not Found`: Training program not found
- `401 Unauthorized`: User not authenticated

---

### 12. Request Callback

Request a callback from the team for a training program.

**Endpoint**: `POST /api/v1/training-programs/:programId/request-callback`

**Access**: Protected (requires authentication)

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Request Body**: Same as enrollment

**Response**:
```json
{
  "success": true,
  "message": "Thank you! We will get back to you soon within 24 hours.",
  "data": {
    "callbackRequest": {
      "_id": "64callback...",
      "userId": "64user123...",
      "programId": "64abc123...",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "title": "Full-Stack Web Development Internship",
      "status": "pending",
      "requestDate": "2026-06-15T10:30:00.000Z"
    }
  }
}
```

---

### 13. Get My Enrollments

Get all training program enrollments for the authenticated user.

**Endpoint**: `GET /api/v1/training-programs/enrollments/my-enrollments`

**Access**: Protected (requires authentication)

**Response**:
```json
{
  "success": true,
  "message": "Enrollments retrieved successfully",
  "data": {
    "enrollments": [
      {
        "_id": "64enroll...",
        "programId": {
          "_id": "64abc123...",
          "title": "Full-Stack Web Development Internship",
          "slug": "full-stack-web-development",
          "thumbnail": "/images/programs/full-stack.jpg",
          "price": 12999,
          "domain": "Web Development",
          "level": "Intermediate",
          "durationDays": 60
        },
        "fullName": "John Doe",
        "email": "john@example.com",
        "status": "confirmed",
        "paymentStatus": "completed",
        "enrollmentDate": "2026-06-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

### 14. Get My Callback Requests

Get all callback requests for the authenticated user.

**Endpoint**: `GET /api/v1/training-programs/callbacks/my-requests`

**Access**: Protected (requires authentication)

---

### 15. Check Enrollment Status

Check if the user is enrolled or has a pending callback request.

**Endpoint**: `GET /api/v1/training-programs/:programId/enrollment-status`

**Access**: Protected (requires authentication)

**Response**:
```json
{
  "success": true,
  "message": "Enrollment status retrieved successfully",
  "data": {
    "isEnrolled": true,
    "hasCallbackRequest": false
  }
}
```

---

## Database Models

### TrainingProgram Model

```typescript
{
  slug: string;              // Unique URL-friendly identifier
  title: string;             // Program title
  description: string;       // Program description
  domain: string;            // e.g., "Web Development"
  durationDays: number;      // Program duration in days
  tools: string[];           // Technologies/tools used
  price: number;             // Current price
  originalPrice?: number;    // Original price (for discounts)
  status: 'active' | 'coming-soon' | 'draft';
  enrollmentCount: number;   // Total enrollments
  rating: number;            // Average rating (0-5)
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  thumbnail?: string;        // Image URL
  startDate?: Date;          // Program start date
  maxSeats?: number;         // Maximum seats
  enrolledCount?: number;    // Currently enrolled
  isPublished: boolean;      // Visibility flag
  deletedAt?: Date;          // Soft delete
  createdAt: Date;
  updatedAt: Date;
}
```

### TrainingProgramDetails Model

```typescript
{
  programId: ObjectId;       // Reference to TrainingProgram
  slug: string;              // Same as program slug
  overview: {
    aboutProgram: string;
    whatYouWillLearn: Array<{ text: string }>;
    prerequisites: Array<{ text: string }>;
    whatsIncluded: Array<{ text: string; icon?: string }>;
  };
  syllabus: Array<{
    week: number;
    title: string;
    topics: string[];
    deliverables?: string[];
  }>;
  mentors: Array<{
    name: string;
    avatar?: string;
    designation: string;
    company?: string;
    bio: string;
    expertise: string[];
    socialLinks?: {
      linkedin?: string;
      twitter?: string;
      github?: string;
    };
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}
```

---

## Seeding Data

To populate the database with sample training programs:

```bash
# Seed training programs and their details
npx ts-node scripts/seed-training-programs.ts
```

This will create:
- 12 training programs across different domains
- Complete program details for each program
- Realistic data matching the frontend requirements

---

## Testing the API

### Using cURL

```bash
# Get all programs
curl http://localhost:3000/api/v1/training-programs

# Get program by slug
curl http://localhost:3000/api/v1/training-programs/full-stack-web-development

# Get program details
curl http://localhost:3000/api/v1/training-programs/full-stack-web-development/details

# Enroll (requires authentication)
curl -X POST http://localhost:3000/api/v1/training-programs/64abc123.../enroll \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"John Doe","email":"john@example.com","phone":"+919876543210"}'
```

### Using Postman

Import the provided Postman collection:
`backend/postman/Training-Programs-API.postman_collection.json` (to be created)

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "statusCode": 400,
    "code": "VALIDATION_ERROR",
    "details": []
  }
}
```

Common HTTP Status Codes:
- `200 OK`: Successful GET request
- `201 Created`: Successful POST request
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate entry
- `500 Internal Server Error`: Server error

---

## Notes

1. All dates are in ISO 8601 format
2. Prices are in INR (Indian Rupees)
3. Phone numbers should be in E.164 format
4. The API uses JWT for authentication
5. All timestamps are in UTC
6. Soft deletes are used (deletedAt field)
7. Text search uses MongoDB full-text indexes

---

## Next Steps

1. Add Postman collection for easy testing
2. Implement admin endpoints for program management
3. Add analytics endpoints for enrollment tracking
4. Integrate payment gateway for enrollment
5. Add email notifications for enrollments
