import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { TrainingProgram } from '@/database/models';
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

export class TrainingProgramAdminController {
  private static instance: TrainingProgramAdminController;

  private constructor() {}

  public static getInstance(): TrainingProgramAdminController {
    if (!TrainingProgramAdminController.instance) {
      TrainingProgramAdminController.instance = new TrainingProgramAdminController();
    }
    return TrainingProgramAdminController.instance;
  }

  /**
   * POST /api/v1/admin/training-programs
   * Create a training program
   */
  public async createTrainingProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, domain, durationDays, tools, price, ...otherFields } = req.body;

      if (!title || !description || !domain || !durationDays || !tools || price === undefined) {
        throw new ValidationError('Title, description, domain, durationDays, tools, and price are required');
      }

      const slug = otherFields.slug ? slugify(otherFields.slug) : slugify(title);

      const existing = await TrainingProgram.findOne({ slug, deletedAt: null }).exec();
      if (existing) {
        throw new ValidationError(`Training program with slug or title similar to '${slug}' already exists`);
      }

      const program = await TrainingProgram.create({
        title,
        description,
        domain,
        durationDays,
        tools,
        price,
        slug,
        status: 'draft',
        isPublished: false,
        ...otherFields,
      });

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'trainingprogram.create',
        program._id.toString(),
        { title, domain, price },
        req.ip
      );

      SuccessResponseHelper.created(res, { trainingProgram: program }, 'Training program created successfully');
    } catch (error) {
      logger.error('Error creating training program:', error);
      next(error);
    }
  }

  /**
   * PUT /api/v1/admin/training-programs/:id
   * Update a training program
   */
  public async updateTrainingProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid training program ID');
      }

      const updates = req.body;
      const program = await TrainingProgram.findOne({ _id: id, deletedAt: null }).exec();
      if (!program) {
        throw new NotFoundError('Training program not found');
      }

      if (updates.title && !updates.slug) {
        updates.slug = slugify(updates.title);
      } else if (updates.slug) {
        updates.slug = slugify(updates.slug);
      }

      if (updates.slug && updates.slug !== program.slug) {
        const existing = await TrainingProgram.findOne({ slug: updates.slug, deletedAt: null }).exec();
        if (existing) {
          throw new ValidationError(`Training program with slug '${updates.slug}' already exists`);
        }
      }

      const oldValues = program.toObject();

      Object.assign(program, updates);
      await program.save();

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'trainingprogram.update',
        id,
        { updates: Object.keys(updates), oldValues, newValues: updates },
        req.ip
      );

      SuccessResponseHelper.ok(res, { trainingProgram: program }, 'Training program updated successfully');
    } catch (error) {
      logger.error('Error updating training program:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/training-programs/:id
   * Soft-delete a training program
   */
  public async deleteTrainingProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid training program ID');
      }

      const program = await TrainingProgram.findOne({ _id: id, deletedAt: null }).exec();
      if (!program) {
        throw new NotFoundError('Training program not found');
      }

      program.deletedAt = new Date();
      program.status = 'draft';
      program.isPublished = false;
      await program.save();

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'trainingprogram.delete',
        id,
        { title: program.title },
        req.ip
      );

      SuccessResponseHelper.ok(res, null, 'Training program deleted successfully');
    } catch (error) {
      logger.error('Error deleting training program:', error);
      next(error);
    }
  }
}

export const trainingProgramAdminController = TrainingProgramAdminController.getInstance();
