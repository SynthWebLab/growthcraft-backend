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
  // Employer-specific fields (optional, only for employer role)
  employerData?: {
    companyName: string;
    contactPerson: string;
    industry: string;
    officialEmail: string;
    phone: string;
    companySize: string;
    website?: string;
    hiringNeeds?: string;
  };
  // Mentor-specific fields (optional, only for mentor role)
  mentorData?: {
    experienceYears: number;
    areaOfExpertise: string;
    currentOrganization: string;
    bio: string;
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
  employerProfile?: {
    id: string;
    companyName: string;
    industry: string;
    companySize: string;
  };
  mentorProfile?: {
    id: string;
    experienceYears: number;
    areaOfExpertise: string;
    currentOrganization: string;
  };
}
