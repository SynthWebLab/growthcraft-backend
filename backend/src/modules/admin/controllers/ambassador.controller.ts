import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '@/common/errors/ValidationError';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { logger } from '@/common/utils/logger.util';
import { User, StudentProfile, Referral } from '@/database/models';
import crypto from 'crypto';

export class AmbassadorController {
  private static instance: AmbassadorController;

  private constructor() {}

  public static getInstance(): AmbassadorController {
    if (!AmbassadorController.instance) {
      AmbassadorController.instance = new AmbassadorController();
    }
    return AmbassadorController.instance;
  }

  /**
   * GET /api/v1/admin/ambassadors
   * List all ambassadors with statistics.
   */
  public async listAmbassadors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const skip = (page - 1) * limit;

      const query: any = { isAmbassador: true };

      const [profiles, total] = await Promise.all([
        StudentProfile.find(query)
          .sort({ ambassadorActivatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        StudentProfile.countDocuments(query).exec(),
      ]);

      const userIds = profiles.map((p) => p.userId);
      const users = await User.find({ _id: { $in: userIds } }).select('fullName email phone').lean();
      const userMap = new Map(users.map((u) => [String(u._id), u]));

      const records = profiles.map((p) => {
        const user = userMap.get(String(p.userId));
        return {
          userId: p.userId,
          fullName: user?.fullName || 'Unknown',
          email: user?.email || '',
          phone: user?.phone || '',
          referralCode: p.referralCode,
          totalReferrals: p.totalReferrals || 0,
          totalConversions: p.totalConversions || 0,
          referralEarnings: p.referralEarnings || 0,
          pendingReferralPayout: p.pendingReferralPayout || 0,
          activatedAt: p.ambassadorActivatedAt,
          activatedBy: p.ambassadorActivatedBy,
        };
      });

      SuccessResponseHelper.paginated(res, records, { page, limit, total }, 'Ambassadors retrieved successfully');
    } catch (error: any) {
      logger.error('List ambassadors admin error:', error);
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/ambassadors/:userId/payout
   * Confirms/records payout for an ambassador.
   */
  public async confirmPayout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ValidationError('Invalid userId format');
      }

      const profile = await StudentProfile.findOne({ userId }).exec();
      if (!profile) {
        throw new ValidationError('Student profile not found');
      }

      const payoutAmount = profile.pendingReferralPayout || 0;
      if (payoutAmount <= 0) {
        throw new ValidationError('No pending payout amount for this ambassador');
      }

      // Start transaction or write sequentially
      profile.pendingReferralPayout = 0;
      await profile.save();

      // Mark all commissionPaid = true for enrolled referrals of this ambassador
      await Referral.updateMany(
        { ambassadorUserId: userId, status: 'enrolled', commissionPaid: false },
        { $set: { commissionPaid: true } }
      ).exec();

      logger.info(`Admin successfully processed payout of INR ${payoutAmount} for ambassador ${userId}`);
      SuccessResponseHelper.ok(res, { payoutAmount }, `Successfully recorded payout of INR ${payoutAmount}`);
    } catch (error: any) {
      logger.error('Record ambassador payout error:', error);
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/ambassadors/:userId/activate
   * Admin promotes or demotes a student's ambassador status.
   */
  public async toggleActivation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { isAmbassador } = req.body;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ValidationError('Invalid userId format');
      }
      if (isAmbassador === undefined || typeof isAmbassador !== 'boolean') {
        throw new ValidationError('isAmbassador boolean is required in request body');
      }

      const profile = await StudentProfile.findOne({ userId }).exec();
      if (!profile) {
        throw new ValidationError('Student profile not found');
      }

      profile.isAmbassador = isAmbassador;
      if (isAmbassador) {
        profile.ambassadorActivatedBy = 'admin';
        profile.ambassadorActivatedAt = new Date();
        if (!profile.referralCode) {
          let isUnique = false;
          let code = '';
          while (!isUnique) {
            code = 'GC-' + crypto.randomBytes(3).toString('hex').toUpperCase();
            const existing = await StudentProfile.findOne({ referralCode: code }).exec();
            if (!existing) {
              isUnique = true;
            }
          }
          profile.referralCode = code;
        }
      }

      await profile.save();
      logger.info(`Admin toggled student ${userId} isAmbassador status to ${isAmbassador}`);
      SuccessResponseHelper.ok(res, { profile }, `Successfully updated ambassador activation status to ${isAmbassador}`);
    } catch (error: any) {
      logger.error('Toggle ambassador activation error:', error);
      next(error);
    }
  }
}

export const ambassadorController = AmbassadorController.getInstance();
