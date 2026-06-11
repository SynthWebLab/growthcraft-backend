import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { eventEnrollmentService } from '../services/event-enrollment.service';
import { logger } from '@/common/utils/logger.util';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { ValidationError } from '@/common/errors/ValidationError';
import { EventType } from '@/database/models/Bootcamp.model';

export class EventEnrollmentController {
  private static instance: EventEnrollmentController;

  private constructor() {}

  public static getInstance(): EventEnrollmentController {
    if (!EventEnrollmentController.instance) {
      EventEnrollmentController.instance = new EventEnrollmentController();
    }
    return EventEnrollmentController.instance;
  }

  /**
   * Get event type label for messages
   */
  private getEventTypeLabel(eventType: EventType): string {
    switch (eventType) {
      case EventType.BOOTCAMP:
        return 'bootcamp';
      case EventType.WORKSHOP:
        return 'workshop';
      case EventType.HACKATHON:
        return 'hackathon';
      default:
        return 'event';
    }
  }

  /**
   * Get enrollment CTA label based on event type
   */
  private getEnrollmentCTALabel(eventType: EventType): string {
    switch (eventType) {
      case EventType.BOOTCAMP:
        return 'Reserve Seat';
      case EventType.WORKSHOP:
        return 'Register Now';
      case EventType.HACKATHON:
        return 'Register Now';
      default:
        return 'Register Now';
    }
  }

  /**
   * Enroll/Register in an event (Bootcamp/Workshop/Hackathon)
   * POST /api/v1/events/:eventType/:eventId/register
   */
  public async registerForEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const { eventType, eventId } = req.params;
      const { fullName, email, phone } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new ValidationError('User authentication required');
      }

      // Validate event type
      if (!Object.values(EventType).includes(eventType as EventType)) {
        throw new ValidationError('Invalid event type');
      }

      const enrollment = await eventEnrollmentService.enrollInEvent({
        userId,
        eventId,
        eventType: eventType as EventType,
        fullName,
        email,
        phone,
      });

      const eventLabel = this.getEventTypeLabel(eventType as EventType);

      SuccessResponseHelper.created(
        res,
        { enrollment },
        `Successfully registered for the ${eventLabel}. We will get back to you soon!`
      );
    } catch (error: any) {
      logger.error('Register for event controller error:', error);
      next(error);
    }
  }

  /**
   * Request callback for an event
   * POST /api/v1/events/:eventType/:eventId/request-callback
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

      const { eventType, eventId } = req.params;
      const { fullName, email, phone } = req.body;
      const userId = req.user?.userId;

      // Validate event type
      if (!Object.values(EventType).includes(eventType as EventType)) {
        throw new ValidationError('Invalid event type');
      }

      const callbackRequest = await eventEnrollmentService.requestCallback({
        userId,
        eventId,
        eventType: eventType as EventType,
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
      logger.error('Request callback for event controller error:', error);
      next(error);
    }
  }

  /**
   * Get user's event enrollments
   * GET /api/v1/events/enrollments/my-enrollments
   * GET /api/v1/events/:eventType/enrollments/my-enrollments (filtered by event type)
   */
  public async getMyEnrollments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { eventType } = req.params;

      if (!userId) {
        throw new ValidationError('User authentication required');
      }

      // Validate event type if provided
      let eventTypeFilter: EventType | undefined;
      if (eventType) {
        if (!Object.values(EventType).includes(eventType as EventType)) {
          throw new ValidationError('Invalid event type');
        }
        eventTypeFilter = eventType as EventType;
      }

      const enrollments = await eventEnrollmentService.getUserEnrollments(
        userId,
        eventTypeFilter
      );

      SuccessResponseHelper.ok(res, { enrollments }, 'Enrollments retrieved successfully');
    } catch (error: any) {
      logger.error('Get my event enrollments controller error:', error);
      next(error);
    }
  }

  /**
   * Get user's event callback requests
   * GET /api/v1/events/callbacks/my-requests
   * GET /api/v1/events/:eventType/callbacks/my-requests (filtered by event type)
   */
  public async getMyCallbackRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { eventType } = req.params;

      if (!userId) {
        throw new ValidationError('User authentication required');
      }

      // Validate event type if provided
      let eventTypeFilter: EventType | undefined;
      if (eventType) {
        if (!Object.values(EventType).includes(eventType as EventType)) {
          throw new ValidationError('Invalid event type');
        }
        eventTypeFilter = eventType as EventType;
      }

      const requests = await eventEnrollmentService.getUserCallbackRequests(
        userId,
        eventTypeFilter
      );

      SuccessResponseHelper.ok(res, { requests }, 'Callback requests retrieved successfully');
    } catch (error: any) {
      logger.error('Get my event callback requests controller error:', error);
      next(error);
    }
  }

  /**
   * Check if user is enrolled in an event and has pending callback request
   * GET /api/v1/events/:eventType/:eventId/enrollment-status
   */
  public async checkEnrollmentStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { eventId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new ValidationError('User authentication required');
      }

      const status = await eventEnrollmentService.getEnrollmentStatus(userId, eventId);

      SuccessResponseHelper.ok(res, status, 'Enrollment status retrieved successfully');
    } catch (error: any) {
      logger.error('Check event enrollment status controller error:', error);
      next(error);
    }
  }
}

export const eventEnrollmentController = EventEnrollmentController.getInstance();
