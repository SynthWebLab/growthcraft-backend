import { EventDetails, IEventDetails } from '@/database/models/EventDetails.model';
import { Bootcamp, EventType, IBootcamp } from '@/database/models/Bootcamp.model';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { logger } from '@/common/utils/logger.util';

export class EventDetailsService {
  private static instance: EventDetailsService | null = null;

  public constructor() {}

  public static getInstance(): EventDetailsService {
    if (!EventDetailsService.instance) {
      EventDetailsService.instance = new EventDetailsService();
    }
    return EventDetailsService.instance;
  }

  public static setInstance(instance: EventDetailsService | null): void {
    EventDetailsService.instance = instance;
  }

  public static resetInstance(): void {
    EventDetailsService.instance = null;
  }

  /**
   * Get complete event details by slug with fallback for admin-created events
   */
  public async getEventDetailsBySlug(slug: string): Promise<Record<string, unknown>> {
    try {
      const event = await Bootcamp.findOne({ slug, deletedAt: null }).lean();
      let eventDetails = await EventDetails.findOne({ slug }).populate('eventId').lean();

      if (!eventDetails) {
        if (!event) {
          throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');
        }
        eventDetails = this.buildFallbackEventDetails(event);
      } else if (eventDetails.eventId) {
        const baseEvent = eventDetails.eventId as any;
        if (typeof baseEvent === 'object' && baseEvent !== null && baseEvent.title) {
          if (baseEvent.mentors && baseEvent.mentors.length > 0) {
            (eventDetails as any).mentors = baseEvent.mentors;
          }
        } else if (event) {
          (eventDetails as any).eventId = event;
        }
      } else if (event) {
        (eventDetails as any).eventId = event;
      }

      if (event && (event as any).mentors && (event as any).mentors.length > 0) {
        (eventDetails as any).mentors = (event as any).mentors;
      }

      return this.serializeEventDetails(eventDetails);
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
        .lean();

      if (eventDetails) return eventDetails.overview;

      const event = await Bootcamp.findOne({ slug, deletedAt: null }).lean();
      if (!event) throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');

      return {
        aboutEvent: event.description || '',
        whatYouWillLearn: event.skillsCovered || [],
        prerequisites: [],
        targetAudience: [],
      };
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
        .lean();

      if (eventDetails) return eventDetails.agenda;

      const event = await Bootcamp.findOne({ slug, deletedAt: null }).lean();
      if (!event) throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');

      return [];
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
        .lean();

      if (eventDetails) return eventDetails.venue;

      const event = await Bootcamp.findOne({ slug, deletedAt: null }).lean();
      if (!event) throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');

      return { mode: event.mode || 'Online' };
    } catch (error) {
      logger.error('Get event venue error:', error);
      throw error;
    }
  }

  /**
   * Get event mentors by slug — prioritizes real assigned mentors from base Bootcamp document
   */
  public async getEventMentors(slug: string) {
    try {
      const event = await Bootcamp.findOne({ slug, deletedAt: null }).lean();
      if (event && (event as any).mentors && (event as any).mentors.length > 0) {
        return (event as any).mentors;
      }

      const eventDetails = await EventDetails.findOne({ slug })
        .select('mentors slug type')
        .lean();

      if (eventDetails && (eventDetails as any).mentors && (eventDetails as any).mentors.length > 0) {
        return eventDetails.mentors;
      }

      return (event as any)?.mentors || [];
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
        .lean();

      if (eventDetails) return eventDetails.faqs;

      const event = await Bootcamp.findOne({ slug, deletedAt: null }).lean();
      if (!event) throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');

      return [];
    } catch (error) {
      logger.error('Get event FAQs error:', error);
      throw error;
    }
  }

  /**
   * Get event details by slug and type
   */
  public async getEventDetailsBySlugAndType(slug: string, eventType: EventType): Promise<Record<string, unknown>> {
    return this.getEventDetailsBySlug(slug);
  }

  /**
   * Create or update event details
   */
  public async upsertEventDetails(
    slug: string,
    detailsData: Partial<IEventDetails>
  ): Promise<IEventDetails> {
    try {
      const event = await Bootcamp.findOne({ slug }).exec();
      if (!event) {
        throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');
      }

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
   * Fallback event details object builder
   */
  private buildFallbackEventDetails(event: any): any {
    return {
      _id: null,
      eventId: event,
      slug: event.slug,
      type: event.type || 'Bootcamp',
      overview: {
        aboutEvent: event.description || '',
        whatYouWillLearn: event.skillsCovered || [],
        prerequisites: [],
        targetAudience: [],
      },
      agenda: [],
      venue: {
        mode: event.mode || 'Online',
      },
      mentors: event.mentors || [],
      faqs: [],
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  /**
   * Serialize EventDetails document into JSON structure
   */
  private serializeEventDetails(eventDetails: any): Record<string, unknown> {
    const rawObj = typeof eventDetails.toObject === 'function' ? eventDetails.toObject() : eventDetails;
    const baseEvent = typeof rawObj.eventId === 'object' && rawObj.eventId !== null ? rawObj.eventId : {};

    return {
      _id: rawObj._id,
      eventId: rawObj.eventId,
      event: baseEvent,
      title: baseEvent.title || rawObj.title,
      price: baseEvent.price ?? rawObj.price ?? 0,
      originalPrice: baseEvent.originalPrice ?? rawObj.originalPrice ?? 0,
      maxSeats: baseEvent.maxSeats ?? rawObj.maxSeats ?? 50,
      startDate: baseEvent.startDate || rawObj.startDate,
      endDate: (baseEvent.endDate || rawObj.endDate) || (
        (baseEvent.startDate || rawObj.startDate) && !Boolean(baseEvent.isDateTBA ?? rawObj.isDateTBA ?? false)
          ? new Date(new Date(baseEvent.startDate || rawObj.startDate).getTime() + (baseEvent.durationDays || baseEvent.duration || 1) * 86400000)
          : null
      ),
      isDateTBA: Boolean(baseEvent.isDateTBA ?? rawObj.isDateTBA ?? false),
      status: baseEvent.status || rawObj.status || 'Open',
      slug: rawObj.slug,
      type: rawObj.type || baseEvent.type,
      overview: rawObj.overview || { aboutEvent: baseEvent.description || '', whatYouWillLearn: baseEvent.skillsCovered || [], prerequisites: [], targetAudience: [] },
      agenda: rawObj.agenda || [],
      venue: rawObj.venue || { mode: baseEvent.mode || 'Online' },
      mentors: (rawObj.mentors && rawObj.mentors.length > 0) ? rawObj.mentors : (baseEvent.mentors || []),
      faqs: rawObj.faqs || [],
      createdAt: rawObj.createdAt || baseEvent.createdAt,
      updatedAt: rawObj.updatedAt || baseEvent.updatedAt,
    };
  }
}

export const eventDetailsService = EventDetailsService.getInstance();
