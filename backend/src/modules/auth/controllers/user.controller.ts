import { Request, Response, NextFunction } from 'express';
import { User } from '@/database/models/User.model';
import { AuthRequest } from '@/common/middleware/authenticate.middleware';
import { logger } from '@/common/utils/logger.util';

export class UserController {
  private static instance: UserController;

  private constructor() {}

  public static getInstance(): UserController {
    if (!UserController.instance) {
      UserController.instance = new UserController();
    }
    return UserController.instance;
  }

  // Get all users (Admin only)
  public async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await User.find({ isActive: true }).select('-password -refreshTokens');

      res.status(200).json({
        success: true,
        data: {
          users,
          count: users.length,
        },
      });
    } catch (error) {
      logger.error('Get all users error:', error);
      next(error);
    }
  }

  // Get user by ID (Admin or own profile)
  public async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId).select('-password -refreshTokens');

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

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      logger.error('Get user by ID error:', error);
      next(error);
    }
  }

  // Update user profile
  public async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { fullName, phone } = req.body;

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

      if (fullName) {
        user.fullName = fullName;
      }
      if (phone) {
        user.phone = phone;
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: { user },
      });
    } catch (error) {
      logger.error('Update user error:', error);
      next(error);
    }
  }

  // Delete user (Admin only)
  public async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const authReq = req as AuthRequest;

      // Prevent self-deletion
      if (authReq.user?.userId === userId) {
        res.status(400).json({
          success: false,
          error: {
            message: 'You cannot delete your own account',
            code: 'SELF_DELETE_NOT_ALLOWED',
          },
        });
        return;
      }

      const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });

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

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      logger.error('Delete user error:', error);
      next(error);
    }
  }
}

export const userController = UserController.getInstance();
