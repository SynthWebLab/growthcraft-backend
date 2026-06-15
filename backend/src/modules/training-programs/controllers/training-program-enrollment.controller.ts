import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { trainingProgramEnrollmentService } from '../services/training-program-enrollment.service';
import { logger } from '@/common/utils/logger.util';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { ValidationError } from '@/common/errors/ValidationError';

export class TrainingProgramEnrollmentController {
  private static instance: TrainingProgramEnrollmentController;

  private constructor() {}

  public static getInstance(): TrainingProgramEnrollmentController {
    if (!TrainingProgramEnrollmentController.instance) {
      TrainingProgramEnrollmentController.instance = new TrainingProgramEnrollmentController();
    }
    return TrainingProgramEnrollmentController.instance;
  }

  /**
   * Enroll in a training program
   * POST /api/v1/training-programs/:programId/enroll
   */
  public async enrollInProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const { programId } = req.params;
      const { fullName, email, phone } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new ValidationError('User authentication required');
      }

      const enrollment = await trainingProgramEnrollmentService.enrollInProgram({
        userId,
        programId,
        fullName,
        email,
        phone,
      });

      SuccessResponseHelper.created(
        res,
        { enrollment },
        'Successfully enrolled in the training program. We will get back to you soon!'
      );
    } catch (error: any) {
      logger.error('Enroll in training program controller error:', error);
      next(error);
    }
  }

  /**
   * Request callback for a training program
   * POST /api/v1/training-programs/:programId/request-callback
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

      const { programId } = req.params;
      const { fullName, email, phone } = req.body;
      const userId = req.user?.userId;

      const callbackRequest = await trainingProgramEnrollmentService.requestCallback({
        userId,
        programId,
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
      logger.error('Request callback for training program controller error:', error);
      next(error);
    }
  }

  /**
   * Get user's training program enrollments
   * GET /api/v1/training-programs/enrollments/my-enrollments
   */
  public async getMyEnrollments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new ValidationError('User authentication required');
      }

      const enrollments = await trainingProgramEnrollmentService.getUserEnrollments(userId);

      SuccessResponseHelper.ok(res, { enrollments }, 'Enrollments retrieved successfully');
    } catch (error: any) {
      logger.error('Get my training program enrollments controller error:', error);
      next(error);
    }
  }

  /**
   * Get user's callback requests
   * GET /api/v1/training-programs/callbacks/my-requests
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

      const requests = await trainingProgramEnrollmentService.getUserCallbackRequests(userId);

      SuccessResponseHelper.ok(res, { requests }, 'Callback requests retrieved successfully');
    } catch (error: any) {
      logger.error('Get my training program callback requests controller error:', error);
      next(error);
    }
  }

  /**
   * Check if user is enrolled in a program and has pending callback request
   * GET /api/v1/training-programs/:programId/enrollment-status
   */
  public async checkEnrollmentStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { programId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new ValidationError('User authentication required');
      }

      const status = await trainingProgramEnrollmentService.getEnrollmentStatus(userId, programId);

      SuccessResponseHelper.ok(
        res,
        status,
        'Enrollment status retrieved successfully'
      );
    } catch (error: any) {
      logger.error('Check training program enrollment status controller error:', error);
      next(error);
    }
  }
}

export const trainingProgramEnrollmentController = TrainingProgramEnrollmentController.getInstance();
