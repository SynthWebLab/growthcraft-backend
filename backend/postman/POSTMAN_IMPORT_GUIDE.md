# Postman Import Guide - Public Catalogue API

## 📥 How to Import into Postman

### Method 1: Import from File (Recommended)

1. **Open Postman**
2. **Click "Import"** button (top left)
3. **Select "Upload Files"**
4. **Navigate to:** `backend/postman/Public-Catalogue-API.postman_collection.json`
5. **Click "Import"**
6. **Done!** Collection will appear in your Collections sidebar

### Method 2: Import from Raw JSON

1. **Open Postman**
2. **Click "Import"** button
3. **Select "Raw text"** tab
4. **Copy the entire content** from `Public-Catalogue-API.postman_collection.json`
5. **Paste** into the text area
6. **Click "Continue"** → **"Import"**

---

## 🎯 Collection Overview

The collection includes **32 API requests** organized into 3 folders:

### 1. **Courses** (12 requests)
- Get All Courses
- Filter by Category (MERN, UI/UX, DataScience, DevOps)
- Filter by Level (Beginner, Intermediate, Advanced)
- Filter by Price Range
- Filter by Rating
- Search Courses
- Filter by Tags
- Sort by Price/Rating
- Combined Filters
- Pagination (Page 1 & 2)

### 2. **Bootcamps** (14 requests)
- Get All Bootcamps
- Filter by Status (Open, Closed, Completed)
- Filter by Mode (Online, Offline, Hybrid)
- Filter by Category
- Filter by Price Range
- Filter by Rating
- Search Bootcamps
- Filter by Tags
- Sort by Start Date/Price
- Combined Filters
- Pagination (Page 1 & 2)

### 3. **Real-World Scenarios** (6 requests)
- Affordable Beginner MERN Courses
- Open Online Bootcamps
- High-Rated UI/UX Courses
- Upcoming Hybrid Bootcamps
- JavaScript Learning (Courses & Bootcamps)

---

## ⚙️ Configuration

### Base URL Variable

The collection uses a variable `{{baseUrl}}` which is set to:
```
http://localhost:5000
```

**To change the base URL:**
1. Click on the collection name
2. Go to **Variables** tab
3. Change the `baseUrl` value
4. Click **Save**

**Common values:**
- Local: `http://localhost:5000`
- Development: `https://dev-api.growthcraft.com`
- Production: `https://api.growthcraft.com`

---

## 🚀 Quick Start

### 1. Start Your Server
```bash
cd backend
npm run dev
```

### 2. Seed Data (First Time Only)
```bash
npm run seed:courses
npm run seed:bootcamps
```

### 3. Test in Postman

#### Test 1: Get All Courses
1. Open **Courses** → **Get All Courses**
2. Click **Send**
3. You should see a JSON response with courses

#### Test 2: Get All Bootcamps
1. Open **Bootcamps** → **Get All Bootcamps**
2. Click **Send**
3. You should see a JSON response with bootcamps

#### Test 3: Filter Courses
1. Open **Courses** → **Get Courses - MERN Category**
2. Click **Send**
3. You should see only MERN courses

---

## 📋 Response Format

All endpoints return the same unified format:

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

## 🔍 Query Parameters Reference

### Common Parameters (Both Endpoints)

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `limit` | integer | `10` | Items per page (1-50) |
| `cursor` | string | `eyJpZCI6...` | Pagination cursor |
| `category` | string | `MERN` | Filter by category |
| `minPrice` | number | `3000` | Minimum price |
| `maxPrice` | number | `8000` | Maximum price |
| `minRating` | number | `4.5` | Minimum rating (0-5) |
| `tags` | string | `React,Node.js` | Comma-separated tags |
| `search` | string | `javascript` | Search query |
| `sortBy` | string | `price` | Sort field |
| `sortOrder` | string | `asc` | Sort order (asc/desc) |

### Courses-Specific

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `level` | string | `Beginner` | Difficulty level |
| `difficultyLevel` | string | `Intermediate` | Alias for level |

### Bootcamps-Specific

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `mode` | string | `Online` | Online/Offline/Hybrid |
| `status` | string | `Open` | Open/Closed/Completed |

---

## 🎨 Using Pagination

### Step 1: Get First Page
1. Open **Courses** → **Get Courses - Pagination (Page 1)**
2. Click **Send**
3. Copy the `nextCursor` value from response

### Step 2: Get Next Page
1. Open **Courses** → **Get Courses - Pagination (Page 2)**
2. Replace `PASTE_CURSOR_HERE` with the cursor you copied
3. Click **Send**
4. Repeat for more pages

**Example:**
```
First Request:
GET /api/v1/courses?limit=3

Response:
{
  "items": [...],
  "nextCursor": "eyJpZCI6IjY3NWE4..."
}

Second Request:
GET /api/v1/courses?cursor=eyJpZCI6IjY3NWE4...&limit=3
```

---

## 🧪 Testing Scenarios

### Scenario 1: Find Affordable Courses
1. Open **Real-World Scenarios** → **Scenario 1**
2. Click **Send**
3. See MERN beginner courses under ₹5000

### Scenario 2: Find Open Bootcamps
1. Open **Real-World Scenarios** → **Scenario 2**
2. Click **Send**
3. See open online bootcamps

### Scenario 3: Search for JavaScript
1. Open **Real-World Scenarios** → **Scenario 5 (Courses)**
2. Click **Send**
3. See JavaScript courses sorted by rating

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

### Categories
- `MERN` - MongoDB, Express, React, Node.js
- `UI/UX` - User Interface & User Experience
- `DataScience` - Data Science & Analytics
- `DevOps` - DevOps & Cloud
- `Other` - Other categories

### Sort Fields
**Courses:** `title`, `price`, `rating`, `createdAt`  
**Bootcamps:** `title`, `price`, `rating`, `startDate`, `createdAt`

### Sort Order
- `asc` - Ascending (A-Z, 0-9, oldest-newest)
- `desc` - Descending (Z-A, 9-0, newest-oldest)

---

## 💡 Tips & Tricks

### 1. Save Responses
- Click **Save Response** to save example responses
- Useful for comparing results

### 2. Use Environments
- Create environments for different servers (local, dev, prod)
- Switch between them easily

### 3. Use Tests
Add tests to verify responses:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has items array", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('items');
    pm.expect(jsonData.items).to.be.an('array');
});
```

### 4. Use Pre-request Scripts
Auto-generate timestamps or random values:
```javascript
pm.environment.set("timestamp", new Date().toISOString());
```

### 5. Chain Requests
Use the cursor from one request in the next:
```javascript
// In Tests tab of first request
var jsonData = pm.response.json();
pm.environment.set("nextCursor", jsonData.nextCursor);

// In second request, use {{nextCursor}}
```

---

## 🐛 Troubleshooting

### Error: "Could not get any response"
- **Check:** Is the server running? (`npm run dev`)
- **Check:** Is the base URL correct? (default: `http://localhost:5000`)
- **Check:** Is the port correct? (check your `.env` file)

### Error: "404 Not Found"
- **Check:** Is the endpoint path correct?
- **Check:** Are you using `/api/v1/courses` or `/api/v1/bootcamps`?

### Error: "Empty response"
- **Check:** Have you seeded the data? (`npm run seed:courses` and `npm run seed:bootcamps`)
- **Check:** Is MongoDB running?

### Error: "Invalid cursor"
- **Check:** Is the cursor value correct?
- **Check:** Did you copy the entire cursor string?
- **Note:** Cursors expire after some time

---

## 📚 Additional Resources

- **API Documentation:** `backend/PUBLIC_CATALOGUE_API.md`
- **Testing Guide:** `backend/API_TESTING_GUIDE.md`
- **Quick Start:** `backend/QUICK_START.md`
- **Implementation Status:** `backend/IMPLEMENTATION_STATUS.md`

---

## ✅ Quick Verification Checklist

Run these requests to verify everything works:

- [ ] **Get All Courses** - Should return courses array
- [ ] **Get All Bootcamps** - Should return bootcamps array
- [ ] **Filter by Category** - Should return filtered results
- [ ] **Search** - Should return search results
- [ ] **Pagination** - Should return nextCursor
- [ ] **Combined Filters** - Should apply all filters

---

**Happy Testing! 🚀**

For more details, see the complete API documentation in `PUBLIC_CATALOGUE_API.md`
