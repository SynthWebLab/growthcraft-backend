import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Bootcamp, EventType } from '@/database/models';
import { ValidationError } from '@/common/errors/ValidationError';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { auditLogService } from '../services/audit-log.service';
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
   * POST /api/v1/admin/events
   * Create an event/bootcamp
   */
  public async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, type, domain, durationDays, price, startDate, endDate, maxSeats, ...otherFields } = req.body;

      if (!title || !type || !domain || !durationDays || price === undefined || !startDate || !endDate || !maxSeats) {
        throw new ValidationError('Title, type, domain, durationDays, price, startDate, endDate, and maxSeats are required');
      }

      if (!Object.values(EventType).includes(type)) {
        throw new ValidationError(`Invalid event type: ${type}`);
      }

      const slug = otherFields.slug ? slugify(otherFields.slug) : slugify(title);

      const existing = await Bootcamp.findOne({ slug, deletedAt: null }).exec();
      if (existing) {
        throw new ValidationError(`Event with slug or title similar to '${slug}' already exists`);
      }

      const event = await Bootcamp.create({
        title,
        type,
        domain,
        durationDays,
        price,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxSeats,
        slug,
        status: 'Draft',
        isPublished: false,
        isActive: true,
        enrolledCount: 0,
        ...otherFields,
      });

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'event.create',
        event._id.toString(),
        { title, type, domain, price },
        req.ip
      );

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

      SuccessResponseHelper.ok(res, { event }, 'Event updated successfully');
    } catch (error) {
      logger.error('Error updating event:', error);
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

      SuccessResponseHelper.ok(res, null, 'Event deleted successfully');
    } catch (error) {
      logger.error('Error deleting event:', error);
      next(error);
    }
  }
}

export const eventAdminController = EventAdminController.getInstance();
