import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { TrainingProgram, User, MentorProfile } from '@/database/models';
import { ValidationError } from '@/common/errors/ValidationError';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { auditLogService } from '../services/audit-log.service';
import { logger } from '@/common/utils/logger.util';

// Helper to slugify title
const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// Helper to resolve internship partner companies
const resolvePartners = (partnersInput: any): any[] => {
  if (!partnersInput) return [];
  if (Array.isArray(partnersInput)) {
    return partnersInput
      .map((p) => {
        if (typeof p === 'string') {
          return { companyName: p.trim(), role: 'Industrial Intern' };
        }
        return {
          companyName: (p.companyName || p.name || '').trim(),
          logo: p.logo || '',
          role: (p.role || 'Industrial Intern').trim(),
          duration: p.duration || '2-3 Months',
          mode: p.mode || 'Hybrid',
          stipend: p.stipend || 'Performance-based Stipend',
          description: p.description || '',
          availableSeats: p.availableSeats ? Number(p.availableSeats) : undefined,
        };
      })
      .filter((p) => Boolean(p.companyName));
  }
  return [];
};

// Helper to resolve mentors
const resolveMentors = async (mentorIds?: string[], mentorsInput?: any[]): Promise<any[]> => {
  let resolvedMentors: any[] = [];
  if (Array.isArray(mentorsInput) && mentorsInput.length > 0) {
    resolvedMentors = mentorsInput.map((m) => ({
      userId: m.userId || m.id || undefined,
      mentorProfileId: m.mentorProfileId || undefined,
      name: m.name || m.fullName || 'GrowthCraft Mentor',
      avatar: m.avatar || '',
      designation: m.designation || m.currentOrganization || m.areaOfExpertise || '',
      areaOfExpertise: m.areaOfExpertise || '',
      bio: m.bio || '',
    }));
  } else if (Array.isArray(mentorIds) && mentorIds.length > 0) {
    const validIds = mentorIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length > 0) {
      const users = await User.find({ _id: { $in: validIds } }).select('fullName email avatar').exec();
      const profiles = await MentorProfile.find({ userId: { $in: validIds } }).exec();
      const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

      resolvedMentors = users.map((u) => {
        const p = profileMap.get(u._id.toString());
        return {
          userId: u._id,
          mentorProfileId: p?._id,
          name: u.fullName || u.email,
          avatar: (u as any).avatar || '',
          designation: p?.currentOrganization || p?.areaOfExpertise || '',
          areaOfExpertise: p?.areaOfExpertise || '',
          bio: p?.bio || '',
        };
      });
    }
  }
  return resolvedMentors;
};

export class TrainingProgramAdminController {
  private static instance: TrainingProgramAdminController;

  private constructor() {}

  public static getInstance(): TrainingProgramAdminController {
    if (!TrainingProgramAdminController.instance) {
      TrainingProgramAdminController.instance = new TrainingProgramAdminController();
    }
    return TrainingProgramAdminController.instance;
  }

  /**
   * GET /api/v1/admin/training-programs
   * List all training programs
   */
  public async listTrainingPrograms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const skip = (page - 1) * limit;
      const search = req.query.search as string;

      const filter: any = { deletedAt: null };
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { domain: { $regex: search, $options: 'i' } },
        ];
      }

      const [programs, total] = await Promise.all([
        TrainingProgram.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
        TrainingProgram.countDocuments(filter).exec(),
      ]);

      SuccessResponseHelper.paginated(res, programs, { page, limit, total }, 'Training programs list retrieved successfully');
    } catch (error) {
      logger.error('Error listing training programs:', error);
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/training-programs
   * Create a training program
   */
  public async createTrainingProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        title,
        description,
        domain,
        durationDays,
        tools,
        price,
        isPublished,
        isFeatured,
        mentorIds,
        mentors: mentorsInput,
        internshipPartners,
        ...otherFields
      } = req.body;

      if (!title || !description || !domain || !durationDays || price === undefined) {
        throw new ValidationError('Title, description, domain, durationDays, and price are required');
      }

      const slug = otherFields.slug ? slugify(otherFields.slug) : slugify(title);

      const existing = await TrainingProgram.findOne({ slug, deletedAt: null }).exec();
      if (existing) {
        throw new ValidationError(`Training program with slug or title similar to '${slug}' already exists`);
      }

      const resolvedMentors = await resolveMentors(mentorIds, mentorsInput);
      const resolvedInternshipPartners = resolvePartners(internshipPartners || otherFields.internshipPartners);
      const toolsArray = Array.isArray(tools) ? tools : typeof tools === 'string' ? tools.split(',').map(t => t.trim()).filter(Boolean) : ['React', 'Node.js'];

      const program = await TrainingProgram.create({
        title: title.trim(),
        description: description.trim(),
        domain: domain.trim(),
        durationDays: Number(durationDays),
        tools: toolsArray.length > 0 ? toolsArray : ['React', 'Node.js'],
        price: Number(price),
        slug,
        status: Boolean(isPublished) ? 'active' : 'draft',
        isPublished: Boolean(isPublished),
        isFeatured: Boolean(isFeatured),
        mentors: resolvedMentors,
        internshipPartners: resolvedInternshipPartners,
        level: otherFields.level || 'Beginner',
        ...otherFields,
      });

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'trainingprogram.create',
        program._id.toString(),
        { title, domain, price },
        req.ip
      );

      SuccessResponseHelper.created(res, { trainingProgram: program }, 'Training program created successfully');
    } catch (error) {
      logger.error('Error creating training program:', error);
      next(error);
    }
  }

  /**
   * PUT /api/v1/admin/training-programs/:id
   * Update a training program
   */
  public async updateTrainingProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid training program ID');
      }

      const updates = req.body;
      const program = await TrainingProgram.findOne({ _id: id, deletedAt: null }).exec();
      if (!program) {
        throw new NotFoundError('Training program not found');
      }

      if (updates.title && !updates.slug) {
        updates.slug = slugify(updates.title);
      } else if (updates.slug) {
        updates.slug = slugify(updates.slug);
      }

      if (updates.slug && updates.slug !== program.slug) {
        const existing = await TrainingProgram.findOne({ slug: updates.slug, deletedAt: null }).exec();
        if (existing) {
          throw new ValidationError(`Training program with slug '${updates.slug}' already exists`);
        }
      }

      const oldValues = program.toObject();

      if (updates.mentorIds || updates.mentors) {
        updates.mentors = await resolveMentors(updates.mentorIds, updates.mentors);
        delete updates.mentorIds;
      }
      if (updates.internshipPartners !== undefined) {
        updates.internshipPartners = resolvePartners(updates.internshipPartners);
      }
      if (updates.isPublished !== undefined) {
        updates.status = updates.isPublished ? 'active' : 'draft';
      }

      Object.assign(program, updates);
      await program.save();

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'trainingprogram.update',
        id,
        { updates: Object.keys(updates), oldValues, newValues: updates },
        req.ip
      );

      SuccessResponseHelper.ok(res, { trainingProgram: program }, 'Training program updated successfully');
    } catch (error) {
      logger.error('Error updating training program:', error);
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/training-programs/:id/publish
   * Toggle publish status of a training program
   */
  public async publishTrainingProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid training program ID');
      }

      const program = await TrainingProgram.findOne({ _id: id, deletedAt: null }).exec();
      if (!program) {
        throw new NotFoundError('Training program not found');
      }

      program.isPublished = !program.isPublished;
      program.status = program.isPublished ? 'active' : 'draft';
      await program.save();

      await auditLogService.log(
        req.user!.userId,
        program.isPublished ? 'trainingprogram.publish' : 'trainingprogram.unpublish',
        id,
        { title: program.title, isPublished: program.isPublished },
        req.ip
      );

      SuccessResponseHelper.ok(
        res,
        { trainingProgram: program },
        `Training program ${program.isPublished ? 'published' : 'unpublished'} successfully`
      );
    } catch (error) {
      logger.error('Error publishing training program:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/training-programs/:id
   * Soft-delete a training program
   */
  public async deleteTrainingProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid training program ID');
      }

      const program = await TrainingProgram.findOne({ _id: id, deletedAt: null }).exec();
      if (!program) {
        throw new NotFoundError('Training program not found');
      }

      program.deletedAt = new Date();
      program.status = 'draft';
      program.isPublished = false;
      await program.save();

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'trainingprogram.delete',
        id,
        { title: program.title },
        req.ip
      );

      SuccessResponseHelper.ok(res, null, 'Training program deleted successfully');
    } catch (error) {
      logger.error('Error deleting training program:', error);
      next(error);
    }
  }
}

export const trainingProgramAdminController = TrainingProgramAdminController.getInstance();
