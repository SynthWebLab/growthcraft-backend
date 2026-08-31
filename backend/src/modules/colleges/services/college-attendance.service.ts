import mongoose from 'mongoose';
import { CollegeProfile } from '@/database/models/CollegeProfile.model';
import { Attendance } from '@/database/models/Attendance.model';
import { Batch } from '@/database/models/Batch.model';
import { User } from '@/database/models/User.model';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { logger } from '@/common/utils/logger.util';

export class CollegeAttendanceService {
  private static instance: CollegeAttendanceService;

  private constructor() {}

  public static getInstance(): CollegeAttendanceService {
    if (!CollegeAttendanceService.instance) {
      CollegeAttendanceService.instance = new CollegeAttendanceService();
    }
    return CollegeAttendanceService.instance;
  }

  /**
   * GET /api/v1/colleges/attendance
   * Returns attendance data for students belonging to this college.
   */
  public async getAttendance(
    collegeUserId: string,
    filters: {
      batchId?: string;
      studentId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ records: any[]; total: number; page: number; limit: number }> {
    try {
      const college = await CollegeProfile.findOne({ userId: collegeUserId }).exec();
      if (!college) {
        throw new NotFoundError('College profile not found');
      }

      const registeredIds = college.registeredStudents || [];
      if (registeredIds.length === 0) {
        return { records: [], total: 0, page: filters.page || 1, limit: filters.limit || 10 };
      }

      const query: any = { studentUserId: { $in: registeredIds } };
      if (filters.batchId && mongoose.isValidObjectId(filters.batchId)) {
        query.batchId = new mongoose.Types.ObjectId(filters.batchId);
      }
      if (filters.studentId && mongoose.isValidObjectId(filters.studentId)) {
        query.studentUserId = new mongoose.Types.ObjectId(filters.studentId);
      }
      if (filters.startDate || filters.endDate) {
        query.attendanceDate = {};
        if (filters.startDate) {
          query.attendanceDate.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.attendanceDate.$lte = new Date(filters.endDate);
        }
      }

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      const records = await Attendance.find(query)
        .populate({ path: 'studentUserId', select: 'fullName email' })
        .populate({
          path: 'batchId',
          select: 'code courseId trainingProgramId bootcampId',
          populate: [
            { path: 'courseId', select: 'title' },
            { path: 'trainingProgramId', select: 'title' },
            { path: 'bootcampId', select: 'title' },
          ],
        })
        .sort({ attendanceDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      const total = await Attendance.countDocuments(query);

      const mapped = records.map((rec) => {
        const student: any = rec.studentUserId;
        const batch: any = rec.batchId;
        let batchTitle = 'Batch ' + (batch?.code || '');
        if (batch) {
          const program: any = batch.courseId || batch.trainingProgramId || batch.bootcampId;
          if (program?.title) {
            batchTitle = `${program.title} (${batch.code})`;
          }
        }
        return {
          studentName: student?.fullName || 'Unknown Student',
          batchTitle,
          attendanceDate: rec.attendanceDate,
          status: rec.status,
          remarks: rec.remarks || '',
        };
      });

      return { records: mapped, total, page, limit };
    } catch (error: any) {
      logger.error('Get college attendance error:', error);
      throw error;
    }
  }

  /**
   * GET /api/v1/colleges/attendance/summary
   * Aggregated view: per-student attendance percentage per batch
   */
  public async getAttendanceSummary(collegeUserId: string): Promise<any[]> {
    try {
      const college = await CollegeProfile.findOne({ userId: collegeUserId }).exec();
      if (!college) {
        throw new NotFoundError('College profile not found');
      }

      const registeredIds = college.registeredStudents || [];
      if (registeredIds.length === 0) {
        return [];
      }

      const summaryList = await Attendance.aggregate([
        { $match: { studentUserId: { $in: registeredIds } } },
        {
          $group: {
            _id: { studentUserId: '$studentUserId', batchId: '$batchId' },
            totalSessions: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
            absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
            late: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
          },
        },
      ]);

      const studentIds = summaryList.map((s) => s._id.studentUserId);
      const students = await User.find({ _id: { $in: studentIds } }).select('fullName email').lean();
      const studentMap = new Map(students.map((s) => [String(s._id), s]));

      const batchIds = summaryList.map((s) => s._id.batchId);
      const batches = await Batch.find({ _id: { $in: batchIds } })
        .select('code courseId trainingProgramId bootcampId')
        .populate({ path: 'courseId', select: 'title' })
        .populate({ path: 'trainingProgramId', select: 'title' })
        .populate({ path: 'bootcampId', select: 'title' })
        .lean()
        .exec();
      const batchMap = new Map(batches.map((b) => [String(b._id), b]));

      return summaryList.map((s) => {
        const student = studentMap.get(String(s._id.studentUserId));
        const batch = batchMap.get(String(s._id.batchId));
        let batchTitle = 'Batch ' + (batch?.code || '');
        if (batch) {
          const program: any = batch.courseId || batch.trainingProgramId || batch.bootcampId;
          if (program?.title) {
            batchTitle = `${program.title} (${batch.code})`;
          }
        }
        const attended = s.present + s.late;
        const attendancePercent = s.totalSessions > 0 ? Math.round((attended / s.totalSessions) * 100) : 0;
        return {
          studentName: student?.fullName || 'Unknown Student',
          batchTitle,
          totalSessions: s.totalSessions,
          present: s.present,
          absent: s.absent,
          late: s.late,
          attendancePercent,
        };
      });
    } catch (error: any) {
      logger.error('Get college attendance summary error:', error);
      throw error;
    }
  }
}

export const collegeAttendanceService = CollegeAttendanceService.getInstance();
