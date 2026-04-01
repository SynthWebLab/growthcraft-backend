import { UserRole } from '@/common/constants/user.constants';

export interface RegisterDto {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole; // Required field
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
}
