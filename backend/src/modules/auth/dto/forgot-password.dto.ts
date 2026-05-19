/**
 * DTO for forgot password request
 */
export interface ForgotPasswordDto {
  email: string;
}

/**
 * Response DTO for forgot password request
 */
export interface ForgotPasswordResponseDto {
  success: boolean;
  message: string;
}
