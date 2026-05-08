import { Course, ICourse } from '@/database/models/Course.model';
import { CourseQueryParams, PaginatedCoursesResponse } from '../interfaces/course-query.interface';
import { logger } from '@/common/utils/logger.util';
import { FilterQuery } from 'mongoose';
import { courseConfigService } from './course-config.service';

export class CourseService {
  private static instance: CourseService;

  private constructor() {}

  public static getInstance(): CourseService {
    if (!CourseService.instance) {
      CourseService.instance = new CourseService();
    }
    return CourseService.instance;
  }

  /**
   * Get courses with filtering, search, and pagination
   */
  public async getCourses(queryParams: CourseQueryParams): Promise<PaginatedCoursesResponse> {
    try {
      // Pagination defaults
      const page = Math.max(1, queryParams.page || 1);
      const limit = Math.min(50, Math.max(1, queryParams.limit || 10)); // Max 50 items per page
      const skip = (page - 1) * limit;

      // Build filter query
      const filter: FilterQuery<ICourse> = { isActive: true };

      // Category filter
      if (queryParams.category) {
        filter.category = queryParams.category;
      }

      // Difficulty level filter
      if (queryParams.difficultyLevel) {
        filter.difficultyLevel = queryParams.difficultyLevel;
      }

      // Price range filter
      if (queryParams.minPrice !== undefined || queryParams.maxPrice !== undefined) {
        filter.price = {};
        if (queryParams.minPrice !== undefined) {
          filter.price.$gte = queryParams.minPrice;
        }
        if (queryParams.maxPrice !== undefined) {
          filter.price.$lte = queryParams.maxPrice;
        }
      }

      // Rating filter
      if (queryParams.minRating !== undefined) {
        filter.rating = { $gte: queryParams.minRating };
      }

      // Tags filter
      if (queryParams.tags) {
        const tagsArray = Array.isArray(queryParams.tags) 
          ? queryParams.tags 
          : queryParams.tags.split(',').map(tag => tag.trim());
        
        if (tagsArray.length > 0) {
          filter.tags = { $in: tagsArray };
        }
      }

      // Search filter (text search on title and description)
      if (queryParams.search && queryParams.search.trim()) {
        filter.$text = { $search: queryParams.search.trim() };
      }

      // Build sort query
      const sortBy = queryParams.sortBy || 'createdAt';
      const sortOrder = queryParams.sortOrder === 'asc' ? 1 : -1;
      const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder };

      // If searching, add text score for relevance sorting
      if (queryParams.search && queryParams.search.trim()) {
        sort.score = { $meta: 'textScore' } as any;
      }

      // Execute query with pagination
      const [courses, total] = await Promise.all([
        Course.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .exec(),
        Course.countDocuments(filter).exec(),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(`Retrieved ${courses.length} courses (page ${page}/${totalPages})`);

      return {
        courses,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error: any) {
      logger.error('Get courses error:', error);
      throw error;
    }
  }

  /**
   * Get course by ID
   */
  public async getCourseById(courseId: string): Promise<ICourse | null> {
    try {
      const course = await Course.findById(courseId).exec();
      return course;
    } catch (error: any) {
      logger.error('Get course by ID error:', error);
      throw error;
    }
  }

  /**
   * Get course by slug
   */
  public async getCourseBySlug(slug: string): Promise<ICourse | null> {
    try {
      const course = await Course.findOne({ slug }).exec();
      return course;
    } catch (error: any) {
      logger.error('Get course by slug error:', error);
      throw error;
    }
  }

  /**
   * Get available filter options (for frontend filter UI)
   */
  public async getFilterOptions(): Promise<{
    categories: string[];
    difficultyLevels: string[];
    courseTypes: string[];
    priceRange: { min: number; max: number };
    tags: string[];
  }> {
    try {
      // Get dynamic configurations
      const configs = await courseConfigService.getAllConfigs();

      const [priceStats, allTags] = await Promise.all([
        Course.aggregate([
          { $match: { isActive: true } },
          {
            $group: {
              _id: null,
              minPrice: { $min: '$price' },
              maxPrice: { $max: '$price' },
            },
          },
        ]).exec(),
        Course.distinct('tags', { isActive: true }).exec(),
      ]);

      const priceRange = priceStats[0] || { minPrice: 0, maxPrice: 0 };

      return {
        categories: configs.categories,
        difficultyLevels: configs.difficultyLevels,
        courseTypes: configs.courseTypes,
        priceRange: {
          min: priceRange.minPrice || 0,
          max: priceRange.maxPrice || 0,
        },
        tags: allTags.filter(Boolean),
      };
    } catch (error: any) {
      logger.error('Get filter options error:', error);
      throw error;
    }
  }
}

export const courseService = CourseService.getInstance();
