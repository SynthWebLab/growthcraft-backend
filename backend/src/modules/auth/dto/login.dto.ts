export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
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
