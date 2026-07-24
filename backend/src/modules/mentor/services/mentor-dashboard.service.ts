import mongoose from 'mongoose';
import { MentorProfile, IMentorProfile } from '@/database/models/MentorProfile.model';
import { User } from '@/database/models/User.model';
import { Batch, IBatch, BatchStatus } from '@/database/models/Batch.model';
import { Enrollment } from '@/database/models/Enrollment.model';
import { MentorCheckIn, IMentorCheckIn } from '@/database/models/MentorCheckIn.model';
import { Attendance } from '@/database/models/Attendance.model';
import { ProgressNote, IProgressNote } from '@/database/models/ProgressNote.model';
import { SupportTicket, ISupportTicket } from '@/database/models/SupportTicket.model';
import { Course } from '@/database/models/Course.model';
import { logger } from '@/common/utils/logger.util';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { ValidationError } from '@/common/errors/ValidationError';
import bcrypt from 'bcryptjs';

export interface MentorDashboardSummary {
  assignedBatches: number;
  completedBatches: number;
  totalHoursMentored: number;
  pendingPayout: number;
  upcomingBatches: any[];
  recentCheckIns: any[];
}

export class MentorDashboardService {
  private static instance: MentorDashboardService;

  private constructor() {}

  public static getInstance(): MentorDashboardService {
    if (!MentorDashboardService.instance) {
      MentorDashboardService.instance = new MentorDashboardService();
    }
    return MentorDashboardService.instance;
  }

  /**
   * Helper to verify if mentor is assigned to a batch
   */
  private async verifyMentorAssignment(mentorProfileId: string, batchId: string): Promise<IBatch> {
    const batch = await Batch.findById(batchId).exec();
    if (!batch) {
      throw new NotFoundError('Batch not found');
    }

    const assigned =
      batch.assignedMentorId?.toString() === mentorProfileId ||
      batch.assignedMentorIds?.some((id) => id.toString() === mentorProfileId);

    if (!assigned) {
      throw new ValidationError('Mentor is not assigned to this batch');
    }

    return batch;
  }

  /**
   * Get mentor dashboard summary
   */
  public async getDashboard(userId: string): Promise<MentorDashboardSummary> {
    try {
      const mentorProfile = await MentorProfile.findOne({ userId });
      if (!mentorProfile) {
        throw new NotFoundError('Mentor profile not found');
      }

      const mentorProfileId = mentorProfile._id as mongoose.Types.ObjectId;

      const [assignedBatches, completedBatches, checkInsResult] = await Promise.all([
        Batch.countDocuments({
          status: { $in: [BatchStatus.OPEN, BatchStatus.IN_PROGRESS] },
          $or: [
            { assignedMentorId: mentorProfileId },
            { assignedMentorIds: mentorProfileId },
          ],
        }),
        Batch.countDocuments({
          status: BatchStatus.COMPLETED,
          $or: [
            { assignedMentorId: mentorProfileId },
            { assignedMentorIds: mentorProfileId },
          ],
        }),
        MentorCheckIn.aggregate([
          { $match: { mentorId: userId, status: 'checked-out' } },
          { $group: { _id: null, totalHours: { $sum: '$hoursWorked' } } },
        ]).exec(),
      ]);

      const totalHoursMentored = checkInsResult[0]?.totalHours || 0;

      // Get next 5 upcoming batches
      const upcomingBatchesRaw = await Batch.find({
        status: { $in: [BatchStatus.DRAFT, BatchStatus.OPEN, BatchStatus.IN_PROGRESS] },
        startDate: { $gte: new Date() },
        $or: [
          { assignedMentorId: mentorProfileId },
          { assignedMentorIds: mentorProfileId },
        ],
      })
        .populate('courseId', 'title')
        .populate('bootcampId', 'title')
        .populate('trainingProgramId', 'title')
        .sort({ startDate: 1 })
        .limit(5)
        .exec();

      const upcomingBatches = upcomingBatchesRaw.map((b) => ({
        id: b._id.toString(),
        code: b.code,
        title: (b.courseId as any)?.title || (b.bootcampId as any)?.title || (b.trainingProgramId as any)?.title || 'Program',
        startDate: b.startDate,
        status: b.status,
      }));

      // Get last 5 check-ins
      const recentCheckInsRaw = await MentorCheckIn.find({ mentorId: userId })
        .populate('batchId', 'code')
        .sort({ checkInTime: -1 })
        .limit(5)
        .exec();

      const recentCheckIns = recentCheckInsRaw.map((c) => ({
        id: c._id.toString(),
        batchCode: (c.batchId as any)?.code || 'Unknown',
        checkInTime: c.checkInTime,
        checkOutTime: c.checkOutTime,
        hoursWorked: c.hoursWorked,
        status: c.status,
      }));

      return {
        assignedBatches,
        completedBatches,
        totalHoursMentored,
        pendingPayout: mentorProfile.pendingPayout || 0,
        upcomingBatches,
        recentCheckIns,
      };
    } catch (error: any) {
      logger.error('Get mentor dashboard error:', error);
      throw error;
    }
  }

  /**
   * Get batches assigned to this mentor
   */
  public async getBatches(
    userId: string,
    query: { status?: string; batchType?: string; page?: number; limit?: number }
  ): Promise<any> {
    try {
      const mentorProfile = await MentorProfile.findOne({ userId });
      if (!mentorProfile) {
        throw new NotFoundError('Mentor profile not found');
      }

      const mentorProfileId = mentorProfile._id;
      const filter: Record<string, any> = {
        $or: [
          { assignedMentorId: mentorProfileId },
          { assignedMentorIds: mentorProfileId },
        ],
      };

      if (query.status) {
        if (query.status === 'Active') {
          filter.status = { $in: ['Open', 'Filling', 'Full', 'InProgress'] };
        } else {
          filter.status = query.status;
        }
      }
      if (query.batchType) {
        filter.batchType = query.batchType;
      }

      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      const [batchesRaw, total] = await Promise.all([
        Batch.find(filter)
          .populate('courseId', 'title description')
          .populate('bootcampId', 'title description')
          .populate('trainingProgramId', 'title description')
          .sort({ startDate: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        Batch.countDocuments(filter),
      ]);

      const batches = [];
      for (const b of batchesRaw) {
        const studentCount = await Enrollment.countDocuments({ batchId: b._id });
        batches.push({
          id: b._id.toString(),
          code: b.code,
          batchType: b.batchType,
          mode: b.mode,
          startDate: b.startDate,
          endDate: b.endDate,
          status: b.status,
          title: (b.courseId as any)?.title || (b.bootcampId as any)?.title || (b.trainingProgramId as any)?.title || 'Program',
          description: (b.courseId as any)?.description || (b.bootcampId as any)?.description || (b.trainingProgramId as any)?.description || '',
          studentCount,
        });
      }

      return {
        batches,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Get mentor batches error:', error);
      throw error;
    }
  }

  /**
   * Get single batch details for mentor
   */
  public async getBatchById(userId: string, batchId: string): Promise<any> {
    try {
      const mentorProfile = await MentorProfile.findOne({ userId });
      if (!mentorProfile) {
        throw new NotFoundError('Mentor profile not found');
      }

      const batch = await this.verifyMentorAssignment(mentorProfile._id.toString(), batchId);

      // Populate batch info
      await batch.populate([
        { path: 'courseId', select: 'title' },
        { path: 'bootcampId', select: 'title' },
        { path: 'trainingProgramId', select: 'title' },
      ]);

      // Get enrolled students
      const enrollments = await Enrollment.find({ batchId })
        .populate({ path: 'studentUserId', select: 'fullName email phone' })
        .exec();

      const students = enrollments.map((e: any) => ({
        id: e.studentUserId?._id?.toString() || '',
        name: e.studentUserId?.fullName || 'Student',
        email: e.studentUserId?.email || '',
        phone: e.studentUserId?.phone || '',
        status: e.status,
        attendancePercent: e.attendancePercent,
        avgRubricScore: e.avgRubricScore,
      }));

      // Get attendance logs
      const attendance = await Attendance.find({ batchId })
        .populate('studentUserId', 'fullName')
        .sort({ attendanceDate: -1 })
        .exec();

      // Get progress notes
      const progressNotes = await ProgressNote.find({ batchId, mentorId: userId })
        .populate('studentUserId', 'fullName')
        .sort({ noteDate: -1 })
        .exec();

      return {
        batch: {
          id: batch._id.toString(),
          code: batch.code,
          batchType: batch.batchType,
          startDate: batch.startDate,
          endDate: batch.endDate,
          status: batch.status,
          title: (batch.courseId as any)?.title || (batch.bootcampId as any)?.title || (batch.trainingProgramId as any)?.title || 'Program',
        },
        students,
        attendance,
        progressNotes,
      };
    } catch (error: any) {
      logger.error('Get mentor batch by ID error:', error);
      throw error;
    }
  }

  /**
   * Check in mentor for batch session
   */
  public async checkIn(userId: string, batchId: string): Promise<IMentorCheckIn> {
    try {
      const mentorProfile = await MentorProfile.findOne({ userId });
      if (!mentorProfile) {
        throw new NotFoundError('Mentor profile not found');
      }

      const batch = await this.verifyMentorAssignment(mentorProfile._id.toString(), batchId);
      if (batch.status === BatchStatus.COMPLETED || batch.status === BatchStatus.CANCELLED) {
        throw new ValidationError('Cannot check in to a completed or cancelled batch');
      }

      // Check if there is an active check-in (unclosed check-out)
      const active = await MentorCheckIn.findOne({
        mentorId: userId,
        status: 'checked-in',
      }).exec();

      if (active) {
        throw new ValidationError('You are already checked in to another batch/session. Check out first.');
      }

      const now = new Date();
      return await MentorCheckIn.create({
        mentorId: userId,
        batchId,
        sessionDate: now,
        checkInTime: now,
        checkOutTime: null,
        hoursWorked: 0,
        status: 'checked-in',
      });
    } catch (error: any) {
      logger.error('Check in error:', error);
      throw error;
    }
  }

  /**
   * Check out mentor
   */
  public async checkOut(userId: string, batchId: string, notes?: string): Promise<IMentorCheckIn> {
    try {
      const mentorProfile = await MentorProfile.findOne({ userId });
      if (!mentorProfile) {
        throw new NotFoundError('Mentor profile not found');
      }

      const active = await MentorCheckIn.findOne({
        mentorId: userId,
        batchId,
        status: 'checked-in',
      }).exec();

      if (!active) {
        throw new ValidationError('No active check-in session found for this batch');
      }

      const checkOutTime = new Date();
      const diffMs = checkOutTime.getTime() - active.checkInTime.getTime();
      const rawHours = diffMs / (1000 * 60 * 60);
      // Round to nearest 0.5 hours
      const hoursWorked = Math.max(0.5, Math.round(rawHours * 2) / 2);

      active.checkOutTime = checkOutTime;
      active.hoursWorked = hoursWorked;
      active.status = 'checked-out';
      active.notes = notes;
      await active.save();

      // Accumulate pending payout based on hourly rate
      const rate = mentorProfile.hourlyRate || 1500;
      const earnings = hoursWorked * rate;
      await MentorProfile.updateOne(
        { userId },
        {
          $inc: {
            totalHoursMentored: hoursWorked,
            pendingPayout: earnings,
          },
        }
      );

      logger.info(`Mentor ${userId} checked out batch ${batchId}. Hours worked: ${hoursWorked}`);
      return active;
    } catch (error: any) {
      logger.error('Check out error:', error);
      throw error;
    }
  }

  /**
   * Get active check-in status
   */
  public async getCheckInStatus(userId: string): Promise<IMentorCheckIn | null> {
    try {
      return await MentorCheckIn.findOne({
        mentorId: userId,
        status: 'checked-in',
      }).populate('batchId', 'code').exec();
    } catch (error: any) {
      logger.error('Get check-in status error:', error);
      throw error;
    }
  }

  /**
   * Get check-ins history
   */
  public async getCheckIns(
    userId: string,
    query: { batchId?: string; page?: number; limit?: number }
  ): Promise<any> {
    try {
      const filter: Record<string, any> = { mentorId: userId };
      if (query.batchId) {
        filter.batchId = query.batchId;
      }

      const page = query.page || 1;
      const limit = query.limit || 15;
      const skip = (page - 1) * limit;

      const [checkIns, total] = await Promise.all([
        MentorCheckIn.find(filter)
          .populate('batchId', 'code')
          .sort({ checkInTime: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        MentorCheckIn.countDocuments(filter),
      ]);

      return {
        checkIns,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Get check-ins history error:', error);
      throw error;
    }
  }

  /**
   * Mark student attendance for a batch session
   */
  public async markAttendance(
    userId: string,
    batchId: string,
    data: {
      date: string | Date;
      records: { studentUserId: string; status: 'Present' | 'Absent' | 'Late' | 'Excused'; remarks?: string }[];
    }
  ): Promise<any[]> {
    try {
      const mentorProfile = await MentorProfile.findOne({ userId });
      if (!mentorProfile) {
        throw new NotFoundError('Mentor profile not found');
      }

      await this.verifyMentorAssignment(mentorProfile._id.toString(), batchId);

      const attendanceDate = new Date(data.date);
      attendanceDate.setHours(0, 0, 0, 0);

      const savedRecords = [];
      for (const record of data.records) {
        const query = {
          studentUserId: record.studentUserId,
          batchId,
          attendanceDate,
        };
        const update = {
          status: record.status,
          remarks: record.remarks,
          markedBy: userId,
        };

        const doc = await Attendance.findOneAndUpdate(query, update, {
          new: true,
          upsert: true,
          runValidators: true,
        }).exec();
        savedRecords.push(doc);

        // Recalculate attendance percent for the student enrollment
        const totalSessions = await Attendance.countDocuments({ studentUserId: record.studentUserId, batchId });
        const presentSessions = await Attendance.countDocuments({
          studentUserId: record.studentUserId,
          batchId,
          status: { $in: ['Present', 'Late'] },
        });

        const attendancePercent = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;
        await Enrollment.updateOne({ studentUserId: record.studentUserId, batchId }, { attendancePercent });
      }

      logger.info(`Attendance marked for batch ${batchId} on date ${attendanceDate}`);
      return savedRecords;
    } catch (error: any) {
      logger.error('Mark student attendance error:', error);
      throw error;
    }
  }

  /**
   * Create or update student progress note
   */
  public async createProgressNote(
    userId: string,
    data: {
      studentUserId: string;
      batchId: string;
      rubricScore: number;
      feedback: string;
      strengths?: string;
      areasForImprovement?: string;
    }
  ): Promise<IProgressNote> {
    try {
      const mentorProfile = await MentorProfile.findOne({ userId });
      if (!mentorProfile) {
        throw new NotFoundError('Mentor profile not found');
      }

      await this.verifyMentorAssignment(mentorProfile._id.toString(), data.batchId);

      // Verify student is enrolled in this batch
      const enrolled = await Enrollment.findOne({
        studentUserId: data.studentUserId,
        batchId: data.batchId,
      }).exec();

      if (!enrolled) {
        throw new ValidationError('Student is not enrolled in this batch');
      }

      const note = await ProgressNote.create({
        studentUserId: data.studentUserId,
        batchId: data.batchId,
        mentorId: userId,
        noteDate: new Date(),
        rubricScore: data.rubricScore,
        feedback: data.feedback,
        strengths: data.strengths,
        areasForImprovement: data.areasForImprovement,
      });

      // Recalculate average rubric score
      const allNotes = await ProgressNote.find({ studentUserId: data.studentUserId, batchId: data.batchId }).exec();
      const avgRubricScore =
        allNotes.length > 0 ? Math.round(allNotes.reduce((sum, n) => sum + n.rubricScore, 0) / allNotes.length) : 0;

      await Enrollment.updateOne({ studentUserId: data.studentUserId, batchId: data.batchId }, { avgRubricScore });

      logger.info(`Progress note created by mentor ${userId} for student ${data.studentUserId}`);
      return note;
    } catch (error: any) {
      logger.error('Create progress note error:', error);
      throw error;
    }
  }

  /**
   * Get earnings info
   */
  public async getEarnings(userId: string): Promise<any> {
    try {
      const mentorProfile = await MentorProfile.findOne({ userId });
      if (!mentorProfile) {
        throw new NotFoundError('Mentor profile not found');
      }

      const hourlyRate = mentorProfile.hourlyRate || 1500;

      // Group monthly earnings
      const monthlyData = await MentorCheckIn.aggregate([
        { $match: { mentorId: new mongoose.Types.ObjectId(userId), status: 'checked-out' } },
        {
          $group: {
            _id: {
              year: { $year: '$checkInTime' },
              month: { $month: '$checkInTime' },
            },
            hours: { $sum: '$hoursWorked' },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
      ]).exec();

      const earningsByMonth = monthlyData.map((d) => {
        const monthNames = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];
        return {
          month: `${monthNames[d._id.month - 1]} ${d._id.year}`,
          hours: d.hours,
          amount: d.hours * hourlyRate,
        };
      });

      return {
        hourlyRate,
        totalHoursMentored: mentorProfile.totalHoursMentored || 0,
        totalPayouts: mentorProfile.totalPayouts || 0,
        pendingPayout: mentorProfile.pendingPayout || 0,
        earningsByMonth,
      };
    } catch (error: any) {
      logger.error('Get earnings info error:', error);
      throw error;
    }
  }

  /**
   * Get availability schedule
   */
  public async getAvailability(userId: string): Promise<any> {
    try {
      const profile = await MentorProfile.findOne({ userId });
      if (!profile) {
        throw new NotFoundError('Mentor profile not found');
      }
      return {
        availabilityCalendar: profile.availabilityCalendar || [],
        hourlyRate: profile.hourlyRate || 1500,
      };
    } catch (error: any) {
      logger.error('Get availability calendar error:', error);
      throw error;
    }
  }

  /**
   * Update availability calendar and rate
   */
  public async updateAvailability(
    userId: string,
    data: { availabilityCalendar?: any[]; hourlyRate?: number }
  ): Promise<any> {
    try {
      const profile = await MentorProfile.findOne({ userId });
      if (!profile) {
        throw new NotFoundError('Mentor profile not found');
      }

      if (data.availabilityCalendar !== undefined) {
        profile.availabilityCalendar = data.availabilityCalendar;
      }
      if (data.hourlyRate !== undefined) {
        profile.hourlyRate = data.hourlyRate;
      }

      await profile.save();
      return {
        availabilityCalendar: profile.availabilityCalendar,
        hourlyRate: profile.hourlyRate,
      };
    } catch (error: any) {
      logger.error('Update availability calendar error:', error);
      throw error;
    }
  }

  /**
   * Get mentor profile
   */
  public async getProfile(userId: string): Promise<IMentorProfile | null> {
    try {
      return await MentorProfile.findOne({ userId }).populate('userId', 'fullName email phone').exec();
    } catch (error: any) {
      logger.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Update mentor profile
   */
  public async updateProfile(userId: string, data: any): Promise<IMentorProfile> {
    try {
      const profile = await MentorProfile.findOne({ userId });
      if (!profile) {
        throw new NotFoundError('Mentor profile not found');
      }

      const fields = ['bio', 'experienceYears', 'areaOfExpertise', 'currentOrganization', 'linkedIn', 'website', 'specializations', 'linkedinUrl', 'portfolioUrl'];
      for (const field of fields) {
        if (data[field] !== undefined) {
          (profile as any)[field] = data[field];
        }
      }

      await profile.save();
      return profile;
    } catch (error: any) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Submit support query ticket
   */
  public async createSupportTicket(userId: string, data: { subject: string; message: string }): Promise<ISupportTicket> {
    try {
      const ticket = await SupportTicket.create({
        userId,
        subject: data.subject,
        message: data.message,
        status: 'open',
      });
      logger.info(`Support ticket ${ticket._id} created by mentor ${userId}`);
      return ticket;
    } catch (error: any) {
      logger.error('Create support ticket error:', error);
      throw error;
    }
  }

  /**
   * Get support query tickets submitted by mentor
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
   * Update settings account
   */
  public async updateSettingsAccount(userId: string, data: { fullName?: string; phone?: string }): Promise<any> {
    try {
      const user = await User.findById(userId).exec();
      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (data.fullName) user.fullName = data.fullName;
      if (data.phone) user.phone = data.phone;

      await user.save();
      return {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      };
    } catch (error: any) {
      logger.error('Update account settings error:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  public async changePassword(userId: string, data: any): Promise<void> {
    try {
      const user = await User.findById(userId).select('+password').exec();
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const isValid = await user.comparePassword(data.currentPassword);
      if (!isValid) {
        throw new ValidationError('Current password is incorrect');
      }

      user.password = data.newPassword;
      await user.save();
    } catch (error: any) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Get students for mentor
   */
  public async getStudents(userId: string): Promise<any[]> {
    try {
      const mentorProfile = await MentorProfile.findOne({ userId });
      if (!mentorProfile) {
        throw new NotFoundError('Mentor profile not found');
      }

      const mentorProfileId = mentorProfile._id;
      // Get all batches assigned to this mentor
      const batches = await Batch.find({
        $or: [
          { assignedMentorId: mentorProfileId },
          { assignedMentorIds: mentorProfileId },
        ],
      }).exec();

      const batchIds = batches.map((b) => b._id);

      // Get enrolled students across these batches
      const enrollments = await Enrollment.find({ batchId: { $in: batchIds } })
        .populate({ path: 'studentUserId', select: 'fullName email phone' })
        .populate('batchId', 'code')
        .exec();

      return enrollments.map((e: any) => ({
        id: e.studentUserId?._id?.toString() || '',
        name: e.studentUserId?.fullName || 'Student',
        email: e.studentUserId?.email || '',
        phone: e.studentUserId?.phone || '',
        batchCode: e.batchId?.code || 'Unknown',
        attendancePercent: e.attendancePercent,
        avgRubricScore: e.avgRubricScore,
        status: e.status,
      }));
    } catch (error: any) {
      logger.error('Get mentor students error:', error);
      throw error;
    }
  }

  /**
   * Get assigned courses for mentor
   */
  public async getAssignedCourses(userId: string): Promise<any[]> {
    try {
      const user = await User.findById(userId).exec();
      const userName = user?.fullName || '';

      const filter: any = {
        deletedAt: null,
        $or: [
          { 'mentors.userId': new mongoose.Types.ObjectId(userId) },
          { instructorId: userId },
          ...(userName ? [{ 'instructor.name': { $regex: userName, $options: 'i' } }] : []),
        ],
      };

      return await Course.find(filter).sort({ createdAt: -1 }).exec();
    } catch (error) {
      logger.error('Error fetching assigned courses for mentor:', error);
      return [];
    }
  }
}

export const mentorDashboardService = MentorDashboardService.getInstance();
