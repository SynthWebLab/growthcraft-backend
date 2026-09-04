import rateLimit from 'express-rate-limit';
import { config } from '../../config';

/**
 * Custom IP extraction helper to get correct client IP behind reverse proxies.
 * Handles single/comma-separated x-forwarded-for headers, arrays, and standard socket fallbacks.
 */
export const getClientIp = (req: any): string => {
  const xForwardedFor = req?.headers?.['x-forwarded-for'];
  if (xForwardedFor) {
    const rawIp =
      typeof xForwardedFor === 'string'
        ? xForwardedFor
        : Array.isArray(xForwardedFor) && xForwardedFor.length > 0
          ? xForwardedFor[0]
          : '';
    const ip = rawIp.split(',')[0].trim();
    if (ip) return ip;
  }
  return req?.ip || req?.socket?.remoteAddress || '127.0.0.1';
};

/**
 * Determines if rate limiting should be skipped.
 * Rate limiting is enabled by default in all environments (including development and test).
 * It is only skipped if RATE_LIMIT_ENABLED is explicitly configured to false.
 */
export const shouldSkipRateLimiting = (): boolean => {
  return !config.RATE_LIMIT_ENABLED;
};

/**
 * Factory helper to create custom rate limiters with consistent error format, standard headers, and skip rules
 */
export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
  code: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      error: {
        message: options.message,
        code: options.code,
      },
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: options.skipSuccessfulRequests ?? false,
    keyGenerator: getClientIp,
    skip: () => shouldSkipRateLimiting(),
  });
};

/**
 * General API rate limiter
 * Limits requests per IP address across general API routes
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
  skip: () => shouldSkipRateLimiting(),
});

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks while allowing successful logins
 * Configured via config.AUTH_RATE_LIMIT_MAX_REQUESTS (default: 10 requests per windowMs)
 */
export const authLimiter = rateLimit({
  windowMs: config.AUTH_RATE_LIMIT_WINDOW_MS,
  max: config.AUTH_RATE_LIMIT_MAX_REQUESTS,
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
  skip: () => shouldSkipRateLimiting(),
});

/**
 * Moderate rate limiter for password reset endpoints
 * Configured via config.PASSWORD_RESET_RATE_LIMIT_MAX_REQUESTS (default: 10 requests per windowMs)
 */
export const passwordResetLimiter = rateLimit({
  windowMs: config.PASSWORD_RESET_RATE_LIMIT_WINDOW_MS,
  max: config.PASSWORD_RESET_RATE_LIMIT_MAX_REQUESTS,
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
  skip: () => shouldSkipRateLimiting(),
});

