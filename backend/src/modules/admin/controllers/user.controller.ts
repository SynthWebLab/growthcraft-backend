import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserRole } from '@/common/constants/user.constants';
import { ValidationError } from '@/common/errors/ValidationError';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { logger } from '@/common/utils/logger.util';
import { User } from '@/database/models';

const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  role: z.nativeEnum(UserRole).optional(),
  search: z.string().optional(),
});

export class UserController {
  private static instance: UserController;

  private constructor() {}

  public static getInstance(): UserController {
    if (!UserController.instance) {
      UserController.instance = new UserController();
    }
    return UserController.instance;
  }

  /**
   * List users with filters
   * GET /api/v1/admin/users
   */
  public async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryResult = listUsersQuerySchema.safeParse(req.query);

      if (!queryResult.success) {
        throw ValidationError.fromZodError(queryResult.error);
      }

      const { page = 1, limit = 10, role, search } = queryResult.data;
      const skip = (page - 1) * limit;

      // Build filter
      const filter: any = {};

      if (role) {
        filter.role = role;
      }

      if (search) {
        filter.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      // Query users
      const [users, total] = await Promise.all([
        User.find(filter)
          .select('-password -refreshTokens -emailVerificationOTP -passwordResetToken')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        User.countDocuments(filter).exec(),
      ]);

      SuccessResponseHelper.paginated(
        res,
        users,
        {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        'Users retrieved successfully'
      );
    } catch (error: any) {
      logger.error('List users controller error:', error);
      next(error);
    }
  }

  /**
   * Get user by ID
   * GET /api/v1/admin/users/:id
   */
  public async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw ValidationError.forField('id', 'Invalid user ID format');
      }

      const user = await User.findById(id)
        .select('-password -refreshTokens -emailVerificationOTP -passwordResetToken')
        .lean()
        .exec();

      if (!user) {
        throw ValidationError.forField('id', 'User not found');
      }

      SuccessResponseHelper.ok(res, { user }, 'User retrieved successfully');
    } catch (error: any) {
      logger.error('Get user by ID controller error:', error);
      next(error);
    }
  }
}

export const userController = UserController.getInstance();
