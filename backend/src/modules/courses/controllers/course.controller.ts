import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { courseService } from '../services/course.service';
import { CourseQueryParams } from '../interfaces/course-query.interface';
import { logger } from '@/common/utils/logger.util';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { ValidationError } from '@/common/errors/ValidationError';

export class CourseController {
  private static instance: CourseController;

  private constructor() {}

  public static getInstance(): CourseController {
    if (!CourseController.instance) {
      CourseController.instance = new CourseController();
    }
    return CourseController.instance;
  }

  /**
   * Get all courses with filtering, search, and pagination
   * GET /api/v1/courses
   * Supports both offset-based (page/limit) and cursor-based (cursor/useCursor) pagination
   */
  public async getCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // Extract query parameters
      const queryParams: CourseQueryParams = {
        // Offset-based pagination
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        
        // Cursor-based pagination
        cursor: req.query.cursor as string,
        useCursor: req.query.useCursor === 'true' || (!!req.query.cursor && req.query.cursor !== ''),
        
        // Filters
        category: req.query.category as any,
        difficultyLevel: req.query.difficultyLevel as any,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
        tags: req.query.tags as string,
        
        // Search (supports both 'q' and 'search' for backward compatibility)
        q: req.query.q as string,
        search: req.query.search as string,
        
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
      };

      // Get courses from service
      const result = await courseService.getCourses(queryParams);

      // Check if cursor-based or offset-based response
      if ('nextCursor' in result) {
        // Cursor-based response
        SuccessResponseHelper.ok(
          res,
          {
            items: result.items,
            nextCursor: result.nextCursor,
            hasMore: result.hasMore,
          },
          'Courses retrieved successfully'
        );
      } else {
        // Offset-based response (original format)
        SuccessResponseHelper.paginated(
          res,
          result.courses,
          result.pagination,
          'Courses retrieved successfully'
        );
      }
    } catch (error: any) {
      logger.error('Get courses controller error:', error);
      next(error);
    }
  }

  /**
   * Get course by ID
   * GET /api/v1/courses/:id
   */
  public async getCourseById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const course = await courseService.getCourseById(id);

      if (!course) {
        throw NotFoundError.course();
      }

      SuccessResponseHelper.ok(res, { course }, 'Course retrieved successfully');
    } catch (error: any) {
      logger.error('Get course by ID controller error:', error);
      next(error);
    }
  }

  /**
   * Get course by slug
   * GET /api/v1/courses/slug/:slug
   */
  public async getCourseBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const course = await courseService.getCourseBySlug(slug);

      if (!course) {
        throw NotFoundError.course();
      }

      // Try to fetch course details (overview, curriculum, instructor, FAQs)
      let courseDetails = null;
      try {
        const { CourseDetails } = await import('@/database/models/CourseDetails.model');
        courseDetails = await CourseDetails.findOne({ slug }).select('-courseId -__v').lean().exec();
      } catch (detailsError) {
        // Course details are optional, log but don't fail
        logger.warn(`Course details not found for slug: ${slug}`);
      }

      // Convert course to plain object if it's a Mongoose document
      const courseData = typeof course.toJSON === 'function' ? course.toJSON() : course;

      // Combine course and details
      const response: any = { course: courseData };
      
      if (courseDetails) {
        response.overview = courseDetails.overview;
        response.curriculum = courseDetails.curriculum;
        response.instructorDetails = courseDetails.instructorDetails;
        response.faqs = courseDetails.faqs;
      }

      SuccessResponseHelper.ok(res, response, 'Course retrieved successfully');
    } catch (error: any) {
      logger.error('Get course by slug controller error:', error);
      next(error);
    }
  }

  /**
   * Get available filter options
   * GET /api/v1/courses/filters/options
   */
  public async getFilterOptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = await courseService.getFilterOptions();

      SuccessResponseHelper.ok(res, options, 'Filter options retrieved successfully');
    } catch (error: any) {
      logger.error('Get filter options controller error:', error);
      next(error);
    }
  }
}

export const courseController = CourseController.getInstance();
