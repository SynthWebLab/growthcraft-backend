export enum UserRole {
  STUDENT = 'student',
  MENTOR = 'mentor',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export const USER_ROLES = Object.values(UserRole);

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.STUDENT]: 1,
  [UserRole.MENTOR]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.SUPER_ADMIN]: 4,
};

// Permissions for each role
export const ROLE_PERMISSIONS = {
  [UserRole.STUDENT]: [
    'read:own_profile',
    'update:own_profile',
    'read:courses',
    'enroll:courses',
    'submit:assignments',
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
  ],
  [UserRole.ADMIN]: [
    'read:own_profile',
    'update:own_profile',
    'read:courses',
    'create:courses',
    'update:courses',
    'delete:courses',
    'read:users',
    'create:users',
    'update:users',
    'read:analytics',
  ],
  [UserRole.SUPER_ADMIN]: [
    'read:own_profile',
    'update:own_profile',
    'read:courses',
    'create:courses',
    'update:courses',
    'delete:courses',
    'read:users',
    'create:users',
    'update:users',
    'delete:users',
    'read:analytics',
    'manage:system',
    'manage:roles',
  ],
};
