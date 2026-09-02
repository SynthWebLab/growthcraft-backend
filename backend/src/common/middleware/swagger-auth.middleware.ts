import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { config } from '@/config';
import { jwtConfig } from '@/config/jwt.config';
import { logger } from '@/common/utils/logger.util';
import { UserRole } from '@/common/constants/user.constants';
import { redisTokenService } from '@/modules/auth/services/redis-token.service';
import { asyncHandler } from '../utils/async-handler.util';

/**
 * Checks whether authentication is required to access Swagger documentation.
 *
 * Rules:
 * 1. In production (`NODE_ENV === 'production'`), authentication is ALWAYS mandatory
 *    to prevent accidental public exposure of the API attack surface.
 * 2. In non-production environments, authentication is enforced if `SWAGGER_REQUIRE_AUTH`
 *    is enabled OR if credentials (`SWAGGER_PASSWORD`) are configured.
 * 3. In development/test without credentials configured, open access is allowed for developer convenience.
 */
export const isSwaggerAuthRequired = (): boolean => {
  if (config.NODE_ENV === 'production') {
    return true;
  }
  return Boolean(config.SWAGGER_REQUIRE_AUTH || config.SWAGGER_PASSWORD);
};

/**
 * Timing-safe string comparison using SHA-256 digests.
 * Hashing ensures both inputs are always exactly 32 bytes, preventing both
 * character-by-character timing leaks and length-disclosure leaks.
 */
export const safeCompare = (a: string, b: string): boolean => {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
};

/**
 * Parses and verifies HTTP Basic Auth credentials against configured SWAGGER_USER and SWAGGER_PASSWORD.
 */
const verifyBasicAuth = (req: Request): boolean => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  // SWAGGER_PASSWORD must be configured and non-empty for Basic Auth to succeed
  if (!config.SWAGGER_PASSWORD || config.SWAGGER_PASSWORD.trim() === '') {
    return false;
  }

  try {
    const base64Credentials = authHeader.substring(6).trim();
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const colonIndex = credentials.indexOf(':');
    if (colonIndex === -1) {
      return false;
    }

    const username = credentials.substring(0, colonIndex);
    const password = credentials.substring(colonIndex + 1);

    const expectedUser = config.SWAGGER_USER || 'admin';
    const expectedPassword = config.SWAGGER_PASSWORD;

    const userMatches = safeCompare(username, expectedUser);
    const passwordMatches = safeCompare(password, expectedPassword);

    return userMatches && passwordMatches;
  } catch (error) {
    logger.debug('Error parsing Basic Auth credentials for Swagger', error);
    return false;
  }
};

/**
 * Checks if the request contains a valid JWT session for an administrative user (SuperAdmin or Ops).
 */
const verifyAdminJwt = async (req: Request): Promise<boolean> => {
  // Extract token from HTTP-only cookie, Authorization Bearer header, or custom header
  let token: string | null = null;
  if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  } else if (typeof req.headers['x-access-token'] === 'string') {
    token = req.headers['x-access-token'];
  }

  if (!token) {
    return false;
  }

  try {
    const decoded = jwtConfig.verifyAccessToken(token);
    const role = decoded.role as UserRole;

    const isPrivileged = role === UserRole.SUPER_ADMIN || role === UserRole.OPS;
    if (!isPrivileged) {
      return false;
    }

    // Check if token is blacklisted in Redis
    const isBlacklisted = await redisTokenService.isAccessTokenBlacklisted(token);
    if (isBlacklisted) {
      return false;
    }

    // Attach user information to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role,
    };

    return true;
  } catch (error) {
    logger.debug('Swagger JWT verification failed', error);
    return false;
  }
};

/**
 * Swagger Authentication Middleware
 *
 * Protects Swagger UI and OpenAPI JSON endpoints against accidental production exposure.
 *
 * Supports two authentication paths:
 * 1. HTTP Basic Auth: native browser modal prompt via WWW-Authenticate header (works with curl & browsers).
 * 2. Admin JWT: existing session cookies or Bearer tokens for SUPER_ADMIN or OPS roles.
 *
 * In production:
 * - Access is strictly denied if unauthenticated, even if SWAGGER_ENABLED=true.
 * - If SWAGGER_PASSWORD is not configured in production, Basic Auth cannot be used, and a security warning is logged.
 */
export const swaggerAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // 1. Check if authentication is required in the current environment
  if (!isSwaggerAuthRequired()) {
    return next();
  }

  // 2. Attempt HTTP Basic Authentication
  if (verifyBasicAuth(req)) {
    logger.debug('Swagger accessed via valid Basic Auth');
    return next();
  }

  // 3. Attempt Admin/Ops JWT Authentication
  try {
    const isAuthorizedAdmin = await verifyAdminJwt(req);
    if (isAuthorizedAdmin) {
      logger.debug(`Swagger accessed via valid Admin session (${req.user?.role})`);
      return next();
    }
  } catch (err) {
    logger.error('Error verifying admin token for Swagger access', err);
  }

  // 4. Production warning if credentials are not configured
  if (
    config.NODE_ENV === 'production' &&
    (!config.SWAGGER_PASSWORD || config.SWAGGER_PASSWORD.trim() === '')
  ) {
    logger.warn(
      '[SECURITY ALERT] Swagger documentation was requested in production, but SWAGGER_PASSWORD is not configured. Access denied.'
    );
  }

  // 5. Deny access and send Basic Auth challenge
  res.set('WWW-Authenticate', 'Basic realm="GrowthCraft API Documentation", charset="UTF-8"');
  res.status(401).json({
    success: false,
    error: {
      message: 'Authentication required to access API documentation.',
      code: 'SWAGGER_AUTH_REQUIRED',
    },
  });
};

/**
 * Express-compatible void-returning wrapper to comply with strict ESLint / TypeScript rules.
 */
export const swaggerAuthGuard = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  void swaggerAuth(req, res, next);
};

