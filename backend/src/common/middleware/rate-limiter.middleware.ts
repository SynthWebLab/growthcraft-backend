import rateLimit from 'express-rate-limit';
import { config } from '../../config';

/**
 * Custom IP extraction helper to get correct client IP behind reverse proxies
 */
const getClientIp = (req: any): string => {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    const ip = typeof xForwardedFor === 'string' ? xForwardedFor.split(',')[0].trim() : xForwardedFor[0].trim();
    if (ip) return ip;
  }
  return req.ip || req.socket.remoteAddress || '';
};

/**
 * General API rate limiter
 * Limits requests per IP address
 */
export const apiLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: getClientIp,
  skip: (req) => {
    // Skip rate limiting in development and test environments
    return config.NODE_ENV === 'development' || config.NODE_ENV === 'test';
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: getClientIp,
  skip: (req) => {
    return config.NODE_ENV === 'development' || config.NODE_ENV === 'test';
  },
});

/**
 * Moderate rate limiter for password reset endpoints
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 3 requests per hour
  message: {
    success: false,
    error: {
      message: 'Too many password reset attempts, please try again later',
      code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  skip: (req) => {
    return config.NODE_ENV === 'development' || config.NODE_ENV === 'test';
  },
});
