import mongoose from 'mongoose';
import { MentorProfile, IMentorProfile } from '@/database/models/MentorProfile.model';
import { User } from '@/database/models/User.model';
import { Batch, IBatch, BatchStatus } from '@/database/models/Batch.model';
import { Enrollment } from '@/database/models/Enrollment.model';
import { MentorCheckIn, IMentorCheckIn } from '@/database/models/MentorCheckIn.model';
import { MentorPayout } from '@/database/models/MentorPayout.model';
import { Attendance } from '@/database/models/Attendance.model';
import { ProgressNote, IProgressNote } from '@/database/models/ProgressNote.model';
import { SupportTicket, ISupportTicket } from '@/database/models/SupportTicket.model';
import { Course } from '@/database/models/Course.model';
import { logger } from '@/common/utils/logger.util';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { ValidationError } from '@/common/errors/ValidationError';
import { auditLogService } from '@/modules/admin/services/audit-log.service';
import { notificationService } from '@/modules/notifications/services/notification.service';
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
  /**
   * Get mentor dashboard summary
   */
  public async getDashboard(userId: string): Promise<any> {
    try {
      const mentorProfile = await MentorProfile.findOne({ userId });
      if (!mentorProfile) {
        throw new NotFoundError('Mentor profile not found');
      }

      // 1. Total sessions / check-ins completed
      const sessionsDelivered = await MentorCheckIn.countDocuments({
        mentorId: userId,
        status: 'checked-out',
      });

      // 2. Today sessions count and items
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const todayCheckIns = await MentorCheckIn.find({
        mentorId: userId,
        sessionDate: { $gte: startOfToday, $lte: endOfToday },
      })
        .populate('batchId', 'code')
        .exec();

      const todaySessions = todayCheckIns.map((c: any) => ({
        id: c._id.toString(),
        student: c.batchId?.code ? `Batch ${c.batchId.code}` : 'Campus Batch',
        time: c.checkInTime ? new Date(c.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
        course: c.batchId?.code || 'Offline Batch',
        duration: `${c.hoursWorked || 0} hrs`,
      }));

      // 3. Earnings trend for past 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const hourlyRate = mentorProfile.hourlyRate || 1500;

      const monthlyAgg = await MentorCheckIn.aggregate([
        {
          $match: {
            mentorId: new mongoose.Types.ObjectId(userId),
            status: 'checked-out',
            sessionDate: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$sessionDate' },
              month: { $month: '$sessionDate' },
            },
            hours: { $sum: '$hoursWorked' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]).exec();

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const earningsTrend = monthlyAgg.map((m) => ({
        month: `${monthNames[m._id.month - 1]} ${m._id.year}`,
        amount: m.hours * hourlyRate,
      }));

      // 4. Recent reviews / feedback from ProgressNote
      const recentNotes = await ProgressNote.find({ mentorId: userId })
        .populate('studentUserId', 'fullName')
        .sort({ noteDate: -1 })
        .limit(5)
        .exec();

      const recentReviews = recentNotes.map((n: any) => ({
        student: n.studentUserId?.fullName || 'Student',
        rating: Math.min(5, Math.max(1, Math.round(n.rubricScore / 2))),
        text: n.feedback || 'Great session performance',
        date: n.noteDate ? new Date(n.noteDate).toLocaleDateString() : 'Recent',
      }));

      // 5. Total earnings
      const totalEarnings = (mentorProfile.totalPayouts || 0) + (mentorProfile.pendingPayout || 0);

      return {
        counts: {
          sessionsDelivered,
          totalEarnings,
          avgRating: mentorProfile.rating || 4.8,
          todaySessionsCount: todaySessions.length,
        },
        todaySessions,
        earningsTrend,
        recentReviews,
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
      const now = new Date();

      // Group monthly check-ins for earnings breakdown
      const monthlyAgg = await MentorCheckIn.aggregate([
        { $match: { mentorId: new mongoose.Types.ObjectId(userId), status: 'checked-out' } },
        {
          $group: {
            _id: {
              year: { $year: '$sessionDate' },
              month: { $month: '$sessionDate' },
            },
            sessionsCount: { $sum: 1 },
            hours: { $sum: '$hoursWorked' },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
      ]).exec();

      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];

      let thisMonthAmount = 0;

      const monthlyData = monthlyAgg.map((d) => {
        const monthLabel = `${monthNames[d._id.month - 1]} ${d._id.year}`;
        const baseAmount = d.hours * hourlyRate;
        const bonus = 0;
        const total = baseAmount + bonus;

        if (d._id.year === now.getFullYear() && d._id.month === now.getMonth() + 1) {
          thisMonthAmount = total;
        }

        return {
          month: monthLabel,
          sessions: d.sessionsCount,
          amount: baseAmount,
          bonus,
          total,
        };
      });

      // Fetch payout history for this mentor
      const payoutDocs = await MentorPayout.find({ mentorId: userId })
        .sort({ createdAt: -1 })
        .exec();

      const payouts = payoutDocs.map((p) => ({
        date: p.processedAt ? p.processedAt.toISOString().split('T')[0] : p.createdAt.toISOString().split('T')[0],
        amount: p.amount,
        status: p.status === 'processed' ? ('completed' as const) : ('pending' as const),
        txnId: p._id.toString(),
      }));

      const pendingPayout = mentorProfile.pendingPayout || 0;
      const lifetime = (mentorProfile.totalPayouts || 0) + pendingPayout;

      return {
        summary: {
          thisMonth: thisMonthAmount,
          pendingPayout,
          lifetime,
        },
        monthlyData,
        payouts,
      };
    } catch (error: any) {
      logger.error('Get earnings info error:', error);
      throw error;
    }
  }

  /**
   * Submit withdrawal request
   */
  public async withdrawEarnings(userId: string, data?: { amount?: number; paymentMethod?: string; paymentDetails?: string }): Promise<any> {
    try {
      const mentorProfile = await MentorProfile.findOne({ userId });
      if (!mentorProfile) {
        throw new NotFoundError('Mentor profile not found');
      }

      const currentPending = mentorProfile.pendingPayout || 0;
      if (currentPending <= 0) {
        throw new ValidationError('No pending payout balance available for withdrawal');
      }

      const requestedAmount = data?.amount && data.amount > 0 && data.amount <= currentPending ? data.amount : currentPending;

      const now = new Date();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const period = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

      const notesStr = data?.paymentDetails ? `${data.paymentMethod || 'Withdrawal'}: ${data.paymentDetails}` : 'Requested via Mentor Portal';

      const payoutRecord = await MentorPayout.create({
        mentorId: userId,
        amount: requestedAmount,
        period,
        hourlyRate: mentorProfile.hourlyRate || 0,
        status: 'pending',
        notes: notesStr,
      });

      mentorProfile.pendingPayout = Math.max(0, currentPending - requestedAmount);
      await mentorProfile.save();

      // Record audit log
      await auditLogService.log(
        userId,
        'mentor.withdraw.request',
        userId,
        { amount: requestedAmount, payoutId: payoutRecord._id },
        '0.0.0.0'
      );

      // Create notification for mentor
      try {
        await notificationService.createNotification(
          userId,
          'mentor.withdraw.requested',
          { amount: requestedAmount }
        );
      } catch (err) {
        logger.error('Failed to trigger withdrawal notification:', err);
      }

      return {
        payoutId: payoutRecord._id.toString(),
        amountRequested: requestedAmount,
        status: 'pending',
      };
    } catch (error: any) {
      logger.error('Withdraw earnings service error:', error);
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
        course: e.batchId?.code ? `Batch ${e.batchId.code}` : 'Training Cohort',
        sessionsCompleted: e.attendancePercent ? Math.round((e.attendancePercent / 100) * 10) : 0,
        lastSession: e.updatedAt ? new Date(e.updatedAt).toLocaleDateString() : 'N/A',
        nextSession: 'Scheduled',
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
