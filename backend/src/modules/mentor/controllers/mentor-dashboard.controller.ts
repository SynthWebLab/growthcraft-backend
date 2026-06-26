import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { mentorDashboardService } from '../services/mentor-dashboard.service';
import { logger } from '@/common/utils/logger.util';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { ValidationError } from '@/common/errors/ValidationError';

export class MentorDashboardController {
  private static instance: MentorDashboardController;

  private constructor() {}

  public static getInstance(): MentorDashboardController {
    if (!MentorDashboardController.instance) {
      MentorDashboardController.instance = new MentorDashboardController();
    }
    return MentorDashboardController.instance;
  }

  private getUserId(req: Request): string {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ValidationError('User authentication required');
    }
    return userId;
  }

  private handleValidationErrors(req: Request) {
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
   * Get mentor dashboard summary
   * GET /api/v1/mentor/dashboard
   */
  public async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const period = (req.query.period as string) || 'monthly';
      const dashboard = await mentorDashboardService.getDashboard(userId, period);
      SuccessResponseHelper.ok(res, dashboard, 'Dashboard details retrieved successfully');
    } catch (error: any) {
      logger.error('Get mentor dashboard controller error:', error);
      next(error);
    }
  }

  /**
   * Get mentor sessions
   * GET /api/v1/mentor/sessions
   */
  public async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const statusParam = req.query.status as 'upcoming' | 'past' | 'cancelled' | undefined;
      const sessions = await mentorDashboardService.getSessions(userId, statusParam);
      SuccessResponseHelper.ok(res, { sessions }, 'Sessions retrieved successfully');
    } catch (error: any) {
      logger.error('Get mentor sessions controller error:', error);
      next(error);
    }
  }

  /**
   * Update mentor session status
   * PATCH /api/v1/mentor/sessions/:id/status
   */
  public async updateSessionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      const userId = this.getUserId(req);
      const sessionId = req.params.id;
      const { status } = req.body;

      const session = await mentorDashboardService.updateSessionStatus(userId, sessionId, status);
      SuccessResponseHelper.ok(res, { session }, `Session status updated to ${status}`);
    } catch (error: any) {
      logger.error('Update mentor session status controller error:', error);
      next(error);
    }
  }

  /**
   * Get mentor availability
   * GET /api/v1/mentor/availability
   */
  public async getAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const availabilityData = await mentorDashboardService.getAvailability(userId);
      SuccessResponseHelper.ok(res, availabilityData, 'Availability retrieved successfully');
    } catch (error: any) {
      logger.error('Get mentor availability controller error:', error);
      next(error);
    }
  }

  /**
   * Update mentor availability
   * PUT /api/v1/mentor/availability
   */
  public async updateAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      const userId = this.getUserId(req);
      const { availability, hourlyRate } = req.body;

      const updated = await mentorDashboardService.updateAvailability(userId, { availability, hourlyRate });
      SuccessResponseHelper.ok(res, updated, 'Availability updated successfully');
    } catch (error: any) {
      logger.error('Update mentor availability controller error:', error);
      next(error);
    }
  }

  /**
   * Get students mentored by this mentor
   * GET /api/v1/mentor/students
   */
  public async getStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const students = await mentorDashboardService.getStudents(userId);
      SuccessResponseHelper.ok(res, { students }, 'Students retrieved successfully');
    } catch (error: any) {
      logger.error('Get mentor students controller error:', error);
      next(error);
    }
  }

  /**
   * Get mentor earnings breakdown
   * GET /api/v1/mentor/earnings
   */
  public async getEarnings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const earnings = await mentorDashboardService.getEarnings(userId);
      SuccessResponseHelper.ok(res, earnings, 'Earnings retrieved successfully');
    } catch (error: any) {
      logger.error('Get mentor earnings controller error:', error);
      next(error);
    }
  }

  /**
   * Submit withdrawal request
   * POST /api/v1/mentor/earnings/withdraw
   */
  public async withdrawEarnings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Simulate submission of withdrawal request
      SuccessResponseHelper.ok(res, null, 'Withdrawal request submitted successfully');
    } catch (error: any) {
      logger.error('Withdraw earnings controller error:', error);
      next(error);
    }
  }

  /**
   * Get mentor profile
   * GET /api/v1/mentor/profile
   */
  public async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const profile = await mentorDashboardService.getProfile(userId);
      SuccessResponseHelper.ok(res, { profile }, 'Profile retrieved successfully');
    } catch (error: any) {
      logger.error('Get mentor profile controller error:', error);
      next(error);
    }
  }

  /**
   * Update mentor profile
   * PUT /api/v1/mentor/profile
   */
  public async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      const userId = this.getUserId(req);
      const profile = await mentorDashboardService.updateProfile(userId, req.body);
      SuccessResponseHelper.ok(res, { profile }, 'Profile updated successfully');
    } catch (error: any) {
      logger.error('Update mentor profile controller error:', error);
      next(error);
    }
  }

  /**
   * Submit support ticket
   * POST /api/v1/mentor/support
   */
  public async createSupportTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      const userId = this.getUserId(req);
      const { subject, message } = req.body;
      const ticket = await mentorDashboardService.createSupportTicket(userId, { subject, message });
      SuccessResponseHelper.created(res, { ticket }, 'Support ticket created successfully');
    } catch (error: any) {
      logger.error('Create mentor support ticket controller error:', error);
      next(error);
    }
  }

  /**
   * Get support tickets
   * GET /api/v1/mentor/support
   */
  public async getSupportTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const tickets = await mentorDashboardService.getSupportTickets(userId);
      SuccessResponseHelper.ok(res, { tickets }, 'Support tickets retrieved successfully');
    } catch (error: any) {
      logger.error('Get mentor support tickets controller error:', error);
      next(error);
    }
  }

  /**
   * Update settings account info
   * PUT /api/v1/mentor/settings/account
   */
  public async updateSettingsAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      const userId = this.getUserId(req);
      const user = await mentorDashboardService.updateSettingsAccount(userId, req.body);
      SuccessResponseHelper.ok(res, { user }, 'Account settings updated successfully');
    } catch (error: any) {
      logger.error('Update settings account controller error:', error);
      next(error);
    }
  }

  /**
   * Change password
   * POST /api/v1/mentor/settings/password
   */
  public async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      const userId = this.getUserId(req);
      const { currentPassword, newPassword } = req.body;
      await mentorDashboardService.changePassword(userId, { currentPassword, newPassword });
      SuccessResponseHelper.ok(res, null, 'Password updated successfully');
    } catch (error: any) {
      logger.error('Change password controller error:', error);
      next(error);
    }
  }
}

export const mentorDashboardController = MentorDashboardController.getInstance();
