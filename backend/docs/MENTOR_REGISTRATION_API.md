# Mentor Registration API Documentation

## Overview
This document describes the mentor registration flow that creates both a User account and a MentorProfile in a single API call.

## Endpoint
```
POST /api/auth/register
```

## Request Body for Mentor Registration

```json
{
  "fullName": "John Doe",
  "email": "john.mentor@example.com",
  "phone": "+91-98765-43210",
  "password": "SecurePass123",
  "role": "mentor",
  "mentorData": {
    "experienceYears": 5,
    "areaOfExpertise": "Web Development",
    "currentOrganization": "Tech Solutions Inc",
    "bio": "Experienced full-stack developer with 5 years of expertise in React, Node.js, and cloud technologies. Passionate about mentoring and helping students achieve their career goals."
  }
}
```

## Field Descriptions

### User Fields (Required for all roles)
- **fullName**: Full name of the mentor (2-100 characters)
- **email**: Email address for login (must be valid email format)
- **phone**: Contact phone number (supports international format)
- **password**: Password (min 8 chars, must contain uppercase, lowercase, and number)
- **role**: Must be "mentor" for mentor registration

### Mentor Data Fields (Required when role is "mentor")
- **experienceYears**: Years of professional experience (0-50) - **Required**
- **areaOfExpertise**: Primary area of expertise - **Required**
  - Valid values: `Web Development`, `Data Science & AI`, `Mobile Development`, `DevOps & Cloud`, `UI/UX Design`, `Cybersecurity`, `Other`
- **currentOrganization**: Current company/organization (2-200 characters) - **Required**
- **bio**: Short biography describing experience and mentoring approach (10-1000 characters) - **Required**

## Response

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "email": "john.mentor@example.com",
      "phone": "+91-98765-43210",
      "role": "mentor",
      "isEmailVerified": false
    },
    "mentorProfile": {
      "id": "507f1f77bcf86cd799439012",
      "experienceYears": 5,
      "areaOfExpertise": "Web Development",
      "currentOrganization": "Tech Solutions Inc"
    },
    "requiresEmailVerification": true,
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "a1b2c3d4e5f6..."
    }
  }
}
```

### Error Responses

#### Validation Error (400)
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "mentorData.areaOfExpertise",
        "message": "Area of expertise is required for mentor registration"
      }
    ]
  }
}
```

#### User Already Exists (409)
```json
{
  "success": false,
  "error": {
    "message": "User with this email already exists",
    "code": "USER_EXISTS"
  }
}
```

#### Profile Creation Failed (500)
```json
{
  "success": false,
  "error": {
    "message": "Failed to create mentor profile. Please try again.",
    "code": "PROFILE_CREATION_FAILED"
  }
}
```

## Validation Rules

### User Fields
- **fullName**: Required, 2-100 characters
- **email**: Required, valid email format
- **phone**: Required, valid phone format (supports +, digits, spaces, hyphens, parentheses)
- **password**: Required, min 8 characters, must contain at least one uppercase, one lowercase, and one number
- **role**: Required, must be "mentor"

### Mentor Data Fields (when role is "mentor")
- **experienceYears**: Required, integer between 0 and 50
- **areaOfExpertise**: Required, must be one of: Web Development, Data Science & AI, Mobile Development, DevOps & Cloud, UI/UX Design, Cybersecurity, Other
- **currentOrganization**: Required, 2-200 characters
- **bio**: Required, 10-1000 characters

## Database Models

### User Model
Created in the `users` collection with:
- Basic authentication fields (email, password, phone)
- Role set to "mentor"
- Email verification status (initially false)
- OTP for email verification

### MentorProfile Model
Created in the `mentorprofiles` collection with:
- Reference to User via `userId`
- Experience and expertise information
- Current organization
- Bio/description
- Verification status (initially false)
- Additional fields for future use (rating, sessions, courses, etc.)

## Flow

1. **Validation**: Request body is validated against the schema
2. **User Creation**: User account is created with role "mentor"
3. **Profile Creation**: MentorProfile is created and linked to the user
4. **Rollback**: If profile creation fails, the user is deleted to maintain consistency
5. **Email Verification**: OTP is sent to the registered email (non-blocking)
6. **Token Generation**: JWT access token and refresh token are generated
7. **Response**: User data, mentor profile data, and tokens are returned

## Notes

- Email verification is required before the mentor can fully access the platform
- The mentor profile `isVerified` field is initially `false` and can be updated by admin approval
- Tokens are also set as httpOnly cookies for web clients
- In development mode, tokens are included in the response body for testing
- If email sending fails, registration still succeeds (email is non-blocking)
- Transaction-like behavior: If mentor profile creation fails, user creation is rolled back

## Example cURL Request

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john.mentor@example.com",
    "phone": "+91-98765-43210",
    "password": "SecurePass123",
    "role": "mentor",
    "mentorData": {
      "experienceYears": 5,
      "areaOfExpertise": "Web Development",
      "currentOrganization": "Tech Solutions Inc",
      "bio": "Experienced full-stack developer with 5 years of expertise in React, Node.js, and cloud technologies."
    }
  }'
```

## Frontend Integration

The frontend should:
1. Collect all required fields from the registration form
2. Send POST request to `/api/auth/register` with the complete payload
3. Handle success: Store tokens, redirect to email verification page
4. Handle errors: Display validation errors to the user
5. Show email verification prompt after successful registration

### Area of Expertise Dropdown Options
```javascript
const areasOfExpertise = [
  'Web Development',
  'Data Science & AI',
  'Mobile Development',
  'DevOps & Cloud',
  'UI/UX Design',
  'Cybersecurity',
  'Other'
];
```

### Experience Years Input
```javascript
// Number input with min=0, max=50
<input 
  type="number" 
  min="0" 
  max="50" 
  name="experienceYears"
  required
/>
```

### Bio Textarea
```javascript
// Textarea with character limit
<textarea 
  name="bio"
  minLength="10"
  maxLength="1000"
  required
  placeholder="Tell us about your experience..."
/>
```
