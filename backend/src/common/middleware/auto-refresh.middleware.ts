import { Request, Response, NextFunction } from 'express';
import { jwtConfig } from '@/config/jwt.config';
import { authService } from '@/modules/auth/services/auth.service';
import { logger } from '@/common/utils/logger.util';
import { config } from '@/config';

/**
 * Middleware to automatically refresh access token if it's about to expire
 * This provides a seamless user experience by rotating tokens proactively
 */
export const autoRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = req.cookies.access_token;
    const refreshToken = req.cookies.refreshToken;

    // Skip if no tokens present
    if (!accessToken || !refreshToken) {
      return next();
    }

    // Decode the access token (don't verify, just decode)
    const decoded = jwtConfig.decodeToken(accessToken);

    if (!decoded || !decoded.exp) {
      return next();
    }

    // Check if token expires in less than 5 minutes
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
    const REFRESH_THRESHOLD = 5 * 60; // 5 minutes in seconds

    if (timeUntilExpiry > 0 && timeUntilExpiry < REFRESH_THRESHOLD) {
      logger.info(`Auto-refreshing token for user: ${decoded.userId}`);

      try {
        // Extract device info
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const deviceInfo = `${userAgent.substring(0, 100)}`;

        // Rotate tokens
        const tokens = await authService.refreshToken(decoded.userId, refreshToken, deviceInfo);

        // Set new cookies
        const isProduction = config.NODE_ENV === 'production';

        res.cookie('access_token', tokens.accessToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'none' : 'lax',
          maxAge: 15 * 60 * 1000, // 15 minutes
          path: '/',
        });

        res.cookie('refreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'none' : 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/',
        });

        logger.info(`Token auto-refreshed successfully for user: ${decoded.userId}`);
      } catch (error: any) {
        // If auto-refresh fails, log but don't block the request
        // The authenticate middleware will handle expired tokens
        logger.warn(`Auto-refresh failed for user ${decoded.userId}:`, error.message);
      }
    }

    next();
  } catch (error: any) {
    // Don't block the request if auto-refresh fails
    logger.error('Auto-refresh middleware error:', error);
    next();
  }
};
