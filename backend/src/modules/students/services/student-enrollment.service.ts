import mongoose from 'mongoose';
import { CourseEnrollment, ICourseEnrollment } from '@/database/models/CourseEnrollment.model';
import { EventEnrollment, IEventEnrollment } from '@/database/models/EventEnrollment.model';
import {
  TrainingProgramEnrollment,
  ITrainingProgramEnrollment,
} from '@/database/models/TrainingProgramEnrollment.model';
import { User } from '@/database/models/User.model';
import { StudentProfile } from '@/database/models/StudentProfile.model';
import { Enrollment } from '@/database/models/Enrollment.model';
import { EventType } from '@/database/models/Bootcamp.model';
import { logger } from '@/common/utils/logger.util';

export const ACTIVE_STATUSES = ['confirmed', 'active', 'completed', 'enrolled'];
export const PAID_PAYMENT_STATUSES = ['completed', 'paid', 'success'];

export class StudentEnrollmentService {
  private static instance: StudentEnrollmentService;

  private constructor() {}

  public static getInstance(): StudentEnrollmentService {
    if (!StudentEnrollmentService.instance) {
      StudentEnrollmentService.instance = new StudentEnrollmentService();
    }
    return StudentEnrollmentService.instance;
  }

  /**
   * Resolve user's email and dynamically link any existing unlinked enrollments.
   */
  public async linkEnrollmentsByEmail(userId: string): Promise<string | null> {
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

      // Relink legacy enrollments
      if (oldUserIds.size > 0) {
        const legacyEnrollments = await Enrollment.find({
          studentUserId: { $in: Array.from(oldUserIds) },
        }).exec();

        for (const e of legacyEnrollments) {
          const duplicate = await Enrollment.findOne({
            studentUserId: userId,
            batchId: e.batchId,
          });

          if (duplicate) {
            await Enrollment.deleteOne({ _id: e._id });
          } else {
            await Enrollment.updateOne(
              { _id: e._id },
              { $set: { studentUserId: userId } }
            );
          }
        }
      } else {
        const studentProfile = await StudentProfile.findOne({ userId }).select('email').lean().exec();
        if (studentProfile) {
          const legacyEnrollments = await Enrollment.find({
            studentEmail: email,
            studentUserId: { $ne: userId },
          }).exec();

          for (const e of legacyEnrollments) {
            const duplicate = await Enrollment.findOne({
              studentUserId: userId,
              batchId: e.batchId,
            });

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
   * Get the student's enrolled courses (only confirmed/paid enrollments)
   */
  public async getCourses(userId: string): Promise<ICourseEnrollment[]> {
    try {
      const email = await this.linkEnrollmentsByEmail(userId);
      const userCondition = email ? { $or: [{ userId }, { email }] } : { userId };
      const filter = {
        ...userCondition,
        status: { $in: ACTIVE_STATUSES },
        paymentStatus: { $nin: ['pending', 'failed', 'cancelled', 'unpaid'] },
      };

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
   * Get the student's enrolled events (only confirmed/paid enrollments)
   */
  public async getEvents(userId: string, eventType?: EventType): Promise<IEventEnrollment[]> {
    try {
      const email = await this.linkEnrollmentsByEmail(userId);
      const userCondition = email ? { $or: [{ userId }, { email }] } : { userId };
      const filter: any = {
        ...userCondition,
        status: { $in: ACTIVE_STATUSES },
        paymentStatus: { $nin: ['pending', 'failed', 'cancelled', 'unpaid'] },
      };
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
   * Get the student's enrolled training programs (only confirmed/paid enrollments)
   */
  public async getTrainingPrograms(userId: string): Promise<ITrainingProgramEnrollment[]> {
    try {
      const email = await this.linkEnrollmentsByEmail(userId);
      const userCondition = email ? { $or: [{ userId }, { email }] } : { userId };
      const filter = {
        ...userCondition,
        status: { $in: ACTIVE_STATUSES },
        paymentStatus: { $nin: ['pending', 'failed', 'cancelled', 'unpaid'] },
      };

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
   * Get cohort batches enrolled by student
   */
  public async getBatches(userId: string): Promise<any[]> {
    try {
      const EnrollmentModel = mongoose.model('Enrollment');
      const BatchModel = mongoose.model('Batch');

      // 1. Get student's active course, event, and training program enrollments
      const email = await this.linkEnrollmentsByEmail(userId);
      const emailFilter = email ? { $or: [{ userId }, { email }] } : { userId };

      const [activeCourses, activeEvents, activePrograms] = await Promise.all([
        CourseEnrollment.find({ ...emailFilter, status: { $in: ['confirmed', 'pending'] } }).select('courseId').lean().exec(),
        EventEnrollment.find({ ...emailFilter, status: { $in: ['confirmed', 'pending'] } }).select('eventId').lean().exec(),
        TrainingProgramEnrollment.find({ ...emailFilter, status: { $in: ['confirmed', 'pending'] } }).select('programId').lean().exec(),
      ]);

      const activeCourseIds = new Set(activeCourses.map((c: any) => c.courseId?.toString()));
      const activeEventIds = new Set(activeEvents.map((e: any) => e.eventId?.toString()));
      const activeProgramIds = new Set(activePrograms.map((p: any) => p.programId?.toString()));

      // 2. Get student's operational batch enrollments (only Confirmed or Pending)
      const enrollments = await EnrollmentModel.find({
        studentUserId: userId,
        status: { $in: ['Confirmed', 'Pending'] },
      }).exec();

      const batchIds = enrollments.map((e: any) => e.batchId);

      // 3. Fetch batches that are not cancelled
      const batchesRaw = await BatchModel.find({
        _id: { $in: batchIds },
        status: { $ne: 'Cancelled' },
      })
        .populate('courseId', 'title description slug')
        .populate('bootcampId', 'title description slug')
        .populate('trainingProgramId', 'title description slug')
        .exec();

      const batches = [];
      for (const b of batchesRaw) {
        // Verify that the batch belongs to an active course, event, or program enrollment
        const courseIdStr = (b.courseId as any)?._id?.toString() || (b.courseId as any)?.toString();
        const bootcampIdStr = (b.bootcampId as any)?._id?.toString() || (b.bootcampId as any)?.toString();
        const programIdStr = (b.trainingProgramId as any)?._id?.toString() || (b.trainingProgramId as any)?.toString();

        const isCourseActive = courseIdStr && activeCourseIds.has(courseIdStr);
        const isEventActive = bootcampIdStr && activeEventIds.has(bootcampIdStr);
        const isProgramActive = programIdStr && activeProgramIds.has(programIdStr);

        if (!isCourseActive && !isEventActive && !isProgramActive) {
          continue; // Skip this batch if the parent course/event/program is not active for the student
        }

        let mentorName = 'Not Assigned';
        let mentorEmail = '';
        if (b.assignedMentorId && mongoose.Types.ObjectId.isValid(b.assignedMentorId)) {
          const MentorProfileModel = mongoose.model('MentorProfile');
          const mentorProfileObj = await MentorProfileModel.findById(b.assignedMentorId).populate('userId', 'firstName lastName fullName email').exec();
          if (mentorProfileObj && mentorProfileObj.userId) {
            const mUser = mentorProfileObj.userId as any;
            mentorName = mUser.fullName || `${mUser.firstName || ''} ${mUser.lastName || ''}`.trim() || 'Not Assigned';
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
}

export const studentEnrollmentService = StudentEnrollmentService.getInstance();
