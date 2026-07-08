import { Request, Response, NextFunction } from 'express';
import { auditLogService } from '../services/audit-log.service';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { logger } from '@/common/utils/logger.util';

export class AuditLogController {
  private static instance: AuditLogController;

  private constructor() {}

  public static getInstance(): AuditLogController {
    if (!AuditLogController.instance) {
      AuditLogController.instance = new AuditLogController();
    }
    return AuditLogController.instance;
  }

  /**
   * GET /api/v1/admin/audit-logs
   * List paginated audit logs
   */
  public async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { performedBy, action, target, startDate, endDate } = req.query;

      const result = await auditLogService.listLogs({
        performedBy: performedBy as string,
        action: action as string,
        target: target as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page,
        limit,
      });

      SuccessResponseHelper.paginated(
        res,
        result.logs,
        result.pagination,
        'Audit logs retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching audit logs:', error);
      next(error);
    }
  }
}

export const auditLogController = AuditLogController.getInstance();
