import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Course } from '@/database/models';
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
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, ''); // Trim - from end
};

export class CourseAdminController {
  private static instance: CourseAdminController;

  private constructor() {}

  public static getInstance(): CourseAdminController {
    if (!CourseAdminController.instance) {
      CourseAdminController.instance = new CourseAdminController();
    }
    return CourseAdminController.instance;
  }

  /**
   * POST /api/v1/admin/courses
   * Create a new course
   */
  public async createCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, category, price, ...otherFields } = req.body;

      if (!title || !description || !category || price === undefined) {
        throw new ValidationError('Title, description, category, and price are required');
      }

      const slug = otherFields.slug ? slugify(otherFields.slug) : slugify(title);

      // Check if slug is unique
      const existingCourse = await Course.findOne({ slug, deletedAt: null }).exec();
      if (existingCourse) {
        throw new ValidationError(`Course with slug or title similar to '${slug}' already exists`);
      }

      const course = await Course.create({
        title,
        description,
        category,
        price,
        slug,
        isPublished: false,
        isDraft: true,
        isActive: true,
        ...otherFields,
      });

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'course.create',
        course._id.toString(),
        { title, category, price },
        req.ip
      );

      SuccessResponseHelper.created(res, { course }, 'Course created successfully');
    } catch (error) {
      logger.error('Error creating course:', error);
      next(error);
    }
  }

  /**
   * PUT /api/v1/admin/courses/:id
   * Update an existing course
   */
  public async updateCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid course ID');
      }

      const updates = req.body;
      const course = await Course.findOne({ _id: id, deletedAt: null }).exec();
      if (!course) {
        throw new NotFoundError('Course not found');
      }

      // If title is modified, optionally update slug if not explicitly passed
      if (updates.title && !updates.slug) {
        updates.slug = slugify(updates.title);
      } else if (updates.slug) {
        updates.slug = slugify(updates.slug);
      }

      // Prevent duplicate slug if it was updated
      if (updates.slug && updates.slug !== course.slug) {
        const existing = await Course.findOne({ slug: updates.slug, deletedAt: null }).exec();
        if (existing) {
          throw new ValidationError(`Course with slug '${updates.slug}' already exists`);
        }
      }

      const oldValues = course.toObject();

      // Apply updates
      Object.assign(course, updates);
      await course.save();

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'course.update',
        id,
        { updates: Object.keys(updates), oldValues, newValues: updates },
        req.ip
      );

      SuccessResponseHelper.ok(res, { course }, 'Course updated successfully');
    } catch (error) {
      logger.error('Error updating course:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/courses/:id
   * Soft-delete a course
   */
  public async deleteCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid course ID');
      }

      const course = await Course.findOne({ _id: id, deletedAt: null }).exec();
      if (!course) {
        throw new NotFoundError('Course not found');
      }

      course.deletedAt = new Date();
      course.isActive = false;
      await course.save();

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'course.delete',
        id,
        { title: course.title },
        req.ip
      );

      SuccessResponseHelper.ok(res, null, 'Course deleted successfully');
    } catch (error) {
      logger.error('Error deleting course:', error);
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/courses/:id/publish
   * Publish course
   */
  public async publishCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid course ID');
      }

      const course = await Course.findOne({ _id: id, deletedAt: null }).exec();
      if (!course) {
        throw new NotFoundError('Course not found');
      }

      course.isPublished = true;
      course.isDraft = false;
      course.publishedAt = new Date();
      await course.save();

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'course.publish',
        id,
        { title: course.title, publishedAt: course.publishedAt },
        req.ip
      );

      SuccessResponseHelper.ok(res, { course }, 'Course published successfully');
    } catch (error) {
      logger.error('Error publishing course:', error);
      next(error);
    }
  }
}

export const courseAdminController = CourseAdminController.getInstance();
