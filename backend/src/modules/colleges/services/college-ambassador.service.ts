import crypto from 'crypto';
import { CollegeProfile } from '@/database/models/CollegeProfile.model';
import { StudentProfile, IStudentProfile } from '@/database/models/StudentProfile.model';
import { User } from '@/database/models/User.model';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { ValidationError } from '@/common/errors/ValidationError';
import { logger } from '@/common/utils/logger.util';
import { notificationService } from '@/modules/notifications/services/notification.service';

export class CollegeAmbassadorService {
  private static instance: CollegeAmbassadorService;

  private constructor() {}

  public static getInstance(): CollegeAmbassadorService {
    if (!CollegeAmbassadorService.instance) {
      CollegeAmbassadorService.instance = new CollegeAmbassadorService();
    }
    return CollegeAmbassadorService.instance;
  }

  /**
   * POST /api/v1/colleges/ambassadors
   * Promotes student(s) to ambassador status.
   */
  public async activateAmbassadors(
    collegeUserId: string,
    studentUserIds: string[]
  ): Promise<{ activated: number }> {
    try {
      const college = await CollegeProfile.findOne({ userId: collegeUserId }).exec();
      if (!college) {
        throw new NotFoundError('College profile not found');
      }

      const registeredStrings = new Set((college.registeredStudents || []).map((id) => String(id)));
      const belongsToCollege = studentUserIds.filter((id) => registeredStrings.has(id));

      if (belongsToCollege.length === 0) {
        return { activated: 0 };
      }

      let activated = 0;
      for (const studentId of belongsToCollege) {
        const profile = await StudentProfile.findOne({ userId: studentId }).exec();
        if (profile) {
          if (!profile.isAmbassador) {
            profile.isAmbassador = true;
            profile.ambassadorActivatedBy = 'college';
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
            await profile.save();
            activated++;

            // Real-time socket & persistent notification push to the student
            void notificationService.createNotification(studentId, 'ambassador.activated', {
              collegeName: college.collegeName,
              referralCode: profile.referralCode,
              message: `Congratulations! Your campus ${college.collegeName} has activated you as a Campus Ambassador.`,
            });
          }
        }
      }

      return { activated };
    } catch (error: any) {
      logger.error('Activate college ambassadors error:', error);
      throw error;
    }
  }

  /**
   * GET /api/v1/colleges/ambassadors
   * Lists the ambassadors registered under this college.
   */
  public async getAmbassadors(collegeUserId: string): Promise<any[]> {
    try {
      const college = await CollegeProfile.findOne({ userId: collegeUserId }).exec();
      if (!college) {
        throw new NotFoundError('College profile not found');
      }

      const profiles = await StudentProfile.find({
        userId: { $in: college.registeredStudents || [] },
        isAmbassador: true,
      }).exec();

      const userIds = profiles.map((p) => p.userId);
      const users = await User.find({ _id: { $in: userIds } }).select('fullName email').lean();
      const userMap = new Map(users.map((u) => [String(u._id), u]));

      return profiles.map((p) => {
        const user = userMap.get(String(p.userId));
        return {
          studentUserId: p.userId,
          name: user?.fullName || 'Unknown Student',
          email: user?.email || '',
          referralCode: p.referralCode,
          totalReferrals: p.totalReferrals || 0,
          totalConversions: p.totalConversions || 0,
          referralEarnings: p.referralEarnings || 0,
          pendingReferralPayout: p.pendingReferralPayout || 0,
          activatedAt: p.ambassadorActivatedAt,
        };
      });
    } catch (error: any) {
      logger.error('Get college ambassadors error:', error);
      throw error;
    }
  }

  /**
   * DELETE /api/v1/colleges/ambassadors/:studentUserId
   * Deactivates student's ambassador status.
   */
  public async deactivateAmbassador(
    collegeUserId: string,
    studentUserId: string
  ): Promise<IStudentProfile> {
    try {
      const college = await CollegeProfile.findOne({ userId: collegeUserId }).exec();
      if (!college) {
        throw new NotFoundError('College profile not found');
      }

      const profile = await StudentProfile.findOne({ userId: studentUserId }).exec();
      if (!profile) {
        throw new NotFoundError('Student profile not found');
      }

      if (profile.collegeName !== college.collegeName) {
        throw new ValidationError('Student does not belong to your college');
      }

      profile.isAmbassador = false;
      await profile.save();

      // Real-time socket & persistent notification push to the student
      void notificationService.createNotification(studentUserId, 'ambassador.deactivated', {
        collegeName: college.collegeName,
        message: `Your Campus Ambassador status has been updated by ${college.collegeName}.`,
      });

      logger.info(
        `College ${college.collegeName} deactivated student ${studentUserId} ambassador status`
      );
      return profile;
    } catch (error: any) {
      logger.error('Deactivate college ambassador error:', error);
      throw error;
    }
  }
}

export const collegeAmbassadorService = CollegeAmbassadorService.getInstance();
