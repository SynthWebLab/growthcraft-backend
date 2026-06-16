import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { leadService } from '../services/lead.service';
import { logger } from '@/common/utils/logger.util';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { ValidationError } from '@/common/errors/ValidationError';

export class LeadController {
  private static instance: LeadController;

  private constructor() {}

  public static getInstance(): LeadController {
    if (!LeadController.instance) {
      LeadController.instance = new LeadController();
    }
    return LeadController.instance;
  }

  /**
   * Create a new lead/enquiry
   * POST /api/v1/leads
   */
  public async createLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = errors.array().map((err: any) => ({
          field: err.path || err.param || 'unknown',
          message: err.msg,
          value: err.value,
        }));
        throw new ValidationError('Validation failed', validationErrors);
      }

      const { name, email, phone, role, subject, message, organization, source } = req.body;

      const lead = await leadService.createLead({
        name,
        email,
        phone,
        role,
        subject,
        message,
        organization,
        source,
      });

      SuccessResponseHelper.created(
        res,
        { lead },
        'Your enquiry has been submitted successfully. We will get back to you soon!'
      );
    } catch (error: any) {
      logger.error('Create lead controller error:', error);
      next(error);
    }
  }
}

export const leadController = LeadController.getInstance();
