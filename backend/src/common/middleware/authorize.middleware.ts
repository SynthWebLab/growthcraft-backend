import { Request, Response, NextFunction } from 'express';
import { UserRole, ROLE_HIERARCHY, ROLE_PERMISSIONS } from '@/common/constants/user.constants';
import { AuthRequest } from './authenticate.middleware';
import { logger } from '@/common/utils/logger.util';

/**
 * Authorize by specific roles
 * Usage: authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])
 */
export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: 'NOT_AUTHENTICATED',
          },
        });
        return;
      }

      const userRole = authReq.user.role as UserRole;

      if (!allowedRoles.includes(userRole)) {
        logger.warn(
          `Unauthorized access attempt by user ${authReq.user.userId} with role ${userRole}`
        );
        res.status(403).json({
          success: false,
          error: {
            message: 'You do not have permission to access this resource',
            code: 'FORBIDDEN',
          },
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Authorization failed',
          code: 'AUTH_ERROR',
        },
      });
    }
  };
};

/**
 * Authorize by minimum role level
 * Usage: authorizeMinRole(UserRole.INSTRUCTOR)
 * This allows INSTRUCTOR, ADMIN, and SUPER_ADMIN
 */
export const authorizeMinRole = (minRole: UserRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: 'NOT_AUTHENTICATED',
          },
        });
        return;
      }

      const userRole = authReq.user.role as UserRole;
      const userRoleLevel = ROLE_HIERARCHY[userRole];
      const minRoleLevel = ROLE_HIERARCHY[minRole];

      if (userRoleLevel < minRoleLevel) {
        logger.warn(
          `Unauthorized access attempt by user ${authReq.user.userId} with role ${userRole}`
        );
        res.status(403).json({
          success: false,
          error: {
            message: 'You do not have permission to access this resource',
            code: 'FORBIDDEN',
          },
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Authorization failed',
          code: 'AUTH_ERROR',
        },
      });
    }
  };
};

/**
 * Authorize by specific permission
 * Usage: authorizePermission('create:courses')
 */
export const authorizePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: 'NOT_AUTHENTICATED',
          },
        });
        return;
      }

      const userRole = authReq.user.role as UserRole;
      const userPermissions = ROLE_PERMISSIONS[userRole] || [];

      if (!userPermissions.includes(permission)) {
        logger.warn(
          `Unauthorized access attempt by user ${authReq.user.userId} - missing permission: ${permission}`
        );
        res.status(403).json({
          success: false,
          error: {
            message: 'You do not have permission to perform this action',
            code: 'FORBIDDEN',
          },
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Authorization failed',
          code: 'AUTH_ERROR',
        },
      });
    }
  };
};

/**
 * Check if user owns the resource
 * Usage: authorizeOwnership('userId') - checks if req.params.userId matches authenticated user
 */
export const authorizeOwnership = (paramName: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: 'NOT_AUTHENTICATED',
          },
        });
        return;
      }

      const resourceUserId = req.params[paramName] || req.body[paramName];
      const authenticatedUserId = authReq.user.userId;

      // Allow if user owns the resource OR is admin/super_admin
      const userRole = authReq.user.role as UserRole;
      const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

      if (resourceUserId !== authenticatedUserId && !isAdmin) {
        logger.warn(`Unauthorized ownership access attempt by user ${authenticatedUserId}`);
        res.status(403).json({
          success: false,
          error: {
            message: 'You can only access your own resources',
            code: 'FORBIDDEN',
          },
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Authorization failed',
          code: 'AUTH_ERROR',
        },
      });
    }
  };
};
