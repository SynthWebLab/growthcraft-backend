
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { studentDashboardService } from '../services/student-dashboard.service';
import { logger } from '@/common/utils/logger.util';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { ValidationError } from '@/common/errors/ValidationError';
import { EventType } from '@/database/models/Bootcamp.model';

export class StudentDashboardController {
  private static instance: StudentDashboardController;

  private constructor() {}

  public static getInstance(): StudentDashboardController {
    if (!StudentDashboardController.instance) {
      StudentDashboardController.instance = new StudentDashboardController();
    }
    return StudentDashboardController.instance;
  }

  private getUserId(req: Request): string {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ValidationError('User authentication required');
    }
    return userId;
  }

  /**
   * Get aggregated student dashboard
   * GET /api/v1/students/dashboard
   */
  public async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const dashboard = await studentDashboardService.getDashboard(userId);
      SuccessResponseHelper.ok(res, dashboard, 'Dashboard retrieved successfully');
    } catch (error: any) {
      logger.error('Get student dashboard controller error:', error);
      next(error);
    }
  }

  /**
   * Get student profile
   * GET /api/v1/students/profile
   */
  public async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const profile = await studentDashboardService.getProfile(userId);
      SuccessResponseHelper.ok(res, { profile }, 'Profile retrieved successfully');
    } catch (error: any) {
      logger.error('Get student profile controller error:', error);
      next(error);
    }
  }

  /**
   * Create or update the authenticated student's profile
   * PUT /api/v1/students/profile
   */
  public async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = errors.array().map((err: any) => ({
          field: err.path || err.param || 'unknown',
          message: err.msg,
          value: err.value,
        }));
        throw new ValidationError('Validation failed', validationErrors);
      }

      const userId = this.getUserId(req);
      const profile = await studentDashboardService.updateProfile(userId, req.body);
      SuccessResponseHelper.ok(res, { profile }, 'Profile updated successfully');
    } catch (error: any) {
      logger.error('Update student profile controller error:', error);
      next(error);
    }
  }

  /**
   * Get student's enrolled courses
   * GET /api/v1/students/courses
   */
  public async getCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const courses = await studentDashboardService.getCourses(userId);
      SuccessResponseHelper.ok(res, { courses }, 'Courses retrieved successfully');
    } catch (error: any) {
      logger.error('Get student courses controller error:', error);
      next(error);
    }
  }

  /**
   * Get student's enrolled bootcamps
   * GET /api/v1/students/bootcamps
   */
  public async getBootcamps(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const bootcamps = await studentDashboardService.getEvents(userId, EventType.BOOTCAMP);
      SuccessResponseHelper.ok(res, { bootcamps }, 'Bootcamps retrieved successfully');
    } catch (error: any) {
      logger.error('Get student bootcamps controller error:', error);
      next(error);
    }
  }

  /**
   * Get student's enrolled workshops
   * GET /api/v1/students/workshops
   */
  public async getWorkshops(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const workshops = await studentDashboardService.getEvents(userId, EventType.WORKSHOP);
      SuccessResponseHelper.ok(res, { workshops }, 'Workshops retrieved successfully');
    } catch (error: any) {
      logger.error('Get student workshops controller error:', error);
      next(error);
    }
  }

  /**
   * Get student's enrolled hackathons
   * GET /api/v1/students/hackathons
   */
  public async getHackathons(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const hackathons = await studentDashboardService.getEvents(userId, EventType.HACKATHON);
      SuccessResponseHelper.ok(res, { hackathons }, 'Hackathons retrieved successfully');
    } catch (error: any) {
      logger.error('Get student hackathons controller error:', error);
      next(error);
    }
  }

  /**
   * Get student's enrolled events (optionally filtered by ?type=)
   * GET /api/v1/students/events
   */
  public async getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);

      let eventType: EventType | undefined;
      const typeParam = req.query.type;
      if (typeof typeParam === 'string' && typeParam.length > 0) {
        const match = Object.values(EventType).find(
          (value) => value.toLowerCase() === typeParam.toLowerCase()
        );
        if (!match) {
          throw new ValidationError(
            `Invalid event type. Allowed values: ${Object.values(EventType).join(', ')}`
          );
        }
        eventType = match;
      }

      const events = await studentDashboardService.getEvents(userId, eventType);
      SuccessResponseHelper.ok(res, { events }, 'Events retrieved successfully');
    } catch (error: any) {
      logger.error('Get student events controller error:', error);
      next(error);
    }
  }

  /**
   * Get student's enrolled training programs
   * GET /api/v1/students/training-programs
   */
  public async getTrainingPrograms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const trainingPrograms = await studentDashboardService.getTrainingPrograms(userId);
      SuccessResponseHelper.ok(
        res,
        { trainingPrograms },
        'Training programs retrieved successfully'
      );
    } catch (error: any) {
      logger.error('Get student training programs controller error:', error);
      next(error);
    }
  }

  /**
   * Get student's certificates
   * GET /api/v1/students/certificates
   */
  public async getCertificates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const certificates = await studentDashboardService.getCertificates(userId);
      SuccessResponseHelper.ok(res, { certificates }, 'Certificates retrieved successfully');
    } catch (error: any) {
      logger.error('Get student certificates controller error:', error);
      next(error);
    }
  }
}

export const studentDashboardController = StudentDashboardController.getInstance();
