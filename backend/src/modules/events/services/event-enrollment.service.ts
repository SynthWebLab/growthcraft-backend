import { EventEnrollment, IEventEnrollment } from '@/database/models/EventEnrollment.model';
import {
  EventCallbackRequest,
  IEventCallbackRequest,
} from '@/database/models/EventCallbackRequest.model';
import { Bootcamp, EventType } from '@/database/models/Bootcamp.model';
import { logger } from '@/common/utils/logger.util';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { ConflictError } from '@/common/errors/ConflictError';
import { ValidationError } from '@/common/errors/ValidationError';

export interface EventEnrollmentData {
  userId?: string;
  eventId: string;
  eventType: EventType;
  fullName: string;
  email: string;
  phone: string;
}

export interface EventCallbackRequestData {
  userId?: string;
  eventId: string;
  eventType: EventType;
  fullName: string;
  email: string;
  phone: string;
}

export class EventEnrollmentService {
  private static instance: EventEnrollmentService;

  private constructor() {}

  public static getInstance(): EventEnrollmentService {
    if (!EventEnrollmentService.instance) {
      EventEnrollmentService.instance = new EventEnrollmentService();
    }
    return EventEnrollmentService.instance;
  }

  /**
   * Enroll/Register user in an event (Bootcamp, Workshop, Hackathon)
   */
  public async enrollInEvent(data: EventEnrollmentData): Promise<IEventEnrollment> {
    try {
      // Check if event exists
      const event = await Bootcamp.findById(data.eventId);
      if (!event) {
        throw new NotFoundError(`${data.eventType} not found`);
      }

      // Verify event type matches
      if (event.type !== data.eventType) {
        throw new ValidationError(
          `Event type mismatch. Expected ${data.eventType} but found ${event.type}`
        );
      }

      // Check if event is active
      if (!event.isActive) {
        throw new ValidationError(`This ${data.eventType.toLowerCase()} is not available for registration`);
      }

      // Check if event is published
      if (!event.isPublished) {
        throw new ValidationError(`This ${data.eventType.toLowerCase()} is not yet published`);
      }

      // Check if user can register (based on event status and availability)
      if (!event.canRegister()) {
        throw new ValidationError(
          `This ${data.eventType.toLowerCase()} is not available for registration at this time`
        );
      }

      // Check seat availability
      if (event.isFull()) {
        throw new ValidationError(`No seats available for this ${data.eventType.toLowerCase()}`);
      }

      // Check if registration deadline has passed
      if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
        throw new ValidationError(
          `Registration deadline has passed for this ${data.eventType.toLowerCase()}`
        );
      }

      // Check if event has already started
      if (event.hasStarted()) {
        throw new ValidationError(
          `This ${data.eventType.toLowerCase()} has already started. Please request a callback instead.`
        );
      }

      // Check if user is already enrolled
      const duplicateEnrollmentFilter = {
        eventId: data.eventId,
        ...(data.userId
          ? { $or: [{ userId: data.userId }, { email: data.email.toLowerCase() }] }
          : { email: data.email.toLowerCase() }),
      };

      const existingEnrollment = await EventEnrollment.findOne(duplicateEnrollmentFilter);

      if (existingEnrollment) {
        throw new ConflictError(`You are already registered for this ${data.eventType.toLowerCase()}`);
      }

      // Create enrollment
      const enrollment = await EventEnrollment.create({
        ...(data.userId ? { userId: data.userId } : {}),
        eventId: data.eventId,
        eventType: data.eventType,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        title: event.title, // Save event title
        enrollmentDate: new Date(),
        status: 'pending',
        paymentStatus: 'pending',
      });

      // Update event enrollment count and decrease available seats
      await Bootcamp.findByIdAndUpdate(data.eventId, {
        $inc: {
          enrolledCount: 1,
        },
      });

      logger.info(
        `${data.userId ? `User ${data.userId}` : `Guest ${data.email}`} enrolled in ${data.eventType} ${data.eventId}`
      );

      return enrollment;
    } catch (error: any) {
      logger.error('Enroll in event error:', error);
      throw error;
    }
  }

  /**
   * Request callback for an event
   */
  public async requestCallback(data: EventCallbackRequestData): Promise<IEventCallbackRequest> {
    try {
      // Check if event exists
      const event = await Bootcamp.findById(data.eventId);
      if (!event) {
        throw new NotFoundError(`${data.eventType} not found`);
      }

      // Verify event type matches
      if (event.type !== data.eventType) {
        throw new ValidationError(
          `Event type mismatch. Expected ${data.eventType} but found ${event.type}`
        );
      }

      // Check if there's already a pending callback request
      const duplicateCallbackFilter = {
        eventId: data.eventId,
        status: 'pending',
        ...(data.userId
          ? { $or: [{ userId: data.userId }, { email: data.email.toLowerCase() }] }
          : { email: data.email.toLowerCase() }),
      };

      const existingRequest = await EventCallbackRequest.findOne(duplicateCallbackFilter);

      if (existingRequest) {
        throw new ConflictError(
          `You already have a pending callback request for this ${data.eventType.toLowerCase()}. We will get back to you soon.`
        );
      }

      // Create callback request
      const callbackRequest = await EventCallbackRequest.create({
        ...(data.userId ? { userId: data.userId } : {}),
        eventId: data.eventId,
        eventType: data.eventType,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        title: event.title, // Save event title
        requestDate: new Date(),
        status: 'pending',
      });

      logger.info(
        `Callback request created for ${data.userId ? `user ${data.userId}` : `guest ${data.email}`} and ${data.eventType} ${data.eventId}`
      );

      return callbackRequest;
    } catch (error: any) {
      logger.error('Request callback for event error:', error);
      throw error;
    }
  }

  /**
   * Get user's event enrollments
   */
  public async getUserEnrollments(
    userId: string,
    eventType?: EventType
  ): Promise<IEventEnrollment[]> {
    try {
      const filter: any = { userId };
      if (eventType) {
        filter.eventType = eventType;
      }

      const enrollments = await EventEnrollment.find(filter)
        .populate('eventId')
        .sort({ createdAt: -1 })
        .exec();

      return enrollments;
    } catch (error: any) {
      logger.error('Get user event enrollments error:', error);
      throw error;
    }
  }

  /**
   * Get user's event callback requests
   */
  public async getUserCallbackRequests(
    userId: string,
    eventType?: EventType
  ): Promise<IEventCallbackRequest[]> {
    try {
      const filter: any = { userId };
      if (eventType) {
        filter.eventType = eventType;
      }

      const requests = await EventCallbackRequest.find(filter)
        .populate('eventId')
        .sort({ createdAt: -1 })
        .exec();

      return requests;
    } catch (error: any) {
      logger.error('Get user event callback requests error:', error);
      throw error;
    }
  }

  /**
   * Check if user is enrolled in an event
   */
  public async isUserEnrolled(userId: string, eventId: string): Promise<boolean> {
    try {
      const enrollment = await EventEnrollment.findOne({
        userId,
        eventId,
        status: { $in: ['pending', 'confirmed'] },
      });

      return !!enrollment;
    } catch (error: any) {
      logger.error('Check user event enrollment error:', error);
      throw error;
    }
  }

  /**
   * Get enrollment status for a user and event (enrollment + callback request)
   */
  public async getEnrollmentStatus(
    userId: string,
    eventId: string
  ): Promise<{ isEnrolled: boolean; hasCallbackRequest: boolean }> {
    try {
      // Check enrollment
      const enrollment = await EventEnrollment.findOne({
        userId,
        eventId,
        status: { $in: ['pending', 'confirmed'] },
      });

      // Check callback request
      const callbackRequest = await EventCallbackRequest.findOne({
        userId,
        eventId,
        status: 'pending',
      });

      return {
        isEnrolled: !!enrollment,
        hasCallbackRequest: !!callbackRequest,
      };
    } catch (error: any) {
      logger.error('Get event enrollment status error:', error);
      throw error;
    }
  }

  /**
   * Get event IDs where the user has an active enrollment
   */
  public async getUserEnrolledEventIds(
    userId: string,
    eventIds: string[],
    eventType?: EventType
  ): Promise<Set<string>> {
    try {
      if (eventIds.length === 0) {
        return new Set();
      }

      const filter: any = {
        userId,
        eventId: { $in: eventIds },
        status: { $in: ['pending', 'confirmed'] },
      };

      if (eventType) {
        filter.eventType = eventType;
      }

      const enrollments = await EventEnrollment.find(filter)
        .select('eventId')
        .lean()
        .exec();

      return new Set(enrollments.map(enrollment => enrollment.eventId.toString()));
    } catch (error: any) {
      logger.error('Get user enrolled event IDs error:', error);
      throw error;
    }
  }

  /**
   * Get event IDs where the user has a pending callback request
   */
  public async getUserPendingCallbackEventIds(
    userId: string,
    eventIds: string[],
    eventType?: EventType
  ): Promise<Set<string>> {
    try {
      if (eventIds.length === 0) {
        return new Set();
      }

      const filter: any = {
        userId,
        eventId: { $in: eventIds },
        status: 'pending',
      };

      if (eventType) {
        filter.eventType = eventType;
      }

      const requests = await EventCallbackRequest.find(filter)
        .select('eventId')
        .lean()
        .exec();

      return new Set(requests.map(request => request.eventId.toString()));
    } catch (error: any) {
      logger.error('Get user pending callback event IDs error:', error);
      throw error;
    }
  }

  /**
   * Get enrollment by ID
   */
  public async getEnrollmentById(enrollmentId: string): Promise<IEventEnrollment | null> {
    try {
      const enrollment = await EventEnrollment.findById(enrollmentId).populate('eventId').exec();

      return enrollment;
    } catch (error: any) {
      logger.error('Get event enrollment by ID error:', error);
      throw error;
    }
  }
}

export const eventEnrollmentService = EventEnrollmentService.getInstance();
