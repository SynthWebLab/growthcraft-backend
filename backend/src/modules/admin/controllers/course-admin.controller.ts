import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Course, CourseCategory, CourseLevel, User, MentorProfile } from '@/database/models';
import { ValidationError } from '@/common/errors/ValidationError';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { auditLogService } from '../services/audit-log.service';
import { catalogueService } from '@/modules/public/services/catalogue.service';
import { logger } from '@/common/utils/logger.util';

import { createCourseSchema, updateCourseSchema } from '../validators/admin.validator';

// Helper to slugify title
const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, ''); // Trim - from end
};

// Helper to resolve mentors
const resolveMentors = async (mentorIds?: string[], mentorsInput?: any[]): Promise<{ mentors: any[]; primaryInstructor: any }> => {
  let resolvedMentors: any[] = [];
  if (Array.isArray(mentorsInput) && mentorsInput.length > 0) {
    resolvedMentors = mentorsInput.map((m) => ({
      userId: m.userId || m.id || undefined,
      mentorProfileId: m.mentorProfileId || undefined,
      name: m.name || m.fullName || 'GrowthCraft Team',
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

  const primaryInstructor = resolvedMentors.length > 0
    ? {
        name: resolvedMentors[0].name,
        avatar: resolvedMentors[0].avatar,
        userId: resolvedMentors[0].userId,
        designation: resolvedMentors[0].designation,
      }
    : null;

  return { mentors: resolvedMentors, primaryInstructor };
};

// Normalize category to match Mongoose enum values
const normalizeCategory = (cat: string): string => {
  if (!cat) return CourseCategory.OTHER;
  const mapping: Record<string, CourseCategory> = {
    MERN: CourseCategory.WEB_DEVELOPMENT,
    'UI/UX': CourseCategory.DESIGN,
    DataScience: CourseCategory.DATA_SCIENCE,
    'Data Science': CourseCategory.DATA_SCIENCE,
    'Web Development': CourseCategory.WEB_DEVELOPMENT,
    'Mobile Development': CourseCategory.MOBILE_DEVELOPMENT,
    'Cloud Computing': CourseCategory.CLOUD_COMPUTING,
    Cybersecurity: CourseCategory.CYBERSECURITY,
    'AI/ML': CourseCategory.AI_ML,
    DevOps: CourseCategory.DEVOPS,
    Design: CourseCategory.DESIGN,
    Business: CourseCategory.BUSINESS,
    Programming: CourseCategory.PROGRAMMING,
    Other: CourseCategory.OTHER,
  };
  return mapping[cat] || cat;
};

export class CourseAdminController {
  private static instance: CourseAdminController;

  private constructor() {}

  public static getInstance(): CourseAdminController {
    if (!CourseAdminController.instance) {
      CourseAdminController.instance = new CourseAdminController();
    }
    return CourseAdminController.instance;
  }

  /**
   * GET /api/v1/admin/courses
   * Get all non-deleted courses for admin management
   */
  public async listCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courses = await Course.find({ deletedAt: null }).sort({ createdAt: -1 }).exec();
      SuccessResponseHelper.ok(res, courses, 'Courses fetched successfully');
    } catch (error) {
      logger.error('Error fetching admin courses:', error);
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/courses
   * Create a new course
   */
  public async createCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = createCourseSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw ValidationError.fromZodError(parseResult.error);
      }

      const validated = parseResult.data;
      const normalizedCat = normalizeCategory(validated.category || 'Other');
      const slug = validated.slug ? slugify(validated.slug) : slugify(validated.title);

      // Check if slug is unique among non-deleted courses
      const existingCourse = await Course.findOne({ slug, deletedAt: null }).exec();
      if (existingCourse) {
        throw new ValidationError(`Course with slug or title similar to '${slug}' already exists`);
      }

      const numDuration = Number(validated.duration || validated.totalHours || 20);
      const numLessons = Number(validated.lessonsCount || validated.totalLessons || Math.max(1, Math.floor(numDuration * 2)));
      const resolvedDifficulty = validated.difficultyLevel || validated.level || 'Beginner';
      const resolvedInstructorName = validated.instructorName || validated.instructor?.name || 'GrowthCraft Team';

      const { mentors: resolvedMentors, primaryInstructor } = await resolveMentors(validated.mentorIds, validated.mentors);

      let finalInstructor = {
        name: resolvedInstructorName.trim(),
        avatar: validated.instructor?.avatar || '',
      };
      if (primaryInstructor) {
        finalInstructor = {
          name: primaryInstructor.name,
          avatar: primaryInstructor.avatar || finalInstructor.avatar,
        };
      }

      const tagsArray = Array.isArray(validated.tags)
        ? validated.tags
        : typeof validated.tags === 'string'
        ? (validated.tags as string).split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const coursePayload: Record<string, any> = {
        title: validated.title.trim(),
        description: validated.description.trim(),
        shortDescription: validated.shortDescription?.trim() || '',
        category: normalizedCat,
        price: Number(validated.price),
        slug,
        duration: numDuration,
        totalHours: numDuration,
        lessonsCount: numLessons,
        difficultyLevel: resolvedDifficulty,
        instructor: finalInstructor,
        mentors: resolvedMentors.length > 0 ? resolvedMentors : [{ name: finalInstructor.name, avatar: finalInstructor.avatar }],
        tags: tagsArray,
        thumbnail: validated.thumbnail || '',
        thumbnailUrl: validated.thumbnailUrl || validated.thumbnail || '',
        isDateTBA: validated.isDateTBA !== undefined ? Boolean(validated.isDateTBA) : true,
        startDate: validated.startDate && !validated.isDateTBA ? new Date(validated.startDate) : null,
        endDate: validated.endDate && !validated.isDateTBA ? new Date(validated.endDate) : null,
        isPublished: Boolean(validated.isPublished),
        isDraft: !Boolean(validated.isPublished),
        isFeatured: Boolean(validated.isFeatured),
        isActive: true,
      };

      if (validated.originalPrice !== undefined && validated.originalPrice !== null) {
        coursePayload.originalPrice = Number(validated.originalPrice);
      }

      const course = await Course.create(coursePayload);

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'course.create',
        course._id.toString(),
        { title: validated.title, category: normalizedCat, price: validated.price },
        req.ip
      );

      await catalogueService.clearCatalogueCache();

      SuccessResponseHelper.created(res, { course }, 'Course created successfully');
    } catch (error) {
      logger.error('Error creating course:', error);
      next(error);
    }
  }

  /**
   * PUT /api/v1/admin/courses/:id
   * Update an existing course
   */
  public async updateCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid course ID');
      }

      const parseResult = updateCourseSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw ValidationError.fromZodError(parseResult.error);
      }

      const updates = parseResult.data;
      const course = await Course.findOne({ _id: id, deletedAt: null }).exec();
      if (!course) {
        throw new NotFoundError('Course not found');
      }

      // Handle title and slug updating
      let targetSlug = updates.slug;
      if (updates.title && !targetSlug) {
        targetSlug = slugify(updates.title);
      } else if (targetSlug) {
        targetSlug = slugify(targetSlug);
      }

      // Prevent duplicate slug if it was updated
      if (targetSlug && targetSlug !== course.slug) {
        const existing = await Course.findOne({ slug: targetSlug, deletedAt: null }).exec();
        if (existing) {
          throw new ValidationError(`Course with slug '${targetSlug}' already exists`);
        }
        course.slug = targetSlug;
      }

      // Explicitly assign only validated fields (prevent mass assignment)
      if (updates.title !== undefined) course.title = updates.title.trim();
      if (updates.description !== undefined) course.description = updates.description.trim();
      if (updates.shortDescription !== undefined) course.shortDescription = updates.shortDescription.trim();

      // Category normalization
      if (updates.category !== undefined) {
        course.category = normalizeCategory(updates.category) as any;
      }

      // Instructor & Mentors normalization
      if (updates.mentorIds !== undefined || updates.mentors !== undefined) {
        const { mentors: resolvedMentors, primaryInstructor } = await resolveMentors(updates.mentorIds, updates.mentors);
        if (resolvedMentors.length > 0) {
          course.mentors = resolvedMentors;
          course.instructor = {
            name: primaryInstructor.name,
            avatar: primaryInstructor.avatar || course.instructor?.avatar || '',
          };
        }
      } else if (updates.instructorName !== undefined || updates.instructor !== undefined) {
        const name = updates.instructorName || updates.instructor?.name || course.instructor?.name || 'GrowthCraft Team';
        const avatar = updates.instructor?.avatar || course.instructor?.avatar;
        course.instructor = { name: name.trim(), avatar };
        course.mentors = [{ name: name.trim(), avatar }];
      }

      // Duration & Lessons count
      const resolvedDuration = updates.duration ?? updates.totalHours;
      if (resolvedDuration !== undefined) {
        const numDur = Number(resolvedDuration);
        course.duration = numDur;
        course.totalHours = numDur;
      }
      const resolvedLessons = updates.lessonsCount ?? updates.totalLessons;
      if (resolvedLessons !== undefined) {
        course.lessonsCount = Number(resolvedLessons);
      }

      if (updates.difficultyLevel !== undefined) {
        course.difficultyLevel = updates.difficultyLevel;
      }
      if (updates.level !== undefined) {
        course.level = updates.level;
      }

      // Sync published & draft status
      if (updates.isPublished !== undefined) {
        course.isPublished = Boolean(updates.isPublished);
        course.isDraft = !updates.isPublished;
      }
      if (updates.isFeatured !== undefined) {
        course.isFeatured = Boolean(updates.isFeatured);
      }

      if (updates.isDateTBA !== undefined) {
        course.isDateTBA = Boolean(updates.isDateTBA);
      }
      if (updates.startDate !== undefined) {
        course.startDate = updates.startDate && !course.isDateTBA ? new Date(updates.startDate) : null;
      }
      if (updates.endDate !== undefined) {
        course.endDate = updates.endDate && !course.isDateTBA ? new Date(updates.endDate) : null;
      }
      if (course.isDateTBA) {
        course.startDate = null;
        course.endDate = null;
      }

      // Clean numbers
      if (updates.price !== undefined) course.price = Number(updates.price);
      if (updates.originalPrice !== undefined) {
        course.originalPrice = updates.originalPrice !== null ? Number(updates.originalPrice) : undefined;
      }

      if (updates.tags !== undefined) {
        course.tags = Array.isArray(updates.tags)
          ? updates.tags
          : typeof updates.tags === 'string'
          ? (updates.tags as string).split(',').map((t) => t.trim()).filter(Boolean)
          : [];
      }

      if (updates.thumbnail !== undefined) course.thumbnail = updates.thumbnail;
      if (updates.thumbnailUrl !== undefined) course.thumbnailUrl = updates.thumbnailUrl;

      const oldValues = course.toObject();
      await course.save();

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'course.update',
        id,
        { updates: Object.keys(updates), oldValues, newValues: updates },
        req.ip
      );

      await catalogueService.clearCatalogueCache();

      SuccessResponseHelper.ok(res, { course }, 'Course updated successfully');
    } catch (error) {
      logger.error('Error updating course:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/courses/:id
   * Soft-delete a course
   */
  public async deleteCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid course ID');
      }

      const course = await Course.findOne({ _id: id, deletedAt: null }).exec();
      if (!course) {
        throw new NotFoundError('Course not found');
      }

      course.deletedAt = new Date();
      course.isActive = false;
      course.isPublished = false;
      course.isDraft = true;
      await course.save();

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'course.delete',
        id,
        { title: course.title },
        req.ip
      );

      await catalogueService.clearCatalogueCache();

      SuccessResponseHelper.ok(res, null, 'Course deleted successfully');
    } catch (error) {
      logger.error('Error deleting course:', error);
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/courses/:id/publish
   * Publish course
   */
  public async publishCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid course ID');
      }

      const course = await Course.findOne({ _id: id, deletedAt: null }).exec();
      if (!course) {
        throw new NotFoundError('Course not found');
      }

      course.isPublished = !course.isPublished;
      course.isDraft = !course.isPublished;
      if (course.isPublished) {
        course.publishedAt = new Date();
      }
      await course.save();

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'course.publish',
        id,
        { title: course.title, isPublished: course.isPublished, publishedAt: course.publishedAt },
        req.ip
      );

      await catalogueService.clearCatalogueCache();

      SuccessResponseHelper.ok(res, { course }, `Course ${course.isPublished ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      logger.error('Error publishing course:', error);
      next(error);
    }
  }
}

export const courseAdminController = CourseAdminController.getInstance();
