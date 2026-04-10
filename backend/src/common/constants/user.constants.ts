export enum UserRole {
  STUDENT = 'student',
  COLLEGE = 'college',
  MENTOR = 'mentor',
  AMBASSADOR = 'ambassador',
  HIRING_PARTNER = 'hiring_partner',
}

export const USER_ROLES = Object.values(UserRole);

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.STUDENT]: 1,
  [UserRole.AMBASSADOR]: 2,
  [UserRole.MENTOR]: 3,
  [UserRole.COLLEGE]: 4,
  [UserRole.HIRING_PARTNER]: 5,
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
  [UserRole.AMBASSADOR]: [
    'read:own_profile',
    'update:own_profile',
    'read:courses',
    'promote:platform',
    'refer:students',
    'read:referrals',
    'earn:rewards',
  ],
  [UserRole.HIRING_PARTNER]: [
    'read:own_profile',
    'update:own_profile',
    'read:students',
    'post:jobs',
    'manage:jobs',
    'view:candidates',
    'schedule:interviews',
    'read:analytics',
  ],
};
