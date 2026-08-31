import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { EmployerProfile, User } from '@/database/models';
import { ValidationError } from '@/common/errors/ValidationError';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { auditLogService } from '../services/audit-log.service';
import { logger } from '@/common/utils/logger.util';
import { updateEmployerSchema } from '../validators/admin.validator';

export class EmployerAdminController {
  private static instance: EmployerAdminController;

  private constructor() {}

  public static getInstance(): EmployerAdminController {
    if (!EmployerAdminController.instance) {
      EmployerAdminController.instance = new EmployerAdminController();
    }
    return EmployerAdminController.instance;
  }

  /**
   * GET /api/v1/admin/employers
   * List all hiring partners (employers)
   */
  public async listEmployers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const skip = (page - 1) * limit;

      const [profiles, total] = await Promise.all([
        EmployerProfile.find({})
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        EmployerProfile.countDocuments({}).exec(),
      ]);

      const userIds = profiles.map((p) => p.userId);
      const users = await User.find({ _id: { $in: userIds } }).select('isActive').lean();
      const userMap = new Map(users.map((u) => [String(u._id), u.isActive]));

      // Map to clean flat records matching frontend Employer interface
      const records = profiles.map((p) => ({
        id: p._id,
        userId: p.userId,
        company_name: p.companyName,
        email: p.contactPerson?.email || null,
        phone: p.contactPerson?.phone || null,
        industry: p.industry || null,
        company_size: p.companySize || null,
        website: p.website || null,
        contact_person: p.contactPerson?.name || null,
        hiring_needs: p.hiringNeeds || null,
        is_active: !!userMap.get(String(p.userId)),
        created_at: p.createdAt || new Date().toISOString(),
      }));

      SuccessResponseHelper.paginated(res, records, { page, limit, total }, 'Employers retrieved successfully');
    } catch (error: any) {
      logger.error('List employers admin error:', error);
      next(error);
    }
  }

  /**
   * PUT /api/v1/admin/employers/:id
   * Update employer profile & toggle user activation state
   */
  public async updateEmployer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid employer ID');
      }

      const parseResult = updateEmployerSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw ValidationError.fromZodError(parseResult.error);
      }

      const updates = parseResult.data;
      const profile = await EmployerProfile.findById(id).exec();
      if (!profile) {
        throw new NotFoundError('Employer profile not found');
      }

      const oldValues = profile.toObject();

      // Map updates to DB schema fields
      const resolvedCompanyName = updates.company_name ?? updates.companyName;
      if (resolvedCompanyName !== undefined) profile.companyName = resolvedCompanyName;

      if (updates.industry !== undefined) profile.industry = updates.industry;

      const resolvedCompanySize = updates.company_size ?? updates.companySize;
      if (resolvedCompanySize !== undefined) profile.companySize = resolvedCompanySize;

      if (updates.website !== undefined) profile.website = updates.website || undefined;

      const resolvedHiringNeeds = updates.hiring_needs ?? updates.hiringNeeds;
      if (resolvedHiringNeeds !== undefined) profile.hiringNeeds = resolvedHiringNeeds || undefined;

      if (!profile.contactPerson) {
        profile.contactPerson = { name: '', email: '', phone: '' };
      }
      if (updates.contact_person !== undefined) profile.contactPerson.name = updates.contact_person || '';
      if (updates.email !== undefined) profile.contactPerson.email = updates.email || '';
      if (updates.phone !== undefined) profile.contactPerson.phone = updates.phone || '';

      await profile.save();

      // Update associated user's isActive status if passed
      const resolvedActive = updates.is_active ?? updates.isActive;
      if (resolvedActive !== undefined) {
        await User.updateOne({ _id: profile.userId }, { $set: { isActive: !!resolvedActive } }).exec();
      }

      // Write AuditLog
      if (req.user?.userId) {
        await auditLogService.log(
          req.user.userId,
          'employer.update',
          id,
          { updates: Object.keys(updates), oldValues, newValues: updates },
          req.ip
        );
      }

      SuccessResponseHelper.ok(res, { profile }, 'Employer updated successfully');
    } catch (error: any) {
      logger.error('Update employer admin error:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/employers/:id
   * Delete employer profile & user account
   */
  public async deleteEmployer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid employer ID');
      }

      const profile = await EmployerProfile.findById(id).exec();
      if (!profile) {
        throw new NotFoundError('Employer profile not found');
      }

      // Delete associated user
      await User.deleteOne({ _id: profile.userId }).exec();
      // Delete profile
      await EmployerProfile.deleteOne({ _id: id }).exec();

      // Write AuditLog
      if (req.user?.userId) {
        await auditLogService.log(
          req.user.userId,
          'employer.delete',
          id,
          { companyName: profile.companyName },
          req.ip
        );
      }

      SuccessResponseHelper.ok(res, null, 'Employer deleted successfully');
    } catch (error: any) {
      logger.error('Delete employer admin error:', error);
      next(error);
    }
  }
}

export const employerAdminController = EmployerAdminController.getInstance();

