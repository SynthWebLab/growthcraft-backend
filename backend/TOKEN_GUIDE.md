# Access Token & Refresh Token Guide

## Token Overview

### Access Token
- **Purpose**: Authenticate API requests
- **Lifetime**: 15 minutes (short-lived for security)
- **Storage**: Client-side (localStorage, sessionStorage, or memory)
- **Usage**: Sent in Authorization header for protected routes

### Refresh Token
- **Purpose**: Get new access tokens without re-login
- **Lifetime**: 7 days (long-lived)
- **Storage**: HttpOnly cookie (secure) or client-side
- **Usage**: Sent to refresh endpoint when access token expires

## Complete Token Flow

### 1. Registration/Login
When user registers or logs in, they receive both tokens:

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "fullName": "John Doe",
      "email": "user@example.com",
      "role": "student"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Also sets cookie:**
```
Set-Cookie: refreshToken=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

### 2. Using Access Token
Include access token in Authorization header for protected routes:

```bash
GET /api/v1/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. When Access Token Expires
After 15 minutes, access token expires. You'll get:

```json
{
  "success": false,
  "error": {
    "message": "Invalid or expired token",
    "code": "INVALID_TOKEN"
  }
}
```

### 4. Refresh the Access Token
Use refresh token to get new access token:

```bash
POST /api/v1/auth/refresh-token
# Refresh token automatically sent from cookie
# OR send in body:
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 5. Logout
Invalidate refresh token:

```bash
POST /api/v1/auth/logout
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 6. Logout All Devices
Invalidate all refresh tokens:

```bash
POST /api/v1/auth/logout-all
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Frontend Implementation Examples

### React/JavaScript Example

```javascript
// auth.service.js
class AuthService {
  constructor() {
    this.accessToken = null;
  }

  async login(email, password) {
    const response = await fetch('http://localhost:5001/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Important: sends/receives cookies
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (data.success) {
      // Store access token
      this.accessToken = data.data.accessToken;
      localStorage.setItem('accessToken', data.data.accessToken);
      
      // Refresh token is automatically stored in httpOnly cookie
      return data.data.user;
    }
    
    throw new Error(data.error.message);
  }

  async refreshAccessToken() {
    const response = await fetch('http://localhost:5001/api/v1/auth/refresh-token', {
      method: 'POST',
      credentials: 'include' // Sends refresh token cookie
    });

    const data = await response.json();
    
    if (data.success) {
      this.accessToken = data.data.accessToken;
      localStorage.setItem('accessToken', data.data.accessToken);
      return data.data.accessToken;
    }
    
    throw new Error('Token refresh failed');
  }

  async apiCall(url, options = {}) {
    // Add access token to request
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${this.accessToken || localStorage.getItem('accessToken')}`
    };

    let response = await fetch(url, { ...options, headers });

    // If token expired, refresh and retry
    if (response.status === 401) {
      try {
        await this.refreshAccessToken();
        
        // Retry with new token
        headers.Authorization = `Bearer ${this.accessToken}`;
        response = await fetch(url, { ...options, headers });
      } catch (error) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        throw error;
      }
    }

    return response.json();
  }

  async logout() {
    await fetch('http://localhost:5001/api/v1/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
      credentials: 'include'
    });

    this.accessToken = null;
    localStorage.removeItem('accessToken');
  }
}

export default new AuthService();
```

### Axios Interceptor Example

```javascript
// axios.config.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api/v1',
  withCredentials: true // Important: sends cookies
});

// Request interceptor - add access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh token
        const { data } = await axios.post(
          'http://localhost:5001/api/v1/auth/refresh-token',
          {},
          { withCredentials: true }
        );

        // Save new access token
        localStorage.setItem('accessToken', data.data.accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### Usage in Components

```javascript
// Login.jsx
import authService from './auth.service';

function Login() {
  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const user = await authService.login(email, password);
      console.log('Logged in:', user);
      // Redirect to dashboard
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {/* form fields */}
    </form>
  );
}

// Profile.jsx
import api from './axios.config';

function Profile() {
  useEffect(() => {
    // Axios automatically handles token refresh
    api.get('/auth/profile')
      .then(response => {
        setUser(response.data.data.user);
      })
      .catch(error => {
        console.error('Failed to load profile:', error);
      });
  }, []);

  return <div>{/* profile UI */}</div>;
}
```

## Security Best Practices

### 1. Token Storage
- **Access Token**: localStorage or memory (for SPAs)
- **Refresh Token**: HttpOnly cookie (most secure) or secure storage

### 2. HTTPS Only
Always use HTTPS in production to prevent token interception.

### 3. Token Rotation
Refresh tokens are rotated on each use (old token invalidated, new one issued).

### 4. Logout Handling
- Single device: Removes one refresh token
- All devices: Removes all refresh tokens

### 5. XSS Protection
- HttpOnly cookies prevent JavaScript access
- Sanitize all user inputs
- Use Content Security Policy

### 6. CSRF Protection
- SameSite cookie attribute
- CSRF tokens for state-changing operations

## Testing Token Flow

### 1. Login and Get Tokens
```bash
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"user@example.com","password":"SecurePass123"}'
```

### 2. Use Access Token
```bash
curl -X GET http://localhost:5001/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Refresh Token (with cookie)
```bash
curl -X POST http://localhost:5001/api/v1/auth/refresh-token \
  -b cookies.txt \
  -c cookies.txt
```

### 4. Logout
```bash
curl -X POST http://localhost:5001/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -b cookies.txt
```

## Troubleshooting

### "No token provided"
- Ensure Authorization header is included
- Format: `Authorization: Bearer <token>`

### "Invalid or expired token"
- Access token expired (15 min)
- Use refresh token endpoint

### "Invalid refresh token"
- Refresh token expired (7 days)
- User logged out
- User needs to login again

### CORS Issues
- Ensure `credentials: 'include'` in fetch
- Backend CORS must allow credentials
- Frontend and backend must be on allowed origins

## API Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/register` | POST | No | Register new user |
| `/auth/login` | POST | No | Login user |
| `/auth/refresh-token` | POST | No | Refresh access token |
| `/auth/profile` | GET | Yes | Get user profile |
| `/auth/logout` | POST | Yes | Logout current device |
| `/auth/logout-all` | POST | Yes | Logout all devices |
