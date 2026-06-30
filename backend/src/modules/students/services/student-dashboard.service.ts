import { CourseEnrollment, ICourseEnrollment } from '@/database/models/CourseEnrollment.model';
import { User } from '@/database/models/User.model';
import { EventEnrollment, IEventEnrollment } from '@/database/models/EventEnrollment.model';
import {
  TrainingProgramEnrollment,
  ITrainingProgramEnrollment,
} from '@/database/models/TrainingProgramEnrollment.model';
import { StudentProfile, IStudentProfile } from '@/database/models/StudentProfile.model';
import { SupportTicket, ISupportTicket } from '@/database/models/SupportTicket.model';
import { MentorProfile, IMentorProfile } from '@/database/models/MentorProfile.model';
import { MentorSession, IMentorSession } from '@/database/models/MentorSession.model';
import { Enrollment } from '@/database/models/Enrollment.model';
import { Batch } from '@/database/models/Batch.model';
import { Referral } from '@/database/models/Referral.model';
import { EventType } from '@/database/models/Bootcamp.model';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { ConflictError } from '@/common/errors/ConflictError';
import { ValidationError } from '@/common/errors/ValidationError';
import { logger } from '@/common/utils/logger.util';

export type StudentCertification = IStudentProfile['certifications'][number];

export interface UpdateStudentProfileData {
  enrollmentNumber?: string;
  collegeName?: string;
  degree?: string;
  branch?: string;
  yearOfStudy?: number;
  graduationYear?: number;
  skills?: string[];
  interests?: string[];
  resume?: string;
  portfolio?: string;
  linkedIn?: string;
  github?: string;
}

const UPDATABLE_PROFILE_FIELDS: (keyof UpdateStudentProfileData)[] = [
  'enrollmentNumber',
  'collegeName',
  'degree',
  'branch',
  'yearOfStudy',
  'graduationYear',
  'skills',
  'interests',
  'resume',
  'portfolio',
  'linkedIn',
  'github',
];

export interface StudentDashboardSummary {
  counts: {
    courses: number;
    bootcamps: number;
    workshops: number;
    hackathons: number;
    trainingPrograms: number;
    certificates: number;
  };
  recent: {
    courses: ICourseEnrollment[];
    events: IEventEnrollment[];
    trainingPrograms: ITrainingProgramEnrollment[];
  };
  certificates: StudentCertification[];
}

const ACTIVE_STATUSES = ['pending', 'confirmed'];

export class StudentDashboardService {
  private static instance: StudentDashboardService;

  private constructor() {}

  public static getInstance(): StudentDashboardService {
    if (!StudentDashboardService.instance) {
      StudentDashboardService.instance = new StudentDashboardService();
    }
    return StudentDashboardService.instance;
  }

  /**
   * Resolve user's email and dynamically link any existing unlinked enrollments.
   */
  private async linkEnrollmentsByEmail(userId: string): Promise<string | null> {
    try {
      const user = await User.findById(userId).select('email').lean().exec();
      if (!user?.email) return null;

      const email = user.email.toLowerCase().trim();

      await Promise.all([
        CourseEnrollment.updateMany(
          { email, userId: { $exists: false } },
          { $set: { userId } }
        ),
        EventEnrollment.updateMany(
          { email, userId: { $exists: false } },
          { $set: { userId } }
        ),
        TrainingProgramEnrollment.updateMany(
          { email, userId: { $exists: false } },
          { $set: { userId } }
        ),
      ]);
      return email;
    } catch (error) {
      logger.error('Error linking student enrollments by email:', error);
      return null;
    }
  }

  /**
   * Get the student's enrolled courses
   */
  public async getCourses(userId: string): Promise<ICourseEnrollment[]> {
    try {
      const email = await this.linkEnrollmentsByEmail(userId);
      const filter = email
        ? { $or: [{ userId }, { email }], status: { $in: ACTIVE_STATUSES } }
        : { userId, status: { $in: ACTIVE_STATUSES } };

      return await CourseEnrollment.find(filter)
        .populate('courseId')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error: any) {
      logger.error('Get student courses error:', error);
      throw error;
    }
  }

  /**
   * Get the student's enrolled events (optionally filtered by event type)
   */
  public async getEvents(userId: string, eventType?: EventType): Promise<IEventEnrollment[]> {
    try {
      const email = await this.linkEnrollmentsByEmail(userId);
      const filter: any = { status: { $in: ACTIVE_STATUSES } };
      if (email) {
        filter.$or = [{ userId }, { email }];
      } else {
        filter.userId = userId;
      }
      if (eventType) {
        filter.eventType = eventType;
      }

      return await EventEnrollment.find(filter)
        .populate('eventId')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error: any) {
      logger.error('Get student events error:', error);
      throw error;
    }
  }

  /**
   * Get the student's enrolled training programs
   */
  public async getTrainingPrograms(userId: string): Promise<ITrainingProgramEnrollment[]> {
    try {
      const email = await this.linkEnrollmentsByEmail(userId);
      const filter = email
        ? { $or: [{ userId }, { email }], status: { $in: ACTIVE_STATUSES } }
        : { userId, status: { $in: ACTIVE_STATUSES } };

      return await TrainingProgramEnrollment.find(filter)
        .populate('programId')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error: any) {
      logger.error('Get student training programs error:', error);
      throw error;
    }
  }

  /**
   * Get the student's profile (null if not yet created)
   */
  public async getProfile(userId: string): Promise<IStudentProfile | null> {
    try {
      return await StudentProfile.findOne({ userId })
        .populate('enrolledCourses')
        .populate('completedCourses')
        .exec();
    } catch (error: any) {
      logger.error('Get student profile error:', error);
      throw error;
    }
  }

  /**
   * Create or update the student's profile (upsert). Only known fields are applied.
   */
  public async updateProfile(
    userId: string,
    data: UpdateStudentProfileData
  ): Promise<IStudentProfile> {
    try {
      const update: Record<string, unknown> = {};
      for (const field of UPDATABLE_PROFILE_FIELDS) {
        if (data[field] !== undefined) {
          update[field] = data[field];
        }
      }

      const profile = await StudentProfile.findOneAndUpdate(
        { userId },
        { $set: update, $setOnInsert: { userId } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      ).exec();

      return profile;
    } catch (error: any) {
      logger.error('Update student profile error:', error);
      throw error;
    }
  }

  /**
   * Get the student's certificates from their profile
   */
  public async getCertificates(userId: string): Promise<StudentCertification[]> {
    try {
      const profile = await StudentProfile.findOne({ userId }).select('certifications').lean().exec();
      return (profile?.certifications ?? []) as StudentCertification[];
    } catch (error: any) {
      logger.error('Get student certificates error:', error);
      throw error;
    }
  }

  /**
   * Create a support ticket for the student
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

      logger.info(`Support ticket ${ticket._id} created by user ${userId}`);
      return ticket;
    } catch (error: any) {
      logger.error('Create support ticket error:', error);
      throw error;
    }
  }

  /**
   * Get the student's support tickets (most recent first)
   */
  public async getSupportTickets(userId: string): Promise<ISupportTicket[]> {
    try {
      return await SupportTicket.find({ userId }).sort({ createdAt: -1 }).exec();
    } catch (error: any) {
      logger.error('Get support tickets error:', error);
      throw error;
    }
  }

  /**
   * Get mentors assigned to the student's enrolled batches, optionally filtered by area of expertise.
   */
  public async getMentors(studentUserId: string, areaOfExpertise?: string): Promise<IMentorProfile[]> {
    try {
      const enrollments = await Enrollment.find({ studentUserId }).exec();
      const batchIds = enrollments.map((e) => e.batchId);

      const batches = await Batch.find({ _id: { $in: batchIds } }).exec();

      const mentorProfileIds = new Set<string>();
      for (const batch of batches) {
        if (batch.assignedMentorId) {
          mentorProfileIds.add(batch.assignedMentorId.toString());
        }
        if (batch.assignedMentorIds && Array.isArray(batch.assignedMentorIds)) {
          for (const mId of batch.assignedMentorIds) {
            mentorProfileIds.add(mId.toString());
          }
        }
      }

      const filter: Record<string, unknown> = {
        _id: { $in: Array.from(mentorProfileIds) },
      };
      if (areaOfExpertise) {
        filter.areaOfExpertise = areaOfExpertise;
      }

      return await MentorProfile.find(filter)
        .populate('userId', 'fullName email')
        .exec();
    } catch (error: any) {
      logger.error('Get mentors error:', error);
      throw error;
    }
  }

  /**
   * Book a mentor session for the student.
   */
  public async bookMentorSession(
    studentUserId: string,
    data: {
      mentorUserId: string;
      topic: string;
      scheduledDate: string | Date;
      timeSlot: string;
      sessionType?: '1:1' | 'Group';
    }
  ): Promise<IMentorSession> {
    try {
      // Ensure the mentor exists.
      const mentor = await MentorProfile.findOne({ userId: data.mentorUserId });
      if (!mentor) {
        throw new NotFoundError('Mentor not found');
      }

      const existing = await MentorSession.findOne({
        studentUserId,
        mentorUserId: data.mentorUserId,
        scheduledDate: new Date(data.scheduledDate),
        timeSlot: data.timeSlot,
      });
      if (existing) {
        throw new ConflictError('You already have a session booked with this mentor at that time');
      }

      const session = await MentorSession.create({
        studentUserId,
        mentorUserId: data.mentorUserId,
        topic: data.topic,
        scheduledDate: new Date(data.scheduledDate),
        timeSlot: data.timeSlot,
        sessionType: data.sessionType ?? '1:1',
        status: 'scheduled',
      });

      await MentorProfile.updateOne({ userId: data.mentorUserId }, { $inc: { totalSessions: 1 } });

      logger.info(`Mentor session ${session._id} booked by student ${studentUserId}`);
      return session;
    } catch (error: any) {
      logger.error('Book mentor session error:', error);
      throw error;
    }
  }

  /**
   * Get the student's mentor sessions (most recent first), mentor populated.
   */
  public async getMentorSessions(studentUserId: string): Promise<IMentorSession[]> {
    try {
      return await MentorSession.find({ studentUserId })
        .populate('mentorUserId', 'fullName email')
        .sort({ scheduledDate: -1 })
        .exec();
    } catch (error: any) {
      logger.error('Get mentor sessions error:', error);
      throw error;
    }
  }

  /**
   * Build the aggregated dashboard summary for a student
   */
  public async getDashboard(userId: string): Promise<StudentDashboardSummary> {
    try {
      const email = await this.linkEnrollmentsByEmail(userId);
      const baseFilter = email
        ? { $or: [{ userId }, { email }], status: { $in: ACTIVE_STATUSES } }
        : { userId, status: { $in: ACTIVE_STATUSES } };

      const [
        courses,
        events,
        trainingPrograms,
        certificates,
      ] = await Promise.all([
        CourseEnrollment.find(baseFilter).populate('courseId').sort({ createdAt: -1 }).exec(),
        EventEnrollment.find(baseFilter).populate('eventId').sort({ createdAt: -1 }).exec(),
        TrainingProgramEnrollment.find(baseFilter).populate('programId').sort({ createdAt: -1 }).exec(),
        this.getCertificates(userId),
      ]);

      const bootcamps = events.filter((e) => e.eventType === EventType.BOOTCAMP);
      const workshops = events.filter((e) => e.eventType === EventType.WORKSHOP);
      const hackathons = events.filter((e) => e.eventType === EventType.HACKATHON);

      return {
        counts: {
          courses: courses.length,
          bootcamps: bootcamps.length,
          workshops: workshops.length,
          hackathons: hackathons.length,
          trainingPrograms: trainingPrograms.length,
          certificates: certificates.length,
        },
        recent: {
          courses: courses.slice(0, 5),
          events: events.slice(0, 5),
          trainingPrograms: trainingPrograms.slice(0, 5),
        },
        certificates,
      };
    } catch (error: any) {
      logger.error('Get student dashboard error:', error);
      throw error;
    }
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

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
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

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const invites: any[] = [];

      for (const email of payload.emails) {
        const normalizedEmail = email.toLowerCase().trim();
        if (!normalizedEmail) {
          continue;
        }

        // Check if already invited by this ambassador
        let referral = await Referral.findOne({
          ambassadorUserId: studentUserId,
          referredEmail: normalizedEmail,
        }).exec();

        if (!referral) {
          let inviteLink = `${frontendUrl}/register/student?ref=${profile.referralCode}`;
          if (payload.programId) {
            inviteLink += `&program=${payload.programId}`;
          }

          referral = await Referral.create({
            ambassadorUserId: studentUserId,
            referralCode: profile.referralCode,
            referredEmail: normalizedEmail,
            status: 'sent',
            inviteLink,
            enrollmentType: payload.programType as any || null,
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

export const studentDashboardService = StudentDashboardService.getInstance();
