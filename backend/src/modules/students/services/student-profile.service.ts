import { StudentProfile, IStudentProfile } from '@/database/models/StudentProfile.model';
import { SupportTicket, ISupportTicket } from '@/database/models/SupportTicket.model';
import { MentorProfile, IMentorProfile } from '@/database/models/MentorProfile.model';
import { MentorSession, IMentorSession } from '@/database/models/MentorSession.model';
import { Enrollment } from '@/database/models/Enrollment.model';
import { Batch } from '@/database/models/Batch.model';
import { CourseEnrollment } from '@/database/models/CourseEnrollment.model';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { ConflictError } from '@/common/errors/ConflictError';
import { logger } from '@/common/utils/logger.util';
import { studentEnrollmentService, ACTIVE_STATUSES } from './student-enrollment.service';

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

export class StudentProfileService {
  private static instance: StudentProfileService;

  private constructor() {}

  public static getInstance(): StudentProfileService {
    if (!StudentProfileService.instance) {
      StudentProfileService.instance = new StudentProfileService();
    }
    return StudentProfileService.instance;
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
   * Get mentors assigned to the student's enrolled batches and registered courses, optionally filtered by area of expertise.
   */
  public async getMentors(studentUserId: string, areaOfExpertise?: string): Promise<IMentorProfile[]> {
    try {
      // 1. Get mentors assigned to cohort batches
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

      // 2. Get mentors assigned to registered courses
      const email = await studentEnrollmentService.linkEnrollmentsByEmail(studentUserId);
      const courseFilter = email
        ? { $or: [{ userId: studentUserId }, { email }], status: { $in: ACTIVE_STATUSES } }
        : { userId: studentUserId, status: { $in: ACTIVE_STATUSES } };

      const courseEnrollments = await CourseEnrollment.find(courseFilter)
        .populate('courseId')
        .exec();

      const mentorUserIds = new Set<string>();
      for (const ce of courseEnrollments) {
        const course = ce.courseId as any;
        if (course && course.mentors && Array.isArray(course.mentors)) {
          for (const m of course.mentors) {
            if (m.mentorProfileId) {
              mentorProfileIds.add(m.mentorProfileId.toString());
            }
            if (m.userId) {
              mentorUserIds.add(m.userId.toString());
            }
          }
        }
      }

      // 3. Query all unique MentorProfiles
      const conditions: any[] = [];
      if (mentorProfileIds.size > 0) {
        conditions.push({ _id: { $in: Array.from(mentorProfileIds) } });
      }
      if (mentorUserIds.size > 0) {
        conditions.push({ userId: { $in: Array.from(mentorUserIds) } });
      }

      if (conditions.length === 0) {
        return [];
      }

      const filter: Record<string, any> = {
        $or: conditions,
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
}

export const studentProfileService = StudentProfileService.getInstance();
