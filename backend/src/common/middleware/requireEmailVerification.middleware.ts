import { Request, Response, NextFunction } from 'express';
import { User } from '@/database/models/User.model';
import { logger } from '@/common/utils/logger.util';

/**
 * Middleware to ensure user has verified their email
 * Use this on routes that require email verification
 */
export const requireEmailVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
      });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        },
      });
      return;
    }

    if (!user.isEmailVerified) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Email verification required. Please verify your email to access this feature.',
          code: 'EMAIL_NOT_VERIFIED',
        },
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Email verification middleware error:', error);
    next(error);
  }
};
