import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserRole } from '@/common/constants/user.constants';
import { ValidationError } from '@/common/errors/ValidationError';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { logger } from '@/common/utils/logger.util';
import { User, StudentProfile } from '@/database/models';

const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  role: z.string().optional(), // Accept any string, validate manually
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
        const normalizedRole = role.toLowerCase();
        if (normalizedRole === 'ambassador') {
          // Find all student profiles who are ambassadors
          const ambassadorProfiles = await StudentProfile.find({ isAmbassador: true }).select('userId').lean().exec();
          const ambassadorUserIds = ambassadorProfiles.map(p => p.userId);
          filter._id = { $in: ambassadorUserIds };
        } else if (normalizedRole === 'admin') {
          // Find all administrators (super_admin and ops)
          filter.role = { $in: [UserRole.SUPER_ADMIN, UserRole.OPS] };
        } else {
          // Support both uppercase and lowercase role values
          filter.role = { $regex: new RegExp(`^${normalizedRole}$`, 'i') };
        }
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

      // Populate isAmbassador flag for student users
      const studentUserIds = users.filter(u => u.role === UserRole.STUDENT).map(u => u._id);
      const ambassadorProfilesMap = new Map();
      if (studentUserIds.length > 0) {
        const studentProfiles = await StudentProfile.find({
          userId: { $in: studentUserIds }
        }).select('userId isAmbassador').lean().exec();
        
        studentProfiles.forEach(p => {
          ambassadorProfilesMap.set(String(p.userId), p.isAmbassador);
        });
      }

      const usersWithAmbassadorFlag = users.map(u => ({
        ...u,
        isAmbassador: u.role === UserRole.STUDENT ? !!ambassadorProfilesMap.get(String(u._id)) : false
      }));

      SuccessResponseHelper.paginated(
        res,
        usersWithAmbassadorFlag,
        {
          page,
          limit,
          total,
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
