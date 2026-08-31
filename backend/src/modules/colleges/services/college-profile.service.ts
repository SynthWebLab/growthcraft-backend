import mongoose from 'mongoose';
import { CollegeProfile, ICollegeProfile } from '@/database/models/CollegeProfile.model';
import { StudentProfile } from '@/database/models/StudentProfile.model';
import { SupportTicket, ISupportTicket } from '@/database/models/SupportTicket.model';
import { User } from '@/database/models/User.model';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { logger } from '@/common/utils/logger.util';

export interface UpdateCollegeProfileData {
  collegeName?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  contactPerson?: {
    name?: string;
    designation?: string;
    email?: string;
    phone?: string;
  };
}

export class CollegeProfileService {
  private static instance: CollegeProfileService;

  private constructor() {}

  public static getInstance(): CollegeProfileService {
    if (!CollegeProfileService.instance) {
      CollegeProfileService.instance = new CollegeProfileService();
    }
    return CollegeProfileService.instance;
  }

  /**
   * Fetch the authenticated college's profile or throw if it does not exist.
   */
  public async getProfileOrThrow(userId: string): Promise<ICollegeProfile> {
    const profile = await CollegeProfile.findOne({ userId }).exec();
    if (!profile) {
      throw new NotFoundError('College profile not found');
    }
    return profile;
  }

  /**
   * Resolve the set of student user ids that belong to a college.
   * Primary source is the explicit `registeredStudents` list; if that is empty
   * we fall back to matching student profiles by college name.
   */
  public async resolveStudentUserIds(
    college: ICollegeProfile
  ): Promise<mongoose.Types.ObjectId[]> {
    const idSet = new Set<string>();

    if (college.registeredStudents && college.registeredStudents.length > 0) {
      college.registeredStudents.forEach((id) => idSet.add(String(id)));
    }

    if (college.collegeName) {
      const profiles = await StudentProfile.find({ collegeName: college.collegeName })
        .select('userId')
        .lean()
        .exec();
      profiles.forEach((p) => idSet.add(String(p.userId)));
    }

    return Array.from(idSet).map((id) => new mongoose.Types.ObjectId(id));
  }

  /**
   * The college's profile (institution details + point of contact).
   */
  public async getProfile(userId: string): Promise<ICollegeProfile> {
    return this.getProfileOrThrow(userId);
  }

  /**
   * Update institution details and point-of-contact fields (partial update).
   */
  public async updateProfile(
    userId: string,
    data: UpdateCollegeProfileData
  ): Promise<ICollegeProfile> {
    try {
      const update: Record<string, unknown> = {};
      if (data.collegeName !== undefined) {
        update.collegeName = data.collegeName;
      }
      if (data.website !== undefined) {
        update.website = data.website;
      }

      // Nested fields use dot-notation so we don't clobber unspecified sub-fields.
      if (data.address) {
        for (const [k, v] of Object.entries(data.address)) {
          if (v !== undefined) {
            update[`address.${k}`] = v;
          }
        }
      }
      if (data.contactPerson) {
        for (const [k, v] of Object.entries(data.contactPerson)) {
          if (v !== undefined) {
            update[`contactPerson.${k}`] = v;
          }
        }
      }

      const profile = await CollegeProfile.findOneAndUpdate(
        { userId },
        { $set: update },
        { new: true, runValidators: true }
      ).exec();

      if (!profile) {
        throw new NotFoundError('College profile not found');
      }
      return profile;
    } catch (error: any) {
      logger.error('Update college profile error:', error);
      throw error;
    }
  }

  /**
   * Account settings view: institution name, email (read-only), phone, prefs.
   */
  public async getSettings(userId: string): Promise<{
    institutionName: string;
    email: string;
    phone: string;
    notificationPreferences: ICollegeProfile['notificationPreferences'];
  }> {
    const [college, user] = await Promise.all([
      this.getProfileOrThrow(userId),
      User.findById(userId).select('email phone').lean().exec(),
    ]);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      institutionName: college.collegeName,
      email: user.email,
      phone: user.phone,
      notificationPreferences: college.notificationPreferences,
    };
  }

  /**
   * Update editable account fields: institution name (profile) and phone (user).
   */
  public async updateAccount(
    userId: string,
    data: { institutionName?: string; phone?: string }
  ): Promise<{ institutionName: string; phone: string }> {
    try {
      if (data.institutionName !== undefined) {
        await CollegeProfile.updateOne(
          { userId },
          { $set: { collegeName: data.institutionName } },
          { runValidators: true }
        ).exec();
      }
      if (data.phone !== undefined) {
        await User.updateOne(
          { _id: userId },
          { $set: { phone: data.phone } },
          { runValidators: true }
        ).exec();
      }

      const [college, user] = await Promise.all([
        this.getProfileOrThrow(userId),
        User.findById(userId).select('phone').lean().exec(),
      ]);

      return { institutionName: college.collegeName, phone: user?.phone ?? '' };
    } catch (error: any) {
      logger.error('Update college account error:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences (partial update of the four toggles).
   */
  public async updateNotificationPreferences(
    userId: string,
    prefs: Partial<ICollegeProfile['notificationPreferences']>
  ): Promise<ICollegeProfile['notificationPreferences']> {
    try {
      const update: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(prefs)) {
        if (v !== undefined) {
          update[`notificationPreferences.${k}`] = v;
        }
      }

      const profile = await CollegeProfile.findOneAndUpdate(
        { userId },
        { $set: update },
        { new: true, runValidators: true }
      ).exec();

      if (!profile) {
        throw new NotFoundError('College profile not found');
      }
      return profile.notificationPreferences;
    } catch (error: any) {
      logger.error('Update college notification preferences error:', error);
      throw error;
    }
  }

  /**
   * Create a support ticket (reuses the shared SupportTicket model).
   */
  public async createSupportTicket(
    userId: string,
    data: { subject: string; message: string }
  ): Promise<ISupportTicket> {
    try {
      const ticket = await SupportTicket.create({
        userId,
        subject: data.subject,
        message: data.message,
        status: 'open',
      });
      logger.info(`College support ticket ${ticket._id} created by user ${userId}`);
      return ticket;
    } catch (error: any) {
      logger.error('Create college support ticket error:', error);
      throw error;
    }
  }

  /**
   * The college's support tickets (most recent first).
   */
  public async getSupportTickets(userId: string): Promise<ISupportTicket[]> {
    try {
      return await SupportTicket.find({ userId }).sort({ createdAt: -1 }).exec();
    } catch (error: any) {
      logger.error('Get college support tickets error:', error);
      throw error;
    }
  }
}

export const collegeProfileService = CollegeProfileService.getInstance();
