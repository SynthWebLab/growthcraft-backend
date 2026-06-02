export enum UserRole {
  STUDENT = 'student',
  COLLEGE = 'college',
  MENTOR = 'mentor',
  EMPLOYER = 'employer',
  OPS = 'ops',
  SUPER_ADMIN = 'super_admin',
}

export const USER_ROLES = Object.values(UserRole);

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.STUDENT]: 1,
  [UserRole.MENTOR]: 2,
  [UserRole.COLLEGE]: 3,
  [UserRole.EMPLOYER]: 4,
  [UserRole.OPS]: 5,
  [UserRole.SUPER_ADMIN]: 6,
};

// Permissions for each role
export const ROLE_PERMISSIONS = {
  [UserRole.STUDENT]: [
    'read:own_profile',
    'update:own_profile',
    'read:courses',
    'enroll:courses',
    'submit:assignments',
    'read:mentors',
    'book:sessions',
  ],
  [UserRole.COLLEGE]: [
    'read:own_profile',
    'update:own_profile',
    'read:courses',
    'read:students',
    'manage:college_students',
    'read:analytics',
    'create:college_programs',
    'update:college_programs',
  ],
  [UserRole.MENTOR]: [
    'read:own_profile',
    'update:own_profile',
    'read:courses',
    'create:courses',
    'update:own_courses',
    'delete:own_courses',
    'read:students',
    'grade:assignments',
    'manage:sessions',
    'provide:mentorship',
  ],
  [UserRole.EMPLOYER]: [
    'read:own_profile',
    'update:own_profile',
    'read:students',
    'post:jobs',
    'manage:jobs',
    'view:candidates',
    'schedule:interviews',
    'read:analytics',
  ],
  [UserRole.OPS]: [
    'read:own_profile',
    'update:own_profile',
    'manage:batches',
    'manage:courses',
    'manage:bootcamps',
    'manage:training_programs',
    'read:analytics',
    'manage:enrollments',
  ],
  [UserRole.SUPER_ADMIN]: [
    'read:own_profile',
    'update:own_profile',
    'manage:all',
    'manage:users',
    'manage:roles',
    'manage:batches',
    'manage:courses',
    'manage:bootcamps',
    'manage:training_programs',
    'read:analytics',
    'manage:enrollments',
    'manage:system',
  ],
};
