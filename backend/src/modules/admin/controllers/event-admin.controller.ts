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
   * List all events for admin dashboard
   */
  public async listEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 100, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const query: any = { deletedAt: null };
      if (search) {
        query.$or = [
          { title: { $regex: search as string, $options: 'i' } },
          { domain: { $regex: search as string, $options: 'i' } },
          { type: { $regex: search as string, $options: 'i' } },
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
      const { title, type, domain, durationDays, price, startDate, endDate, maxSeats, mentorIds, mentors, isPublished, isFeatured, ...otherFields } = req.body;

      if (!title || !domain) {
        throw new ValidationError('Title and domain are required');
      }

      const eventType = type && Object.values(EventType).includes(type) ? type : EventType.BOOTCAMP;
      const slug = otherFields.slug ? slugify(otherFields.slug) : slugify(title);

      const existing = await Bootcamp.findOne({ slug, deletedAt: null }).exec();
      if (existing) {
        throw new ValidationError(`Event with slug or title similar to '${slug}' already exists`);
      }

      const resolvedMentors = await resolveMentors(mentorIds, mentors);

      const event = await Bootcamp.create({
        title,
        type: eventType,
        domain,
        durationDays: durationDays ? Number(durationDays) : 30,
        price: price ? Number(price) : 0,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 86400000),
        maxSeats: maxSeats ? Number(maxSeats) : 50,
        slug,
        status: isPublished ? 'Open' : 'Draft',
        isPublished: !!isPublished,
        isFeatured: !!isFeatured,
        isActive: true,
        enrolledCount: 0,
        mentors: resolvedMentors,
        mentorNames: resolvedMentors.map((m) => m.name),
        ...otherFields,
      });

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'event.create',
        event._id.toString(),
        { title, type: eventType, domain, price },
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

      const updates = req.body;
      const event = await Bootcamp.findOne({ _id: id, deletedAt: null }).exec();
      if (!event) {
        throw new NotFoundError('Event not found');
      }

      if (updates.type && !Object.values(EventType).includes(updates.type)) {
        throw new ValidationError(`Invalid event type: ${updates.type}`);
      }

      if (updates.title && !updates.slug) {
        updates.slug = slugify(updates.title);
      } else if (updates.slug) {
        updates.slug = slugify(updates.slug);
      }

      if (updates.slug && updates.slug !== event.slug) {
        const existing = await Bootcamp.findOne({ slug: updates.slug, deletedAt: null }).exec();
        if (existing) {
          throw new ValidationError(`Event with slug '${updates.slug}' already exists`);
        }
      }

      if (updates.mentorIds || updates.mentors) {
        updates.mentors = await resolveMentors(updates.mentorIds, updates.mentors);
        updates.mentorNames = updates.mentors.map((m: any) => m.name);
        delete updates.mentorIds;
      }

      if (updates.startDate) updates.startDate = new Date(updates.startDate);
      if (updates.endDate) updates.endDate = new Date(updates.endDate);

      // Reset stale registrationDeadline if start date is updated to future date
      if (updates.startDate && new Date(updates.startDate) > new Date()) {
        if (!updates.registrationDeadline || new Date(updates.registrationDeadline) < new Date()) {
          updates.registrationDeadline = updates.startDate;
        }
      }

      // Status handling:
      // 1. If explicit status provided, use it.
      // 2. If dates updated to future and event is published, auto-open unless explicit status was passed as 'Closed' or 'Draft'.
      // 3. Otherwise if isPublished was changed without explicit status, set status based on isPublished.
      if (updates.status && ['Open', 'Closed', 'Draft', 'Completed'].includes(updates.status)) {
        // keep explicit status
      } else if (updates.startDate && new Date(updates.startDate) > new Date() && (updates.isPublished ?? event.isPublished)) {
        updates.status = 'Open';
      } else if (updates.isPublished !== undefined) {
        updates.status = updates.isPublished ? 'Open' : 'Draft';
      }

      const oldValues = event.toObject();

      Object.assign(event, updates);
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
      const { status } = req.body;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid event ID');
      }

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
