import mongoose from 'mongoose';
import { AuditLog, IAuditLog } from '@/database/models';
import { logger } from '@/common/utils/logger.util';

export class AuditLogService {
  private static instance: AuditLogService;

  private constructor() {}

  public static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  /**
   * Create an audit log entry
   * @param performedBy User ID of the admin performing the action
   * @param action Description of the action (e.g., 'batch.create', 'course.publish')
   * @param target Resource identifier or details of what is changed
   * @param changes Optional details of what changed (before/after or delta payload)
   * @param ip Optional IP address of the requester
   */
  public async log(
    performedBy: string | mongoose.Types.ObjectId,
    action: string,
    target: string,
    changes?: any,
    ip?: string
  ): Promise<IAuditLog> {
    try {
      const logEntry = await AuditLog.create({
        performedBy: typeof performedBy === 'string' ? new mongoose.Types.ObjectId(performedBy) : performedBy,
        action,
        target,
        changes,
        ip,
        timestamp: new Date(),
      });

      logger.debug(`AuditLog recorded: ${action} on ${target} by ${performedBy}`);
      return logEntry;
    } catch (error: any) {
      logger.error('Failed to write AuditLog:', error);
      // We don't throw to avoid blocking critical operations if logging fails, but in this system
      // audit logging is critical so we log it heavily.
      throw error;
    }
  }

  /**
   * List audit logs with pagination and filters
   */
  public async listLogs(filters: {
    performedBy?: string;
    action?: string;
    target?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (filters.performedBy && mongoose.Types.ObjectId.isValid(filters.performedBy)) {
      query.performedBy = filters.performedBy;
    }

    if (filters.action) {
      query.action = { $regex: filters.action, $options: 'i' };
    }

    if (filters.target) {
      query.target = { $regex: filters.target, $options: 'i' };
    }

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        query.timestamp.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.timestamp.$lte = new Date(filters.endDate);
      }
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('performedBy', 'fullName email role')
        .exec(),
      AuditLog.countDocuments(query).exec(),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const auditLogService = AuditLogService.getInstance();
