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
   * Get ambassador dashboard summary statistics.
   */
  public async getAmbassadorDashboard(studentUserId: string): Promise<any> {
    try {
      const studentProfile = await StudentProfile.findOne({ userId: studentUserId });
      if (!studentProfile || !studentProfile.isAmbassador) {
        throw new Error('Ambassador profile not found or user is not an ambassador');
      }

      const referrals = await Referral.find({ referrerId: studentUserId }).exec();

      const totalReferrals = referrals.length;
      const joinedReferrals = referrals.filter(r => r.status === 'joined' || r.status === 'completed').length;
      const totalCommission = referrals.reduce((sum, r) => sum + r.commissionEarned, 0);
      const unpaidCommission = referrals.filter(r => r.payoutStatus === 'unpaid').reduce((sum, r) => sum + r.commissionEarned, 0);
      const paidCommission = referrals.filter(r => r.payoutStatus === 'paid').reduce((sum, r) => sum + r.commissionEarned, 0);

      return {
        totalReferrals,
        joinedReferrals,
        totalCommission,
        unpaidCommission,
        paidCommission,
        commissionRate: 10, // 10% default
      };
    } catch (error: any) {
      logger.error('Get ambassador dashboard error:', error);
      throw error;
    }
  }

  /**
   * Get list of referrals made by this ambassador.
   */
  public async getAmbassadorReferrals(studentUserId: string): Promise<any[]> {
    try {
      const studentProfile = await StudentProfile.findOne({ userId: studentUserId });
      if (!studentProfile || !studentProfile.isAmbassador) {
        throw new Error('Ambassador profile not found or user is not an ambassador');
      }

      return await Referral.find({ referrerId: studentUserId })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error: any) {
      logger.error('Get ambassador referrals error:', error);
      throw error;
    }
  }

  /**
   * Track/create a new referral link generation or invite.
   */
  public async createReferral(
    studentUserId: string,
    data: {
      referredEmail: string;
      referredItemType: 'Course' | 'TrainingProgram' | 'Bootcamp';
      referredItemId: string;
    }
  ): Promise<any> {
    try {
      const studentProfile = await StudentProfile.findOne({ userId: studentUserId });
      if (!studentProfile || !studentProfile.isAmbassador) {
        throw new Error('Ambassador profile not found or user is not an ambassador');
      }

      const existing = await Referral.findOne({
        referrerId: studentUserId,
        referredEmail: data.referredEmail.toLowerCase(),
        referredItemId: data.referredItemId,
      });

      if (existing) {
        return existing;
      }

      return await Referral.create({
        referrerId: studentUserId,
        referredEmail: data.referredEmail.toLowerCase(),
        referredItemType: data.referredItemType,
        referredItemId: data.referredItemId,
        status: 'pending',
        commissionEarned: 0,
        payoutStatus: 'unpaid',
      });
    } catch (error: any) {
      logger.error('Create referral error:', error);
      throw error;
    }
  }
}

export const studentDashboardService = StudentDashboardService.getInstance();
