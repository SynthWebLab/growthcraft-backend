/**
 * DTO for change password request (authenticated users)
 */
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string; // Optional, can be validated on frontend
}

/**
 * Response DTO for change password request
 */
export interface ChangePasswordResponseDto {
  success: boolean;
  message: string;
}
