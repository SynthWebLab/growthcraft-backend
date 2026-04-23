/**
 * DTO for reset password request
 */
export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

/**
 * Response DTO for reset password request
 */
export interface ResetPasswordResponseDto {
  success: boolean;
  message: string;
}
