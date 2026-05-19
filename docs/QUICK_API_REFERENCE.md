# Quick API Reference - cURL Commands

## Authentication APIs

### 1. Register Student

```bash
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"fullName":"John Student","email":"student@example.com","phone":"+91 9876543210","password":"SecurePass123","role":"student"}'
```

### 2. Register Instructor

```bash
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"fullName":"Jane Instructor","email":"instructor@example.com","phone":"+91 9876543211","password":"SecurePass123","role":"instructor"}'
```

### 3. Register Admin

```bash
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"fullName":"Admin User","email":"admin@example.com","phone":"+91 9876543212","password":"SecurePass123","role":"admin"}'
```

### 4. Register Super Admin

```bash
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"fullName":"Super Admin","email":"superadmin@example.com","phone":"+91 9876543213","password":"SecurePass123","role":"super_admin"}'
```

### 5. Login

```bash
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"student@example.com","password":"SecurePass123"}'
```

### 6. Get Profile

```bash
curl -X GET http://localhost:5001/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 7. Refresh Token

```bash
curl -X POST http://localhost:5001/api/v1/auth/refresh-token \
  -b cookies.txt \
  -c cookies.txt
```

### 8. Logout

```bash
curl -X POST http://localhost:5001/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -b cookies.txt
```

### 9. Logout All Devices

```bash
curl -X POST http://localhost:5001/api/v1/auth/logout-all \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## User Management APIs

### 10. Get All Users (Admin/Super Admin Only)

```bash
curl -X GET http://localhost:5001/api/v1/users \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

### 11. Get User By ID (Own Profile or Admin)

```bash
curl -X GET http://localhost:5001/api/v1/users/USER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 12. Update User (Own Profile or Admin)

```bash
curl -X PATCH http://localhost:5001/api/v1/users/USER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Updated Name","phone":"+91 9876500000"}'
```

### 13. Delete User (Admin/Super Admin Only)

```bash
curl -X DELETE http://localhost:5001/api/v1/users/USER_ID \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

---

## System APIs

### 14. Health Check

```bash
curl -X GET http://localhost:5001/health
```

---

## Complete Workflow Example

```bash
# Step 1: Register
RESPONSE=$(curl -s -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"fullName":"Test User","email":"test@example.com","phone":"+91 9876543210","password":"SecurePass123","role":"student"}')

echo "Registration Response:"
echo $RESPONSE | jq

# Step 2: Extract access token
ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.data.accessToken')
USER_ID=$(echo $RESPONSE | jq -r '.data.user.id')

echo "Access Token: $ACCESS_TOKEN"
echo "User ID: $USER_ID"

# Step 3: Get profile
echo -e "\nGetting Profile:"
curl -s -X GET http://localhost:5001/api/v1/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# Step 4: Update profile
echo -e "\nUpdating Profile:"
curl -s -X PATCH http://localhost:5001/api/v1/users/$USER_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Updated Name"}' | jq

# Step 5: Refresh token
echo -e "\nRefreshing Token:"
NEW_RESPONSE=$(curl -s -X POST http://localhost:5001/api/v1/auth/refresh-token \
  -b cookies.txt \
  -c cookies.txt)

NEW_ACCESS_TOKEN=$(echo $NEW_RESPONSE | jq -r '.data.accessToken')
echo "New Access Token: $NEW_ACCESS_TOKEN"

# Step 6: Logout
echo -e "\nLogging Out:"
curl -s -X POST http://localhost:5001/api/v1/auth/logout \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN" \
  -b cookies.txt | jq
```

---

## Testing Different Roles

### Test Student Access

```bash
# Register as student
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -c cookies_student.txt \
  -d '{"fullName":"Student","email":"student@test.com","phone":"+91 1111111111","password":"SecurePass123","role":"student"}'

# Try to access admin route (should fail)
curl -X GET http://localhost:5001/api/v1/users \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

### Test Instructor Access

```bash
# Register as instructor
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -c cookies_instructor.txt \
  -d '{"fullName":"Instructor","email":"instructor@test.com","phone":"+91 2222222222","password":"SecurePass123","role":"instructor"}'

# Access instructor routes
curl -X GET http://localhost:5001/api/v1/auth/profile \
  -H "Authorization: Bearer INSTRUCTOR_TOKEN"
```

### Test Admin Access

```bash
# Register as admin
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -c cookies_admin.txt \
  -d '{"fullName":"Admin","email":"admin@test.com","phone":"+91 3333333333","password":"SecurePass123","role":"admin"}'

# Access all users (should work)
curl -X GET http://localhost:5001/api/v1/users \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## API Endpoints Summary

| Method | Endpoint              | Auth | Role               | Description                       |
| ------ | --------------------- | ---- | ------------------ | --------------------------------- |
| POST   | `/auth/register`      | No   | -                  | Register new user (role required) |
| POST   | `/auth/login`         | No   | -                  | Login user                        |
| POST   | `/auth/refresh-token` | No   | -                  | Refresh access token              |
| GET    | `/auth/profile`       | Yes  | All                | Get own profile                   |
| POST   | `/auth/logout`        | Yes  | All                | Logout current device             |
| POST   | `/auth/logout-all`    | Yes  | All                | Logout all devices                |
| GET    | `/users`              | Yes  | Admin, Super Admin | Get all users                     |
| GET    | `/users/:id`          | Yes  | Own or Admin       | Get user by ID                    |
| PATCH  | `/users/:id`          | Yes  | Own or Admin       | Update user                       |
| DELETE | `/users/:id`          | Yes  | Admin, Super Admin | Delete user                       |
| GET    | `/health`             | No   | -                  | Health check                      |

---

## Response Examples

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "user": {
      "id": "65abc123...",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "student"
    },
    "accessToken": "eyJhbGc..."
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

### Validation Error

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Please provide a valid email"
      }
    ]
  }
}
```

---

## Tips

1. **Save cookies**: Use `-c cookies.txt` to save refresh token
2. **Send cookies**: Use `-b cookies.txt` to send refresh token
3. **Pretty print**: Add `| jq` to format JSON (requires jq installed)
4. **Silent mode**: Add `-s` flag to hide progress
5. **Verbose**: Add `-v` flag to see headers
6. **Save token**: Store access token in variable for reuse

### Install jq (for pretty JSON)

```bash
# Windows (using chocolatey)
choco install jq

# macOS
brew install jq

# Linux
sudo apt-get install jq
```
