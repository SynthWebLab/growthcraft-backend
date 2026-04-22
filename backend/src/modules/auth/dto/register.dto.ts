import { UserRole } from '@/common/constants/user.constants';

export interface RegisterDto {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole; // Required field
  // College-specific fields (optional, only for college role)
  collegeData?: {
    institutionName: string;
    contactPerson: string;
    designation: string;
    officialEmail: string;
    phone: string;
    city: string;
    state: string;
    website?: string;
  };
}

export interface RegisterResponseDto {
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    isEmailVerified: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  collegeProfile?: {
    id: string;
    collegeName: string;
    city: string;
    state: string;
  };
}
