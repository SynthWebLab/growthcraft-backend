# How to Get Admin Token for Testing Batch APIs

## Step 1: Ensure Admin User Exists

Run this command to create an admin user (if not already created):

```bash
npx ts-node -r tsconfig-paths/register scripts/create-admin.ts
```

**Default Admin Credentials:**
- Email: `admin@growthcraft.com`
- Password: `Admin@123456`

---

## Step 2: Login to Get JWT Token

### Option A: Using cURL (Windows CMD)

```bash
curl -X POST http://localhost:5002/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@growthcraft.com\",\"password\":\"Admin@123456\"}"
```

### Option B: Using PowerShell

```powershell
$body = @{
    email = "admin@growthcraft.com"
    password = "Admin@123456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5002/api/v1/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### Option C: Using Postman

1. **URL:** `POST http://localhost:5002/api/v1/auth/login`
2. **Headers:** `Content-Type: application/json`
3. **Body (raw JSON):**
```json
{
  "email": "admin@growthcraft.com",
  "password": "Admin@123456"
}
```

4. Click **Send**
5. Copy the `accessToken` from the response

---

## Step 3: Use Token in Batch API Requests

### Response Format

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "email": "admin@growthcraft.com",
      "fullName": "System Administrator",
      "role": "Admin"
    }
  }
}
```

### Copy the accessToken and use it in your requests:

**Header:**
```
Authorization: Bearer <your_access_token_here>
```

---

## Step 4: Test Batch Update APIs

### Example: Get All Batches

```bash
curl -X GET http://localhost:5002/api/v1/admin/batches ^
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Example: Update Batch Venue

```bash
curl -X PATCH http://localhost:5002/api/v1/admin/batches/BATCH_ID ^
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" ^
  -H "Content-Type: application/json" ^
  -d "{\"venue\":\"New Venue Location\"}"
```

### Example: Assign Mentor

```bash
curl -X PATCH http://localhost:5002/api/v1/admin/batches/BATCH_ID/mentor ^
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" ^
  -H "Content-Type: application/json" ^
  -d "{\"mentorId\":\"MENTOR_ID_HERE\"}"
```

---

## Quick Test Script (PowerShell)

Save this as `test-batch-api.ps1`:

```powershell
# Step 1: Login
$loginBody = @{
    email = "admin@growthcraft.com"
    password = "Admin@123456"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:5002/api/v1/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody

$token = $loginResponse.data.accessToken
Write-Host "✅ Got token: $($token.Substring(0,20))..." -ForegroundColor Green

# Step 2: Get batches
$headers = @{
    "Authorization" = "Bearer $token"
}

$batches = Invoke-RestMethod -Uri "http://localhost:5002/api/v1/admin/batches" `
    -Method GET `
    -Headers $headers

Write-Host "✅ Found $($batches.data.batches.Count) batches" -ForegroundColor Green

# Step 3: Update first batch
if ($batches.data.batches.Count -gt 0) {
    $batchId = $batches.data.batches[0]._id
    
    $updateBody = @{
        venue = "Updated via PowerShell - $(Get-Date)"
    } | ConvertTo-Json
    
    $updated = Invoke-RestMethod -Uri "http://localhost:5002/api/v1/admin/batches/$batchId" `
        -Method PATCH `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $updateBody
    
    Write-Host "✅ Updated batch: $($updated.data.batch.code)" -ForegroundColor Green
    Write-Host "   New venue: $($updated.data.batch.venue)" -ForegroundColor Cyan
}
```

Run with: `powershell -ExecutionPolicy Bypass -File test-batch-api.ps1`

---

## Troubleshooting

### Error: "Invalid access token format"
- Make sure you include the full token
- Check that the header format is: `Authorization: Bearer <token>`
- Ensure there's a space between "Bearer" and the token

### Error: "Token expired"
- Access tokens expire in 15 minutes
- Get a new token by logging in again
- Or use the refresh token endpoint

### Error: "Forbidden"
- Your user doesn't have admin/ops role
- Make sure you're using the admin user created by `create-admin.ts`
- Check the user role in the login response

### Server not responding
- Make sure the server is running: `npm run dev`
- Check the port in `.env` file (default: 5002)
- Verify MongoDB is connected
