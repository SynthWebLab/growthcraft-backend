# Role-Based Profile Models Implementation

## Overview

This document explains the role-based profile system implemented using Mongoose. Each user role has a dedicated profile model with role-specific fields.

## Architecture

### Base User Model
- Located at: `backend/src/database/models/User.model.ts`
- Contains common fields: fullName, email, phone, password, role, etc.
- Handles authentication and basic user information

### Role-Specific Profile Models

Each role has a separate profile model that references the User model:

1. **StudentProfile** - For students
2. **CollegeProfile** - For colleges/institutions
3. **MentorProfile** - For mentors
4. **AmbassadorProfile** - For ambassadors
5. **HiringPartnerProfile** - For hiring partners

## Model Structure

### 1. Student Profile
```typescript
{
  userId: ObjectId (ref: User)
  enrollmentNumber: string
  collegeName: string
  degree: string
  branch: string
  yearOfStudy: number
  graduationYear: number
  skills: string[]
  interests: string[]
  enrolledCourses: ObjectId[]
  completedCourses: ObjectId[]
  certifications: []
  resume: string
  portfolio: string
  linkedIn: string
  github: string
}
```

### 2. College Profile
```typescript
{
  userId: ObjectId (ref: User)
  collegeName: string
  collegeCode: string
  address: {}
  contactPerson: {}
  establishedYear: number
  accreditation: string[]
  website: string
  totalStudents: number
  registeredStudents: ObjectId[]
  programs: []
  isVerified: boolean
}
```

### 3. Mentor Profile
```typescript
{
  userId: ObjectId (ref: User)
  expertise: string[]
  bio: string
  experience: number
  company: string
  designation: string
  hourlyRate: number
  availability: []
  rating: number
  totalSessions: number
  coursesCreated: ObjectId[]
  linkedIn: string
  website: string
  isVerified: boolean
}
```

### 4. Ambassador Profile
```typescript
{
  userId: ObjectId (ref: User)
  collegeName: string
  referralCode: string (unique)
  totalReferrals: number
  successfulReferrals: number
  earnings: number
  socialMedia: {}
  referredUsers: []
  rewards: []
  isActive: boolean
}
```

### 5. Hiring Partner Profile
```typescript
{
  userId: ObjectId (ref: User)
  companyName: string
  companySize: string
  industry: string
  website: string
  description: string
  address: {}
  contactPerson: {}
  jobsPosted: ObjectId[]
  totalHires: number
  isVerified: boolean
}
```

## Usage Examples

### 1. Creating a Profile During Registration

```typescript
import { createProfile } from '@/database/services/profile.service';
import { UserRole } from '@/common/constants/user.constants';

// After creating a user
const user = await User.create({
  fullName: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  password: 'password123',
  role: UserRole.STUDENT,
});

// Create the corresponding profile
const profile = await createProfile(user._id, user.role, {
  collegeName: 'MIT',
  degree: 'B.Tech',
  branch: 'Computer Science',
  yearOfStudy: 2,
});
```

### 2. Getting User with Profile

```typescript
import { getUserWithProfile } from '@/database/services/profile.service';

const { user, profile } = await getUserWithProfile(userId, UserRole.STUDENT);

console.log(user.fullName); // John Doe
console.log(profile.collegeName); // MIT
```

### 3. Updating a Profile

```typescript
import { updateProfile } from '@/database/services/profile.service';

const updatedProfile = await updateProfile(userId, UserRole.STUDENT, {
  skills: ['JavaScript', 'TypeScript', 'React'],
  github: 'https://github.com/johndoe',
});
```

### 4. Querying Profiles Directly

```typescript
import { StudentProfile } from '@/database/models';

// Find all students from a specific college
const students = await StudentProfile.find({ collegeName: 'MIT' })
  .populate('userId', 'fullName email')
  .exec();

// Find mentors with specific expertise
const mentors = await MentorProfile.find({ expertise: 'JavaScript' })
  .populate('userId')
  .sort({ rating: -1 })
  .exec();
```

### 5. In Auth Service (Registration)

```typescript
// In auth.service.ts
async register(registerDto: RegisterDto) {
  // Create user
  const user = await User.create({
    fullName: registerDto.fullName,
    email: registerDto.email,
    phone: registerDto.phone,
    password: registerDto.password,
    role: registerDto.role,
  });

  // Create role-specific profile
  await createProfile(user._id, user.role, {
    // Add role-specific initial data
    ...(user.role === UserRole.AMBASSADOR && {
      referralCode: generateReferralCode(),
    }),
  });

  return user;
}
```

## Benefits of This Approach

1. **Separation of Concerns**: User authentication data is separate from role-specific data
2. **Flexibility**: Easy to add/modify role-specific fields without affecting the User model
3. **Performance**: Only load profile data when needed
4. **Scalability**: Easy to add new roles with their own profiles
5. **Type Safety**: Full TypeScript support with interfaces

## Database Indexes

Each profile model has indexes for:
- `userId` - Fast lookups by user
- Role-specific fields (e.g., `referralCode` for ambassadors, `rating` for mentors)

## Best Practices

1. **Always create a profile** when creating a user
2. **Use the profile service** for CRUD operations
3. **Populate userId** when you need user details with profile
4. **Validate role** before accessing profile models
5. **Handle null profiles** gracefully (user might not have a profile yet)

## Migration Strategy

If you have existing users without profiles:

```typescript
// Migration script
import { User } from '@/database/models';
import { createProfile } from '@/database/services/profile.service';

async function migrateExistingUsers() {
  const users = await User.find({});

  for (const user of users) {
    const existingProfile = await getProfile(user._id, user.role);

    if (!existingProfile) {
      await createProfile(user._id, user.role, {
        // Add default values based on role
      });
      console.log(`Created profile for user: ${user.email}`);
    }
  }
}
```

## API Endpoints Example

```typescript
// GET /api/v1/profile - Get current user's profile
router.get('/profile', authenticate, async (req, res) => {
  const { user, profile } = await getUserWithProfile(req.user._id, req.user.role);
  res.json({ user, profile });
});

// PUT /api/v1/profile - Update current user's profile
router.put('/profile', authenticate, async (req, res) => {
  const profile = await updateProfile(req.user._id, req.user.role, req.body);
  res.json(profile);
});
```

## Testing

```typescript
describe('Profile Service', () => {
  it('should create a student profile', async () => {
    const user = await User.create({...});
    const profile = await createProfile(user._id, UserRole.STUDENT, {
      collegeName: 'MIT',
    });

    expect(profile.collegeName).toBe('MIT');
    expect(profile.userId.toString()).toBe(user._id.toString());
  });
});
```

## Troubleshooting

### Profile not found
- Ensure profile was created during user registration
- Check if the correct role is being used
- Verify userId is correct

### Validation errors
- Check required fields for each profile type
- Ensure data types match the schema
- Validate enum values (e.g., companySize, day of week)

### Performance issues
- Use `.select()` to limit fields returned
- Add indexes for frequently queried fields
- Use `.lean()` for read-only operations
