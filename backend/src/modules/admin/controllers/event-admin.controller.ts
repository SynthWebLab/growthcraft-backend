import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Bootcamp, EventType, User, MentorProfile } from '@/database/models';
import { ValidationError } from '@/common/errors/ValidationError';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { auditLogService } from '../services/audit-log.service';
import { catalogueService } from '@/modules/public/services/catalogue.service';
import { socketService } from '@/modules/notifications/services/socket.service';
import { logger } from '@/common/utils/logger.util';
import {
  createEventSchema,
  updateEventSchema,
  toggleEventStatusSchema,
} from '../validators/admin.validator';

// Helper to slugify title
const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// Helper to resolve real mentors from mentorIds array or input
const resolveMentors = async (mentorIds?: string[], mentorsInput?: any[]): Promise<any[]> => {
  let resolvedMentors: any[] = [];
  if (Array.isArray(mentorsInput) && mentorsInput.length > 0) {
    resolvedMentors = mentorsInput.map((m) => ({
      userId: m.userId || m.id || undefined,
      mentorProfileId: m.mentorProfileId || undefined,
      name: m.name || m.fullName || 'GrowthCraft Mentor',
      avatar: m.avatar || '',
      designation: m.designation || m.currentOrganization || m.areaOfExpertise || '',
      areaOfExpertise: m.areaOfExpertise || '',
      bio: m.bio || '',
    }));
  } else if (Array.isArray(mentorIds) && mentorIds.length > 0) {
    const validIds = mentorIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length > 0) {
      const users = await User.find({ _id: { $in: validIds } }).select('fullName email avatar').exec();
      const profiles = await MentorProfile.find({ userId: { $in: validIds } }).exec();
      const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

      resolvedMentors = users.map((u) => {
        const p = profileMap.get(u._id.toString());
        return {
          userId: u._id,
          mentorProfileId: p?._id,
          name: u.fullName || u.email,
          avatar: (u as any).avatar || '',
          designation: p?.currentOrganization || p?.areaOfExpertise || '',
          areaOfExpertise: p?.areaOfExpertise || '',
          bio: p?.bio || '',
        };
      });
    }
  }
  return resolvedMentors;
};

export class EventAdminController {
  private static instance: EventAdminController;

  private constructor() {}

  public static getInstance(): EventAdminController {
    if (!EventAdminController.instance) {
      EventAdminController.instance = new EventAdminController();
    }
    return EventAdminController.instance;
  }

  /**
   * GET /api/v1/admin/events
   * List all events/bootcamps for admin with pagination, filtering & search
   */
  public async listEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, type, domain, status, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const query: any = { deletedAt: null };

      if (type && Object.values(EventType).includes(type as EventType)) {
        query.type = type;
      }
      if (domain) {
        query.domain = { $regex: domain, $options: 'i' };
      }
      if (status) {
        query.status = status;
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { domain: { $regex: search, $options: 'i' } },
          { mentorNames: { $in: [new RegExp(String(search), 'i')] } },
        ];
      }

      const [items, total] = await Promise.all([
        Bootcamp.find(query).sort({ isFeatured: -1, createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
        Bootcamp.countDocuments(query),
      ]);

      SuccessResponseHelper.ok(
        res,
        {
          items,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
        'Events retrieved successfully'
      );
    } catch (error) {
      logger.error('Error listing events:', error);
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/events
   * Create an event/bootcamp
   */
  public async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = createEventSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw ValidationError.fromZodError(parseResult.error);
      }

      const validated = parseResult.data;
      const eventType = validated.type || EventType.BOOTCAMP;
      const slug = validated.slug ? slugify(validated.slug) : slugify(validated.title);

      const existing = await Bootcamp.findOne({ slug, deletedAt: null }).exec();
      if (existing) {
        throw new ValidationError(`Event with slug or title similar to '${slug}' already exists`);
      }

      const resolvedMentors = await resolveMentors(validated.mentorIds, validated.mentors);

      const eventPayload: Record<string, any> = {
        title: validated.title.trim(),
        type: eventType,
        domain: validated.domain.trim(),
        description: validated.description?.trim() || '',
        durationDays: validated.durationDays ? Number(validated.durationDays) : 30,
        price: validated.price ? Number(validated.price) : 0,
        isDateTBA: Boolean(validated.isDateTBA),
        startDate: !validated.isDateTBA && validated.startDate ? new Date(validated.startDate) : null,
        endDate: !validated.isDateTBA && validated.startDate
          ? (validated.endDate ? new Date(validated.endDate) : new Date(new Date(validated.startDate).getTime() + (validated.durationDays ? Number(validated.durationDays) : 30) * 86400000))
          : null,
        registrationDeadline: !validated.isDateTBA && validated.registrationDeadline ? new Date(validated.registrationDeadline) : null,
        maxSeats: validated.maxSeats ? Number(validated.maxSeats) : 50,
        mode: validated.mode || 'Online',
        banner: validated.banner || '',
        keyTopics: validated.keyTopics || ['Full Stack', 'Web Development'],
        skillsCovered: validated.skillsCovered || [],
        tags: validated.tags || [],
        slug,
        status: validated.status || (validated.isPublished ? 'Open' : 'Draft'),
        isPublished: Boolean(validated.isPublished),
        isFeatured: Boolean(validated.isFeatured),
        isActive: true,
        enrolledCount: 0,
        mentors: resolvedMentors,
        mentorNames: resolvedMentors.map((m) => m.name),
      };

      if (validated.originalPrice !== undefined && validated.originalPrice !== null) {
        eventPayload.originalPrice = Number(validated.originalPrice);
      }

      const event = await Bootcamp.create(eventPayload);

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'event.create',
        event._id.toString(),
        { title: validated.title, type: eventType, domain: validated.domain, price: validated.price },
        req.ip
      );

      // Invalidate catalogue cache
      await catalogueService.clearCatalogueCache();

      SuccessResponseHelper.created(res, { event }, 'Event created successfully');
    } catch (error) {
      logger.error('Error creating event:', error);
      next(error);
    }
  }

  /**
   * PUT /api/v1/admin/events/:id
   * Update an event
   */
  public async updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid event ID');
      }

      const parseResult = updateEventSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw ValidationError.fromZodError(parseResult.error);
      }

      const updates = parseResult.data;
      const event = await Bootcamp.findOne({ _id: id, deletedAt: null }).exec();
      if (!event) {
        throw new NotFoundError('Event not found');
      }

      let targetSlug = updates.slug;
      if (updates.title && !targetSlug) {
        targetSlug = slugify(updates.title);
      } else if (targetSlug) {
        targetSlug = slugify(targetSlug);
      }

      if (targetSlug && targetSlug !== event.slug) {
        const existing = await Bootcamp.findOne({ slug: targetSlug, deletedAt: null }).exec();
        if (existing) {
          throw new ValidationError(`Event with slug '${targetSlug}' already exists`);
        }
        event.slug = targetSlug;
      }

      // Explicitly assign only validated fields (prevent mass assignment)
      if (updates.title !== undefined) event.title = updates.title.trim();
      if (updates.domain !== undefined) event.domain = updates.domain.trim();
      if (updates.type !== undefined) event.type = updates.type;
      if (updates.description !== undefined) event.description = updates.description.trim();
      if (updates.durationDays !== undefined) event.durationDays = Number(updates.durationDays);
      if (updates.price !== undefined) event.price = Number(updates.price);
      if (updates.originalPrice !== undefined) {
        event.originalPrice = updates.originalPrice !== null ? Number(updates.originalPrice) : undefined;
      }
      if (updates.maxSeats !== undefined) event.maxSeats = Number(updates.maxSeats);
      if (updates.mode !== undefined) event.mode = updates.mode;
      if (updates.banner !== undefined) event.banner = updates.banner;
      if (updates.keyTopics !== undefined) event.keyTopics = updates.keyTopics;
      if (updates.skillsCovered !== undefined) event.skillsCovered = updates.skillsCovered;
      if (updates.tags !== undefined) event.tags = updates.tags;

      if (updates.mentorIds !== undefined || updates.mentors !== undefined) {
        event.mentors = await resolveMentors(updates.mentorIds, updates.mentors);
        event.mentorNames = event.mentors.map((m: any) => m.name);
      }

      if (updates.isDateTBA !== undefined) {
        event.isDateTBA = Boolean(updates.isDateTBA);
      }

      if (event.isDateTBA) {
        event.startDate = null;
        event.endDate = null;
        event.registrationDeadline = null;
      } else {
        if (updates.startDate !== undefined) {
          event.startDate = updates.startDate ? new Date(updates.startDate) : null;
        }
        if (updates.endDate !== undefined) {
          event.endDate = updates.endDate ? new Date(updates.endDate) : null;
        } else if (event.startDate && !event.endDate) {
          const days = event.durationDays || event.duration || 30;
          event.endDate = new Date(event.startDate.getTime() + days * 86400000);
        }

        // Reset stale registrationDeadline if start date is updated to future date
        if (updates.startDate && new Date(updates.startDate) > new Date()) {
          if (!updates.registrationDeadline || new Date(updates.registrationDeadline) < new Date()) {
            event.registrationDeadline = new Date(updates.startDate);
          }
        } else if (updates.registrationDeadline !== undefined) {
          event.registrationDeadline = updates.registrationDeadline ? new Date(updates.registrationDeadline) : null;
        }
      }

      if (updates.isPublished !== undefined) {
        event.isPublished = Boolean(updates.isPublished);
      }
      if (updates.isFeatured !== undefined) {
        event.isFeatured = Boolean(updates.isFeatured);
      }

      // Status handling:
      // 1. If explicit status provided, use it.
      // 2. If dates updated to future and event is published, auto-open unless explicit status was passed as 'Closed' or 'Draft'.
      // 3. Otherwise if isPublished was changed without explicit status, set status based on isPublished.
      if (updates.status && ['Open', 'Closed', 'Draft', 'Completed'].includes(updates.status)) {
        event.status = updates.status;
      } else if (updates.startDate && new Date(updates.startDate) > new Date() && event.isPublished) {
        event.status = 'Open';
      } else if (updates.isPublished !== undefined) {
        event.status = updates.isPublished ? 'Open' : 'Draft';
      }

      const oldValues = event.toObject();
      await event.save();

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'event.update',
        id,
        { updates: Object.keys(updates), oldValues, newValues: updates },
        req.ip
      );

      // Invalidate catalogue cache
      await catalogueService.clearCatalogueCache();

      // Real-time broadcast
      socketService.emitToAll('event.updated', { id, eventId: id, status: event.status, title: event.title, isPublished: event.isPublished });

      SuccessResponseHelper.ok(res, { event }, 'Event updated successfully');
    } catch (error) {
      logger.error('Error updating event:', error);
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/events/:id/status
   * Toggle or update registration status (Open / Closed)
   */
  public async toggleEventStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid event ID');
      }

      const parseResult = toggleEventStatusSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw ValidationError.fromZodError(parseResult.error);
      }

      const { status } = parseResult.data;
      const event = await Bootcamp.findOne({ _id: id, deletedAt: null }).exec();
      if (!event) {
        throw new NotFoundError('Event not found');
      }

      if (status && ['Open', 'Closed', 'Draft', 'Completed'].includes(status)) {
        event.status = status;
      } else {
        event.status = event.status === 'Open' ? 'Closed' : 'Open';
      }

      await event.save();

      await auditLogService.log(
        req.user!.userId,
        'event.status.update',
        id,
        { title: event.title, status: event.status },
        req.ip
      );

      // Invalidate catalogue cache
      await catalogueService.clearCatalogueCache();

      // Real-time broadcast
      socketService.emitToAll('event.updated', { id, eventId: id, status: event.status, title: event.title });

      SuccessResponseHelper.ok(
        res,
        { event },
        `Event registration status updated to ${event.status}`
      );
    } catch (error) {
      logger.error('Error toggling event status:', error);
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/events/:id/publish
   * Toggle publish status of an event
   */
  public async publishEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid event ID');
      }

      const event = await Bootcamp.findOne({ _id: id, deletedAt: null }).exec();
      if (!event) {
        throw new NotFoundError('Event not found');
      }

      event.isPublished = !event.isPublished;
      event.status = event.isPublished ? 'Open' : 'Draft';
      if (event.isPublished && !event.publishedAt) {
        event.publishedAt = new Date();
      }

      await event.save();

      await auditLogService.log(
        req.user!.userId,
        event.isPublished ? 'event.publish' : 'event.unpublish',
        id,
        { title: event.title, isPublished: event.isPublished },
        req.ip
      );

      // Invalidate catalogue cache
      await catalogueService.clearCatalogueCache();

      // Real-time broadcast
      socketService.emitToAll('event.updated', { id, eventId: id, status: event.status, isPublished: event.isPublished, title: event.title });

      SuccessResponseHelper.ok(
        res,
        { event },
        `Event ${event.isPublished ? 'published' : 'unpublished'} successfully`
      );
    } catch (error) {
      logger.error('Error toggling event publish status:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/events/:id
   * Soft-delete an event
   */
  public async deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid event ID');
      }

      const event = await Bootcamp.findOne({ _id: id, deletedAt: null }).exec();
      if (!event) {
        throw new NotFoundError('Event not found');
      }

      event.deletedAt = new Date();
      event.status = 'Draft';
      event.isPublished = false;
      event.isActive = false;
      await event.save();

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'event.delete',
        id,
        { title: event.title },
        req.ip
      );

      // Invalidate catalogue cache
      await catalogueService.clearCatalogueCache();

      SuccessResponseHelper.ok(res, null, 'Event deleted successfully');
    } catch (error) {
      logger.error('Error deleting event:', error);
      next(error);
    }
  }
}

export const eventAdminController = EventAdminController.getInstance();
