import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { CollegeProfile } from '@/database/models';
import { ValidationError } from '@/common/errors/ValidationError';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { auditLogService } from '../services/audit-log.service';
import { logger } from '@/common/utils/logger.util';
import { updateCollegeSchema } from '../validators/admin.validator';

export class CollegeAdminController {
  private static instance: CollegeAdminController;

  private constructor() {}

  public static getInstance(): CollegeAdminController {
    if (!CollegeAdminController.instance) {
      CollegeAdminController.instance = new CollegeAdminController();
    }
    return CollegeAdminController.instance;
  }

  /**
   * GET /api/v1/admin/colleges
   * List all partner colleges
   */
  public async listColleges(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const skip = (page - 1) * limit;

      const [colleges, total] = await Promise.all([
        CollegeProfile.find({})
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        CollegeProfile.countDocuments({}).exec(),
      ]);

      // Map to clean flat records
      const records = colleges.map((c) => ({
        id: c._id,
        userId: c.userId,
        name: c.collegeName,
        email: c.contactPerson?.email || null,
        phone: c.contactPerson?.phone || null,
        address: c.address?.street || null,
        city: c.address?.city || null,
        state: c.address?.state || null,
        website: c.website || null,
        contact_person: c.contactPerson?.name || null,
        partnership_type: c.partnershipTier || 'Silver',
        is_active: !!c.partnershipActive,
        created_at: c.createdAt || new Date().toISOString(),
      }));

      SuccessResponseHelper.paginated(res, records, { page, limit, total }, 'Colleges retrieved successfully');
    } catch (error: any) {
      logger.error('List colleges admin error:', error);
      next(error);
    }
  }

  /**
   * PUT /api/v1/admin/colleges/:id
   * Update college details
   */
  public async updateCollege(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid college ID');
      }

      const parseResult = updateCollegeSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw ValidationError.fromZodError(parseResult.error);
      }

      const updates = parseResult.data;
      const college = await CollegeProfile.findById(id).exec();
      if (!college) {
        throw new NotFoundError('College profile not found');
      }

      const oldValues = college.toObject();

      // Map the validated payload back to the nested model schema
      const resolvedName = updates.name ?? updates.collegeName;
      if (resolvedName !== undefined) college.collegeName = resolvedName;
      if (updates.website !== undefined) college.website = updates.website || undefined;

      const resolvedTier = updates.partnership_type ?? updates.partnershipTier;
      if (resolvedTier !== undefined) college.partnershipTier = resolvedTier;

      const resolvedActive = updates.is_active ?? updates.partnershipActive;
      if (resolvedActive !== undefined) college.partnershipActive = resolvedActive;

      if (!college.contactPerson) {
        college.contactPerson = { name: '', designation: '', email: '', phone: '' };
      }
      if (updates.contact_person !== undefined) college.contactPerson.name = updates.contact_person || '';
      if (updates.email !== undefined) college.contactPerson.email = updates.email || '';
      if (updates.phone !== undefined) college.contactPerson.phone = updates.phone || '';

      if (!college.address) {
        college.address = { city: '', state: '', country: 'India' };
      }
      if (updates.address !== undefined) college.address.street = updates.address || '';
      if (updates.city !== undefined) college.address.city = updates.city || '';
      if (updates.state !== undefined) college.address.state = updates.state || '';

      await college.save();

      // Write AuditLog
      if (req.user?.userId) {
        await auditLogService.log(
          req.user.userId,
          'college.update',
          id,
          { updates: Object.keys(updates), oldValues, newValues: updates },
          req.ip
        );
      }

      SuccessResponseHelper.ok(res, { college }, 'College updated successfully');
    } catch (error: any) {
      logger.error('Update college admin error:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/colleges/:id
   * Delete a college profile
   */
  public async deleteCollege(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid college ID');
      }

      const college = await CollegeProfile.findById(id).exec();
      if (!college) {
        throw new NotFoundError('College profile not found');
      }

      await CollegeProfile.deleteOne({ _id: id }).exec();

      // Write AuditLog
      if (req.user?.userId) {
        await auditLogService.log(
          req.user.userId,
          'college.delete',
          id,
          { collegeName: college.collegeName },
          req.ip
        );
      }

      SuccessResponseHelper.ok(res, null, 'College deleted successfully');
    } catch (error: any) {
      logger.error('Delete college admin error:', error);
      next(error);
    }
  }
}

export const collegeAdminController = CollegeAdminController.getInstance();

