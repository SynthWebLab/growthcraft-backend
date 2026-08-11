/// <reference path="../types/express.d.ts" />

import { Request, Response, NextFunction } from 'express';
import { jwtConfig } from '@/config/jwt.config';
import { logger } from '@/common/utils/logger.util';
import { UserRole } from '@/common/constants/user.constants';
import { redisTokenService } from '@/modules/auth/services/redis-token.service';

/**
 * Extract JWT token from request
 * Supports multiple token sources in order of priority:
 * 1. HTTP-only cookie (primary method - most secure)
 * 2. Authorization header with Bearer token (for API clients)
 * 3. Custom x-access-token header (legacy support)
 */
const extractToken = (req: Request): string | null => {
  // Priority 1: HTTP-only cookie (recommended for web apps)
  if (req.cookies?.access_token) {
    return req.cookies.access_token;
  }

  // Priority 2: Authorization header with Bearer token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  // Priority 3: Custom header (legacy support)
  const customHeader = req.headers['x-access-token'];
  if (customHeader && typeof customHeader === 'string') {
    return customHeader;
  }

  return null;
};

/**
 * Authentication middleware - Verifies JWT token and attaches user info to request
 * 
 * This middleware:
 * - Extracts JWT token from cookies or Authorization header
 * - Verifies token signature and expiration
 * - Attaches decoded user information to req.user
 * - Returns 401 for missing, invalid, or expired tokens
 * 
 * Usage:
 * - Apply to protected routes that require authentication
 * - User info will be available in req.user after this middleware
 * - Combine with authorize() middleware for role-based access control
 * 
 * @example
 * router.get('/profile', authenticate, (req, res) => {
 *   const userId = req.user.userId;
 *   // ... handle request
 * });
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract token from multiple possible sources
    const token = extractToken(req);

    if (!token) {
      console.log("[Authenticate Middleware] Missing access token. Cookies in request:", req.cookies);
      // Check if refresh token is present, in which case the access token is merely missing/expired
      if (req.cookies?.refreshToken) {
        logger.debug('Authentication failed: Access token missing but refresh token present');
        res.status(401).json({
          success: false,
          error: {
            message: 'Access token has expired or is missing. Please refresh.',
            code: 'TOKEN_EXPIRED',
          },
        });
        return;
      }

      logger.debug('Authentication failed: No token provided');
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required. Please provide a valid access token.',
          code: 'NO_TOKEN',
        },
      });
      return;
    }

    // Verify and decode token
    const decoded = jwtConfig.verifyAccessToken(token);

    // Validate decoded payload structure
    if (!decoded.userId || !decoded.email || !decoded.role) {
      logger.warn('Authentication failed: Invalid token payload structure');
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token payload',
          code: 'INVALID_TOKEN_PAYLOAD',
        },
      });
      return;
    }

    // Check if this token has been blacklisted (i.e. user already logged out)
    const isBlacklisted = await redisTokenService.isAccessTokenBlacklisted(token);
    if (isBlacklisted) {
      logger.warn(`Blacklisted access token used by user ${decoded.userId}`);
      res.status(401).json({
        success: false,
        error: {
          message: 'Token has been revoked. Please login again.',
          code: 'TOKEN_REVOKED',
        },
      });
      return;
    }

    // Attach user info to request for downstream middleware/controllers
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role as UserRole,
    };

    logger.debug(`User authenticated: ${decoded.userId} (${decoded.role})`);
    next();
  } catch (error: any) {
    logger.error('Authentication error:', {
      message: error.message,
      name: error.name,
    });

    // Handle specific JWT error types
    if (error.message === 'Access token expired') {
      res.status(401).json({
        success: false,
        error: {
          message: 'Access token has expired. Please refresh your token.',
          code: 'TOKEN_EXPIRED',
          hint: 'Use the /auth/refresh endpoint to get a new access token',
        },
      });
      return;
    }

    if (error.message === 'Invalid access token format') {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token format',
          code: 'INVALID_TOKEN_FORMAT',
        },
      });
      return;
    }

    if (error.message === 'Invalid access token') {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid access token',
          code: 'INVALID_TOKEN',
        },
      });
      return;
    }

    // Generic authentication failure
    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication failed. Please login again.',
        code: 'AUTH_FAILED',
      },
    });
  }
};

/**
 * Optional authentication middleware - Does not fail if no token provided
 * Useful for endpoints that have different behavior for authenticated vs anonymous users
 * 
 * @example
 * router.get('/posts', optionalAuthenticate, (req, res) => {
 *   if (req.user) {
 *     // Show personalized content
 *   } else {
 *     // Show public content
 *   }
 * });
 */
export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = extractToken(req);

    if (!token) {
      // No token provided - continue without authentication
      next();
      return;
    }

    // Try to verify token
    const decoded = jwtConfig.verifyAccessToken(token);

    if (decoded.userId && decoded.email && decoded.role) {
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role as UserRole,
      };
      logger.debug(`Optional auth: User authenticated: ${decoded.userId}`);
    }

    next();
  } catch (error: any) {
    // Token provided but invalid - continue without authentication
    logger.debug('Optional auth: Invalid token provided, continuing without auth');
    next();
  }
};
