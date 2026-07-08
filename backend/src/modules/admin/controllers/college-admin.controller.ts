import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { CollegeProfile } from '@/database/models';
import { ValidationError } from '@/common/errors/ValidationError';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { logger } from '@/common/utils/logger.util';

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

      const updates = req.body;
      const college = await CollegeProfile.findById(id).exec();
      if (!college) {
        throw new NotFoundError('College profile not found');
      }

      // Map the payload back to the nested model schema
      if (updates.name) college.collegeName = updates.name;
      if (updates.website) college.website = updates.website;
      if (updates.partnership_type) college.partnershipTier = updates.partnership_type;
      if (updates.is_active !== undefined) college.partnershipActive = updates.is_active;

      if (!college.contactPerson) {
        college.contactPerson = { name: '', designation: '', email: '', phone: '' };
      }
      if (updates.contact_person) college.contactPerson.name = updates.contact_person;
      if (updates.email) college.contactPerson.email = updates.email;
      if (updates.phone) college.contactPerson.phone = updates.phone;

      if (!college.address) {
        college.address = { city: '', state: '', country: 'India' };
      }
      if (updates.address) college.address.street = updates.address;
      if (updates.city) college.address.city = updates.city;
      if (updates.state) college.address.state = updates.state;

      await college.save();

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

      SuccessResponseHelper.ok(res, null, 'College deleted successfully');
    } catch (error: any) {
      logger.error('Delete college admin error:', error);
      next(error);
    }
  }
}

export const collegeAdminController = CollegeAdminController.getInstance();
