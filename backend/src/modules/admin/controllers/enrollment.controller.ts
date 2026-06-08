import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@/common/errors/ValidationError';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { logger } from '@/common/utils/logger.util';
import { enrollmentService } from '../services/enrollment.service';

const createEnrollmentSchema = z.object({
  studentUserId: z
    .string()
    .refine((value) => mongoose.Types.ObjectId.isValid(value), 'Invalid studentUserId format'),
  batchId: z
    .string()
    .refine((value) => mongoose.Types.ObjectId.isValid(value), 'Invalid batchId format'),
  feeQuoted: z
    .number()
    .min(0, 'Fee quoted must be at least 0')
    .max(999999.99, 'Fee quoted cannot exceed 999,999.99'),
  paymentMethod: z.enum(['razorpay', 'offline']).optional(),
});

export class EnrollmentController {
  private static instance: EnrollmentController;

  private constructor() {}

  public static getInstance(): EnrollmentController {
    if (!EnrollmentController.instance) {
      EnrollmentController.instance = new EnrollmentController();
    }
    return EnrollmentController.instance;
  }

  /**
   * Create enrollment
   * POST /api/v1/admin/enrollments
   */
  public async createEnrollment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = createEnrollmentSchema.safeParse(req.body);

      if (!result.success) {
        throw ValidationError.fromZodError(result.error);
      }

      const { enrollment, paymentLink } = await enrollmentService.createEnrollment(result.data);

      const responseData: any = { enrollment };
      if (paymentLink) {
        responseData.paymentLink = paymentLink;
      }

      SuccessResponseHelper.created(res, responseData, 'Enrollment created successfully');
    } catch (error: any) {
      logger.error('Create enrollment controller error:', error);
      next(error);
    }
  }
}

export const enrollmentController = EnrollmentController.getInstance();
