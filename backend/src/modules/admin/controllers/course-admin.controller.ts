import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Course, CourseCategory, CourseLevel, User, MentorProfile } from '@/database/models';
import { ValidationError } from '@/common/errors/ValidationError';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { auditLogService } from '../services/audit-log.service';
import { catalogueService } from '@/modules/public/services/catalogue.service';
import { logger } from '@/common/utils/logger.util';

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
      const {
        title,
        description,
        category,
        price,
        duration,
        lessonsCount,
        instructorName,
        instructor,
        difficultyLevel,
        level,
        originalPrice,
        tags,
        isPublished,
        isFeatured,
        slug: customSlug,
        ...otherFields
      } = req.body;

      if (!title || !description || price === undefined || price === null) {
        throw new ValidationError('Title, description, and price are required');
      }

      const normalizedCat = normalizeCategory(category);
      const slug = customSlug ? slugify(customSlug) : slugify(title);

      // Check if slug is unique among non-deleted courses
      const existingCourse = await Course.findOne({ slug, deletedAt: null }).exec();
      if (existingCourse) {
        throw new ValidationError(`Course with slug or title similar to '${slug}' already exists`);
      }

      const numDuration = Number(duration || otherFields.totalHours || 20);
      const numLessons = Number(lessonsCount || otherFields.totalLessons || Math.max(1, Math.floor(numDuration * 2)));
      const resolvedDifficulty = difficultyLevel || level || 'Beginner';
      const resolvedInstructorName = instructorName || instructor?.name || 'GrowthCraft Team';

      const { mentorIds, mentors: mentorsInput } = req.body;
      const { mentors: resolvedMentors, primaryInstructor } = await resolveMentors(mentorIds, mentorsInput);

      let finalInstructor = {
        name: resolvedInstructorName.trim(),
        avatar: instructor?.avatar || otherFields.instructorAvatar || '',
      };
      if (primaryInstructor) {
        finalInstructor = {
          name: primaryInstructor.name,
          avatar: primaryInstructor.avatar || finalInstructor.avatar,
        };
      }

      const coursePayload: Record<string, any> = {
        title: title.trim(),
        description: description.trim(),
        category: normalizedCat,
        price: Number(price),
        slug,
        duration: numDuration,
        totalHours: numDuration,
        lessonsCount: numLessons,
        difficultyLevel: resolvedDifficulty,
        instructor: finalInstructor,
        mentors: resolvedMentors.length > 0 ? resolvedMentors : [{ name: finalInstructor.name, avatar: finalInstructor.avatar }],
        tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        isPublished: Boolean(isPublished),
        isDraft: !Boolean(isPublished),
        isFeatured: Boolean(isFeatured),
        isActive: true,
        ...otherFields,
      };

      if (originalPrice !== undefined && originalPrice !== null && originalPrice !== '') {
        coursePayload.originalPrice = Number(originalPrice);
      }

      const course = await Course.create(coursePayload);

      // Write AuditLog
      await auditLogService.log(
        req.user!.userId,
        'course.create',
        course._id.toString(),
        { title, category: normalizedCat, price },
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

      const course = await Course.findOne({ _id: id, deletedAt: null }).exec();
      if (!course) {
        throw new NotFoundError('Course not found');
      }

      const updates = { ...req.body };

      // Handle title and slug updating
      if (updates.title && !updates.slug) {
        updates.slug = slugify(updates.title);
      } else if (updates.slug) {
        updates.slug = slugify(updates.slug);
      }

      // Prevent duplicate slug if it was updated
      if (updates.slug && updates.slug !== course.slug) {
        const existing = await Course.findOne({ slug: updates.slug, deletedAt: null }).exec();
        if (existing) {
          throw new ValidationError(`Course with slug '${updates.slug}' already exists`);
        }
      }

      // Category normalization
      if (updates.category) {
        updates.category = normalizeCategory(updates.category);
      }

      // Instructor & Mentors normalization
      if (updates.mentorIds !== undefined || updates.mentors !== undefined) {
        const { mentors: resolvedMentors, primaryInstructor } = await resolveMentors(updates.mentorIds, updates.mentors);
        if (resolvedMentors.length > 0) {
          updates.mentors = resolvedMentors;
          updates.instructor = {
            name: primaryInstructor.name,
            avatar: primaryInstructor.avatar || course.instructor?.avatar || '',
          };
        }
        delete updates.mentorIds;
      } else if (updates.instructorName !== undefined || updates.instructor !== undefined) {
        const name = updates.instructorName || updates.instructor?.name || course.instructor?.name || 'GrowthCraft Team';
        const avatar = updates.instructor?.avatar || course.instructor?.avatar;
        updates.instructor = { name: name.trim(), avatar };
        updates.mentors = [{ name: name.trim(), avatar }];
        delete updates.instructorName;
      }

      // Duration & Lessons count
      if (updates.duration !== undefined) {
        updates.duration = Number(updates.duration);
        updates.totalHours = updates.duration;
      }
      if (updates.lessonsCount !== undefined) {
        updates.lessonsCount = Number(updates.lessonsCount);
      }

      // Sync published & draft status
      if (updates.isPublished !== undefined) {
        updates.isPublished = Boolean(updates.isPublished);
        updates.isDraft = !updates.isPublished;
      }

      // Clean numbers
      if (updates.price !== undefined) updates.price = Number(updates.price);
      if (updates.originalPrice !== undefined) updates.originalPrice = Number(updates.originalPrice);

      const oldValues = course.toObject();

      // Apply updates
      Object.assign(course, updates);
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
