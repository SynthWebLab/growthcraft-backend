import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  Enrollment,
  MentorPayout,
  Batch,
  User,
  Course,
  EnrollmentStatus,
  PaymentTransaction,
  PaymentStatus,
  PaymentItemType,
} from '@/database/models';
import { ValidationError } from '@/common/errors/ValidationError';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { logger } from '@/common/utils/logger.util';

// Helper to parse month parameters to date ranges
const parseMonthToDateRange = (monthStr: string): { start: Date; end: Date } => {
  let start: Date;
  let end: Date;

  // Format: "YYYY-MM" (e.g., "2026-06")
  if (/^\d{4}-\d{2}$/.test(monthStr)) {
    const [year, month] = monthStr.split('-').map(Number);
    start = new Date(Date.UTC(year, month - 1, 1));
    end = new Date(Date.UTC(year, month, 1));
  } else {
    // Format: "Month YYYY" (e.g., "June 2026")
    const parts = monthStr.split(' ');
    if (parts.length === 2) {
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      const monthIndex = monthNames.indexOf(parts[0].toLowerCase());
      const year = parseInt(parts[1]);
      if (monthIndex !== -1 && !isNaN(year)) {
        start = new Date(Date.UTC(year, monthIndex, 1));
        end = new Date(Date.UTC(year, monthIndex + 1, 1));
        return { start, end };
      }
    }
    throw new ValidationError('Invalid month format. Use "YYYY-MM" or "Month YYYY"');
  }

  return { start, end };
};

export class AnalyticsController {
  private static instance: AnalyticsController;

  private constructor() {}

  public static getInstance(): AnalyticsController {
    if (!AnalyticsController.instance) {
      AnalyticsController.instance = new AnalyticsController();
    }
    return AnalyticsController.instance;
  }

  /**
   * GET /api/v1/admin/revenue
   * Revenue overview (SuperAdmin only)
   */
  public async getRevenueReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { month, batchType } = req.query;

      let transactionFilter: any = {
        status: PaymentStatus.CAPTURED,
      };
      let payoutFilter: any = {
        status: 'processed',
      };

      // 1. Date Range filtering
      if (month) {
        const { start, end } = parseMonthToDateRange(month as string);
        transactionFilter.createdAt = { $gte: start, $lt: end };
        payoutFilter.processedAt = { $gte: start, $lt: end };
      }

      // 2. Batch Type filtering
      if (batchType) {
        if (batchType === 'Course') {
          transactionFilter.itemType = PaymentItemType.COURSE;
        } else if (batchType === 'TrainingProgram') {
          transactionFilter.itemType = PaymentItemType.TRAINING_PROGRAM;
        } else if (batchType === 'Bootcamp') {
          transactionFilter.itemType = { $in: [PaymentItemType.BOOTCAMP, PaymentItemType.WORKSHOP, PaymentItemType.HACKATHON] };
        }

        // Find batches matching batchType
        const batches = await Batch.find({ batchType }).distinct('_id');
        payoutFilter.batchIds = { $in: batches };
      }

      // Calculate total collected
      const transactions = await PaymentTransaction.find(transactionFilter).select('amount').exec();
      const totalCollected = transactions.reduce((sum, item) => sum + (item.amount || 0), 0);

      // Calculate total payouts
      const payouts = await MentorPayout.find(payoutFilter).select('amount').exec();
      const totalMentorCosts = payouts.reduce((sum, item) => sum + (item.amount || 0), 0);

      const margin = totalCollected - totalMentorCosts;
      const marginPercent = totalCollected > 0 ? parseFloat(((margin / totalCollected) * 100).toFixed(2)) : 0;

      SuccessResponseHelper.ok(
        res,
        {
          totalCollected: parseFloat(totalCollected.toFixed(2)),
          totalMentorCosts: parseFloat(totalMentorCosts.toFixed(2)),
          margin: parseFloat(margin.toFixed(2)),
          marginPercent,
          filtersApplied: {
            month: month || 'All time',
            batchType: batchType || 'All types',
          },
        },
        'Revenue report retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching revenue report:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/analytics
   * Analytics overview
   */
  public async getAnalyticsOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Enrollments count
      const totalEnrollments = await Enrollment.countDocuments({
        status: { $in: [EnrollmentStatus.CONFIRMED, EnrollmentStatus.COMPLETED] },
      }).exec();

      // 2. Total active users count and users grouped by role
      const usersByRoleAggregate = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]);
      const usersByRole = usersByRoleAggregate.reduce((acc: any, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      // 3. Top performing courses
      const topCoursesAggregate = await Enrollment.aggregate([
        { $match: { status: { $in: [EnrollmentStatus.CONFIRMED, EnrollmentStatus.COMPLETED] } } },
        { $group: { _id: '$batchId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      const topCoursesList = [];
      for (const item of topCoursesAggregate) {
        const batch = await Batch.findById(item._id)
          .populate('courseId', 'title slug')
          .populate('trainingProgramId', 'title slug')
          .populate('bootcampId', 'title slug')
          .exec() as any;

        if (batch) {
          const parent = batch.courseId || batch.trainingProgramId || batch.bootcampId;
          topCoursesList.push({
            batchCode: batch.code,
            title: parent ? parent.title : 'Unnamed Batch',
            type: batch.batchType,
            enrollmentsCount: item.count,
          });
        }
      }

      // 4. Monthly enrollment trends
      const trendsAggregate = await Enrollment.aggregate([
        { $match: { status: { $in: [EnrollmentStatus.CONFIRMED, EnrollmentStatus.COMPLETED] } } },
        {
          $group: {
            _id: {
              year: { $year: '$enrolledAt' },
              month: { $month: '$enrolledAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 6 },
      ]);

      const monthlyTrends = trendsAggregate.map((item) => {
        const monthNames = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        return {
          month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
          enrollments: item.count,
        };
      }).reverse();

      SuccessResponseHelper.ok(
        res,
        {
          totalEnrollments,
          usersByRole,
          topCourses: topCoursesList,
          monthlyTrends,
        },
        'Analytics overview retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching analytics overview:', error);
      next(error);
    }
  }
}

export const analyticsController = AnalyticsController.getInstance();
