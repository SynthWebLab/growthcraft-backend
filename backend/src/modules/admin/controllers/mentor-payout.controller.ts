import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  User,
  MentorProfile,
  MentorCheckIn,
  MentorPayout,
  Batch,
} from '@/database/models';
import { ValidationError } from '@/common/errors/ValidationError';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { auditLogService } from '../services/audit-log.service';
import { notificationService } from '@/modules/notifications/services/notification.service';
import { logger } from '@/common/utils/logger.util';

export class MentorPayoutController {
  private static instance: MentorPayoutController;

  private constructor() {}

  public static getInstance(): MentorPayoutController {
    if (!MentorPayoutController.instance) {
      MentorPayoutController.instance = new MentorPayoutController();
    }
    return MentorPayoutController.instance;
  }

  /**
   * GET /api/v1/admin/mentors
   * List all mentors with payout statistics
   */
  public async listMentors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const skip = (page - 1) * limit;
      const search = req.query.search as string;

      const userFilter: any = { role: 'mentor' };
      if (search) {
        userFilter.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const [mentorUsers, total] = await Promise.all([
        User.find(userFilter).skip(skip).limit(limit).select('fullName email phone').exec(),
        User.countDocuments(userFilter).exec(),
      ]);

      const mentorIds = mentorUsers.map((u) => u._id);

      const profiles = await MentorProfile.find({ userId: { $in: mentorIds } }).exec();
      const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

      // Aggregate check-in hours for active page mentors
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      const allTimeHoursAggregate = await MentorCheckIn.aggregate([
        { $match: { mentorId: { $in: mentorIds } } },
        { $group: { _id: '$mentorId', totalHours: { $sum: '$hoursWorked' } } },
      ]);
      const allTimeHoursMap = new Map(allTimeHoursAggregate.map((h) => [h._id.toString(), h.totalHours]));

      const thisMonthHoursAggregate = await MentorCheckIn.aggregate([
        {
          $match: {
            mentorId: { $in: mentorIds },
            sessionDate: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        { $group: { _id: '$mentorId', totalHours: { $sum: '$hoursWorked' } } },
      ]);
      const thisMonthHoursMap = new Map(thisMonthHoursAggregate.map((h) => [h._id.toString(), h.totalHours]));

      const mentors = mentorUsers.map((user) => {
        const profile = profileMap.get(user._id.toString());
        return {
          _id: user._id,
          name: user.fullName,
          email: user.email,
          phone: user.phone,
          hourlyRate: profile?.hourlyRate || 0,
          totalHoursThisMonth: parseFloat((thisMonthHoursMap.get(user._id.toString()) || 0).toFixed(2)),
          totalHoursAllTime: parseFloat(
            (allTimeHoursMap.get(user._id.toString()) || profile?.totalHoursMentored || 0).toFixed(2)
          ),
          pendingPayout: profile?.pendingPayout || 0,
          totalPaid: profile?.totalPayouts || 0,
          areaOfExpertise: profile?.areaOfExpertise || 'N/A',
          experienceYears: profile?.experienceYears || 0,
          isVerified: profile?.isVerified || false,
        };
      });

      SuccessResponseHelper.paginated(
        res,
        mentors,
        { page, limit, total },
        'Mentors list retrieved successfully'
      );
    } catch (error) {
      logger.error('Error listing mentors:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/mentors/:mentorId
   * Full profile, batches, check-ins, payout history
   */
  public async getMentorDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mentorId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(mentorId)) {
        throw new ValidationError('Invalid mentor ID');
      }

      const user = await User.findById(mentorId).select('fullName email phone avatar').exec();
      if (!user) {
        throw new NotFoundError('Mentor user not found');
      }

      const profile = await MentorProfile.findOne({ userId: mentorId }).exec();

      const batches = await Batch.find({
        $or: [{ assignedMentorId: mentorId }, { assignedMentorIds: mentorId }],
      })
        .populate('courseId', 'title slug')
        .populate('trainingProgramId', 'title slug')
        .populate('bootcampId', 'title slug')
        .exec();

      const checkIns = await MentorCheckIn.find({ mentorId })
        .sort({ sessionDate: -1 })
        .limit(20)
        .populate('batchId', 'code')
        .exec();

      const payouts = await MentorPayout.find({ mentorId })
        .sort({ processedAt: -1 })
        .limit(20)
        .exec();

      SuccessResponseHelper.ok(
        res,
        {
          user,
          profile,
          batches,
          checkIns,
          payouts,
        },
        'Mentor details retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching mentor details:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/mentors/:mentorId/check-ins
   * Paginated check-in records for a mentor
   */
  public async getMentorCheckIns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mentorId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(mentorId)) {
        throw new ValidationError('Invalid mentor ID');
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const skip = (page - 1) * limit;

      const { batchId, startDate, endDate, verified } = req.query;

      const query: any = { mentorId };

      if (batchId && mongoose.Types.ObjectId.isValid(batchId as string)) {
        query.batchId = batchId;
      }

      if (startDate || endDate) {
        query.sessionDate = {};
        if (startDate) query.sessionDate.$gte = new Date(startDate as string);
        if (endDate) query.sessionDate.$lte = new Date(endDate as string);
      }

      if (verified !== undefined) {
        if (verified === 'true') {
          query.verifiedBy = { $ne: null };
        } else {
          query.verifiedBy = null;
        }
      }

      const [checkIns, total] = await Promise.all([
        MentorCheckIn.find(query)
          .sort({ sessionDate: -1 })
          .skip(skip)
          .limit(limit)
          .populate('batchId', 'code')
          .populate('verifiedBy', 'fullName email')
          .exec(),
        MentorCheckIn.countDocuments(query).exec(),
      ]);

      SuccessResponseHelper.paginated(
        res,
        checkIns,
        { page, limit, total },
        'Mentor check-ins retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching mentor check-ins:', error);
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/mentors/:mentorId/check-ins/:checkInId/verify
   * Verify mentor hours and credit to pending payouts
   */
  public async verifyCheckIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mentorId, checkInId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(mentorId) || !mongoose.Types.ObjectId.isValid(checkInId)) {
        throw new ValidationError('Invalid ID parameters');
      }

      const checkIn = await MentorCheckIn.findOne({ _id: checkInId, mentorId }).exec();
      if (!checkIn) {
        throw new NotFoundError('Check-in record not found');
      }

      if (checkIn.verifiedBy) {
        throw new ValidationError('Check-in record has already been verified');
      }

      const profile = await MentorProfile.findOne({ userId: mentorId }).exec();
      if (!profile) {
        throw new NotFoundError('Mentor profile not found');
      }

      // Verify check-in
      checkIn.verifiedBy = new mongoose.Types.ObjectId(req.user!.userId);
      await checkIn.save();

      // Accumulate payout details
      const hourlyRate = profile.hourlyRate || 0;
      const earned = checkIn.hoursWorked * hourlyRate;

      profile.pendingPayout = (profile.pendingPayout || 0) + earned;
      profile.totalHoursMentored = (profile.totalHoursMentored || 0) + checkIn.hoursWorked;
      await profile.save();

      // Trigger notification for mentor
      try {
        await notificationService.createNotification(
          mentorId,
          'mentor.checkin.verified',
          {
            checkInId: checkIn._id,
            hoursWorked: checkIn.hoursWorked,
            earned,
            pendingPayout: profile.pendingPayout,
          }
        );
      } catch (err) {
        logger.error('Failed to trigger check-in verification notification:', err);
      }

      // Log in AuditLog
      await auditLogService.log(
        req.user!.userId,
        'mentor.checkin.verify',
        checkInId,
        { mentorId, hours: checkIn.hoursWorked, earned, hourlyRate },
        req.ip
      );

      SuccessResponseHelper.ok(res, { checkIn, profile }, 'Check-in verified successfully');
    } catch (error) {
      logger.error('Error verifying check-in:', error);
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/mentors/:mentorId/payout
   * Record a payout
   */
  public async recordPayout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mentorId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(mentorId)) {
        throw new ValidationError('Invalid mentor ID');
      }

      const { amount, period, notes } = req.body;
      const parsedAmount = parseFloat(amount);

      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new ValidationError('Payout amount must be a positive number');
      }

      if (!period) {
        throw new ValidationError('Payout period is required (e.g. "June 2026")');
      }

      const profile = await MentorProfile.findOne({ userId: mentorId }).exec();
      if (!profile) {
        throw new NotFoundError('Mentor profile not found');
      }

      // Fetch batch IDs covered by this period (optional helper)
      const batchIds = await Batch.find({
        $or: [{ assignedMentorId: mentorId }, { assignedMentorIds: mentorId }],
      }).distinct('_id');

      const hourlyRate = profile.hourlyRate || 0;
      const hoursForPeriod = hourlyRate > 0 ? parseFloat((parsedAmount / hourlyRate).toFixed(2)) : 0;

      const payout = await MentorPayout.create({
        mentorId,
        amount: parsedAmount,
        period,
        hoursForPeriod,
        hourlyRate,
        batchIds,
        status: 'processed',
        processedBy: req.user!.userId,
        notes,
        processedAt: new Date(),
      });

      profile.pendingPayout = Math.max(0, (profile.pendingPayout || 0) - parsedAmount);
      profile.totalPayouts = (profile.totalPayouts || 0) + parsedAmount;
      await profile.save();

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'mentor.payout.record',
        mentorId,
        { payoutId: payout._id, amount: parsedAmount, period },
        req.ip
      );

      SuccessResponseHelper.created(res, { payout, profile }, 'Payout recorded successfully');
    } catch (error) {
      logger.error('Error recording payout:', error);
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/mentor-payouts/:payoutId/approve
   * Approve a pending mentor withdrawal request → moves it from pending → processed
   */
  public async approvePayout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { payoutId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(payoutId)) {
        throw new ValidationError('Invalid payout ID');
      }

      const payout = await MentorPayout.findById(payoutId).exec();
      if (!payout) {
        throw new NotFoundError('Payout request not found');
      }

      if (payout.status === 'processed') {
        throw new ValidationError('This payout has already been processed');
      }

      const profile = await MentorProfile.findOne({ userId: payout.mentorId }).exec();
      if (!profile) {
        throw new NotFoundError('Mentor profile not found');
      }

      // Mark payout as processed
      payout.status = 'processed';
      payout.processedBy = new mongoose.Types.ObjectId(req.user!.userId);
      payout.processedAt = new Date();
      if (req.body?.notes) payout.notes = req.body.notes;
      await payout.save();

      // Add to totalPayouts (pendingPayout was already deducted at request time)
      profile.totalPayouts = (profile.totalPayouts || 0) + payout.amount;
      await profile.save();

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'mentor.payout.approve',
        payout.mentorId.toString(),
        { payoutId: payout._id, amount: payout.amount },
        req.ip
      );

      SuccessResponseHelper.ok(res, { payout }, `Payout of INR ${payout.amount} approved successfully`);
    } catch (error) {
      logger.error('Error approving payout:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/mentors/:mentorId/payouts
   * Payout history for a single mentor
   */
  public async getMentorPayouts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mentorId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(mentorId)) {
        throw new ValidationError('Invalid mentor ID');
      }

      const payouts = await MentorPayout.find({ mentorId })
        .sort({ createdAt: -1 })
        .populate('processedBy', 'fullName email')
        .exec();

      SuccessResponseHelper.ok(res, { payouts }, 'Mentor payouts retrieved successfully');
    } catch (error) {
      logger.error('Error fetching mentor payouts:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/mentor-payouts
   * Global payout overview
   */
  public async getGlobalPayoutOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { month } = req.query; // Filter period, e.g. "June 2026"

      // Total pending across all mentors
      const pendingAggregate = await MentorProfile.aggregate([
        { $group: { _id: null, totalPending: { $sum: '$pendingPayout' } } },
      ]);
      const totalPending = pendingAggregate[0]?.totalPending || 0;

      // Filter paid
      const query: any = {};
      if (month) {
        query.period = month;
      } else {
        // Default to current calendar month (e.g. "July 2026")
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const date = new Date();
        query.period = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      }

      const paidAggregate = await MentorPayout.aggregate([
        { $match: query },
        { $group: { _id: null, totalPaid: { $sum: '$amount' } } },
      ]);
      const totalPaidThisMonth = paidAggregate[0]?.totalPaid || 0;

      // Fetch the actual payouts matching the query
      const payoutsList = await MentorPayout.find(query)
        .populate('mentorId', 'fullName email')
        .populate('processedBy', 'fullName email')
        .sort({ processedAt: -1 })
        .exec();

      SuccessResponseHelper.ok(
        res,
        {
          totalPending,
          totalPaidThisMonth,
          selectedPeriod: query.period,
          payouts: payoutsList,
        },
        'Global payout overview retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching global payout overview:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/mentors/:mentorId/availability
   * Get availability calendar and assigned batches
   */
  public async getMentorAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mentorId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(mentorId)) {
        throw new ValidationError('Invalid mentor ID');
      }

      const profile = await MentorProfile.findOne({ userId: mentorId }).select('availabilityCalendar availability').exec();
      if (!profile) {
        throw new NotFoundError('Mentor profile not found');
      }

      const batches = await Batch.find({
        $or: [{ assignedMentorId: mentorId }, { assignedMentorIds: mentorId }],
        status: { $ne: 'Cancelled' },
      })
        .populate('courseId', 'title slug')
        .populate('trainingProgramId', 'title slug')
        .populate('bootcampId', 'title slug')
        .select('code startDate endDate status batchType')
        .exec();

      SuccessResponseHelper.ok(
        res,
        {
          availabilityCalendar: profile.availabilityCalendar || [],
          weeklyAvailability: profile.availability || [],
          assignedBatches: batches,
        },
        'Mentor availability calendar retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching mentor availability:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/mentors/available
   * Find mentors whose availability matches and are not assigned to conflicting batches
   */
  public async getAvailableMentors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date: dateStr, batchType, specialization } = req.query;

      if (!dateStr) {
        throw new ValidationError('Date query parameter is required (YYYY-MM-DD)');
      }

      const targetDate = new Date(dateStr as string);
      if (isNaN(targetDate.getTime())) {
        throw new ValidationError('Invalid date format');
      }

      const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const targetDayName = dayNames[dayOfWeek];

      // Build mentor search query
      const profileQuery: any = {};
      if (specialization) {
        profileQuery.$or = [
          { areaOfExpertise: specialization },
          { specializations: specialization },
        ];
      }

      // Find all potential mentors matching specialization
      const profiles = await MentorProfile.find(profileQuery).populate('userId', 'fullName email phone').exec();

      const availableMentors: any[] = [];

      for (const profile of profiles) {
        // 1. Check availability for target day of week
        let isAvailable = false;

        // Check availabilityCalendar override first
        const calendarOverride = profile.availabilityCalendar?.find((c) => c.dayOfWeek === dayOfWeek);
        if (calendarOverride !== undefined) {
          isAvailable = calendarOverride.isAvailable;
        } else {
          // Check standard weekly slots
          const weeklySlot = profile.availability?.find((a) => a.day === targetDayName);
          isAvailable = !!(weeklySlot && weeklySlot.slots.length > 0);
        }

        if (!isAvailable) {
          continue; // Mentor is not available on this day
        }

        // 2. Check conflicting active batches on targetDate
        const conflictingBatch = await Batch.findOne({
          $or: [{ assignedMentorId: profile.userId._id }, { assignedMentorIds: profile.userId._id }],
          startDate: { $lte: targetDate },
          endDate: { $gte: targetDate },
          status: { $in: ['Open', 'Filling', 'Full', 'InProgress'] },
        }).exec();

        if (conflictingBatch) {
          continue; // Mentor is busy with an active batch on this date
        }

        availableMentors.push({
          mentorId: profile.userId._id,
          name: (profile.userId as any).fullName,
          email: (profile.userId as any).email,
          phone: (profile.userId as any).phone,
          areaOfExpertise: profile.areaOfExpertise,
          hourlyRate: profile.hourlyRate || 0,
          experienceYears: profile.experienceYears,
        });
      }

      SuccessResponseHelper.ok(res, { mentors: availableMentors }, 'Available mentors list retrieved successfully');
    } catch (error) {
      logger.error('Error querying available mentors:', error);
      next(error);
    }
  }
}

export const mentorPayoutController = MentorPayoutController.getInstance();
