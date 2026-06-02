import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BatchMode, BatchStatus, BatchType } from '@/database/models';
import { ValidationError } from '@/common/errors/ValidationError';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { logger } from '@/common/utils/logger.util';
import { batchService } from '../services/batch.service';

const objectIdSchema = z
  .string()
  .refine((value) => mongoose.Types.ObjectId.isValid(value), 'Invalid id format');

const createBatchSchema = z
  .object({
    batchType: z.nativeEnum(BatchType),
    parentId: z
      .string()
      .refine((value) => mongoose.Types.ObjectId.isValid(value), 'Invalid parentId format'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    capacity: z.number().int().min(1),
    fee: z.number().min(0),
    venue: z.string().trim().min(1).optional(),
    mode: z.nativeEnum(BatchMode),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

const updateBatchSchema = z
  .object({
    venue: z.string().trim().min(1).optional(),
    capacity: z.number().int().min(1).optional(),
    status: z.nativeEnum(BatchStatus).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

const assignMentorSchema = z.object({
  mentorId: z
    .string()
    .refine((value) => mongoose.Types.ObjectId.isValid(value), 'Invalid mentorId format'),
});

export class BatchController {
  private static instance: BatchController;

  private constructor() {}

  public static getInstance(): BatchController {
    if (!BatchController.instance) {
      BatchController.instance = new BatchController();
    }
    return BatchController.instance;
  }

  /**
   * Create batch
   * POST /api/v1/admin/batches
   */
  public async createBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = createBatchSchema.safeParse(req.body);

      if (!result.success) {
        throw ValidationError.fromZodError(result.error);
      }

      const batch = await batchService.createBatch(result.data);

      SuccessResponseHelper.created(res, { batch }, 'Batch created successfully');
    } catch (error: any) {
      logger.error('Create batch controller error:', error);
      next(error);
    }
  }

  /**
   * Update batch
   * PATCH /api/v1/admin/batches/:id
   */
  public async updateBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idResult = objectIdSchema.safeParse(req.params.id);

      if (!idResult.success) {
        throw ValidationError.fromZodError(idResult.error);
      }

      const result = updateBatchSchema.safeParse(req.body);

      if (!result.success) {
        throw ValidationError.fromZodError(result.error);
      }

      const batch = await batchService.updateBatch(idResult.data, result.data);

      SuccessResponseHelper.ok(res, { batch }, 'Batch updated successfully');
    } catch (error: any) {
      logger.error('Update batch controller error:', error);
      next(error);
    }
  }

  /**
   * Assign mentor to batch
   * PATCH /api/v1/admin/batches/:id/mentor
   */
  public async assignMentor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idResult = objectIdSchema.safeParse(req.params.id);

      if (!idResult.success) {
        throw ValidationError.fromZodError(idResult.error);
      }

      const result = assignMentorSchema.safeParse(req.body);

      if (!result.success) {
        throw ValidationError.fromZodError(result.error);
      }

      const batch = await batchService.assignMentor(idResult.data, result.data.mentorId);

      SuccessResponseHelper.ok(res, { batch }, 'Mentor assigned successfully');
    } catch (error: any) {
      logger.error('Assign mentor controller error:', error);
      next(error);
    }
  }
}

export const batchController = BatchController.getInstance();
