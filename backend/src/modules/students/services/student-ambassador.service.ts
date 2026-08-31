import mongoose from 'mongoose';
import { StudentProfile, IStudentProfile } from '@/database/models/StudentProfile.model';
import { Referral } from '@/database/models/Referral.model';
import { User } from '@/database/models/User.model';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { ValidationError } from '@/common/errors/ValidationError';
import { queueInviteEmail } from '@/jobs/email-delivery.job';
import { logger } from '@/common/utils/logger.util';
import { config } from '@/config';

export class StudentAmbassadorService {
  private static instance: StudentAmbassadorService;

  private constructor() {}

  public static getInstance(): StudentAmbassadorService {
    if (!StudentAmbassadorService.instance) {
      StudentAmbassadorService.instance = new StudentAmbassadorService();
    }
    return StudentAmbassadorService.instance;
  }

  /**
   * Promote the student to ambassador status (self-activation).
   */
  public async activateAmbassador(studentUserId: string): Promise<IStudentProfile> {
    try {
      const profile = await StudentProfile.findOne({ userId: studentUserId }).exec();
      if (!profile) {
        throw new NotFoundError('Student profile not found');
      }

      if (profile.isAmbassador) {
        return profile;
      }

      profile.isAmbassador = true;
      profile.ambassadorActivatedBy = 'self';
      profile.ambassadorActivatedAt = new Date();

      if (!profile.referralCode) {
        const crypto = await import('crypto');
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

      await profile.save();
      logger.info(`Student ${studentUserId} self-activated ambassador mode with code ${profile.referralCode}`);
      return profile;
    } catch (error: any) {
      logger.error('Activate student ambassador error:', error);
      throw error;
    }
  }

  /**
   * Get student ambassador dashboard stats and recent referrals.
   */
  public async getAmbassadorDashboard(studentUserId: string): Promise<any> {
    try {
      const profile = await StudentProfile.findOne({ userId: studentUserId }).exec();
      if (!profile || !profile.isAmbassador) {
        throw new ValidationError('User is not an active ambassador');
      }

      const referrals = await Referral.find({ ambassadorUserId: studentUserId }).exec();
      const recentReferrals = await Referral.find({ ambassadorUserId: studentUserId })
        .sort({ createdAt: -1 })
        .limit(5)
        .exec();

      const frontendUrl = config.FRONTEND_URL;
      const referralLink = `${frontendUrl}/register/student?ref=${profile.referralCode}`;

      const totalReferrals = referrals.length;
      const totalConversions = referrals.filter((r) => r.status === 'enrolled').length;

      return {
        referralCode: profile.referralCode,
        referralLink,
        totalReferrals,
        totalConversions,
        pendingPayout: profile.pendingReferralPayout || 0,
        recentReferrals,
      };
    } catch (error: any) {
      logger.error('Get student ambassador dashboard error:', error);
      throw error;
    }
  }

  /**
   * Get paginated referral ledger for the student ambassador.
   */
  public async getAmbassadorReferrals(
    studentUserId: string,
    filters?: { status?: string; page?: number; limit?: number }
  ): Promise<{ referrals: any[]; total: number; page: number; limit: number }> {
    try {
      const profile = await StudentProfile.findOne({ userId: studentUserId }).exec();
      if (!profile || !profile.isAmbassador) {
        throw new ValidationError('User is not an active ambassador');
      }

      const query: any = { ambassadorUserId: studentUserId };
      if (filters?.status) {
        query.status = filters.status;
      }

      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const referrals = await Referral.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      const total = await Referral.countDocuments(query);

      return { referrals, total, page, limit };
    } catch (error: any) {
      logger.error('Get student ambassador referrals error:', error);
      throw error;
    }
  }

  /**
   * Create referrals (invite friends) and return links.
   */
  public async inviteFriends(
    studentUserId: string,
    payload: { emails: string[]; programType?: string; programId?: string }
  ): Promise<{ referrals: any[] }> {
    try {
      const profile = await StudentProfile.findOne({ userId: studentUserId }).exec();
      if (!profile || !profile.isAmbassador) {
        throw new ValidationError('User is not an active ambassador');
      }

      // Fetch inviter's user name
      const ambassadorUser = await User.findById(profile.userId).select('fullName').lean().exec();
      const senderName = ambassadorUser ? ambassadorUser.fullName : 'Your friend';

      const frontendUrl = config.FRONTEND_URL;
      const invites: any[] = [];

      for (const email of payload.emails) {
        const normalizedEmail = email.toLowerCase().trim();
        if (!normalizedEmail) {
          continue;
        }

        // Check if the user already has an account under any role in GrowthCraft
        const userExists = await User.findOne({ email: normalizedEmail }).select('_id').lean().exec();
        if (userExists) {
          throw new ValidationError(`The email "${normalizedEmail}" is already registered on GrowthCraft.`);
        }

        // Check if already invited by this ambassador
        let referral = await Referral.findOne({
          ambassadorUserId: studentUserId,
          referredEmail: normalizedEmail,
        }).exec();

        let isNewReferral = false;
        if (!referral) {
          let inviteLink = `${frontendUrl}/register/student?ref=${profile.referralCode}`;
          if (payload.programId) {
            inviteLink += `&program=${payload.programId}`;
          }

          let enrollmentType: 'course' | 'event' | 'training-program' | null = null;
          if (payload.programType) {
            const pType = payload.programType.toLowerCase();
            if (pType === 'course') enrollmentType = 'course';
            else if (pType === 'trainingprogram' || pType === 'training-program') enrollmentType = 'training-program';
            else if (pType === 'bootcamp' || pType === 'workshop' || pType === 'hackathon' || pType === 'event') enrollmentType = 'event';
          }

          referral = await Referral.create({
            ambassadorUserId: studentUserId,
            referralCode: profile.referralCode,
            referredEmail: normalizedEmail,
            status: 'sent',
            inviteLink,
            enrollmentType,
          });
          isNewReferral = true;
        }

        if (isNewReferral) {
          // Resolve program name if recommended
          let programName: string | undefined;
          if (payload.programId) {
            try {
              if (payload.programType === 'Course') {
                const c = await mongoose.model('Course').findById(payload.programId).select('title').lean().exec() as any;
                if (c) programName = c.title;
              } else if (payload.programType === 'TrainingProgram') {
                const p = await mongoose.model('TrainingProgram').findById(payload.programId).select('title').lean().exec() as any;
                if (p) programName = p.title;
              } else if (payload.programType === 'Bootcamp' || payload.programType === 'Workshop' || payload.programType === 'Hackathon') {
                const b = await mongoose.model('Bootcamp').findById(payload.programId).select('title').lean().exec() as any;
                if (b) programName = b.title;
              }
            } catch (err) {
              logger.warn(`Could not resolve recommended program name: ${err}`);
            }
          }

          // Enqueue invite email
          void queueInviteEmail({
            to: normalizedEmail,
            inviteLink: referral.inviteLink || '',
            senderName,
            programName,
          });
        }

        invites.push(referral);
      }

      return { referrals: invites };
    } catch (error: any) {
      logger.error('Invite friends student ambassador error:', error);
      throw error;
    }
  }

  /**
   * Get earnings logs and summaries.
   */
  public async getEarnings(studentUserId: string): Promise<any> {
    try {
      const profile = await StudentProfile.findOne({ userId: studentUserId }).exec();
      if (!profile || !profile.isAmbassador) {
        throw new ValidationError('User is not an active ambassador');
      }

      const referrals = await Referral.find({ ambassadorUserId: studentUserId, status: 'enrolled' }).exec();

      const totalEarnings = profile.referralEarnings || 0;
      const pendingPayout = profile.pendingReferralPayout || 0;
      const paidOut = totalEarnings - pendingPayout;

      // Group earnings by month using aggregation or javascript reduce
      const earningsByMonthMap: Record<string, number> = {};
      referrals.forEach((ref) => {
        if (ref.commissionAmount > 0) {
          const date = new Date(ref.updatedAt || ref.createdAt);
          const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
          earningsByMonthMap[monthKey] = (earningsByMonthMap[monthKey] || 0) + ref.commissionAmount;
        }
      });

      const earningsByMonth = Object.keys(earningsByMonthMap).map((month) => ({
        month,
        amount: earningsByMonthMap[month],
      }));

      return {
        totalEarnings,
        pendingPayout,
        paidOut,
        earningsByMonth,
      };
    } catch (error: any) {
      logger.error('Get earnings student ambassador error:', error);
      throw error;
    }
  }
}

export const studentAmbassadorService = StudentAmbassadorService.getInstance();
