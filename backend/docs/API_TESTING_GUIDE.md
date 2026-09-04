# API Testing Guide - cURL Commands

Complete collection of cURL commands for manual testing of the public catalogue APIs.

---

## 🚀 Prerequisites

1. **Seed the data:**
   ```bash
   npm run seed:courses
   npm run seed:bootcamps
   ```

2. **Start the server:**
   ```bash
   npm run dev
   ```

3. **Server should be running on:** `http://localhost:5000`

---

## 📚 **COURSES API** - `/api/v1/courses`

### Basic Queries

#### Get All Courses
```bash
curl -X GET "http://localhost:5000/api/v1/courses" | jq
```

#### Get Courses with Limit
```bash
curl -X GET "http://localhost:5000/api/v1/courses?limit=5" | jq
```

#### Get Courses (Pretty Print)
```bash
curl -X GET "http://localhost:5000/api/v1/courses?limit=3" | jq '.'
```

---

### Filter by Category

#### Get MERN Courses
```bash
curl -X GET "http://localhost:5000/api/v1/courses?category=MERN" | jq
```

#### Get UI/UX Courses
```bash
curl -X GET "http://localhost:5000/api/v1/courses?category=UI/UX" | jq
```

#### Get DataScience Courses
```bash
curl -X GET "http://localhost:5000/api/v1/courses?category=DataScience" | jq
```

#### Get DevOps Courses
```bash
curl -X GET "http://localhost:5000/api/v1/courses?category=DevOps" | jq
```

---

### Filter by Difficulty Level

#### Get Beginner Courses
```bash
curl -X GET "http://localhost:5000/api/v1/courses?level=Beginner" | jq
```

#### Get Intermediate Courses
```bash
curl -X GET "http://localhost:5000/api/v1/courses?level=Intermediate" | jq
```

#### Get Advanced Courses
```bash
curl -X GET "http://localhost:5000/api/v1/courses?level=Advanced" | jq
```

---

### Filter by Price Range

#### Courses Under ₹5000
```bash
curl -X GET "http://localhost:5000/api/v1/courses?maxPrice=5000" | jq
```

#### Courses Between ₹3000-8000
```bash
curl -X GET "http://localhost:5000/api/v1/courses?minPrice=3000&maxPrice=8000" | jq
```

#### Courses Above ₹10000
```bash
curl -X GET "http://localhost:5000/api/v1/courses?minPrice=10000" | jq
```

---

### Filter by Rating

#### Courses with Rating >= 4.5
```bash
curl -X GET "http://localhost:5000/api/v1/courses?minRating=4.5" | jq
```

#### Courses with Rating >= 4.8
```bash
curl -X GET "http://localhost:5000/api/v1/courses?minRating=4.8" | jq
```

---

### Search Courses

#### Search for "JavaScript"
```bash
curl -X GET "http://localhost:5000/api/v1/courses?search=javascript" | jq
```

#### Search for "React"
```bash
curl -X GET "http://localhost:5000/api/v1/courses?search=react" | jq
```

#### Search for "Python"
```bash
curl -X GET "http://localhost:5000/api/v1/courses?search=python" | jq
```

---

### Filter by Tags

#### Courses with "JavaScript" tag
```bash
curl -X GET "http://localhost:5000/api/v1/courses?tags=JavaScript" | jq
```

#### Courses with multiple tags
```bash
curl -X GET "http://localhost:5000/api/v1/courses?tags=React,Node.js" | jq
```

---

### Sorting

#### Sort by Price (Ascending)
```bash
curl -X GET "http://localhost:5000/api/v1/courses?sortBy=price&sortOrder=asc" | jq
```

#### Sort by Price (Descending)
```bash
curl -X GET "http://localhost:5000/api/v1/courses?sortBy=price&sortOrder=desc" | jq
```

#### Sort by Rating (Highest First)
```bash
curl -X GET "http://localhost:5000/api/v1/courses?sortBy=rating&sortOrder=desc" | jq
```

#### Sort by Title (A-Z)
```bash
curl -X GET "http://localhost:5000/api/v1/courses?sortBy=title&sortOrder=asc" | jq
```

---

### Combined Filters

#### MERN + Beginner + Under ₹5000
```bash
curl -X GET "http://localhost:5000/api/v1/courses?category=MERN&level=Beginner&maxPrice=5000" | jq
```

#### UI/UX + Rating >= 4.5 + Sort by Price
```bash
curl -X GET "http://localhost:5000/api/v1/courses?category=UI/UX&minRating=4.5&sortBy=price&sortOrder=asc" | jq
```

#### Search + Category + Level
```bash
curl -X GET "http://localhost:5000/api/v1/courses?search=javascript&category=MERN&level=Beginner" | jq
```

---

### Pagination

#### First Page (3 items)
```bash
curl -X GET "http://localhost:5000/api/v1/courses?limit=3" | jq
```

#### Get Next Cursor
```bash
curl -X GET "http://localhost:5000/api/v1/courses?limit=3" | jq '.nextCursor'
```

#### Use Cursor for Next Page (replace CURSOR_VALUE)
```bash
curl -X GET "http://localhost:5000/api/v1/courses?cursor=CURSOR_VALUE&limit=3" | jq
```

---

## 🎓 **BOOTCAMPS API** - `/api/v1/bootcamps`

### Basic Queries

#### Get All Bootcamps
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps" | jq
```

#### Get Bootcamps with Limit
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?limit=5" | jq
```

---

### Filter by Status

#### Get Open Bootcamps
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?status=Open" | jq
```

#### Get Closed Bootcamps
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?status=Closed" | jq
```

#### Get Completed Bootcamps
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?status=Completed" | jq
```

---

### Filter by Mode

#### Get Online Bootcamps
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?mode=Online" | jq
```

#### Get Offline Bootcamps
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?mode=Offline" | jq
```

#### Get Hybrid Bootcamps
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?mode=Hybrid" | jq
```

---

### Filter by Category

#### Get MERN Bootcamps
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?category=MERN" | jq
```

#### Get DataScience Bootcamps
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?category=DataScience" | jq
```

#### Get DevOps Bootcamps
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?category=DevOps" | jq
```

#### Get UI/UX Bootcamps
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?category=UI/UX" | jq
```

---

### Filter by Price Range

#### Bootcamps Under ₹25000
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?maxPrice=25000" | jq
```

#### Bootcamps Between ₹20000-30000
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?minPrice=20000&maxPrice=30000" | jq
```

#### Bootcamps Above ₹30000
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?minPrice=30000" | jq
```

---

### Filter by Rating

#### Bootcamps with Rating >= 4.5
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?minRating=4.5" | jq
```

#### Bootcamps with Rating >= 4.8
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?minRating=4.8" | jq
```

---

### Search Bootcamps

#### Search for "MERN"
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?search=mern" | jq
```

#### Search for "Data Science"
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?search=data+science" | jq
```

#### Search for "DevOps"
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?search=devops" | jq
```

---

### Filter by Tags

#### Bootcamps with "React" tag
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?tags=React" | jq
```

#### Bootcamps with multiple tags
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?tags=Python,Machine Learning" | jq
```

---

### Sorting

#### Sort by Start Date (Earliest First)
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?sortBy=startDate&sortOrder=asc" | jq
```

#### Sort by Price (Ascending)
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?sortBy=price&sortOrder=asc" | jq
```

#### Sort by Rating (Highest First)
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?sortBy=rating&sortOrder=desc" | jq
```

---

### Combined Filters

#### Open + Hybrid + MERN
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?status=Open&mode=Hybrid&category=MERN" | jq
```

#### Online + Under ₹25000 + Rating >= 4.5
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?mode=Online&maxPrice=25000&minRating=4.5" | jq
```

#### Open + DevOps + Sort by Price
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?status=Open&category=DevOps&sortBy=price&sortOrder=asc" | jq
```

---

### Pagination

#### First Page (3 items)
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?limit=3" | jq
```

#### Get Next Cursor
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?limit=3" | jq '.nextCursor'
```

#### Use Cursor for Next Page (replace CURSOR_VALUE)
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?cursor=CURSOR_VALUE&limit=3" | jq
```

---

## 🧪 **TESTING SCENARIOS**

### Scenario 1: Find Affordable Beginner MERN Courses
```bash
curl -X GET "http://localhost:5000/api/v1/courses?category=MERN&level=Beginner&maxPrice=5000&sortBy=price&sortOrder=asc" | jq
```

### Scenario 2: Find Open Online Bootcamps
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?status=Open&mode=Online&sortBy=startDate&sortOrder=asc" | jq
```

### Scenario 3: Find High-Rated UI/UX Courses
```bash
curl -X GET "http://localhost:5000/api/v1/courses?category=UI/UX&minRating=4.5&sortBy=rating&sortOrder=desc" | jq
```

### Scenario 4: Find Upcoming Hybrid Bootcamps
```bash
curl -X GET "http://localhost:5000/api/v1/bootcamps?status=Open&mode=Hybrid&sortBy=startDate&sortOrder=asc" | jq
```

### Scenario 5: Search for JavaScript Learning Options
```bash
# Courses
curl -X GET "http://localhost:5000/api/v1/courses?search=javascript&sortBy=rating&sortOrder=desc" | jq

# Bootcamps
curl -X GET "http://localhost:5000/api/v1/bootcamps?search=javascript&status=Open" | jq
```

---

## 📊 **RESPONSE ANALYSIS**

### Get Only Item Count
```bash
curl -X GET "http://localhost:5000/api/v1/courses" | jq '.items | length'
```

### Get Only Titles
```bash
curl -X GET "http://localhost:5000/api/v1/courses?limit=5" | jq '.items[].title'
```

### Get Only Prices
```bash
curl -X GET "http://localhost:5000/api/v1/courses?limit=5" | jq '.items[].price'
```

### Get Specific Fields
```bash
curl -X GET "http://localhost:5000/api/v1/courses?limit=5" | jq '.items[] | {title, price, category}'
```

### Check if More Items Available
```bash
curl -X GET "http://localhost:5000/api/v1/courses?limit=5" | jq '.nextCursor != null'
```

---

## ⚡ **PERFORMANCE TESTING**

### Test Cache Performance (Run Twice)
```bash
# First request (cache miss)
time curl -X GET "http://localhost:5000/api/v1/courses?category=MERN" | jq > /dev/null

# Second request (cache hit - should be faster)
time curl -X GET "http://localhost:5000/api/v1/courses?category=MERN" | jq > /dev/null
```

### Test Different Filters (Cache Miss Each Time)
```bash
time curl -X GET "http://localhost:5000/api/v1/courses?category=MERN" | jq > /dev/null
time curl -X GET "http://localhost:5000/api/v1/courses?category=UI/UX" | jq > /dev/null
time curl -X GET "http://localhost:5000/api/v1/courses?category=DevOps" | jq > /dev/null
```

---

## 🔍 **DEBUGGING**

### Get Full Response with Headers
```bash
curl -i -X GET "http://localhost:5000/api/v1/courses?limit=3"
```

### Get Only Status Code
```bash
curl -o /dev/null -s -w "%{http_code}\n" "http://localhost:5000/api/v1/courses"
```

### Verbose Output
```bash
curl -v -X GET "http://localhost:5000/api/v1/courses?limit=3" | jq
```

### Save Response to File
```bash
curl -X GET "http://localhost:5000/api/v1/courses" -o courses.json
curl -X GET "http://localhost:5000/api/v1/bootcamps" -o bootcamps.json
```

---

## 📝 **NOTES**

### URL Encoding
For spaces in search queries, use `+` or `%20`:
```bash
# Using +
curl -X GET "http://localhost:5000/api/v1/bootcamps?search=data+science" | jq

# Using %20
curl -X GET "http://localhost:5000/api/v1/bootcamps?search=data%20science" | jq
```

### Multiple Tags
Separate tags with commas (no spaces):
```bash
curl -X GET "http://localhost:5000/api/v1/courses?tags=React,Node.js,MongoDB" | jq
```

### jq Not Installed?
If you don't have `jq`, omit it or install:
```bash
# Without jq
curl -X GET "http://localhost:5000/api/v1/courses?limit=3"

# Install jq (Ubuntu/Debian)
sudo apt-get install jq

# Install jq (macOS)
brew install jq

# Install jq (Windows with Chocolatey)
choco install jq
```

---

## ✅ **QUICK TEST CHECKLIST**

Run these commands to verify everything works:

```bash
# 1. Test courses endpoint
curl -X GET "http://localhost:5000/api/v1/courses?limit=3" | jq

# 2. Test bootcamps endpoint
curl -X GET "http://localhost:5000/api/v1/bootcamps?limit=3" | jq

# 3. Test filtering
curl -X GET "http://localhost:5000/api/v1/courses?category=MERN" | jq

# 4. Test search
curl -X GET "http://localhost:5000/api/v1/bootcamps?search=mern" | jq

# 5. Test pagination
curl -X GET "http://localhost:5000/api/v1/courses?limit=2" | jq '.nextCursor'

# 6. Test cache (run twice, second should be faster)
time curl -X GET "http://localhost:5000/api/v1/courses" | jq > /dev/null
time curl -X GET "http://localhost:5000/api/v1/courses" | jq > /dev/null
```

---

## 🎯 **Expected Response Format**

```json
{
  "items": [
    {
      "id": "507f1f77bcf86cd799439011",
      "type": "course" | "bootcamp",
      "title": "...",
      "slug": "...",
      "category": "...",
      "price": 4999,
      "rating": 4.8,
      // ... more fields
    }
  ],
  "nextCursor": "base64_string" | null
}
```

---

**Happy Testing! 🚀**
