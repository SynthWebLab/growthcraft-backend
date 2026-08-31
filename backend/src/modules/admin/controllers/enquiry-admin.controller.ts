import { Request, Response, NextFunction } from 'express';
import { enquiryAdminService } from '../services/enquiry-admin.service';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { logger } from '@/common/utils/logger.util';
import { ValidationError } from '@/common/errors/ValidationError';
import { updateEnquirySchema } from '../validators/admin.validator';

export class EnquiryAdminController {
  private static instance: EnquiryAdminController;

  private constructor() {}

  public static getInstance(): EnquiryAdminController {
    if (!EnquiryAdminController.instance) {
      EnquiryAdminController.instance = new EnquiryAdminController();
    }
    return EnquiryAdminController.instance;
  }

  /**
   * GET /api/v1/admin/enquiries
   * List all unified enquiries/leads
   */
  public async listEnquiries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enquiries = await enquiryAdminService.listAllEnquiries();
      SuccessResponseHelper.ok(
        res,
        enquiries,
        'Unified enquiries and callback requests retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching admin enquiries:', error);
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/enquiries/:id
   * Update enquiry status and notes
   */
  public async updateEnquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const parseResult = updateEnquirySchema.safeParse(req.body);
      if (!parseResult.success) {
        throw ValidationError.fromZodError(parseResult.error);
      }

      const { enquiry_type, status, notes } = parseResult.data;

      const updated = await enquiryAdminService.updateEnquiry(id, enquiry_type, status, notes);
      SuccessResponseHelper.ok(
        res,
        updated,
        'Enquiry status and notes updated successfully'
      );
    } catch (error) {
      logger.error('Error updating admin enquiry:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/enquiries/:id
   * Delete an enquiry
   */
  public async deleteEnquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { enquiry_type } = req.query;

      if (!enquiry_type) {
        throw new ValidationError('Enquiry type (enquiry_type) is required as a query parameter');
      }

      await enquiryAdminService.deleteEnquiry(id, enquiry_type as string);
      SuccessResponseHelper.ok(
        res,
        null,
        'Enquiry deleted successfully'
      );
    } catch (error) {
      logger.error('Error deleting admin enquiry:', error);
      next(error);
    }
  }
}

export const enquiryAdminController = EnquiryAdminController.getInstance();
