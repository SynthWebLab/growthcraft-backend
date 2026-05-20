import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { enrollmentService } from '../services/enrollment.service';
import { logger } from '@/common/utils/logger.util';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { ValidationError } from '@/common/errors/ValidationError';

export class EnrollmentController {
  private static instance: EnrollmentController;

  private constructor() {}

  public static getInstance(): EnrollmentController {
    if (!EnrollmentController.instance) {
      EnrollmentController.instance = new EnrollmentController();
    }
    return EnrollmentController.instance;
  }

  /**
   * Enroll in a course
   * POST /api/v1/courses/:courseId/enroll
   */
  public async enrollInCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = errors.array().map((err: any) => ({
          field: err.path || err.param || 'unknown',
          message: err.msg,
          value: err.value,
        }));
        throw new ValidationError('Validation failed', validationErrors);
      }

      const { courseId } = req.params;
      const { fullName, email, phone } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new ValidationError('User authentication required');
      }

      const enrollment = await enrollmentService.enrollInCourse({
        userId,
        courseId,
        fullName,
        email,
        phone,
      });

      SuccessResponseHelper.created(
        res,
        { enrollment },
        'Successfully enrolled in the course. We will get back to you soon!'
      );
    } catch (error: any) {
      logger.error('Enroll in course controller error:', error);
      next(error);
    }
  }

  /**
   * Request callback for a course
   * POST /api/v1/courses/:courseId/request-callback
   */
  public async requestCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = errors.array().map((err: any) => ({
          field: err.path || err.param || 'unknown',
          message: err.msg,
          value: err.value,
        }));
        throw new ValidationError('Validation failed', validationErrors);
      }

      const { courseId } = req.params;
      const { fullName, email, phone } = req.body;
      const userId = req.user?.userId;

      const callbackRequest = await enrollmentService.requestCallback({
        userId,
        courseId,
        fullName,
        email,
        phone,
      });

      SuccessResponseHelper.created(
        res,
        { callbackRequest },
        'Thank you! We will get back to you soon within 24 hours.'
      );
    } catch (error: any) {
      logger.error('Request callback controller error:', error);
      next(error);
    }
  }

  /**
   * Get user's enrollments
   * GET /api/v1/courses/enrollments/my-enrollments
   */
  public async getMyEnrollments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new ValidationError('User authentication required');
      }

      const enrollments = await enrollmentService.getUserEnrollments(userId);

      SuccessResponseHelper.ok(res, { enrollments }, 'Enrollments retrieved successfully');
    } catch (error: any) {
      logger.error('Get my enrollments controller error:', error);
      next(error);
    }
  }

  /**
   * Get user's callback requests
   * GET /api/v1/courses/callbacks/my-requests
   */
  public async getMyCallbackRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new ValidationError('User authentication required');
      }

      const requests = await enrollmentService.getUserCallbackRequests(userId);

      SuccessResponseHelper.ok(res, { requests }, 'Callback requests retrieved successfully');
    } catch (error: any) {
      logger.error('Get my callback requests controller error:', error);
      next(error);
    }
  }

  /**
   * Check if user is enrolled in a course
   * GET /api/v1/courses/:courseId/enrollment-status
   */
  public async checkEnrollmentStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { courseId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new ValidationError('User authentication required');
      }

      const isEnrolled = await enrollmentService.isUserEnrolled(userId, courseId);

      SuccessResponseHelper.ok(
        res,
        { isEnrolled },
        isEnrolled ? 'User is enrolled in this course' : 'User is not enrolled in this course'
      );
    } catch (error: any) {
      logger.error('Check enrollment status controller error:', error);
      next(error);
    }
  }
}

export const enrollmentController = EnrollmentController.getInstance();
