import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { collegeDashboardService, StudentStatus } from '../services/college-dashboard.service';
import { PartnershipTier } from '@/database/models/CollegeProfile.model';
import { logger } from '@/common/utils/logger.util';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { ValidationError } from '@/common/errors/ValidationError';

export class CollegeDashboardController {
  private static instance: CollegeDashboardController;

  private constructor() {}

  public static getInstance(): CollegeDashboardController {
    if (!CollegeDashboardController.instance) {
      CollegeDashboardController.instance = new CollegeDashboardController();
    }
    return CollegeDashboardController.instance;
  }

  private getUserId(req: Request): string {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ValidationError('User authentication required');
    }
    return userId;
  }

  private assertValid(req: Request): void {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = errors.array().map((err: any) => ({
        field: err.path || err.param || 'unknown',
        message: err.msg,
        value: err.value,
      }));
      throw new ValidationError('Validation failed', validationErrors);
    }
  }

  /**
   * GET /api/v1/colleges/dashboard
   */
  public async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const dashboard = await collegeDashboardService.getDashboard(userId);
      SuccessResponseHelper.ok(res, dashboard, 'Dashboard retrieved successfully');
    } catch (error: any) {
      logger.error('Get college dashboard controller error:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/colleges/students
   */
  public async getStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.assertValid(req);
      const userId = this.getUserId(req);

      const status =
        typeof req.query.status === 'string' ? (req.query.status as StudentStatus) : undefined;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const {
        students,
        total,
        page: resolvedPage,
        limit: resolvedLimit,
      } = await collegeDashboardService.getStudents(userId, { status, search, page, limit });

      SuccessResponseHelper.paginated(
        res,
        students,
        { page: resolvedPage, limit: resolvedLimit, total },
        'Students retrieved successfully'
      );
    } catch (error: any) {
      logger.error('Get college students controller error:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/colleges/cohort
   */
  public async getCohort(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const cohort = await collegeDashboardService.getCohortStatus(userId);
      SuccessResponseHelper.ok(res, cohort, 'Cohort status retrieved successfully');
    } catch (error: any) {
      logger.error('Get college cohort controller error:', error);
      next(error);
    }
  }

  /**
   * POST /api/v1/colleges/students/import
   */
  public async importStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.assertValid(req);
      const userId = this.getUserId(req);
      const { students, csv, eventIds, defaultPassword } = req.body;
      const result = await collegeDashboardService.importStudents(userId, {
        students,
        csv,
        eventIds,
        defaultPassword,
      });
      SuccessResponseHelper.created(res, result, 'Students imported successfully');
    } catch (error: any) {
      logger.error('Import college students controller error:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/colleges/profile
   */
  public async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const profile = await collegeDashboardService.getProfile(userId);
      SuccessResponseHelper.ok(res, { profile }, 'Profile retrieved successfully');
    } catch (error: any) {
      logger.error('Get college profile controller error:', error);
      next(error);
    }
  }

  /**
   * PUT /api/v1/colleges/profile
   */
  public async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.assertValid(req);
      const userId = this.getUserId(req);
      const profile = await collegeDashboardService.updateProfile(userId, req.body);
      SuccessResponseHelper.ok(res, { profile }, 'Profile updated successfully');
    } catch (error: any) {
      logger.error('Update college profile controller error:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/colleges/partnership
   */
  public async getPartnership(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const partnership = await collegeDashboardService.getPartnership(userId);
      SuccessResponseHelper.ok(res, partnership, 'Partnership details retrieved successfully');
    } catch (error: any) {
      logger.error('Get college partnership controller error:', error);
      next(error);
    }
  }

  /**
   * POST /api/v1/colleges/subscription
   */
  public async subscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.assertValid(req);
      const userId = this.getUserId(req);
      const { tier } = req.body as { tier: PartnershipTier };
      const cohort = await collegeDashboardService.activateSubscription(userId, tier);
      SuccessResponseHelper.ok(res, cohort, `Subscription activated on ${tier}`);
    } catch (error: any) {
      logger.error('College subscribe controller error:', error);
      next(error);
    }
  }

  /**
   * POST /api/v1/colleges/partnership/upgrade-request
   */
  public async requestUpgrade(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.assertValid(req);
      const userId = this.getUserId(req);
      const { requestedTier, note } = req.body as { requestedTier: PartnershipTier; note?: string };
      const request = await collegeDashboardService.requestUpgrade(userId, { requestedTier, note });
      SuccessResponseHelper.created(
        res,
        { request },
        'Upgrade request sent. Your SPOC will reach out shortly.'
      );
    } catch (error: any) {
      logger.error('College upgrade request controller error:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/colleges/reports
   */
  public async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const reports = await collegeDashboardService.getReports(userId);
      SuccessResponseHelper.ok(res, { reports }, 'Reports retrieved successfully');
    } catch (error: any) {
      logger.error('Get college reports controller error:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/colleges/settings
   */
  public async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const settings = await collegeDashboardService.getSettings(userId);
      SuccessResponseHelper.ok(res, settings, 'Settings retrieved successfully');
    } catch (error: any) {
      logger.error('Get college settings controller error:', error);
      next(error);
    }
  }

  /**
   * PUT /api/v1/colleges/settings/account
   */
  public async updateAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.assertValid(req);
      const userId = this.getUserId(req);
      const { institutionName, phone } = req.body as {
        institutionName?: string;
        phone?: string;
      };
      const account = await collegeDashboardService.updateAccount(userId, {
        institutionName,
        phone,
      });
      SuccessResponseHelper.ok(res, account, 'Account updated successfully');
    } catch (error: any) {
      logger.error('Update college account controller error:', error);
      next(error);
    }
  }

  /**
   * PUT /api/v1/colleges/settings/notifications
   */
  public async updateNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.assertValid(req);
      const userId = this.getUserId(req);
      const prefs = await collegeDashboardService.updateNotificationPreferences(userId, req.body);
      SuccessResponseHelper.ok(
        res,
        { notificationPreferences: prefs },
        'Notification preferences updated successfully'
      );
    } catch (error: any) {
      logger.error('Update college notifications controller error:', error);
      next(error);
    }
  }

  /**
   * POST /api/v1/colleges/support
   */
  public async createSupportTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.assertValid(req);
      const userId = this.getUserId(req);
      const { subject, message } = req.body;
      const ticket = await collegeDashboardService.createSupportTicket(userId, {
        subject,
        message,
      });
      SuccessResponseHelper.created(
        res,
        { ticket },
        'Your message has been sent. Our campus team will get back to you soon.'
      );
    } catch (error: any) {
      logger.error('Create college support ticket controller error:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/colleges/support
   */
  public async getSupportTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const tickets = await collegeDashboardService.getSupportTickets(userId);
      SuccessResponseHelper.ok(res, { tickets }, 'Support tickets retrieved successfully');
    } catch (error: any) {
      logger.error('Get college support tickets controller error:', error);
      next(error);
    }
  }
}

export const collegeDashboardController = CollegeDashboardController.getInstance();
