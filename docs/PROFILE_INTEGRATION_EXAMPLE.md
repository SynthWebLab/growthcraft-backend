# Profile Integration Examples

## How to Integrate Role-Based Profiles with Your Auth System

### 1. Update Registration to Create Profiles

```typescript
// In auth.service.ts
import { createProfile } from '@/database/services/profile.service';

async register(registerDto: RegisterDto) {
  // Create user
  const user = await User.create({
    fullName: registerDto.fullName,
    email: registerDto.email,
    phone: registerDto.phone,
    password: registerDto.password,
    role: registerDto.role,
  });

  // Create role-specific profile with initial data
  let profileData = {};

  switch (user.role) {
    case UserRole.AMBASSADOR:
      profileData = {
        referralCode: generateReferralCode(), // Generate unique code
      };
      break;
    case UserRole.STUDENT:
      profileData = {
        collegeName: registerDto.collegeName || '',
      };
      break;
    case UserRole.MENTOR:
      profileData = {
        expertise: registerDto.expertise || [],
        experience: registerDto.experience || 0,
      };
      break;
    // Add other roles as needed
  }

  await createProfile(user._id, user.role, profileData);

  return user;
}
```

### 2. Create Profile Controller

```typescript
// backend/src/modules/profile/controllers/profile.controller.ts
import { Request, Response } from 'express';
import { getUserWithProfile, updateProfile } from '@/database/services/profile.service';
import { asyncHandler } from '@/common/utils/asyncHandler';

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const { user, profile } = await getUserWithProfile(req.user._id, req.user.role);

  res.status(200).json({
    success: true,
    data: {
      user,
      profile,
    },
  });
});

export const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await updateProfile(req.user._id, req.user.role, req.body);

  res.status(200).json({
    success: true,
    data: profile,
  });
});
```

### 3. Create Profile Routes

```typescript
// backend/src/modules/profile/routes/profile.routes.ts
import { Router } from 'express';
import { authenticate } from '@/modules/auth/middlewares/auth.middleware';
import { getMyProfile, updateMyProfile } from '../controllers/profile.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);

export default router;
```

### 4. Add to Main Routes

```typescript
// In backend/src/routes/v1/index.ts
import profileRoutes from '@/modules/profile/routes/profile.routes';

router.use('/profile', profileRoutes);
```

### 5. Role-Specific Endpoints

```typescript
// backend/src/modules/profile/controllers/student.controller.ts
import { StudentProfile } from '@/database/models';

export const enrollInCourse = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.body;

  const profile = await StudentProfile.findOneAndUpdate(
    { userId: req.user._id },
    { $addToSet: { enrolledCourses: courseId } },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: profile,
  });
});

// backend/src/modules/profile/controllers/mentor.controller.ts
export const updateAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { availability } = req.body;

  const profile = await MentorProfile.findOneAndUpdate(
    { userId: req.user._id },
    { availability },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: profile,
  });
});
```

### 6. Validation DTOs

```typescript
// backend/src/modules/profile/dto/update-student-profile.dto.ts
export class UpdateStudentProfileDto {
  collegeName?: string;
  degree?: string;
  branch?: string;
  yearOfStudy?: number;
  graduationYear?: number;
  skills?: string[];
  interests?: string[];
  resume?: string;
  portfolio?: string;
  linkedIn?: string;
  github?: string;
}

// backend/src/modules/profile/dto/update-mentor-profile.dto.ts
export class UpdateMentorProfileDto {
  expertise?: string[];
  bio?: string;
  experience?: number;
  company?: string;
  designation?: string;
  hourlyRate?: number;
  availability?: Array<{
    day: string;
    slots: Array<{ startTime: string; endTime: string }>;
  }>;
  linkedIn?: string;
  website?: string;
}
```

### 7. Middleware for Role-Specific Access

```typescript
// backend/src/modules/profile/middlewares/role-profile.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@/common/constants/user.constants';

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }
    next();
  };
};

// Usage:
router.post('/courses', authenticate, requireRole(UserRole.MENTOR), createCourse);
```

### 8. Query Examples

```typescript
// Find all verified mentors with specific expertise
const mentors = await MentorProfile.find({
  expertise: { $in: ['JavaScript', 'React'] },
  isVerified: true,
})
  .populate('userId', 'fullName email')
  .sort({ rating: -1 })
  .limit(10);

// Find students from a specific college
const students = await StudentProfile.find({
  collegeName: 'MIT',
  yearOfStudy: { $gte: 2 },
})
  .populate('userId', 'fullName email phone')
  .select('collegeName degree branch skills');

// Find top ambassadors by referrals
const topAmbassadors = await AmbassadorProfile.find({ isActive: true })
  .populate('userId', 'fullName email')
  .sort({ successfulReferrals: -1 })
  .limit(10);
```

### 9. Aggregation Pipeline Example

```typescript
// Get mentor statistics
const mentorStats = await MentorProfile.aggregate([
  {
    $match: { isVerified: true },
  },
  {
    $group: {
      _id: '$expertise',
      count: { $sum: 1 },
      avgRating: { $avg: '$rating' },
      avgHourlyRate: { $avg: '$hourlyRate' },
    },
  },
  {
    $sort: { count: -1 },
  },
]);
```

### 10. Transaction Example (Creating User + Profile)

```typescript
import mongoose from 'mongoose';

async function registerUserWithProfile(registerDto: RegisterDto) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create user
    const [user] = await User.create([registerDto], { session });

    // Create profile
    await createProfile(user._id, user.role, {
      // profile data
    });

    await session.commitTransaction();
    return user;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

## Complete Flow Example

```typescript
// 1. User registers as a student
POST /api/v1/auth/register
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123!",
  "role": "student"
}

// 2. User gets their profile
GET /api/v1/profile/me
Response: {
  "user": { fullName, email, role, ... },
  "profile": { collegeName, degree, skills, ... }
}

// 3. User updates their profile
PUT /api/v1/profile/me
{
  "collegeName": "MIT",
  "degree": "B.Tech",
  "branch": "Computer Science",
  "skills": ["JavaScript", "Python", "React"]
}

// 4. Student enrolls in a course
POST /api/v1/profile/student/enroll
{
  "courseId": "course_id_here"
}
```

## Helper Functions

```typescript
// Generate unique referral code for ambassadors
function generateReferralCode(): string {
  return `AMB${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .substring(2, 5)
    .toUpperCase()}`;
}

// Check if profile exists
async function hasProfile(userId: mongoose.Types.ObjectId, role: UserRole): Promise<boolean> {
  const profile = await getProfile(userId, role);
  return profile !== null;
}

// Get profile completion percentage
function getProfileCompletion(profile: any, requiredFields: string[]): number {
  const filledFields = requiredFields.filter((field) => {
    const value = profile[field];
    return value !== null && value !== undefined && value !== '';
  });

  return Math.round((filledFields.length / requiredFields.length) * 100);
}
```
