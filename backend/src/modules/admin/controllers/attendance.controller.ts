import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  Attendance,
  Enrollment,
  User,
} from '@/database/models';
import { ValidationError } from '@/common/errors/ValidationError';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { auditLogService } from '../services/audit-log.service';
import { logger } from '@/common/utils/logger.util';

// Helper to strip time from session Date to get UTC midnight
const normalizeDate = (dateInput: Date | string | number): Date => {
  const d = new Date(dateInput);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export class AttendanceController {
  private static instance: AttendanceController;

  private constructor() {}

  public static getInstance(): AttendanceController {
    if (!AttendanceController.instance) {
      AttendanceController.instance = new AttendanceController();
    }
    return AttendanceController.instance;
  }

  /**
   * POST /api/v1/admin/attendance
   * Mark attendance for students in a batch session
   */
  public async markAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { batchId, sessionDate, records } = req.body;

      if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) {
        throw new ValidationError('Valid batch ID is required');
      }

      if (!sessionDate) {
        throw new ValidationError('Session date is required');
      }

      if (!records || !Array.isArray(records) || records.length === 0) {
        throw new ValidationError('Attendance records array is required and cannot be empty');
      }

      const normDate = normalizeDate(sessionDate);
      const savedRecords: any[] = [];

      for (const rec of records) {
        if (!rec.studentUserId || !mongoose.Types.ObjectId.isValid(rec.studentUserId)) {
          throw new ValidationError(`Invalid student user ID in records: ${rec.studentUserId}`);
        }
        if (!['Present', 'Absent', 'Late', 'Excused'].includes(rec.status)) {
          throw new ValidationError(`Invalid attendance status for student ${rec.studentUserId}: ${rec.status}`);
        }

        const attendance = await Attendance.findOneAndUpdate(
          {
            studentUserId: new mongoose.Types.ObjectId(rec.studentUserId),
            batchId: new mongoose.Types.ObjectId(batchId),
            attendanceDate: normDate,
          },
          {
            status: rec.status,
            remarks: rec.remarks || '',
            markedBy: new mongoose.Types.ObjectId(req.user!.userId),
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).exec();

        savedRecords.push(attendance);
      }

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'attendance.mark',
        batchId,
        { sessionDate: normDate, recordCount: records.length },
        req.ip
      );

      SuccessResponseHelper.ok(res, { records: savedRecords }, 'Attendance marked successfully');
    } catch (error) {
      logger.error('Error marking attendance:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/attendance
   * List attendance records with filters (paginated)
   */
  public async listAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;

      const { batchId, studentId, startDate, endDate, status } = req.query;

      const query: any = {};

      if (batchId && mongoose.Types.ObjectId.isValid(batchId as string)) {
        query.batchId = batchId;
      }

      if (studentId && mongoose.Types.ObjectId.isValid(studentId as string)) {
        query.studentUserId = studentId;
      }

      if (status) {
        query.status = status;
      }

      if (startDate || endDate) {
        query.attendanceDate = {};
        if (startDate) query.attendanceDate.$gte = normalizeDate(startDate as string);
        if (endDate) query.attendanceDate.$lte = normalizeDate(endDate as string);
      }

      const [records, total] = await Promise.all([
        Attendance.find(query)
          .sort({ attendanceDate: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('studentUserId', 'fullName email')
          .populate('batchId', 'code')
          .populate('markedBy', 'fullName email')
          .exec(),
        Attendance.countDocuments(query).exec(),
      ]);

      SuccessResponseHelper.paginated(
        res,
        records,
        { page, limit, total },
        'Attendance records retrieved successfully'
      );
    } catch (error) {
      logger.error('Error listing attendance:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/attendance/batch/:batchId/summary
   * Per-student attendance summary for a specific batch
   */
  public async getBatchAttendanceSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { batchId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(batchId)) {
        throw new ValidationError('Invalid batch ID');
      }

      // Fetch all student enrollments for this batch
      const enrollments = await Enrollment.find({ batchId })
        .populate('studentUserId', 'fullName email phone')
        .exec();

      // Fetch all attendance records for this batch
      const attendanceRecords = await Attendance.find({ batchId }).exec();

      // Find total sessions (distinct attendanceDate count)
      const distinctDates = [...new Set(attendanceRecords.map((r) => r.attendanceDate.getTime()))];
      const totalSessions = distinctDates.length;

      // Group attendance by student
      const studentMap = new Map<string, any[]>();
      for (const record of attendanceRecords) {
        const sId = record.studentUserId.toString();
        if (!studentMap.has(sId)) {
          studentMap.set(sId, []);
        }
        studentMap.get(sId)!.push(record);
      }

      // Compute summary stats per enrolled student
      const summary = enrollments.map((enrollment) => {
        const student = enrollment.studentUserId as any;
        if (!student) {
          return null; // student record deleted or missing
        }

        const studentIdStr = student._id.toString();
        const records = studentMap.get(studentIdStr) || [];

        let present = 0;
        let absent = 0;
        let late = 0;
        let excused = 0;

        for (const r of records) {
          if (r.status === 'Present') present++;
          else if (r.status === 'Absent') absent++;
          else if (r.status === 'Late') late++;
          else if (r.status === 'Excused') excused++;
        }

        // Attendance % matches standard criteria (Present + Late) / totalSessions * 100
        const markedCount = present + absent + late + excused;
        const activeSessions = totalSessions > 0 ? totalSessions : markedCount;
        const attendancePercent = activeSessions > 0
          ? Math.round(((present + late) / activeSessions) * 100)
          : 0;

        return {
          student: {
            _id: student._id,
            fullName: student.fullName,
            email: student.email,
            phone: student.phone,
          },
          present,
          absent,
          late,
          excused,
          total: markedCount,
          attendancePercent,
        };
      }).filter(Boolean);

      SuccessResponseHelper.ok(
        res,
        {
          totalSessions,
          summary,
        },
        'Batch attendance summary retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching batch attendance summary:', error);
      next(error);
    }
  }
}

export const attendanceController = AttendanceController.getInstance();
