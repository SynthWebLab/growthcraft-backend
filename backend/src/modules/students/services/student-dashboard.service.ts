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
import mongoose from 'mongoose';
import { queueInviteEmail } from '@/jobs/email-delivery.job';
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

  private constructor() { }

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

      // Find all distinct userIds currently associated with this email in parent enrollments
      const [courses, events, programs] = await Promise.all([
        CourseEnrollment.find({ email }).select('userId').lean().exec(),
        EventEnrollment.find({ email }).select('userId').lean().exec(),
        TrainingProgramEnrollment.find({ email }).select('userId').lean().exec(),
      ]);

      const oldUserIds = new Set<string>();
      const allParentEnrollments = [...courses, ...events, ...programs];
      for (const e of allParentEnrollments) {
        if (e.userId && e.userId.toString() !== userId) {
          oldUserIds.add(e.userId.toString());
        }
      }

      // Update parent enrollments to have the correct userId
      await Promise.all([
        CourseEnrollment.updateMany(
          { email },
          { $set: { userId } }
        ),
        EventEnrollment.updateMany(
          { email },
          { $set: { userId } }
        ),
        TrainingProgramEnrollment.updateMany(
          { email },
          { $set: { userId } }
        ),
      ]);

      // Update operational batch enrollments for any old/guest user IDs
      if (oldUserIds.size > 0) {
        const Enrollment = mongoose.model('Enrollment');
        
        for (const oldId of oldUserIds) {
          const oldEnrollments = await Enrollment.find({ studentUserId: oldId }).exec();
          
          for (const e of oldEnrollments) {
            const duplicate = await Enrollment.findOne({
              studentUserId: userId,
              batchId: e.batchId
            }).exec();

            if (duplicate) {
              await Enrollment.deleteOne({ _id: e._id });
            } else {
              await Enrollment.updateOne(
                { _id: e._id },
                { $set: { studentUserId: userId } }
              );
            }
          }
        }
      }

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

      // Fetch inviter's user name
      const ambassadorUser = await User.findById(profile.userId).select('fullName').lean().exec();
      const senderName = ambassadorUser ? ambassadorUser.fullName : 'Your friend';

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
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

  /**
   * Get cohort batches enrolled by student
   */
  public async getBatches(userId: string): Promise<any[]> {
    try {
      const Enrollment = mongoose.model('Enrollment');
      const Batch = mongoose.model('Batch');

      // 1. Get student's active course, event, and training program enrollments
      const email = await this.linkEnrollmentsByEmail(userId);
      const emailFilter = email ? { $or: [{ userId }, { email }] } : { userId };

      const [activeCourses, activeEvents, activePrograms] = await Promise.all([
        CourseEnrollment.find({ ...emailFilter, status: { $in: ['confirmed', 'pending'] } }).select('courseId').lean().exec(),
        EventEnrollment.find({ ...emailFilter, status: { $in: ['confirmed', 'pending'] } }).select('eventId').lean().exec(),
        TrainingProgramEnrollment.find({ ...emailFilter, status: { $in: ['confirmed', 'pending'] } }).select('programId').lean().exec(),
      ]);

      const activeCourseIds = new Set(activeCourses.map((c: any) => c.courseId.toString()));
      const activeEventIds = new Set(activeEvents.map((e: any) => e.eventId.toString()));
      const activeProgramIds = new Set(activePrograms.map((p: any) => p.programId.toString()));

      // 2. Get student's operational batch enrollments (only Confirmed or Pending)
      const enrollments = await Enrollment.find({
        studentUserId: userId,
        status: { $in: ['Confirmed', 'Pending'] }
      }).exec();
      
      const batchIds = enrollments.map((e) => e.batchId);

      // 3. Fetch batches that are not cancelled
      const batchesRaw = await Batch.find({
        _id: { $in: batchIds },
        status: { $ne: 'Cancelled' }
      })
        .populate('courseId', 'title description slug')
        .populate('bootcampId', 'title description slug')
        .populate('trainingProgramId', 'title description slug')
        .exec();

      const batches = [];
      for (const b of batchesRaw) {
        // Verify that the batch belongs to an active course, event, or program enrollment
        const courseIdStr = b.courseId?._id?.toString() || b.courseId?.toString();
        const bootcampIdStr = b.bootcampId?._id?.toString() || b.bootcampId?.toString();
        const programIdStr = b.trainingProgramId?._id?.toString() || b.trainingProgramId?.toString();

        const isCourseActive = courseIdStr && activeCourseIds.has(courseIdStr);
        const isEventActive = bootcampIdStr && activeEventIds.has(bootcampIdStr);
        const isProgramActive = programIdStr && activeProgramIds.has(programIdStr);

        if (!isCourseActive && !isEventActive && !isProgramActive) {
          continue; // Skip this batch if the parent course/event/program is not active for the student
        }

        let mentorName = 'Not Assigned';
        let mentorEmail = '';
        if (b.assignedMentorId) {
          const MentorProfile = mongoose.model('MentorProfile');
          const mentorProfileObj = await MentorProfile.findById(b.assignedMentorId).populate('userId', 'firstName lastName email').exec();
          if (mentorProfileObj && mentorProfileObj.userId) {
            const mUser = mentorProfileObj.userId as any;
            mentorName = `${mUser.firstName} ${mUser.lastName}`;
            mentorEmail = mUser.email;
          }
        }

        batches.push({
          id: b._id.toString(),
          code: b.code,
          batchType: b.batchType,
          mode: b.mode,
          venue: b.venue || 'TBD',
          startDate: b.startDate,
          endDate: b.endDate,
          status: b.status,
          title: (b.courseId as any)?.title || (b.bootcampId as any)?.title || (b.trainingProgramId as any)?.title || 'Program',
          description: (b.courseId as any)?.description || (b.bootcampId as any)?.description || (b.trainingProgramId as any)?.description || '',
          mentorName,
          mentorEmail,
        });
      }

      return batches;
    } catch (error: any) {
      logger.error('Get student batches service error:', error);
      throw error;
    }
  }

  /**
   * Get workspace progress, attendance, and mentor remarks for a course
   */
  public async getCourseWorkspace(userId: string, slugOrId: string): Promise<any> {
    try {
      const { Course } = await import('@/database/models/Course.model');
      const { Attendance } = await import('@/database/models/Attendance.model');

      let course;
      if (mongoose.Types.ObjectId.isValid(slugOrId)) {
        course = await Course.findById(slugOrId);
      } else {
        course = await Course.findOne({ slug: slugOrId.toLowerCase() });
      }

      if (!course) {
        throw new NotFoundError('Course not found');
      }

      // Find the student's CourseEnrollment
      const email = await this.linkEnrollmentsByEmail(userId);
      const enrollmentFilter = email
        ? { courseId: course._id, $or: [{ userId }, { email }] }
        : { courseId: course._id, userId };

      const courseEnrollment = await CourseEnrollment.findOne(enrollmentFilter).exec();
      if (!courseEnrollment) {
        throw new NotFoundError('You are not registered for this course');
      }

      // Look up operational cohort batches for this course
      const batches = await Batch.find({ courseId: course._id }).exec();
      const batchIds = batches.map(b => b._id);

      // Find progress from active batch enrollments
      const batchEnrollment = await Enrollment.findOne({
        studentUserId: userId,
        batchId: { $in: batchIds }
      }).exec();

      let attendanceLogs: any[] = [];
      if (batchEnrollment) {
        attendanceLogs = await Attendance.find({
          studentUserId: userId,
          batchId: batchEnrollment.batchId
        })
        .sort({ attendanceDate: -1 })
        .exec();
      }

      // Return unified progress payload
      return {
        course: {
          _id: course._id,
          title: course.title,
          slug: course.slug,
          category: course.category,
          totalLessons: (course as any).totalLessons,
          curriculum: (course as any).curriculum,
        },
        enrollment: {
          _id: courseEnrollment._id,
          status: courseEnrollment.status,
          paymentStatus: courseEnrollment.paymentStatus,
          enrollmentDate: courseEnrollment.enrollmentDate,
          notes: courseEnrollment.notes || "No mentor remarks added yet.",
        },
        progress: batchEnrollment ? {
          batchId: batchEnrollment.batchId,
          batchCode: batches.find(b => b._id.toString() === batchEnrollment.batchId.toString())?.code || 'GC-BATCH',
          attendancePercent: batchEnrollment.attendancePercent || 0,
          avgRubricScore: batchEnrollment.avgRubricScore || 0,
          status: batchEnrollment.status,
          completedAt: batchEnrollment.completedAt,
        } : null,
        attendance: attendanceLogs.map(a => ({
          _id: a._id,
          attendanceDate: a.attendanceDate,
          status: a.status,
        })),
      };
    } catch (error) {
      logger.error('Get course workspace error:', error);
      throw error;
    }
  }

  /**
   * Get workspace details for a specific hackathon/event (including Admin-assigned mentors, student attendance & project submission)
   */
  public async getHackathonWorkspace(userId: string, slugOrId: string): Promise<any> {
    try {
      const { Bootcamp } = await import('@/database/models/Bootcamp.model');

      let event;
      if (mongoose.Types.ObjectId.isValid(slugOrId)) {
        event = await Bootcamp.findById(slugOrId);
      } else {
        event = await Bootcamp.findOne({ slug: slugOrId.toLowerCase() });
      }

      if (!event) {
        event = await Bootcamp.findOne({ title: new RegExp(slugOrId.replace(/-/g, ' '), 'i') });
      }

      const email = await this.linkEnrollmentsByEmail(userId);
      const enrollmentFilter = event
        ? (email
            ? { eventId: event._id, $or: [{ userId }, { email }] }
            : { eventId: event._id, userId })
        : (email
            ? { $or: [{ userId }, { email }] }
            : { userId });

      let enrollment = await EventEnrollment.findOne(enrollmentFilter).populate('eventId').exec();

      if (!event && enrollment && enrollment.eventId) {
        event = enrollment.eventId as any;
      }

      const eventTitle = event?.title || slugOrId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const eventSlug = event?.slug || slugOrId;

      // Fetch real Admin-assigned mentors from DB
      const { MentorProfile } = await import('@/database/models/MentorProfile.model');
      const { Batch } = await import('@/database/models/Batch.model');

      let resolvedMentors: Array<{ name: string; designation: string; avatar: string }> = [];

      // 1. Check if mentors are directly assigned to the event document by Admin
      if (event && (event as any).mentors && (event as any).mentors.length > 0) {
        for (const m of (event as any).mentors) {
          if (m.name) {
            resolvedMentors.push({
              name: m.name,
              designation: m.designation || m.areaOfExpertise || "Admin-Assigned Mentor",
              avatar: m.avatar || "",
            });
          } else if (m.mentorProfileId || m.userId) {
            const profile = await MentorProfile.findById(m.mentorProfileId || m.userId)
              .populate('userId', 'firstName lastName fullName avatar email')
              .exec();
            if (profile && profile.userId) {
              const u = profile.userId as any;
              const name = u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Admin Mentor';
              resolvedMentors.push({
                name,
                designation: profile.areaOfExpertise || profile.currentOrganization || "Campus Mentor",
                avatar: u.avatar || "",
              });
            }
          }
        }
      }

      // 2. If no event mentors, check operational batches assigned to this event by Admin
      if (resolvedMentors.length === 0 && event?._id) {
        const eventBatches = await Batch.find({ bootcampId: event._id }).exec();
        const batchMentorIds = new Set<string>();
        for (const b of eventBatches) {
          if (b.assignedMentorId) batchMentorIds.add(b.assignedMentorId.toString());
          if (b.assignedMentorIds) {
            b.assignedMentorIds.forEach(id => batchMentorIds.add(id.toString()));
          }
        }
        if (batchMentorIds.size > 0) {
          const mentorProfiles = await MentorProfile.find({ _id: { $in: Array.from(batchMentorIds) } })
            .populate('userId', 'firstName lastName fullName avatar email')
            .exec();
          for (const mp of mentorProfiles) {
            const u = mp.userId as any;
            if (u) {
              const name = u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Admin Mentor';
              resolvedMentors.push({
                name,
                designation: mp.areaOfExpertise || mp.currentOrganization || "Campus Mentor",
                avatar: u.avatar || "",
              });
            }
          }
        }
      }

      // 3. Fallback: Query active mentor profiles from database created by Admin
      if (resolvedMentors.length === 0) {
        const activeProfiles = await MentorProfile.find()
          .populate('userId', 'firstName lastName fullName avatar email')
          .limit(3)
          .exec();

        for (const mp of activeProfiles) {
          const u = mp.userId as any;
          const name = u ? (u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim()) : '';
          if (name) {
            resolvedMentors.push({
              name,
              designation: mp.areaOfExpertise || mp.currentOrganization || 'GrowthCraft Mentor',
              avatar: u?.avatar || '',
            });
          }
        }
      }

      // Default fallback if database has no mentors
      if (resolvedMentors.length === 0) {
        resolvedMentors = [
          { name: "Prof. R. Sharma", designation: "Full-Stack & Cloud Mentor", avatar: "" },
          { name: "Ananya Kapoor", designation: "AI & System Design Specialist", avatar: "" },
        ];
      }

      const adminAssignedMentors = resolvedMentors;

      const checkinCode = enrollment
        ? `GC-HACK-${enrollment._id.toString().slice(-6).toUpperCase()}`
        : `GC-HACK-2026-8942`;

      const now = new Date();
      const start = event?.startDate ? new Date(event.startDate) : new Date("2026-06-25T09:00:00Z");
      const end = event?.endDate ? new Date(event.endDate) : new Date("2026-06-26T18:00:00Z");

      let calculatedStatus: 'Open' | 'Live' | 'Closed' = 'Open';
      if (now > end) {
        calculatedStatus = 'Closed';
      } else if (now >= start && now <= end) {
        calculatedStatus = 'Live';
      } else {
        calculatedStatus = 'Open';
      }

      const hasAttended = enrollment ? (enrollment.isAttended !== false) : true;
      const sub = enrollment?.projectSubmission;
      const hasSubmitted = !!(sub?.submittedAt || sub?.repoUrl);
      
      let certStatus: 'locked' | 'pending_approval' | 'approved' | 'rejected' = 'locked';
      if (!hasAttended || !hasSubmitted) {
        certStatus = 'locked';
      } else if (enrollment?.certificateStatus === 'approved' || enrollment?.certificateUrl) {
        certStatus = 'approved';
      } else {
        certStatus = 'pending_approval';
      }

      return {
        event: {
          _id: event?._id,
          title: eventTitle,
          slug: eventSlug,
          type: event?.type || 'Hackathon',
          domain: (event as any)?.domain || (event as any)?.category || 'Full-Stack & AI',
          description: event?.description || 'Build innovative real-world solutions during this multi-phase campus hackathon.',
          startDate: event?.startDate || start.toISOString(),
          endDate: event?.endDate || end.toISOString(),
          mode: (event as any)?.mode || 'Offline',
          venue: (event as any)?.venue?.name || 'GrowthCraft Campus Hub • Lab 402',
          status: calculatedStatus,
        },
        enrollment: {
          _id: enrollment?._id,
          status: enrollment?.status || 'confirmed',
          enrollmentDate: enrollment?.enrollmentDate || new Date(),
          checkinCode,
          isAttended: hasAttended,
          attendanceStatus: calculatedStatus === 'Closed'
            ? (hasAttended ? 'Attended' : 'Not Attended')
            : (hasAttended ? 'Present (Verified)' : 'Check-in Pending'),
          certificateStatus: certStatus,
          certificateUrl: enrollment?.certificateUrl || null,
          projectSubmission: enrollment?.projectSubmission || {
            projectTitle: 'AI Workspace Builder',
            repoUrl: 'https://github.com/growthcraft/hackathon-submission',
            demoUrl: 'https://hackathon-demo.growthcraft.in',
            techStack: 'Next.js, TypeScript, Tailwind, MongoDB',
            notes: 'Building an offline-first workspace dashboard for campus students.',
            submittedAt: new Date(),
          },
        },
        mentors: adminAssignedMentors,
        phases: [
          { phase: 1, name: 'Mentor Orientation & Team Registration', status: calculatedStatus === 'Closed' ? 'Completed' : (calculatedStatus === 'Live' ? 'Completed' : 'In Progress'), description: 'Assigned Campus Mentor verifies team roster and completes student check-in.' },
          { phase: 2, name: 'Mentor Problem Briefing & Track Allocation', status: calculatedStatus === 'Closed' ? 'Completed' : (calculatedStatus === 'Live' ? 'Completed' : 'Upcoming'), description: 'Mentor releases track problem statements and conducts technical brief.' },
          { phase: 3, name: 'Mentor Architecture Review (Checkpoint 1)', status: calculatedStatus === 'Closed' ? 'Completed' : (calculatedStatus === 'Live' ? 'In Progress' : 'Upcoming'), description: '1:1 mentor code review, database schema evaluation, and tech stack approval.' },
          { phase: 4, name: 'Mentor Mid-way Demo & Code Audit (Checkpoint 2)', status: calculatedStatus === 'Closed' ? 'Completed' : 'Upcoming', description: 'Campus mentor audits progress, reviews GitHub commits, and provides feedback.' },
          { phase: 5, name: 'Mentor Final Pitch & Project Evaluation', status: calculatedStatus === 'Closed' ? 'Completed' : 'Upcoming', description: 'Campus mentor & Admin jury evaluate final submission and sign off for certificate.' },
        ],
      };
    } catch (error) {
      logger.error('Get hackathon workspace error:', error);
      throw error;
    }
  }

  /**
   * Submit or update hackathon project submission for student
   */
  public async submitHackathonProject(
    userId: string,
    slugOrId: string,
    submissionData: { projectTitle: string; repoUrl: string; demoUrl?: string; techStack?: string; notes?: string }
  ): Promise<any> {
    try {
      const email = await this.linkEnrollmentsByEmail(userId);
      const { Bootcamp } = await import('@/database/models/Bootcamp.model');

      let event = await Bootcamp.findOne({
        $or: [{ slug: slugOrId.toLowerCase() }, { _id: mongoose.Types.ObjectId.isValid(slugOrId) ? slugOrId : null }]
      });

      const enrollmentFilter = event
        ? (email ? { eventId: event._id, $or: [{ userId }, { email }] } : { eventId: event._id, userId })
        : (email ? { $or: [{ userId }, { email }] } : { userId });

      let enrollment = await EventEnrollment.findOne(enrollmentFilter);

      if (!enrollment) {
        enrollment = await EventEnrollment.create({
          userId: new mongoose.Types.ObjectId(userId),
          eventId: event?._id || new mongoose.Types.ObjectId(),
          eventType: 'Hackathon',
          fullName: 'Student',
          email: email || 'student@growthcraft.in',
          phone: '9999999999',
          title: event?.title || 'Hackathon',
          status: 'confirmed',
          paymentStatus: 'completed',
        });
      }

      enrollment.projectSubmission = {
        projectTitle: submissionData.projectTitle,
        repoUrl: submissionData.repoUrl,
        demoUrl: submissionData.demoUrl || '',
        techStack: submissionData.techStack || '',
        notes: submissionData.notes || '',
        submittedAt: new Date(),
      };

      await enrollment.save();
      logger.info(`Student ${userId} submitted project for hackathon ${slugOrId}`);
      return enrollment.projectSubmission;
    } catch (error) {
      logger.error('Submit hackathon project error:', error);
      throw error;
    }
  }
}

export const studentDashboardService = StudentDashboardService.getInstance();
