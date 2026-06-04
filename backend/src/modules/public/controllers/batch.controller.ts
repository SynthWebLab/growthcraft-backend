import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { batchService } from '@/modules/admin/services/batch.service';
import { ValidationError } from '@/common/errors/ValidationError';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { logger } from '@/common/utils/logger.util';

const listPublicBatchesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  courseId: z
    .string()
    .refine((value) => mongoose.Types.ObjectId.isValid(value), 'Invalid courseId format')
    .optional(),
  trainingProgramId: z
    .string()
    .refine((value) => mongoose.Types.ObjectId.isValid(value), 'Invalid trainingProgramId format')
    .optional(),
  bootcampId: z
    .string()
    .refine((value) => mongoose.Types.ObjectId.isValid(value), 'Invalid bootcampId format')
    .optional(),
  mentorId: z
    .string()
    .refine((value) => mongoose.Types.ObjectId.isValid(value), 'Invalid mentorId format')
    .optional(),
  parentType: z.enum(['Course', 'TrainingProgram', 'Bootcamp']).optional(),
});

export class PublicBatchController {
  private static instance: PublicBatchController;

  private constructor() {}

  public static getInstance(): PublicBatchController {
    if (!PublicBatchController.instance) {
      PublicBatchController.instance = new PublicBatchController();
    }
    return PublicBatchController.instance;
  }

  /**
   * List public batches (Open/Filling with future start dates)
   * GET /api/v1/batches
   */
  public async listPublicBatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryResult = listPublicBatchesQuerySchema.safeParse(req.query);

      if (!queryResult.success) {
        throw ValidationError.fromZodError(queryResult.error);
      }

      const result = await batchService.listPublicBatches(queryResult.data);

      SuccessResponseHelper.paginated(
        res,
        result.batches,
        result.pagination,
        'Batches retrieved successfully'
      );
    } catch (error: any) {
      logger.error('List public batches controller error:', error);
      next(error);
    }
  }
}

export const publicBatchController = PublicBatchController.getInstance();
