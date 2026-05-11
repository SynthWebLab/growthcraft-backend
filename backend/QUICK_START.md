# Quick Start Guide - GrowthCraft Backend

**Get up and running in 5 minutes!** ⚡

---

## 🚀 Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/growthcraft
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=5000
NODE_ENV=development
```

### 3. Seed Data
```bash
npm run seed:courses
npm run seed:bootcamps
```

### 4. Start Server
```bash
npm run dev
```

Server runs at: `http://localhost:5000`

---

## 🎯 Test the API

### Quick Test
```bash
# Get courses
curl "http://localhost:5000/api/v1/courses?limit=5" | jq

# Get bootcamps
curl "http://localhost:5000/api/v1/bootcamps?limit=5" | jq
```

### With Filters
```bash
# MERN courses for beginners
curl "http://localhost:5000/api/v1/courses?category=MERN&level=Beginner" | jq

# Open hybrid bootcamps
curl "http://localhost:5000/api/v1/bootcamps?status=Open&mode=Hybrid" | jq
```

---

## 📚 API Endpoints

### Public Catalogue (No Auth Required)

#### GET /api/v1/courses
Returns published courses in unified format.

**Query Parameters:**
- `limit` - Items per page (1-50, default: 10)
- `cursor` - Pagination cursor (base64)
- `category` - Filter by category (MERN, UI/UX, DataScience, DevOps)
- `level` - Filter by difficulty (Beginner, Intermediate, Advanced)
- `minPrice` / `maxPrice` - Price range
- `minRating` - Minimum rating (0-5)
- `tags` - Comma-separated tags
- `search` - Search query
- `sortBy` - Sort field (title, price, rating, createdAt)
- `sortOrder` - Sort order (asc, desc)

**Response:**
```json
{
  "items": [
    {
      "id": "...",
      "type": "course",
      "title": "...",
      "slug": "...",
      "category": "MERN",
      "price": 4999,
      "rating": 4.8,
      "difficultyLevel": "Beginner",
      "duration": 70,
      "lessonsCount": 52,
      "instructor": { "name": "..." },
      "canEnroll": true
    }
  ],
  "nextCursor": "..." | null
}
```

#### GET /api/v1/bootcamps
Returns published bootcamps in unified format.

**Query Parameters:**
- `limit` - Items per page (1-50, default: 10)
- `cursor` - Pagination cursor (base64)
- `category` - Filter by category
- `mode` - Filter by mode (Online, Offline, Hybrid)
- `status` - Filter by status (Open, Closed, Completed)
- `minPrice` / `maxPrice` - Price range
- `minRating` - Minimum rating (0-5)
- `tags` - Comma-separated tags
- `search` - Search query
- `sortBy` - Sort field (title, price, rating, startDate, createdAt)
- `sortOrder` - Sort order (asc, desc)

**Response:**
```json
{
  "items": [
    {
      "id": "...",
      "type": "bootcamp",
      "title": "Full-Stack MERN Bootcamp — Batch 7",
      "slug": "mern-bootcamp-batch-7",
      "category": "MERN",
      "price": 24999,
      "rating": 4.9,
      "startDate": "2026-05-15T00:00:00.000Z",
      "endDate": "2026-08-15T00:00:00.000Z",
      "mode": "Hybrid",
      "status": "Open",
      "maxSeats": 40,
      "enrolledCount": 31,
      "availableSeats": 9,
      "skillsCovered": ["React", "Node.js", "Express", "MongoDB"],
      "mentorNames": ["Arjun Mehta", "Priya Sharma"],
      "canRegister": true
    }
  ],
  "nextCursor": "..." | null
}
```

---

## 🔥 Common Use Cases

### 1. Get All Courses (Paginated)
```bash
curl "http://localhost:5000/api/v1/courses?limit=12" | jq
```

### 2. Find Beginner MERN Courses Under ₹5000
```bash
curl "http://localhost:5000/api/v1/courses?category=MERN&level=Beginner&maxPrice=5000&sortBy=price&sortOrder=asc" | jq
```

### 3. Get Open Online Bootcamps
```bash
curl "http://localhost:5000/api/v1/bootcamps?status=Open&mode=Online&sortBy=startDate&sortOrder=asc" | jq
```

### 4. Search for JavaScript Courses
```bash
curl "http://localhost:5000/api/v1/courses?search=javascript&sortBy=rating&sortOrder=desc" | jq
```

### 5. Pagination (Next Page)
```bash
# Get first page
curl "http://localhost:5000/api/v1/courses?limit=3" | jq

# Extract cursor
CURSOR=$(curl -s "http://localhost:5000/api/v1/courses?limit=3" | jq -r '.nextCursor')

# Get next page
curl "http://localhost:5000/api/v1/courses?cursor=$CURSOR&limit=3" | jq
```

---

## 🎨 Frontend Integration

### Next.js SSG
```typescript
// pages/courses/index.tsx
export async function getStaticProps() {
  const allCourses = [];
  let cursor = null;
  
  do {
    const params = new URLSearchParams({ limit: '50' });
    if (cursor) params.append('cursor', cursor);
    
    const res = await fetch(`${API_URL}/api/v1/courses?${params}`);
    const data = await res.json();
    
    allCourses.push(...data.items);
    cursor = data.nextCursor;
  } while (cursor);
  
  return {
    props: { courses: allCourses },
    revalidate: 300, // 5 minutes
  };
}
```

### React Query
```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

function useCourses(filters) {
  return useInfiniteQuery({
    queryKey: ['courses', filters],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        ...filters,
        limit: '12',
        ...(pageParam && { cursor: pageParam }),
      });
      
      const res = await fetch(`/api/v1/courses?${params}`);
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

// Usage
const { data, fetchNextPage, hasNextPage } = useCourses({
  category: 'MERN',
  level: 'Beginner',
});
```

### Simple Fetch
```typescript
async function fetchCourses(cursor?: string) {
  const params = new URLSearchParams({ limit: '12' });
  if (cursor) params.append('cursor', cursor);
  
  const res = await fetch(`/api/v1/courses?${params}`);
  const data = await res.json();
  
  return {
    courses: data.items,
    nextCursor: data.nextCursor,
    hasMore: data.nextCursor !== null,
  };
}
```

---

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check

# Seed data
npm run seed:courses
npm run seed:bootcamps

# Test connections
npm run test:connections
```

---

## 📊 Performance

### Cache Performance
```bash
# First request (cache miss) - ~50-200ms
time curl "http://localhost:5000/api/v1/courses?category=MERN" | jq > /dev/null

# Second request (cache hit) - ~5-10ms
time curl "http://localhost:5000/api/v1/courses?category=MERN" | jq > /dev/null
```

### Cache TTL
- **Lists:** 300s (5 minutes)
- **Single Items:** 600s (10 minutes)
- **Filter Options:** 900s (15 minutes)

---

## 🎯 Enums Reference

### Bootcamp Status
- `Draft` - Not published
- `Open` - Accepting registrations
- `Closed` - Registration closed
- `Completed` - Bootcamp finished

### Bootcamp Mode
- `Online` - Fully online
- `Offline` - In-person only
- `Hybrid` - Mix of online and offline

### Course Difficulty
- `Beginner` - Entry level
- `Intermediate` - Some experience required
- `Advanced` - Expert level

### Sort Fields
**Courses:** `title`, `price`, `rating`, `createdAt`  
**Bootcamps:** `title`, `price`, `rating`, `startDate`, `createdAt`

### Sort Order
- `asc` - Ascending (A-Z, 0-9, oldest-newest)
- `desc` - Descending (Z-A, 9-0, newest-oldest)

---

## 📖 Documentation

- **API Testing Guide:** `API_TESTING_GUIDE.md` - 100+ cURL commands
- **Public Catalogue API:** `PUBLIC_CATALOGUE_API.md` - Complete API docs
- **Implementation Status:** `IMPLEMENTATION_STATUS.md` - Full status report
- **Bootcamp Module:** `BOOTCAMP_MODULE_EXPLANATION.md` - Bootcamp details
- **Bug Fixes:** `BUGFIXES_AND_ENHANCEMENTS.md` - Bug fixes and enhancements

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
mongosh

# Start MongoDB (if not running)
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

### Redis Connection Error
```bash
# Check if Redis is running
redis-cli ping

# Start Redis (if not running)
sudo systemctl start redis  # Linux
brew services start redis  # macOS
```

### Port Already in Use
```bash
# Change PORT in .env file
PORT=5001
```

### TypeScript Errors
```bash
# Clean and rebuild
rm -rf dist
npm run build
```

---

## ✅ Quick Verification

Run these commands to verify everything works:

```bash
# 1. Check server is running
curl http://localhost:5000/health

# 2. Test courses endpoint
curl "http://localhost:5000/api/v1/courses?limit=3" | jq

# 3. Test bootcamps endpoint
curl "http://localhost:5000/api/v1/bootcamps?limit=3" | jq

# 4. Test filtering
curl "http://localhost:5000/api/v1/courses?category=MERN" | jq

# 5. Test search
curl "http://localhost:5000/api/v1/bootcamps?search=mern" | jq

# 6. Test pagination
curl "http://localhost:5000/api/v1/courses?limit=2" | jq '.nextCursor'
```

If all commands return valid JSON, you're good to go! 🎉

---

## 🚀 Next Steps

1. **Explore the API** - Try different filters and combinations
2. **Read the Docs** - Check out `API_TESTING_GUIDE.md` for more examples
3. **Integrate Frontend** - Use the examples above to connect your frontend
4. **Monitor Performance** - Check Redis cache hit rates
5. **Customize** - Modify seed data or add new features

---

**Happy Coding! 🎉**

For detailed documentation, see:
- `API_TESTING_GUIDE.md`
- `PUBLIC_CATALOGUE_API.md`
- `IMPLEMENTATION_STATUS.md`
