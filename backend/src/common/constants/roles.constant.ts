export enum UserRole {
  STUDENT = 'Student',
  MENTOR = 'Mentor',
  COLLEGE = 'College',
  AMBASSADOR = 'Ambassador',
  HIRING_PARTNER = 'HiringPartner',
  ADMIN = 'Admin',
}

export const USER_ROLES = Object.values(UserRole);

export const ROLE_HIERARCHY = {
  [UserRole.ADMIN]: 100,
  [UserRole.HIRING_PARTNER]: 80,
  [UserRole.COLLEGE]: 70,
  [UserRole.AMBASSADOR]: 60,
  [UserRole.MENTOR]: 50,
  [UserRole.STUDENT]: 10,
};

export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: [
    'user:create',
    'user:read',
    'user:update',
    'user:delete',
    'course:create',
    'course:read',
    'course:update',
    'course:delete',
    'enrollment:create',
    'enrollment:read',
    'enrollment:update',
    'enrollment:delete',
    'payment:read',
    'analytics:read',
  ],
  [UserRole.HIRING_PARTNER]: ['user:read', 'course:read', 'enrollment:read', 'analytics:read'],
  [UserRole.COLLEGE]: [
    'user:read',
    'course:create',
    'course:read',
    'course:update',
    'enrollment:read',
    'analytics:read',
  ],
  [UserRole.AMBASSADOR]: ['user:read', 'course:read', 'enrollment:create', 'enrollment:read'],
  [UserRole.MENTOR]: [
    'user:read',
    'course:create',
    'course:read',
    'course:update',
    'enrollment:read',
  ],
  [UserRole.STUDENT]: ['user:read', 'course:read', 'enrollment:create', 'enrollment:read'],
};

export default UserRole;
