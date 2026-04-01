# Role-Based Access Control (RBAC) Guide

## User Roles

The system supports 4 roles with hierarchical permissions:

1. **STUDENT** (Level 1) - Basic user
2. **INSTRUCTOR** (Level 2) - Can create and manage courses
3. **ADMIN** (Level 3) - Can manage users and system
4. **SUPER_ADMIN** (Level 4) - Full system access

## Role Permissions

### Student
- Read/update own profile
- Read courses
- Enroll in courses
- Submit assignments

### Instructor
- All student permissions
- Create courses
- Update/delete own courses
- Read student information
- Grade assignments

### Admin
- All instructor permissions
- Manage all courses
- Read/create/update users
- View analytics

### Super Admin
- All admin permissions
- Delete users
- Manage system settings
- Manage roles

## Authorization Middleware

### 1. `authorize([roles])`
Restrict access to specific roles only.

```typescript
import { authorize } from '@/common/middleware/authorize.middleware';
import { UserRole } from '@/common/constants/user.constants';

// Only admins and super admins
router.get('/admin-only', 
  authenticate,
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  controller.method
);
```

### 2. `authorizeMinRole(role)`
Allow access to a role and all higher roles.

```typescript
import { authorizeMinRole } from '@/common/middleware/authorize.middleware';

// Instructors, admins, and super admins can access
router.post('/courses', 
  authenticate,
  authorizeMinRole(UserRole.INSTRUCTOR),
  controller.createCourse
);
```

### 3. `authorizePermission(permission)`
Check for specific permission.

```typescript
import { authorizePermission } from '@/common/middleware/authorize.middleware';

// Only users with 'create:courses' permission
router.post('/courses', 
  authenticate,
  authorizePermission('create:courses'),
  controller.createCourse
);
```

### 4. `authorizeOwnership(paramName)`
Allow access to own resources or admins.

```typescript
import { authorizeOwnership } from '@/common/middleware/authorize.middleware';

// Users can only update their own profile (or admins can update any)
router.patch('/users/:userId', 
  authenticate,
  authorizeOwnership('userId'),
  controller.updateUser
);
```

## API Endpoints with RBAC

### Authentication (Public)
```
POST /api/v1/auth/register - Register new user
POST /api/v1/auth/login - Login user
```

### User Profile (Protected)
```
GET  /api/v1/auth/profile - Get own profile (All authenticated users)
```

### User Management (Protected)
```
GET    /api/v1/users - Get all users (Admin, Super Admin)
GET    /api/v1/users/:userId - Get user by ID (Own profile or Admin)
PATCH  /api/v1/users/:userId - Update user (Own profile or Admin)
DELETE /api/v1/users/:userId - Delete user (Admin, Super Admin)
```

## Testing RBAC

### 1. Register as Student (default)
```bash
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Student",
    "email": "student@example.com",
    "phone": "+91 9876543210",
    "password": "SecurePass123"
  }'
```

### 2. Try to Access Admin Route (Should Fail)
```bash
curl -X GET http://localhost:5001/api/v1/users \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

Response:
```json
{
  "success": false,
  "error": {
    "message": "You do not have permission to access this resource",
    "code": "FORBIDDEN"
  }
}
```

### 3. Create Admin User (Manually in MongoDB)
```javascript
// In MongoDB Compass or shell
db.users.updateOne(
  { email: "student@example.com" },
  { $set: { role: "admin" } }
)
```

### 4. Login as Admin and Access Route
```bash
# Login to get new token with admin role
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "SecurePass123"
  }'

# Now access admin route
curl -X GET http://localhost:5001/api/v1/users \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Usage Examples

### Example 1: Course Routes (Future Implementation)
```typescript
import { Router } from 'express';
import { authenticate } from '@/common/middleware/authenticate.middleware';
import { authorizeMinRole, authorizePermission } from '@/common/middleware/authorize.middleware';
import { UserRole } from '@/common/constants/user.constants';

const router = Router();

// Anyone can view courses
router.get('/', courseController.getAllCourses);

// Instructors and above can create courses
router.post('/',
  authenticate,
  authorizeMinRole(UserRole.INSTRUCTOR),
  courseController.createCourse
);

// Only course owner or admin can update
router.patch('/:courseId',
  authenticate,
  authorizePermission('update:courses'),
  courseController.updateCourse
);

// Only admin can delete
router.delete('/:courseId',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  courseController.deleteCourse
);
```

### Example 2: Checking Permissions in Controller
```typescript
import { AuthRequest } from '@/common/middleware/authenticate.middleware';
import { UserRole, ROLE_PERMISSIONS } from '@/common/constants/user.constants';

public async createCourse(req: Request, res: Response) {
  const authReq = req as AuthRequest;
  const userRole = authReq.user?.role as UserRole;
  
  // Check if user has permission
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions.includes('create:courses')) {
    return res.status(403).json({
      success: false,
      error: { message: 'Insufficient permissions' }
    });
  }
  
  // Create course logic...
}
```

## Best Practices

1. **Always authenticate first**: Use `authenticate` middleware before any authorization
2. **Use appropriate middleware**: Choose the right authorization method for your use case
3. **Principle of least privilege**: Give users minimum required permissions
4. **Log authorization failures**: Already implemented in middleware
5. **Test all roles**: Ensure each role can only access what they should

## Adding New Roles

1. Add role to enum in `user.constants.ts`:
```typescript
export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  MODERATOR = 'moderator', // New role
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}
```

2. Add to hierarchy:
```typescript
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.STUDENT]: 1,
  [UserRole.INSTRUCTOR]: 2,
  [UserRole.MODERATOR]: 3, // New role
  [UserRole.ADMIN]: 4,
  [UserRole.SUPER_ADMIN]: 5,
};
```

3. Define permissions:
```typescript
export const ROLE_PERMISSIONS = {
  [UserRole.MODERATOR]: [
    'read:own_profile',
    'update:own_profile',
    'moderate:content',
    'ban:users',
  ],
  // ... other roles
};
```

## Security Notes

- Roles are stored in JWT tokens (can't be changed without re-login)
- Role changes require new token generation
- Admins cannot delete themselves
- All authorization failures are logged
- Use HTTPS in production to protect tokens
