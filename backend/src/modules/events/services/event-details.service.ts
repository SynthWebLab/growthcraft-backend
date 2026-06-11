import { EventDetails, IEventDetails } from '@/database/models/EventDetails.model';
import { Bootcamp, EventType } from '@/database/models/Bootcamp.model';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { logger } from '@/common/utils/logger.util';

export class EventDetailsService {
  private static instance: EventDetailsService;

  private constructor() {}

  public static getInstance(): EventDetailsService {
    if (!EventDetailsService.instance) {
      EventDetailsService.instance = new EventDetailsService();
    }
    return EventDetailsService.instance;
  }

  /**
   * Get complete event details by slug
   */
  public async getEventDetailsBySlug(slug: string): Promise<IEventDetails> {
    try {
      const eventDetails = await EventDetails.findOne({ slug })
        .populate('eventId')
        .exec();

      if (!eventDetails) {
        throw new NotFoundError('Event details not found', 'EVENT_DETAILS_NOT_FOUND');
      }

      return eventDetails;
    } catch (error) {
      logger.error('Get event details by slug error:', error);
      throw error;
    }
  }

  /**
   * Get event overview by slug
   */
  public async getEventOverview(slug: string) {
    try {
      const eventDetails = await EventDetails.findOne({ slug })
        .select('overview slug type')
        .exec();

      if (!eventDetails) {
        throw new NotFoundError('Event details not found', 'EVENT_DETAILS_NOT_FOUND');
      }

      return eventDetails.overview;
    } catch (error) {
      logger.error('Get event overview error:', error);
      throw error;
    }
  }

  /**
   * Get event agenda by slug
   */
  public async getEventAgenda(slug: string) {
    try {
      const eventDetails = await EventDetails.findOne({ slug })
        .select('agenda slug type')
        .exec();

      if (!eventDetails) {
        throw new NotFoundError('Event details not found', 'EVENT_DETAILS_NOT_FOUND');
      }

      return eventDetails.agenda;
    } catch (error) {
      logger.error('Get event agenda error:', error);
      throw error;
    }
  }

  /**
   * Get event venue details by slug
   */
  public async getEventVenue(slug: string) {
    try {
      const eventDetails = await EventDetails.findOne({ slug })
        .select('venue slug type')
        .exec();

      if (!eventDetails) {
        throw new NotFoundError('Event details not found', 'EVENT_DETAILS_NOT_FOUND');
      }

      return eventDetails.venue;
    } catch (error) {
      logger.error('Get event venue error:', error);
      throw error;
    }
  }

  /**
   * Get event mentors by slug
   */
  public async getEventMentors(slug: string) {
    try {
      const eventDetails = await EventDetails.findOne({ slug })
        .select('mentors slug type')
        .exec();

      if (!eventDetails) {
        throw new NotFoundError('Event details not found', 'EVENT_DETAILS_NOT_FOUND');
      }

      return eventDetails.mentors;
    } catch (error) {
      logger.error('Get event mentors error:', error);
      throw error;
    }
  }

  /**
   * Get event FAQs by slug
   */
  public async getEventFAQs(slug: string) {
    try {
      const eventDetails = await EventDetails.findOne({ slug })
        .select('faqs slug type')
        .exec();

      if (!eventDetails) {
        throw new NotFoundError('Event details not found', 'EVENT_DETAILS_NOT_FOUND');
      }

      return eventDetails.faqs;
    } catch (error) {
      logger.error('Get event FAQs error:', error);
      throw error;
    }
  }

  /**
   * Get event details by slug and type
   */
  public async getEventDetailsBySlugAndType(slug: string, eventType: EventType): Promise<IEventDetails> {
    try {
      const eventDetails = await EventDetails.findOne({ slug, type: eventType })
        .populate('eventId')
        .exec();

      if (!eventDetails) {
        throw new NotFoundError(`${eventType} details not found`, 'EVENT_DETAILS_NOT_FOUND');
      }

      return eventDetails;
    } catch (error) {
      logger.error('Get event details by slug and type error:', error);
      throw error;
    }
  }

  /**
   * Create or update event details
   */
  public async upsertEventDetails(
    slug: string,
    detailsData: Partial<IEventDetails>
  ): Promise<IEventDetails> {
    try {
      // Check if event exists
      const event = await Bootcamp.findOne({ slug }).exec();
      if (!event) {
        throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');
      }

      // Upsert event details
      const eventDetails = await EventDetails.findOneAndUpdate(
        { slug },
        {
          ...detailsData,
          eventId: event._id,
          slug,
          type: event.type,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      ).exec();

      return eventDetails;
    } catch (error) {
      logger.error('Upsert event details error:', error);
      throw error;
    }
  }

  /**
   * Check if event details exist
   */
  public async eventDetailsExist(slug: string): Promise<boolean> {
    try {
      const count = await EventDetails.countDocuments({ slug }).exec();
      return count > 0;
    } catch (error) {
      logger.error('Check event details exist error:', error);
      throw error;
    }
  }

  /**
   * Delete event details
   */
  public async deleteEventDetails(slug: string): Promise<void> {
    try {
      await EventDetails.findOneAndDelete({ slug }).exec();
      logger.info(`Event details deleted for slug: ${slug}`);
    } catch (error) {
      logger.error('Delete event details error:', error);
      throw error;
    }
  }
}

export const eventDetailsService = EventDetailsService.getInstance();
