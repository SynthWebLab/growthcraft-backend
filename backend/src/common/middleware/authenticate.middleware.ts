import { Request, Response, NextFunction } from 'express';
import { jwtConfig } from '@/config/jwt.config';
import { logger } from '@/common/utils/logger.util';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get token from httpOnly cookie
    const token = req.cookies.access_token;

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          message: 'No access token provided',
          code: 'NO_TOKEN',
        },
      });
      return;
    }

    // Verify token
    const decoded = jwtConfig.verifyAccessToken(token);

    // Attach user info to request
    (req as AuthRequest).user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error: any) {
    logger.error('Authentication error:', error.message);

    // Handle specific error types
    if (error.message === 'Access token expired') {
      res.status(401).json({
        success: false,
        error: {
          message: 'Access token has expired',
          code: 'TOKEN_EXPIRED',
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

    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
      },
    });
  }
};
