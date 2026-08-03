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
      const dashboard = await mentorDashboardService.getDashboard(userId);
      SuccessResponseHelper.ok(res, dashboard, 'Dashboard details retrieved successfully');
    } catch (error: any) {
      logger.error('Get mentor dashboard controller error:', error);
      next(error);
    }
  }

  /**
   * Get mentor assigned batches
   * GET /api/v1/mentor/batches
   */
  public async getBatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const status = req.query.status as string | undefined;
      const batchType = req.query.batchType as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const result = await mentorDashboardService.getBatches(userId, { status, batchType, page, limit });
      SuccessResponseHelper.ok(res, result, 'Batches retrieved successfully');
    } catch (error: any) {
      logger.error('Get mentor batches controller error:', error);
      next(error);
    }
  }

  /**
   * Get single batch details
   * GET /api/v1/mentor/batches/:batchId
   */
  public async getBatchById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const batchId = req.params.batchId;
      const result = await mentorDashboardService.getBatchById(userId, batchId);
      SuccessResponseHelper.ok(res, result, 'Batch details retrieved successfully');
    } catch (error: any) {
      logger.error('Get mentor batch by ID controller error:', error);
      next(error);
    }
  }

  /**
   * Check in mentor
   * POST /api/v1/mentor/check-in
   */
  public async checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { batchId } = req.body;
      if (!batchId) {
        throw new ValidationError('Batch ID is required for check-in');
      }

      const checkIn = await mentorDashboardService.checkIn(userId, batchId);
      SuccessResponseHelper.created(res, { checkIn }, 'Checked in successfully');
    } catch (error: any) {
      logger.error('Check in controller error:', error);
      next(error);
    }
  }

  /**
   * Check out mentor
   * POST /api/v1/mentor/check-out
   */
  public async checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { batchId, notes } = req.body;
      if (!batchId) {
        throw new ValidationError('Batch ID is required for check-out');
      }

      const checkOut = await mentorDashboardService.checkOut(userId, batchId, notes);
      SuccessResponseHelper.ok(res, { checkOut }, 'Checked out successfully');
    } catch (error: any) {
      logger.error('Check out controller error:', error);
      next(error);
    }
  }

  /**
   * Get check-in status
   * GET /api/v1/mentor/check-in/status
   */
  public async getCheckInStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const status = await mentorDashboardService.getCheckInStatus(userId);
      SuccessResponseHelper.ok(res, { status }, 'Check-in status retrieved successfully');
    } catch (error: any) {
      logger.error('Get check-in status controller error:', error);
      next(error);
    }
  }

  /**
   * Get check-ins history
   * GET /api/v1/mentor/check-ins
   */
  public async getCheckIns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const batchId = req.query.batchId as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const result = await mentorDashboardService.getCheckIns(userId, { batchId, page, limit });
      SuccessResponseHelper.ok(res, result, 'Check-ins history retrieved successfully');
    } catch (error: any) {
      logger.error('Get check-ins history controller error:', error);
      next(error);
    }
  }

  /**
   * Mark student attendance
   * POST /api/v1/mentor/attendance
   */
  public async markAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { batchId, date, records } = req.body;
      if (!batchId || !date || !records) {
        throw new ValidationError('Missing required fields: batchId, date, records');
      }

      const saved = await mentorDashboardService.markAttendance(userId, batchId, { date, records });
      SuccessResponseHelper.ok(res, { records: saved }, 'Attendance marked successfully');
    } catch (error: any) {
      logger.error('Mark attendance controller error:', error);
      next(error);
    }
  }

  /**
   * Create progress note
   * POST /api/v1/mentor/progress-notes
   */
  public async createProgressNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { studentUserId, batchId, rubricScore, feedback, strengths, areasForImprovement } = req.body;
      if (!studentUserId || !batchId || rubricScore === undefined || !feedback) {
        throw new ValidationError('Missing required fields: studentUserId, batchId, rubricScore, feedback');
      }

      const note = await mentorDashboardService.createProgressNote(userId, {
        studentUserId,
        batchId,
        rubricScore,
        feedback,
        strengths,
        areasForImprovement,
      });
      SuccessResponseHelper.created(res, { note }, 'Progress note created successfully');
    } catch (error: any) {
      logger.error('Create progress note controller error:', error);
      next(error);
    }
  }

  /**
   * Get earnings
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
      const userId = this.getUserId(req);
      const result = await mentorDashboardService.withdrawEarnings(userId, req.body);
      SuccessResponseHelper.ok(res, result, `Withdrawal request for INR ${result.amountRequested} submitted successfully`);
    } catch (error: any) {
      logger.error('Withdraw earnings controller error:', error);
      next(error);
    }
  }

  /**
   * Get availability
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
   * Update availability
   * PUT /api/v1/mentor/availability
   */
  public async updateAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      const userId = this.getUserId(req);
      const { availabilityCalendar, hourlyRate } = req.body;

      const updated = await mentorDashboardService.updateAvailability(userId, { availabilityCalendar, hourlyRate });
      SuccessResponseHelper.ok(res, updated, 'Availability updated successfully');
    } catch (error: any) {
      logger.error('Update availability controller error:', error);
      next(error);
    }
  }

  /**
   * Get profile
   * GET /api/v1/mentor/profile
   */
  public async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const profile = await mentorDashboardService.getProfile(userId);
      SuccessResponseHelper.ok(res, { profile }, 'Profile retrieved successfully');
    } catch (error: any) {
      logger.error('Get profile controller error:', error);
      next(error);
    }
  }

  /**
   * Update profile
   * PUT /api/v1/mentor/profile
   */
  public async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      const userId = this.getUserId(req);
      const profile = await mentorDashboardService.updateProfile(userId, req.body);
      SuccessResponseHelper.ok(res, { profile }, 'Profile updated successfully');
    } catch (error: any) {
      logger.error('Update profile controller error:', error);
      next(error);
    }
  }

  /**
   * Create support ticket
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
      logger.error('Create support ticket controller error:', error);
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
      logger.error('Get support tickets controller error:', error);
      next(error);
    }
  }

  /**
   * Update settings account
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

  /**
   * Get students mentored
   * GET /api/v1/mentor/students
   */
  public async getStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const students = await mentorDashboardService.getStudents(userId);
      SuccessResponseHelper.ok(res, { students }, 'Students retrieved successfully');
    } catch (error: any) {
      logger.error('Get students controller error:', error);
      next(error);
    }
  }

  /**
   * Get assigned courses
   * GET /api/v1/mentor/courses
   */
  public async getCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const courses = await mentorDashboardService.getAssignedCourses(userId);
      SuccessResponseHelper.ok(res, { courses }, 'Assigned courses retrieved successfully');
    } catch (error: any) {
      logger.error('Get mentor courses controller error:', error);
      next(error);
    }
  }
}

export const mentorDashboardController = MentorDashboardController.getInstance();
