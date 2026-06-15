import { Request, Response, NextFunction } from 'express';
import { eventDetailsService } from '../services/event-details.service';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { logger } from '@/common/utils/logger.util';

export class EventDetailsController {
  private static instance: EventDetailsController;

  private constructor() { }

  public static getInstance(): EventDetailsController {
    if (!EventDetailsController.instance) {
      EventDetailsController.instance = new EventDetailsController();
    }
    return EventDetailsController.instance;
  }

  /**
   * Get all event details (overview, agenda, venue, mentors, FAQs)
   * GET /api/v1/events/:slug/details
   */
  public async getAllDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      let eventDetails = await eventDetailsService.getEventDetailsBySlug(slug) as any;

      if (req.user?.userId && eventDetails) {
        const userId = req.user.userId;
        const { eventEnrollmentService } = await import('@/modules/events/services/event-enrollment.service');

        const eventIdObj = eventDetails.eventId as any;
        if (eventIdObj) {
          const eventIdStr = (eventIdObj._id || eventIdObj.id || eventIdObj).toString();

          const isEnrolled = await eventEnrollmentService.isUserEnrolled(userId, eventIdStr);
          const { hasCallbackRequest } = await eventEnrollmentService.getEnrollmentStatus(userId, eventIdStr);

          eventDetails = JSON.parse(JSON.stringify(eventDetails));

          if (typeof eventDetails.eventId === 'object' && eventDetails.eventId !== null) {
            const eventObj = eventDetails.eventId as any;
            eventObj.isEnrolled = isEnrolled;
            eventObj.hasCallbackRequest = hasCallbackRequest;

            if (isEnrolled) {
              eventObj.primaryCTA = 'Already Enrolled';
              eventObj.secondaryCTA = null;
            } else if (hasCallbackRequest) {
              if (eventObj.primaryCTA && eventObj.primaryCTA.toLowerCase().includes('register')) {
                eventObj.primaryCTA = 'Interest Registered';
                eventObj.secondaryCTA = null;
              } else if (eventObj.primaryCTA && eventObj.primaryCTA.toLowerCase().includes('callback')) {
                eventObj.primaryCTA = 'Callback Requested';
                eventObj.secondaryCTA = null;
              } else {
                eventObj.secondaryCTA = 'Callback Requested';
              }
            }
          }

          eventDetails.isEnrolled = isEnrolled;
          eventDetails.hasCallbackRequest = hasCallbackRequest;
          if (isEnrolled) {
            eventDetails.primaryCTA = 'Already Enrolled';
            eventDetails.secondaryCTA = null;
          } else if (hasCallbackRequest) {
            if (eventDetails.primaryCTA && eventDetails.primaryCTA.toLowerCase().includes('register')) {
              eventDetails.primaryCTA = 'Interest Registered';
              eventDetails.secondaryCTA = null;
            } else if (eventDetails.primaryCTA && eventDetails.primaryCTA.toLowerCase().includes('callback')) {
              eventDetails.primaryCTA = 'Callback Requested';
              eventDetails.secondaryCTA = null;
            } else {
              eventDetails.secondaryCTA = 'Callback Requested';
            }
          }
        }
      }

      SuccessResponseHelper.ok(res, { eventDetails }, 'Event details retrieved successfully');
    } catch (error: any) {
      logger.error('Get all event details controller error:', error);
      next(error);
    }
  }

  /**
   * Get event overview
   * GET /api/v1/events/:slug/overview
   */
  public async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const overview = await eventDetailsService.getEventOverview(slug);

      SuccessResponseHelper.ok(res, { overview }, 'Event overview retrieved successfully');
    } catch (error: any) {
      logger.error('Get event overview controller error:', error);
      next(error);
    }
  }

  /**
   * Get event agenda
   * GET /api/v1/events/:slug/agenda
   */
  public async getAgenda(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const agenda = await eventDetailsService.getEventAgenda(slug);

      SuccessResponseHelper.ok(res, { agenda }, 'Event agenda retrieved successfully');
    } catch (error: any) {
      logger.error('Get event agenda controller error:', error);
      next(error);
    }
  }

  /**
   * Get event venue details
   * GET /api/v1/events/:slug/venue
   */
  public async getVenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const venue = await eventDetailsService.getEventVenue(slug);

      SuccessResponseHelper.ok(res, { venue }, 'Event venue retrieved successfully');
    } catch (error: any) {
      logger.error('Get event venue controller error:', error);
      next(error);
    }
  }

  /**
   * Get event mentors
   * GET /api/v1/events/:slug/mentors
   */
  public async getMentors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const mentors = await eventDetailsService.getEventMentors(slug);

      SuccessResponseHelper.ok(res, { mentors }, 'Event mentors retrieved successfully');
    } catch (error: any) {
      logger.error('Get event mentors controller error:', error);
      next(error);
    }
  }

  /**
   * Get event FAQs
   * GET /api/v1/events/:slug/faqs
   */
  public async getFAQs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const faqs = await eventDetailsService.getEventFAQs(slug);

      SuccessResponseHelper.ok(res, { faqs }, 'Event FAQs retrieved successfully');
    } catch (error: any) {
      logger.error('Get event FAQs controller error:', error);
      next(error);
    }
  }
}

export const eventDetailsController = EventDetailsController.getInstance();
