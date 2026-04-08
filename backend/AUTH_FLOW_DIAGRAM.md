# Cookie-Based Authentication Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GrowthCraft EdTech                          │
│                    Cookie-Based Authentication                      │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │         │   Backend    │         │   Database   │
│  Next.js 14  │◄───────►│  Express.js  │◄───────►│   MongoDB    │
│   + Redux    │  HTTPS  │  + JWT       │  Async  │  + Mongoose  │
└──────────────┘         └──────────────┘         └──────────────┘
      │                         │                         │
      │  withCredentials:true   │                         │
      │  Cookies automatic      │  Hashed tokens          │
      │  No manual tokens       │  Token rotation         │
      │  Auto refresh           │  RBAC middleware        │
```

## Token Types

```
┌─────────────────────────────────────────────────────────────────┐
│                        ACCESS TOKEN (JWT)                       │
├─────────────────────────────────────────────────────────────────┤
│ Type:       JSON Web Token (JWT)                                │
│ Expiry:     15 minutes                                          │
│ Storage:    access_token httpOnly cookie                        │
│ Purpose:    Authenticate API requests                           │
│ Contains:   { userId, email, role, iat, exp }                   │
│ Algorithm:  HS256                                               │
│ Signed:     JWT_SECRET                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   REFRESH TOKEN (Crypto Random)                 │
├─────────────────────────────────────────────────────────────────┤
│ Type:       Cryptographically secure random                     │
│ Length:     128 hex characters (64 bytes)                       │
│ Expiry:     30 days                                             │
│ Storage:    refreshToken httpOnly cookie (raw)                  │
│             MongoDB (bcrypt hashed)                             │
│ Purpose:    Rotate access tokens without re-login              │
│ Hashing:    bcrypt with salt rounds 10                         │
│ Rotation:   New token on every use                             │
└─────────────────────────────────────────────────────────────────┘
```

## Complete Authentication Flow

```
┌─────────┐                                                    ┌─────────┐
│ Browser │                                                    │ Server  │
└────┬────┘                                                    └────┬────┘
     │                                                              │
     │ 1. POST /auth/login                                         │
     │    { email, password }                                      │
     ├────────────────────────────────────────────────────────────►│
     │                                                              │
     │                                          2. Validate         │
     │                                             credentials      │
     │                                                              │
     │                                          3. Generate JWT     │
     │                                             (15 min)         │
     │                                                              │
     │                                          4. Generate crypto  │
     │                                             random (30 days) │
     │                                                              │
     │                                          5. Hash refresh     │
     │                                             token (bcrypt)   │
     │                                                              │
     │                                          6. Store hashed     │
     │                                             token in DB      │
     │                                                              │
     │ 7. Set-Cookie: access_token=JWT; HttpOnly                   │
     │    Set-Cookie: refreshToken=RANDOM; HttpOnly                │
     │    { user: {...} }                                          │
     │◄────────────────────────────────────────────────────────────┤
     │                                                              │
     │ 8. GET /auth/profile                                        │
     │    Cookie: access_token=JWT                                 │
     ├────────────────────────────────────────────────────────────►│
     │                                                              │
     │                                          9. Verify JWT       │
     │                                             signature        │
     │                                                              │
     │                                          10. Check expiry    │
     │                                                              │
     │                                          11. Extract payload │
     │                                              req.user = {...}│
     │                                                              │
     │ 12. { user: {...} }                                         │
     │◄────────────────────────────────────────────────────────────┤
     │                                                              │
     │ ... 15 minutes pass ...                                     │
     │                                                              │
     │ 13. GET /auth/profile                                       │
     │     Cookie: access_token=EXPIRED_JWT                        │
     ├────────────────────────────────────────────────────────────►│
     │                                                              │
     │                                          14. Verify JWT      │
     │                                              (EXPIRED!)      │
     │                                                              │
     │ 15. 401 TOKEN_EXPIRED                                       │
     │◄────────────────────────────────────────────────────────────┤
     │                                                              │
     │ 16. Axios Interceptor catches 401                           │
     │                                                              │
     │ 17. POST /auth/refresh                                      │
     │     Cookie: refreshToken=RANDOM                             │
     │     Cookie: access_token=EXPIRED_JWT                        │
     ├────────────────────────────────────────────────────────────►│
     │                                                              │
     │                                          18. Decode expired  │
     │                                              JWT for userId  │
     │                                                              │
     │                                          19. Get user's      │
     │                                              hashed tokens   │
     │                                                              │
     │                                          20. Compare refresh │
     │                                              with hashed     │
     │                                                              │
     │                                          21. MATCH! Valid    │
     │                                                              │
     │                                          22. Remove old      │
     │                                              hashed token    │
     │                                                              │
     │                                          23. Generate new    │
     │                                              JWT (15 min)    │
     │                                                              │
     │                                          24. Generate new    │
     │                                              crypto random   │
     │                                                              │
     │                                          25. Hash new token  │
     │                                                              │
     │                                          26. Store new       │
     │                                              hashed token    │
     │                                                              │
     │ 27. Set-Cookie: access_token=NEW_JWT; HttpOnly              │
     │     Set-Cookie: refreshToken=NEW_RANDOM; HttpOnly           │
     │     { success: true }                                       │
     │◄────────────────────────────────────────────────────────────┤
     │                                                              │
     │ 28. Retry GET /auth/profile                                 │
     │     Cookie: access_token=NEW_JWT                            │
     ├────────────────────────────────────────────────────────────►│
     │                                                              │
     │                                          29. Verify new JWT  │
     │                                              (VALID!)        │
     │                                                              │
     │ 30. { user: {...} }                                         │
     │◄────────────────────────────────────────────────────────────┤
     │                                                              │
```

## Token Rotation Security

```
┌─────────────────────────────────────────────────────────────────┐
│                    Token Rotation Process                       │
└─────────────────────────────────────────────────────────────────┘

Time: T0 (Login)
┌──────────────────────────────────────────────────────────────┐
│ Browser Cookie:  refreshToken_1 (raw)                        │
│ Database:        $2a$10$hash_of_refreshToken_1               │
└──────────────────────────────────────────────────────────────┘

Time: T1 (First Refresh)
┌──────────────────────────────────────────────────────────────┐
│ 1. Receive refreshToken_1                                    │
│ 2. Compare with hashed version in DB → MATCH ✓              │
│ 3. DELETE $2a$10$hash_of_refreshToken_1 from DB             │
│ 4. Generate refreshToken_2                                   │
│ 5. Hash refreshToken_2                                       │
│ 6. Store $2a$10$hash_of_refreshToken_2 in DB                │
│ 7. Send refreshToken_2 to browser                           │
└──────────────────────────────────────────────────────────────┘

Result:
┌──────────────────────────────────────────────────────────────┐
│ Browser Cookie:  refreshToken_2 (raw)                        │
│ Database:        $2a$10$hash_of_refreshToken_2               │
│ Old Token:       refreshToken_1 is now INVALID ✗            │
└──────────────────────────────────────────────────────────────┘

Time: T2 (Attacker tries old token)
┌──────────────────────────────────────────────────────────────┐
│ 1. Receive refreshToken_1 (stolen/old)                       │
│ 2. Compare with hashed versions in DB → NO MATCH ✗          │
│ 3. Return 401 INVALID_REFRESH_TOKEN                         │
│ 4. Clear cookies                                             │
└──────────────────────────────────────────────────────────────┘
```

## Multi-Device Support

```
┌─────────────────────────────────────────────────────────────────┐
│                    User: john@example.com                       │
└─────────────────────────────────────────────────────────────────┘

Device 1: Laptop                Device 2: Phone
┌──────────────────┐           ┌──────────────────┐
│ refreshToken_A   │           │ refreshToken_B   │
└──────────────────┘           └──────────────────┘
         │                              │
         └──────────────┬───────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │      MongoDB User Doc        │
         ├──────────────────────────────┤
         │ refreshTokens: [             │
         │   "$2a$10$hash_of_token_A",  │
         │   "$2a$10$hash_of_token_B",  │
         │   "$2a$10$hash_of_token_C",  │ ← Device 3
         │   "$2a$10$hash_of_token_D",  │ ← Device 4
         │   "$2a$10$hash_of_token_E"   │ ← Device 5
         │ ]                            │
         │ (Max 5 tokens)               │
         └──────────────────────────────┘

Logout from Device 1:
┌──────────────────────────────────────────────────────────────┐
│ 1. Send refreshToken_A                                       │
│ 2. Find matching hash in array                              │
│ 3. Remove $2a$10$hash_of_token_A                            │
│ 4. Other devices still work ✓                               │
└──────────────────────────────────────────────────────────────┘

Logout All:
┌──────────────────────────────────────────────────────────────┐
│ 1. Clear entire refreshTokens array                         │
│ 2. All devices logged out ✓                                 │
└──────────────────────────────────────────────────────────────┘
```

## Cookie Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      Security Layers                            │
└─────────────────────────────────────────────────────────────────┘

Layer 1: HttpOnly Flag
┌──────────────────────────────────────────────────────────────┐
│ document.cookie                    → Cannot access ✗         │
│ JavaScript cannot read             → XSS Protection ✓        │
└──────────────────────────────────────────────────────────────┘

Layer 2: Secure Flag (Production)
┌──────────────────────────────────────────────────────────────┐
│ HTTP requests                      → Cookie not sent ✗       │
│ HTTPS requests only                → MITM Protection ✓       │
└──────────────────────────────────────────────────────────────┘

Layer 3: SameSite Attribute
┌──────────────────────────────────────────────────────────────┐
│ Cross-site requests                → Cookie not sent ✗       │
│ Same-site requests only            → CSRF Protection ✓       │
└──────────────────────────────────────────────────────────────┘

Layer 4: Path Restriction
┌──────────────────────────────────────────────────────────────┐
│ Only sent to /api/v1/*             → Scope Limited ✓         │
└──────────────────────────────────────────────────────────────┘

Layer 5: Expiration
┌──────────────────────────────────────────────────────────────┐
│ access_token: 15 minutes           → Short exposure ✓        │
│ refreshToken: 30 days              → Good UX ✓              │
└──────────────────────────────────────────────────────────────┘

Layer 6: Token Rotation
┌──────────────────────────────────────────────────────────────┐
│ Old tokens invalidated             → Reuse prevented ✓       │
│ New tokens on every refresh        → Attack window small ✓   │
└──────────────────────────────────────────────────────────────┘

Layer 7: Hashed Storage
┌──────────────────────────────────────────────────────────────┐
│ Raw tokens never in database       → DB breach safe ✓        │
│ Bcrypt hashing                     → Rainbow table safe ✓    │
└──────────────────────────────────────────────────────────────┘
```

## Request/Response Headers

```
┌─────────────────────────────────────────────────────────────────┐
│                         Login Request                           │
└─────────────────────────────────────────────────────────────────┘

POST /api/v1/auth/login HTTP/1.1
Host: localhost:5001
Content-Type: application/json
Origin: http://localhost:3000

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

┌─────────────────────────────────────────────────────────────────┐
│                        Login Response                           │
└─────────────────────────────────────────────────────────────────┘

HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Set-Cookie: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...;
            HttpOnly; Secure; SameSite=None; Path=/; Max-Age=900
Set-Cookie: refreshToken=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...;
            HttpOnly; Secure; SameSite=None; Path=/; Max-Age=2592000
Content-Type: application/json

{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "student"
    }
  }
}

┌─────────────────────────────────────────────────────────────────┐
│                    Protected Request                            │
└─────────────────────────────────────────────────────────────────┘

GET /api/v1/auth/profile HTTP/1.1
Host: localhost:5001
Cookie: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...;
        refreshToken=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...
Origin: http://localhost:3000

┌─────────────────────────────────────────────────────────────────┐
│                   Protected Response                            │
└─────────────────────────────────────────────────────────────────┘

HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Content-Type: application/json

{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Error Scenarios                              │
└─────────────────────────────────────────────────────────────────┘

Scenario 1: No Access Token
┌──────────────────────────────────────────────────────────────┐
│ Request: GET /auth/profile (no cookie)                       │
│ Response: 401 NO_TOKEN                                       │
│ Action: Redirect to login                                    │
└──────────────────────────────────────────────────────────────┘

Scenario 2: Expired Access Token
┌──────────────────────────────────────────────────────────────┐
│ Request: GET /auth/profile (expired JWT)                     │
│ Response: 401 TOKEN_EXPIRED                                  │
│ Action: Auto-call /auth/refresh                             │
│ Result: New tokens → Retry request                          │
└──────────────────────────────────────────────────────────────┘

Scenario 3: Invalid Access Token
┌──────────────────────────────────────────────────────────────┐
│ Request: GET /auth/profile (malformed JWT)                   │
│ Response: 401 INVALID_TOKEN                                  │
│ Action: Clear cookies → Redirect to login                    │
└──────────────────────────────────────────────────────────────┘

Scenario 4: No Refresh Token
┌──────────────────────────────────────────────────────────────┐
│ Request: POST /auth/refresh (no cookie)                      │
│ Response: 401 NO_REFRESH_TOKEN                               │
│ Action: Redirect to login                                    │
└──────────────────────────────────────────────────────────────┘

Scenario 5: Invalid Refresh Token
┌──────────────────────────────────────────────────────────────┐
│ Request: POST /auth/refresh (invalid token)                  │
│ Response: 401 REFRESH_FAILED                                 │
│ Action: Clear cookies → Redirect to login                    │
└──────────────────────────────────────────────────────────────┘

Scenario 6: Expired Refresh Token
┌──────────────────────────────────────────────────────────────┐
│ Request: POST /auth/refresh (30+ days old)                   │
│ Response: 401 REFRESH_FAILED                                 │
│ Action: Clear cookies → Redirect to login                    │
└──────────────────────────────────────────────────────────────┘
```

This visual guide shows exactly how the cookie-based authentication system works at every level!
