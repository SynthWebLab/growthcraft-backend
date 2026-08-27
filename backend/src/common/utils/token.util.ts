import crypto from 'crypto';

/**
 * Generate a secure random verification token
 * @returns A 64-character hexadecimal string (32 bytes)
 */
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate a 6-digit OTP
 * @returns A 6-digit numeric OTP as a string
 */
export const generateOTP = (): string => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Hash a token or OTP using SHA-256
 * @param token - The token/OTP to hash
 * @returns The hashed token as a hexadecimal string
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Validate token format (64 hex characters)
 * @param token - The token to validate
 * @returns True if valid format, false otherwise
 */
export const isValidTokenFormat = (token: string): boolean => {
  return /^[a-f0-9]{64}$/i.test(token);
};

/**
 * Check if a date has expired
 * @param expiryDate - The expiry date to check
 * @returns True if expired, false otherwise
 */
export const isExpired = (expiryDate: Date): boolean => {
  return expiryDate.getTime() < Date.now();
};

/**
 * Get time remaining until expiry in human-readable format
 * @param expiryDate - The expiry date
 * @returns Human-readable time remaining
 */
export const getTimeRemaining = (expiryDate: Date): string => {
  const now = Date.now();
  const diff = expiryDate.getTime() - now;

  if (diff <= 0) {
    return 'expired';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
};
