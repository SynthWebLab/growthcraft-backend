/**
 * DTO for reset password request
 */
export interface ResetPasswordDto {
  email: string;
  otp: string;
  newPassword: string;
}

/**
 * Response DTO for reset password request
 */
export interface ResetPasswordResponseDto {
  success: boolean;
  message: string;
}
