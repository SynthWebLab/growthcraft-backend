import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { TrainingProgram, User, MentorProfile } from '@/database/models';
import { ValidationError } from '@/common/errors/ValidationError';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { auditLogService } from '../services/audit-log.service';
import { logger } from '@/common/utils/logger.util';
import {
  createTrainingProgramSchema,
  updateTrainingProgramSchema,
} from '../validators/admin.validator';

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
      const parseResult = createTrainingProgramSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw ValidationError.fromZodError(parseResult.error);
      }

      const validated = parseResult.data;
      const slug = validated.slug ? slugify(validated.slug) : slugify(validated.title);

      const existing = await TrainingProgram.findOne({ slug, deletedAt: null }).exec();
      if (existing) {
        throw new ValidationError(`Training program with slug or title similar to '${slug}' already exists`);
      }

      const resolvedMentors = await resolveMentors(validated.mentorIds, validated.mentors);
      const resolvedInternshipPartners = resolvePartners(validated.internshipPartners);
      const toolsArray = Array.isArray(validated.tools)
        ? validated.tools
        : typeof validated.tools === 'string'
        ? (validated.tools as string).split(',').map((t) => t.trim()).filter(Boolean)
        : ['React', 'Node.js'];

      const prereqArray = Array.isArray(validated.prerequisites)
        ? validated.prerequisites
        : typeof validated.prerequisites === 'string'
        ? (validated.prerequisites as string).split(/,|\n/).map((p) => p.trim()).filter(Boolean)
        : [];

      const careerOutcomesArray = Array.isArray(validated.careerOutcomes)
        ? validated.careerOutcomes
        : typeof validated.careerOutcomes === 'string'
        ? (validated.careerOutcomes as string).split(/,|\n/).map((c) => c.trim()).filter(Boolean)
        : [];

      const resolvedSeats = validated.maxSeats || validated.batchSize;

      const programPayload: Record<string, any> = {
        title: validated.title.trim(),
        description: validated.description.trim(),
        domain: validated.domain.trim(),
        durationDays: Number(validated.durationDays),
        tools: toolsArray.length > 0 ? toolsArray : ['React', 'Node.js'],
        prerequisites: prereqArray,
        careerOutcomes: careerOutcomesArray,
        price: Number(validated.price),
        slug,
        status: Boolean(validated.isPublished) ? 'active' : 'draft',
        isPublished: Boolean(validated.isPublished),
        isFeatured: Boolean(validated.isFeatured),
        mentors: resolvedMentors,
        internshipPartners: resolvedInternshipPartners,
        level: (validated.level as any) || 'Beginner',
        thumbnail: validated.thumbnail || '',
      };

      if (validated.originalPrice !== undefined && validated.originalPrice !== null) {
        programPayload.originalPrice = Number(validated.originalPrice);
      }
      if (resolvedSeats !== undefined) {
        programPayload.maxSeats = Number(resolvedSeats);
      }
      if (validated.startDate) {
        programPayload.startDate = new Date(validated.startDate);
      }

      const program = await TrainingProgram.create(programPayload);

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'trainingprogram.create',
        program._id.toString(),
        { title: validated.title, domain: validated.domain, price: validated.price },
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

      const parseResult = updateTrainingProgramSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw ValidationError.fromZodError(parseResult.error);
      }

      const updates = parseResult.data;
      const program = await TrainingProgram.findOne({ _id: id, deletedAt: null }).exec();
      if (!program) {
        throw new NotFoundError('Training program not found');
      }

      let targetSlug = updates.slug;
      if (updates.title && !targetSlug) {
        targetSlug = slugify(updates.title);
      } else if (targetSlug) {
        targetSlug = slugify(targetSlug);
      }

      if (targetSlug && targetSlug !== program.slug) {
        const existing = await TrainingProgram.findOne({ slug: targetSlug, deletedAt: null }).exec();
        if (existing) {
          throw new ValidationError(`Training program with slug '${targetSlug}' already exists`);
        }
        program.slug = targetSlug;
      }

      // Explicitly assign only validated fields (prevent mass assignment)
      if (updates.title !== undefined) program.title = updates.title.trim();
      if (updates.description !== undefined) program.description = updates.description.trim();
      if (updates.domain !== undefined) program.domain = updates.domain.trim();
      if (updates.durationDays !== undefined) program.durationDays = Number(updates.durationDays);
      if (updates.price !== undefined) program.price = Number(updates.price);
      if (updates.originalPrice !== undefined) {
        program.originalPrice = updates.originalPrice !== null ? Number(updates.originalPrice) : undefined;
      }

      if (updates.level !== undefined) {
        program.level = updates.level as any;
      }

      const resolvedSeats = updates.maxSeats ?? updates.batchSize;
      if (resolvedSeats !== undefined) {
        program.maxSeats = Number(resolvedSeats);
      }

      if (updates.startDate !== undefined) {
        program.startDate = updates.startDate ? new Date(updates.startDate) : undefined;
      }

      if (updates.thumbnail !== undefined) {
        program.thumbnail = updates.thumbnail;
      }

      if (updates.tools !== undefined) {
        program.tools = Array.isArray(updates.tools)
          ? updates.tools
          : typeof updates.tools === 'string'
          ? (updates.tools as string).split(',').map((t) => t.trim()).filter(Boolean)
          : ['React', 'Node.js'];
      }

      if (updates.prerequisites !== undefined) {
        program.prerequisites = Array.isArray(updates.prerequisites)
          ? updates.prerequisites
          : typeof updates.prerequisites === 'string'
          ? (updates.prerequisites as string).split(/,|\n/).map((p) => p.trim()).filter(Boolean)
          : [];
      }

      if (updates.careerOutcomes !== undefined) {
        program.careerOutcomes = Array.isArray(updates.careerOutcomes)
          ? updates.careerOutcomes
          : typeof updates.careerOutcomes === 'string'
          ? (updates.careerOutcomes as string).split(/,|\n/).map((c) => c.trim()).filter(Boolean)
          : [];
      }

      if (updates.mentorIds !== undefined || updates.mentors !== undefined) {
        program.mentors = await resolveMentors(updates.mentorIds, updates.mentors);
      }

      if (updates.internshipPartners !== undefined) {
        program.internshipPartners = resolvePartners(updates.internshipPartners);
      }

      if (updates.isPublished !== undefined) {
        program.isPublished = Boolean(updates.isPublished);
        program.status = updates.isPublished ? 'active' : 'draft';
      }

      if (updates.isFeatured !== undefined) {
        program.isFeatured = Boolean(updates.isFeatured);
      }

      const oldValues = program.toObject();
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
