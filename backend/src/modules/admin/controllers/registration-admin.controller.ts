import { Request, Response, NextFunction } from 'express';
import { registrationAdminService } from '../services/registration-admin.service';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { logger } from '@/common/utils/logger.util';
import { ValidationError } from '@/common/errors/ValidationError';

export class RegistrationAdminController {
  private static instance: RegistrationAdminController;

  private constructor() {}

  public static getInstance(): RegistrationAdminController {
    if (!RegistrationAdminController.instance) {
      RegistrationAdminController.instance = new RegistrationAdminController();
    }
    return RegistrationAdminController.instance;
  }

  /**
   * GET /api/v1/admin/registrations
   * List all unified registrations
   */
  public async listRegistrations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const registrations = await registrationAdminService.listAllRegistrations();
      SuccessResponseHelper.ok(
        res,
        registrations,
        'Unified registration records retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching admin registrations:', error);
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/registrations/:id
   * Update registration status, payment status, and notes
   */
  public async updateRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { item_type, status, payment_status, notes } = req.body;

      if (!item_type) {
        throw new ValidationError('Registration item type (item_type) is required in the body');
      }
      if (!status) {
        throw new ValidationError('Registration status (status) is required in the body');
      }
      if (!payment_status) {
        throw new ValidationError('Registration payment status (payment_status) is required in the body');
      }

      const updated = await registrationAdminService.updateRegistration(id, item_type, status, payment_status, notes);
      SuccessResponseHelper.ok(
        res,
        updated,
        'Registration updated successfully'
      );
    } catch (error) {
      logger.error('Error updating admin registration:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/registrations/:id
   * Delete a registration
   */
  public async deleteRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { item_type } = req.query;

      if (!item_type) {
        throw new ValidationError('Registration item type (item_type) is required as a query parameter');
      }

      await registrationAdminService.deleteRegistration(id, item_type as string);
      SuccessResponseHelper.ok(
        res,
        null,
        'Registration deleted successfully'
      );
    } catch (error) {
      logger.error('Error deleting admin registration:', error);
      next(error);
    }
  }
}

export const registrationAdminController = RegistrationAdminController.getInstance();
