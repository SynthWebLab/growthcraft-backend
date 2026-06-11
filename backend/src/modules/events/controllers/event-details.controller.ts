import { Request, Response, NextFunction } from 'express';
import { eventDetailsService } from '../services/event-details.service';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { logger } from '@/common/utils/logger.util';

export class EventDetailsController {
  private static instance: EventDetailsController;

  private constructor() {}

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

      const eventDetails = await eventDetailsService.getEventDetailsBySlug(slug);

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
