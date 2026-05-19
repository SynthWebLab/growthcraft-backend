# Profile System Quick Reference

## 🚀 Quick Start

### Import What You Need

```typescript
// Import models
import { User, StudentProfile, MentorProfile } from '@/database/models';

// Import service functions
import {
  createProfile,
  getProfile,
  updateProfile,
  deleteProfile,
  getUserWithProfile,
} from '@/database/services/profile.service';

// Import constants
import { UserRole } from '@/common/constants/user.constants';
```

## 📝 Common Operations

### 1. Create a Profile

```typescript
const profile = await createProfile(userId, UserRole.STUDENT, {
  collegeName: 'MIT',
  degree: 'B.Tech',
  branch: 'Computer Science',
});
```

### 2. Get a Profile

```typescript
const profile = await getProfile(userId, UserRole.STUDENT);
```

### 3. Get User + Profile Together

```typescript
const { user, profile } = await getUserWithProfile(userId, UserRole.STUDENT);
```

### 4. Update a Profile

```typescript
const updated = await updateProfile(userId, UserRole.STUDENT, {
  skills: ['JavaScript', 'React', 'Node.js'],
  github: 'https://github.com/username',
});
```

### 5. Delete a Profile

```typescript
const deleted = await deleteProfile(userId, UserRole.STUDENT);
```

## 🎯 Role-Specific Examples

### Student

```typescript
// Create
await createProfile(userId, UserRole.STUDENT, {
  collegeName: 'MIT',
  degree: 'B.Tech',
  yearOfStudy: 2,
});

// Enroll in course
await StudentProfile.findOneAndUpdate(
  { userId },
  { $addToSet: { enrolledCourses: courseId } }
);

// Add skill
await StudentProfile.findOneAndUpdate(
  { userId },
  { $addToSet: { skills: 'React' } }
);
```

### Mentor

```typescript
// Create
await createProfile(userId, UserRole.MENTOR, {
  expertise: ['JavaScript', 'React'],
  experience: 5,
  hourlyRate: 50,
});

// Update availability
await MentorProfile.findOneAndUpdate(
  { userId },
  {
    availability: [
      {
        day: 'Monday',
        slots: [{ startTime: '10:00', endTime: '12:00' }],
      },
    ],
  }
);
```

### Ambassador

```typescript
// Create with referral code
await createProfile(userId, UserRole.AMBASSADOR, {
  referralCode: 'AMB123XYZ',
  collegeName: 'MIT',
});

// Add referral
await AmbassadorProfile.findOneAndUpdate(
  { userId },
  {
    $push: {
      referredUsers: {
        userId: referredUserId,
        referredAt: new Date(),
        status: 'pending',
      },
    },
    $inc: { totalReferrals: 1 },
  }
);
```

### College

```typescript
// Create
await createProfile(userId, UserRole.COLLEGE, {
  collegeName: 'MIT',
  address: {
    city: 'Cambridge',
    state: 'MA',
    country: 'USA',
  },
  contactPerson: {
    name: 'John Doe',
    designation: 'Admin',
    email: 'admin@mit.edu',
    phone: '+1234567890',
  },
});
```

### Hiring Partner

```typescript
// Create
await createProfile(userId, UserRole.HIRING_PARTNER, {
  companyName: 'Tech Corp',
  industry: 'Technology',
  companySize: '51-200',
  contactPerson: {
    name: 'Jane Smith',
    designation: 'HR Manager',
    email: 'hr@techcorp.com',
    phone: '+1234567890',
  },
});
```

## 🔍 Query Examples

### Find Profiles

```typescript
// Find all students from a college
const students = await StudentProfile.find({ collegeName: 'MIT' })
  .populate('userId', 'fullName email')
  .exec();

// Find verified mentors with expertise
const mentors = await MentorProfile.find({
  expertise: 'JavaScript',
  isVerified: true,
})
  .populate('userId')
  .sort({ rating: -1 })
  .limit(10);

// Find active ambassadors
const ambassadors = await AmbassadorProfile.find({ isActive: true })
  .sort({ successfulReferrals: -1 })
  .limit(20);

// Find hiring partners by industry
const companies = await HiringPartnerProfile.find({
  industry: 'Technology',
  isVerified: true,
});
```

### Aggregation

```typescript
// Count students by college
const stats = await StudentProfile.aggregate([
  { $group: { _id: '$collegeName', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
]);

// Average mentor rating by expertise
const mentorStats = await MentorProfile.aggregate([
  { $unwind: '$expertise' },
  {
    $group: {
      _id: '$expertise',
      avgRating: { $avg: '$rating' },
      count: { $sum: 1 },
    },
  },
]);
```

## 🛡️ Validation Examples

### Joi Validation

```typescript
import Joi from 'joi';

const updateStudentProfileSchema = Joi.object({
  collegeName: Joi.string().trim(),
  degree: Joi.string().trim(),
  branch: Joi.string().trim(),
  yearOfStudy: Joi.number().min(1).max(6),
  skills: Joi.array().items(Joi.string()),
  github: Joi.string().uri(),
});
```

### Class Validator

```typescript
import { IsString, IsNumber, IsArray, IsUrl, Min, Max } from 'class-validator';

export class UpdateStudentProfileDto {
  @IsString()
  collegeName?: string;

  @IsNumber()
  @Min(1)
  @Max(6)
  yearOfStudy?: number;

  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsUrl()
  github?: string;
}
```

## 🔐 Middleware Examples

### Authenticate & Get Profile

```typescript
export const authenticateWithProfile = async (req, res, next) => {
  try {
    // Authenticate user (JWT)
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user) throw new Error('User not found');

    // Get profile
    const profile = await getProfile(user._id, user.role);

    req.user = user;
    req.profile = profile;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
```

### Role-Based Access

```typescript
export const requireRole = (...roles: UserRole[]) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

// Usage
router.post('/courses', authenticate, requireRole(UserRole.MENTOR), createCourse);
```

## 📊 Response Formatting

### Standard Response

```typescript
// Success
res.status(200).json({
  success: true,
  data: {
    user: {
      _id: '...',
      fullName: 'John Doe',
      email: 'john@example.com',
      role: 'student',
    },
    profile: {
      _id: '...',
      userId: '...',
      collegeName: 'MIT',
      degree: 'B.Tech',
      skills: ['JavaScript', 'React'],
    },
  },
});

// Error
res.status(400).json({
  success: false,
  message: 'Profile not found',
  error: 'PROFILE_NOT_FOUND',
});
```

## 🧪 Testing Examples

### Unit Test

```typescript
describe('Profile Service', () => {
  it('should create a student profile', async () => {
    const userId = new mongoose.Types.ObjectId();
    const profile = await createProfile(userId, UserRole.STUDENT, {
      collegeName: 'MIT',
    });

    expect(profile).toBeDefined();
    expect(profile.collegeName).toBe('MIT');
    expect(profile.userId.toString()).toBe(userId.toString());
  });

  it('should get profile by userId', async () => {
    const profile = await getProfile(userId, UserRole.STUDENT);
    expect(profile).toBeDefined();
  });
});
```

### Integration Test

```typescript
describe('Profile API', () => {
  it('GET /api/v1/profile/me should return user profile', async () => {
    const response = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.profile).toBeDefined();
  });
});
```

## 🎨 Frontend Integration

### API Service

```typescript
// profileService.ts
export const profileAPI = {
  getMyProfile: async () => {
    const response = await axios.get('/api/v1/profile/me');
    return response.data;
  },

  updateMyProfile: async (data: any) => {
    const response = await axios.put('/api/v1/profile/me', data);
    return response.data;
  },
};
```

### React Hook

```typescript
// useProfile.ts
export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileAPI.getMyProfile();
        setProfile(data.profile);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { profile, loading };
};
```

## 🔧 Utility Functions

```typescript
// Generate referral code
export const generateReferralCode = (): string => {
  return `AMB${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .substring(2, 5)
    .toUpperCase()}`;
};

// Calculate profile completion
export const getProfileCompletion = (profile: any, requiredFields: string[]): number => {
  const filled = requiredFields.filter((field) => {
    const value = profile[field];
    return value !== null && value !== undefined && value !== '';
  });
  return Math.round((filled.length / requiredFields.length) * 100);
};

// Check if profile exists
export const hasProfile = async (userId: ObjectId, role: UserRole): Promise<boolean> => {
  const profile = await getProfile(userId, role);
  return profile !== null;
};
```

## 📚 Model Reference

| Role | Model | Key Fields |
|------|-------|------------|
| Student | StudentProfile | collegeName, degree, skills, courses |
| College | CollegeProfile | collegeName, programs, students |
| Mentor | MentorProfile | expertise, experience, rating, availability |
| Ambassador | AmbassadorProfile | referralCode, referrals, earnings |
| Hiring Partner | HiringPartnerProfile | companyName, industry, jobs |

## 🚨 Common Errors

```typescript
// Profile not found
if (!profile) {
  throw new Error('Profile not found');
}

// Invalid role
if (!Object.values(UserRole).includes(role)) {
  throw new Error('Invalid role');
}

// Profile already exists
const existing = await getProfile(userId, role);
if (existing) {
  throw new Error('Profile already exists');
}
```

## 💡 Best Practices

1. Always create profile during user registration
2. Use service functions instead of direct model access
3. Validate input data before creating/updating
4. Handle null profiles gracefully
5. Use transactions for user + profile creation
6. Add indexes for frequently queried fields
7. Populate userId only when needed
8. Use .lean() for read-only operations
9. Implement proper error handling
10. Keep profile data normalized
