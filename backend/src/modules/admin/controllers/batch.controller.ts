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
    code: z.string().trim().min(1).max(50).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

const updateBatchSchema = z.object({
  venue: z.string().trim().min(1).optional(),
  capacity: z.number().int().min(1).optional(),
  status: z.nativeEnum(BatchStatus).optional(),
  fee: z.number().min(0).optional(),
});

const assignMentorSchema = z.object({
  mentorId: z
    .string()
    .refine((value) => mongoose.Types.ObjectId.isValid(value), 'Invalid mentorId format'),
});

const assignMentorsSchema = z.object({
  mentorIds: z.array(
    z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), 'Invalid mentorId format')
  ),
});

const listBatchesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.nativeEnum(BatchStatus).optional(),
  batchType: z.nativeEnum(BatchType).optional(),
  courseId: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .refine((val) => !val || mongoose.Types.ObjectId.isValid(val), "Invalid courseId format"),
  trainingProgramId: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .refine((val) => !val || mongoose.Types.ObjectId.isValid(val), "Invalid trainingProgramId format"),
  bootcampId: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .refine((val) => !val || mongoose.Types.ObjectId.isValid(val), "Invalid bootcampId format"),
  mentorId: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .refine((val) => !val || mongoose.Types.ObjectId.isValid(val), "Invalid mentorId format"),
  parentType: z
    .enum(["Course", "TrainingProgram", "Bootcamp"])
    .optional()
    .transform((val) => ((val as any) === "" ? undefined : val)),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
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
   * Get batch by ID
   * GET /api/v1/admin/batches/:id
   */
  public async getBatchById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const batch = await batchService.getBatchById(id);

      SuccessResponseHelper.ok(res, { batch }, 'Batch retrieved successfully');
    } catch (error: any) {
      logger.error('Get batch by ID controller error:', error);
      next(error);
    }
  }

  /**
   * List batches with filters
   * GET /api/v1/admin/batches
   */
  public async listBatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryResult = listBatchesQuerySchema.safeParse(req.query);

      if (!queryResult.success) {
        throw ValidationError.fromZodError(queryResult.error);
      }

      const result = await batchService.listBatches(queryResult.data);

      SuccessResponseHelper.paginated(
        res,
        result.batches,
        result.pagination,
        'Batches retrieved successfully'
      );
    } catch (error: any) {
      logger.error('List batches controller error:', error);
      next(error);
    }
  }

  /**
   * Update batch details
   * PATCH /api/v1/admin/batches/:id
   */
  public async updateBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = updateBatchSchema.safeParse(req.body);

      if (!result.success) {
        throw ValidationError.fromZodError(result.error);
      }

      const batch = await batchService.updateBatch(id, result.data);

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
      const { id } = req.params;
      const result = assignMentorSchema.safeParse(req.body);

      if (!result.success) {
        throw ValidationError.fromZodError(result.error);
      }

      const batch = await batchService.assignMentor(id, result.data.mentorId);

      SuccessResponseHelper.ok(res, { batch }, 'Mentor assigned successfully');
    } catch (error: any) {
      logger.error('Assign mentor controller error:', error);
      next(error);
    }
  }

  /**
   * Assign multiple mentors to batch
   * PATCH /api/v1/admin/batches/:id/mentors
   */
  public async assignMentors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = assignMentorsSchema.safeParse(req.body);

      if (!result.success) {
        throw ValidationError.fromZodError(result.error);
      }

      const batch = await batchService.assignMentors(id, result.data.mentorIds);

      SuccessResponseHelper.ok(res, { batch }, 'Mentors assigned successfully');
    } catch (error: any) {
      logger.error('Assign mentors controller error:', error);
      next(error);
    }
  }
}

export const batchController = BatchController.getInstance();
