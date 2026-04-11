# Role-Based Profile Architecture Diagram

## Database Schema Relationship

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Model                              │
│  (Common authentication & basic info)                           │
├─────────────────────────────────────────────────────────────────┤
│  _id: ObjectId                                                  │
│  fullName: string                                               │
│  email: string (unique)                                         │
│  phone: string                                                  │
│  password: string (hashed)                                      │
│  role: enum [student, college, mentor, ambassador, hiring]      │
│  isEmailVerified: boolean                                       │
│  isActive: boolean                                              │
│  refreshTokens: []                                              │
│  createdAt: Date                                                │
│  updatedAt: Date                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ userId (reference)
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Student    │    │   College    │    │    Mentor    │
│   Profile    │    │   Profile    │    │   Profile    │
├──────────────┤    ├──────────────┤    ├──────────────┤
│ userId       │    │ userId       │    │ userId       │
│ enrollment#  │    │ collegeName  │    │ expertise[]  │
│ collegeName  │    │ collegeCode  │    │ bio          │
│ degree       │    │ address      │    │ experience   │
│ branch       │    │ contactPerson│    │ company      │
│ yearOfStudy  │    │ established  │    │ hourlyRate   │
│ skills[]     │    │ accreditation│    │ availability │
│ courses[]    │    │ programs[]   │    │ rating       │
│ resume       │    │ students[]   │    │ courses[]    │
└──────────────┘    └──────────────┘    └──────────────┘

        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐
│ Ambassador   │    │ Hiring       │
│  Profile     │    │ Partner      │
├──────────────┤    │ Profile      │
│ userId       │    ├──────────────┤
│ referralCode │    │ userId       │
│ collegeName  │    │ companyName  │
│ totalReferral│    │ companySize  │
│ earnings     │    │ industry     │
│ socialMedia  │    │ website      │
│ referredUsers│    │ address      │
│ rewards[]    │    │ contactPerson│
└──────────────┘    │ jobsPosted[] │
                    │ totalHires   │
                    └──────────────┘
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client Application                         │
│                    (Frontend/Mobile App)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP Requests
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Routes Layer                           │
│  /api/v1/auth/*        /api/v1/profile/*                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Route Handlers
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Middleware Layer                             │
│  - Authentication (JWT)                                         │
│  - Authorization (Role-based)                                   │
│  - Validation (DTOs)                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Validated Request
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Controller Layer                             │
│  - auth.controller.ts                                           │
│  - profile.controller.ts                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Business Logic
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Service Layer                               │
│  - auth.service.ts                                              │
│  - profile.service.ts                                           │
│                                                                 │
│  Functions:                                                     │
│  • createProfile(userId, role, data)                           │
│  • getProfile(userId, role)                                    │
│  • updateProfile(userId, role, data)                           │
│  • deleteProfile(userId, role)                                 │
│  • getUserWithProfile(userId, role)                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Database Operations
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Model Layer                                │
│  - User.model.ts                                                │
│  - StudentProfile.model.ts                                      │
│  - CollegeProfile.model.ts                                      │
│  - MentorProfile.model.ts                                       │
│  - AmbassadorProfile.model.ts                                   │
│  - HiringPartnerProfile.model.ts                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Mongoose ODM
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MongoDB Database                           │
│  Collections:                                                   │
│  • users                                                        │
│  • studentprofiles                                              │
│  • collegeprofiles                                              │
│  • mentorprofiles                                               │
│  • ambassadorprofiles                                           │
│  • hiringpartnerprofiles                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Registration Flow

```
User Registration Request
         │
         ▼
┌─────────────────────┐
│ Validate Input      │
│ (DTO Validation)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Create User         │
│ (User Model)        │
│ • Hash password     │
│ • Save to DB        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Determine Role      │
│ (student/mentor/etc)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Create Profile      │
│ (Role-specific)     │
│ • StudentProfile    │
│ • MentorProfile     │
│ • etc.              │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Generate Tokens     │
│ • Access Token      │
│ • Refresh Token     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Return Response     │
│ • User data         │
│ • Tokens            │
└─────────────────────┘
```

## Profile Access Flow

```
GET /api/v1/profile/me
         │
         ▼
┌─────────────────────┐
│ Authenticate        │
│ (JWT Middleware)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Extract User Info   │
│ • userId            │
│ • role              │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Get Profile Model   │
│ Based on Role       │
│                     │
│ if (role === STUDENT)│
│   → StudentProfile  │
│ if (role === MENTOR)│
│   → MentorProfile   │
│ etc.                │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Query Database      │
│ Profile.findOne({   │
│   userId: userId    │
│ })                  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Populate User Data  │
│ (if needed)         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Return Response     │
│ {                   │
│   user: {...},      │
│   profile: {...}    │
│ }                   │
└─────────────────────┘
```

## Role-Based Access Control

```
                    ┌─────────────┐
                    │   Request   │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Authenticate│
                    │   (JWT)     │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Check Role  │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   STUDENT    │  │   MENTOR     │  │   COLLEGE    │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ • View       │  │ • View       │  │ • View       │
│   courses    │  │   courses    │  │   students   │
│ • Enroll     │  │ • Create     │  │ • Manage     │
│ • Submit     │  │   courses    │  │   programs   │
│   assignments│  │ • Grade      │  │ • Analytics  │
│ • Book       │  │ • Mentor     │  │              │
│   sessions   │  │   students   │  │              │
└──────────────┘  └──────────────┘  └──────────────┘

        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐
│ AMBASSADOR   │  │ HIRING       │
├──────────────┤  │ PARTNER      │
│ • Refer      │  ├──────────────┤
│   students   │  │ • Post jobs  │
│ • Track      │  │ • View       │
│   referrals  │  │   candidates │
│ • Earn       │  │ • Schedule   │
│   rewards    │  │   interviews │
└──────────────┘  └──────────────┘
```

## File Structure

```
backend/
├── src/
│   ├── database/
│   │   ├── models/
│   │   │   ├── User.model.ts
│   │   │   ├── StudentProfile.model.ts
│   │   │   ├── CollegeProfile.model.ts
│   │   │   ├── MentorProfile.model.ts
│   │   │   ├── AmbassadorProfile.model.ts
│   │   │   ├── HiringPartnerProfile.model.ts
│   │   │   └── index.ts
│   │   └── services/
│   │       └── profile.service.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── routes/
│   │   │   └── dto/
│   │   └── profile/
│   │       ├── controllers/
│   │       │   ├── profile.controller.ts
│   │       │   ├── student.controller.ts
│   │       │   ├── mentor.controller.ts
│   │       │   └── ...
│   │       ├── routes/
│   │       │   └── profile.routes.ts
│   │       ├── dto/
│   │       │   ├── update-student-profile.dto.ts
│   │       │   ├── update-mentor-profile.dto.ts
│   │       │   └── ...
│   │       └── middlewares/
│   │           └── role-profile.middleware.ts
│   └── common/
│       └── constants/
│           └── user.constants.ts
```

## Key Design Decisions

1. **Separate Models**: Each role has its own profile model
   - Pros: Clean separation, flexible schema per role
   - Cons: More models to manage

2. **Reference Pattern**: Profiles reference User via userId
   - Pros: Easy to query, maintain data integrity
   - Cons: Requires populate for full data

3. **Service Layer**: Centralized profile operations
   - Pros: Reusable, consistent, easy to test
   - Cons: Extra abstraction layer

4. **Type Safety**: Full TypeScript interfaces
   - Pros: Compile-time checks, better IDE support
   - Cons: More code to write

## Performance Considerations

1. **Indexes**: Added on userId and frequently queried fields
2. **Lean Queries**: Use .lean() for read-only operations
3. **Select Fields**: Only fetch needed fields
4. **Populate Wisely**: Only populate when necessary
5. **Caching**: Consider Redis for frequently accessed profiles
