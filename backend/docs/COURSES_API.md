# Courses API Documentation

## Overview

The Courses API provides endpoints for browsing, filtering, searching, and retrieving course information. It supports advanced filtering, full-text search, and pagination.

## Base URL

```
/api/v1/courses
```

## Endpoints

### 1. Get All Courses (with filtering, search, and pagination)

**Endpoint:** `GET /api/v1/courses`

**Description:** Retrieve a paginated list of courses with optional filtering and search capabilities.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number (min: 1) |
| `limit` | integer | No | 10 | Items per page (min: 1, max: 50) |
| `category` | string | No | - | Filter by category: `MERN`, `UI/UX`, `DataScience`, `DevOps`, `Other` |
| `difficultyLevel` | string | No | - | Filter by difficulty: `Beginner`, `Intermediate`, `Advanced` |
| `minPrice` | number | No | - | Minimum price filter |
| `maxPrice` | number | No | - | Maximum price filter |
| `minRating` | number | No | - | Minimum rating (0-5) |
| `tags` | string | No | - | Comma-separated tags (e.g., `JavaScript,React`) |
| `search` | string | No | - | Search query for title and description (max 100 chars) |
| `sortBy` | string | No | `createdAt` | Sort field: `title`, `price`, `rating`, `enrollmentCount`, `createdAt`, `duration` |
| `sortOrder` | string | No | `desc` | Sort order: `asc` or `desc` |

#### Example Requests

**Basic request (default pagination):**
```bash
GET /api/v1/courses
```

**Filter by category and difficulty:**
```bash
GET /api/v1/courses?category=MERN&difficultyLevel=Beginner
```

**Search for courses:**
```bash
GET /api/v1/courses?search=JavaScript
```

**Filter by price range:**
```bash
GET /api/v1/courses?minPrice=3000&maxPrice=8000
```

**Filter by tags:**
```bash
GET /api/v1/courses?tags=React,Node.js
```

**Sort by rating (highest first):**
```bash
GET /api/v1/courses?sortBy=rating&sortOrder=desc
```

**Complex query (multiple filters):**
```bash
GET /api/v1/courses?category=MERN&difficultyLevel=Intermediate&minRating=4.5&sortBy=enrollmentCount&sortOrder=desc&page=1&limit=20
```

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "message": "Courses retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "JavaScript Zero to Hero",
      "description": "The only JS course you need. Closures, async, DOM, ES6+, and 30+ hands-on projects",
      "category": "MERN",
      "difficultyLevel": "Beginner",
      "duration": 70,
      "lessonsCount": 52,
      "price": 4499,
      "originalPrice": 7999,
      "rating": 4.9,
      "instructor": {
        "name": "Ananya Iyer",
        "avatar": "https://i.pravatar.cc/150?img=1"
      },
      "thumbnail": "https://example.com/course-thumbnail.jpg",
      "isActive": true,
      "tags": ["JavaScript", "ES6", "DOM", "Async"],
      "enrollmentCount": 1250,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2024-01-20T12:00:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

**Validation Error (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "minRating",
        "message": "Minimum rating must be between 0 and 5"
      }
    ]
  }
}
```

---

### 2. Get Course by ID

**Endpoint:** `GET /api/v1/courses/:id`

**Description:** Retrieve detailed information about a specific course.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Course ID (MongoDB ObjectId) |

#### Example Request

```bash
GET /api/v1/courses/507f1f77bcf86cd799439011
```

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "message": "Course retrieved successfully",
  "data": {
    "course": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "JavaScript Zero to Hero",
      "description": "The only JS course you need. Closures, async, DOM, ES6+, and 30+ hands-on projects",
      "category": "MERN",
      "difficultyLevel": "Beginner",
      "duration": 70,
      "lessonsCount": 52,
      "price": 4499,
      "originalPrice": 7999,
      "rating": 4.9,
      "instructor": {
        "name": "Ananya Iyer",
        "avatar": "https://i.pravatar.cc/150?img=1"
      },
      "thumbnail": "https://example.com/course-thumbnail.jpg",
      "isActive": true,
      "tags": ["JavaScript", "ES6", "DOM", "Async"],
      "enrollmentCount": 1250,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2024-01-20T12:00:00.000Z"
  }
}
```

**Not Found (404):**
```json
{
  "success": false,
  "error": {
    "message": "Course with ID 507f1f77bcf86cd799439011 not found",
    "code": "RESOURCE_NOT_FOUND"
  }
}
```

---

### 3. Get Filter Options

**Endpoint:** `GET /api/v1/courses/filters/options`

**Description:** Retrieve available filter options for the frontend UI (categories, difficulty levels, price range, and tags).

#### Example Request

```bash
GET /api/v1/courses/filters/options
```

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "message": "Filter options retrieved successfully",
  "data": {
    "categories": ["MERN", "UI/UX", "DataScience", "DevOps", "Other"],
    "difficultyLevels": ["Beginner", "Intermediate", "Advanced"],
    "priceRange": {
      "min": 0,
      "max": 15000
    },
    "tags": [
      "JavaScript",
      "React",
      "Node.js",
      "Python",
      "Machine Learning",
      "AWS",
      "Docker",
      "Figma"
    ]
  },
  "meta": {
    "timestamp": "2024-01-20T12:00:00.000Z"
  }
}
```

---

## Data Model

### Course Schema

```typescript
{
  _id: ObjectId,
  title: string,              // 3-200 characters
  description: string,        // 10-2000 characters
  category: string,           // MERN | UI/UX | DataScience | DevOps | Other
  difficultyLevel: string,    // Beginner | Intermediate | Advanced
  duration: number,           // Duration in hours
  lessonsCount: number,       // Number of lessons (min: 1)
  price: number,              // Price in INR
  originalPrice?: number,     // Original price (for discounts)
  rating: number,             // 0-5
  instructor: {
    name: string,
    avatar?: string
  },
  thumbnail?: string,
  isActive: boolean,          // Only active courses are returned
  tags: string[],             // Array of tags
  enrollmentCount: number,    // Number of enrollments
  createdAt: Date,
  updatedAt: Date
}
```

---

## Usage Examples

### Frontend Integration

#### React/Next.js Example

```typescript
// Fetch courses with filters
const fetchCourses = async (filters: {
  category?: string;
  difficultyLevel?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, value.toString());
    }
  });

  const response = await fetch(`/api/v1/courses?${params.toString()}`);
  const data = await response.json();
  
  return data;
};

// Usage
const result = await fetchCourses({
  category: 'MERN',
  difficultyLevel: 'Beginner',
  search: 'JavaScript',
  page: 1,
  limit: 12
});

console.log(result.data); // Array of courses
console.log(result.meta.pagination); // Pagination info
```

---

## Seeding Sample Data

To populate the database with sample courses for testing:

```bash
cd backend
npm run seed:courses
```

This will:
- Clear existing courses
- Insert 12 sample courses across different categories
- Display a summary of seeded data

---

## Performance Considerations

1. **Indexes:** The Course model has indexes on:
   - `category`, `difficultyLevel`, `isActive` (compound index)
   - `rating`, `enrollmentCount` (compound index)
   - `title`, `description` (text index for search)
   - `tags` (for tag filtering)

2. **Pagination:** Maximum limit is 50 items per page to prevent performance issues

3. **Text Search:** Uses MongoDB's text search for efficient full-text search on title and description

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid query parameters |
| `RESOURCE_NOT_FOUND` | Course not found |
| `INTERNAL_SERVER_ERROR` | Server error |

---

## Testing with cURL

```bash
# Get all courses
curl http://localhost:5000/api/v1/courses

# Filter by category
curl "http://localhost:5000/api/v1/courses?category=MERN"

# Search courses
curl "http://localhost:5000/api/v1/courses?search=JavaScript"

# Get course by ID
curl http://localhost:5000/api/v1/courses/507f1f77bcf86cd799439011

# Get filter options
curl http://localhost:5000/api/v1/courses/filters/options
```

---

## Future Enhancements

- [ ] Add authentication for course management (create, update, delete)
- [ ] Add course enrollment tracking
- [ ] Add course reviews and ratings
- [ ] Add course curriculum/syllabus endpoints
- [ ] Add instructor profiles
- [ ] Add course recommendations based on user preferences
- [ ] Add course analytics (views, completion rates)
