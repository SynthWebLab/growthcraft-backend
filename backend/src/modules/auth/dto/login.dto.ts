export interface LoginDto {
  email: string;
  password: string;
  role?: string;
}

export interface LoginResponseDto {
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    isEmailVerified: boolean;
    isAmbassador?: boolean;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  requiresRoleSelection?: boolean;
  availableRoles?: string[];
}
