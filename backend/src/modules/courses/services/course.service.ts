import { Course, ICourse } from '@/database/models/Course.model';
import { 
  CourseQueryParams, 
  PaginatedCoursesResponse, 
  CursorPaginatedCoursesResponse 
} from '../interfaces/course-query.interface';
import { logger } from '@/common/utils/logger.util';
import { FilterQuery } from 'mongoose';
import { courseConfigService } from './course-config.service';
import { redisConfig } from '@/config/redis.config';
import { 
  generateCacheKey, 
  encodeCursor, 
  decodeCursor 
} from '../utils/cache.util';
import { ValidationError } from '@/common/errors/ValidationError';

export class CourseService {
  private static instance: CourseService | null = null;
  private readonly CACHE_TTL = 300; // 5 minutes in seconds

  public constructor() {}

  public static getInstance(): CourseService {
    if (!CourseService.instance) {
      CourseService.instance = new CourseService();
    }
    return CourseService.instance;
  }

  public static setInstance(instance: CourseService | null): void {
    CourseService.instance = instance;
  }

  public static resetInstance(): void {
    CourseService.instance = null;
  }

  /**
   * Get courses with filtering, search, and pagination
   * Supports both offset-based and cursor-based pagination with Redis caching
   */
  public async getCourses(
    queryParams: CourseQueryParams
  ): Promise<PaginatedCoursesResponse | CursorPaginatedCoursesResponse> {
    try {
      // Check if cursor-based pagination is requested
      if (queryParams.useCursor || queryParams.cursor) {
        return await this.getCoursesWithCursor(queryParams);
      }

      // Use offset-based pagination (default)
      return await this.getCoursesWithOffset(queryParams);
    } catch (error: any) {
      logger.error('Get courses error:', error);
      throw error;
    }
  }

  /**
   * Get courses with offset-based pagination (original implementation with caching)
   */
  private async getCoursesWithOffset(
    queryParams: CourseQueryParams
  ): Promise<PaginatedCoursesResponse> {
    try {
      // Generate cache key
      const cacheKey = generateCacheKey(queryParams);

      // Try to get from cache
      const cachedData = await this.getFromCache(cacheKey);
      if (cachedData) {
        logger.info(`Cache hit for key: ${cacheKey}`);
        return cachedData;
      }

      logger.info(`Cache miss for key: ${cacheKey}`);

      // Pagination defaults
      const page = Math.max(1, queryParams.page || 1);
      const limit = Math.min(50, Math.max(1, queryParams.limit || 10)); // Max 50 items per page
      const skip = (page - 1) * limit;

      // Build filter query
      const filter = this.buildFilterQuery(queryParams);

      // Build sort query
      const sort = this.buildSortQuery(queryParams);

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

      const result: PaginatedCoursesResponse = {
        courses,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };

      // Cache the result
      await this.setCache(cacheKey, result);

      logger.info(`Retrieved ${courses.length} courses (page ${page}/${totalPages})`);

      return result;
    } catch (error: any) {
      logger.error('Get courses with offset error:', error);
      throw error;
    }
  }

  /**
   * Get courses with cursor-based pagination (for SSG and better performance)
   */
  private async getCoursesWithCursor(
    queryParams: CourseQueryParams
  ): Promise<CursorPaginatedCoursesResponse> {
    try {
      // Generate cache key
      const cacheKey = generateCacheKey(queryParams);

      // Try to get from cache
      const cachedData = await this.getFromCache(cacheKey);
      if (cachedData) {
        logger.info(`Cache hit for key: ${cacheKey}`);
        return cachedData;
      }

      logger.info(`Cache miss for key: ${cacheKey}`);

      const limit = Math.min(50, Math.max(1, queryParams.limit || 10));
      const sortBy = queryParams.sortBy || 'createdAt';
      const sortOrder = queryParams.sortOrder === 'asc' ? 1 : -1;

      // Build filter query
      const filter = this.buildFilterQuery(queryParams);

      // If cursor is provided, decode it and add to filter
      if (queryParams.cursor) {
        const cursorData = decodeCursor(queryParams.cursor);
        if (!cursorData) {
          logger.warn(`Invalid cursor provided: ${queryParams.cursor}`);
          throw new ValidationError('Invalid cursor format', [
            {
              field: 'cursor',
              message: 'The provided cursor is invalid or expired',
              value: queryParams.cursor,
            },
          ]);
        }
        
        // Add cursor condition to filter
        const cursorCondition = sortOrder === 1
          ? { $gt: cursorData.sortValue }
          : { $lt: cursorData.sortValue };

        // Handle tie-breaking with _id
        filter.$or = [
          { [sortBy]: cursorCondition },
          {
            [sortBy]: cursorData.sortValue,
            _id: sortOrder === 1 ? { $gt: cursorData.id } : { $lt: cursorData.id },
          },
        ];
      }

      // Build sort query
      const sort: Record<string, 1 | -1> = { 
        [sortBy]: sortOrder,
        _id: sortOrder, // Tie-breaker
      };

      // If searching, add text score for relevance sorting
      if (queryParams.search && queryParams.search.trim()) {
        sort.score = { $meta: 'textScore' } as any;
      }

      // Fetch limit + 1 to check if there are more items
      const courses = await Course.find(filter)
        .sort(sort)
        .limit(limit + 1)
        .exec();

      // Check if there are more items
      const hasMore = courses.length > limit;
      const items = hasMore ? courses.slice(0, limit) : courses;

      // Generate next cursor if there are more items
      let nextCursor: string | null = null;
      if (hasMore && items.length > 0) {
        const lastItem = items[items.length - 1];
        const sortValue = (lastItem as any)[sortBy];
        nextCursor = encodeCursor(lastItem._id.toString(), sortBy, sortValue);
      }

      const result: CursorPaginatedCoursesResponse = {
        items,
        nextCursor,
        hasMore,
      };

      // Cache the result
      await this.setCache(cacheKey, result);

      logger.info(`Retrieved ${items.length} courses with cursor pagination (hasMore: ${hasMore})`);

      return result;
    } catch (error: any) {
      logger.error('Get courses with cursor error:', error);
      throw error;
    }
  }

  /**
   * Build filter query from query parameters
   */
  private buildFilterQuery(queryParams: CourseQueryParams): FilterQuery<ICourse> {
    const filter: FilterQuery<ICourse> = { isActive: true, isPublished: true, deletedAt: null };

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
      const tagsArray = queryParams.tags.split(',').map(tag => tag.trim());
      
      if (tagsArray.length > 0) {
        filter.tags = { $in: tagsArray };
      }
    }

    // Search filter (text search on title and description)
    // Support both 'q' and 'search' parameters (q takes precedence)
    const searchQuery = queryParams.q || queryParams.search;
    if (searchQuery && searchQuery.trim()) {
      filter.$text = { $search: searchQuery.trim() };
    }

    return filter;
  }

  /**
   * Build sort query from query parameters
   */
  private buildSortQuery(queryParams: CourseQueryParams): Record<string, 1 | -1 | any> {
    const sortBy = queryParams.sortBy || 'createdAt';
    const sortOrder = queryParams.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1 | any> = { isFeatured: -1, [sortBy]: sortOrder };

    // If searching, add text score for relevance sorting
    const searchQuery = queryParams.q || queryParams.search;
    if (searchQuery && searchQuery.trim()) {
      sort.score = { $meta: 'textScore' };
    }

    return sort;
  }

  /**
   * Get data from Redis cache
   */
  private async getFromCache(key: string): Promise<any | null> {
    try {
      const cached = await redisConfig.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error: any) {
      logger.warn('Redis get error (non-critical):', error.message);
      return null; // Fail gracefully
    }
  }

  /**
   * Set data in Redis cache
   */
  private async setCache(key: string, data: any, ttl?: number): Promise<void> {
    try {
      const cacheTTL = ttl || this.CACHE_TTL;
      await redisConfig.set(key, JSON.stringify(data), cacheTTL);
      logger.info(`Cached data with key: ${key} (TTL: ${cacheTTL}s)`);
    } catch (error: any) {
      logger.warn('Redis set error (non-critical):', error.message);
      // Fail gracefully - don't throw error
    }
  }

  /**
   * Invalidate all course caches
   * Call this when courses are created, updated, or deleted
   * Uses SCAN to avoid blocking Redis in production
   */
  public async invalidateCache(): Promise<void> {
    try {
      const client = redisConfig.getClient();
      if (!client || !redisConfig.getConnectionStatus()) {
        logger.warn('Redis not connected. Skipping cache invalidation.');
        return;
      }

      let cursor = '0';
      let totalDeleted = 0;
      const patterns = [
        'public:courses:*',
        'public:course:id:*',
        'public:course:slug:*',
        'public:courses:filter-options',
      ];

      // Use SCAN to iterate through keys without blocking Redis
      for (const pattern of patterns) {
        cursor = '0';
        do {
          const result = await client.scan(cursor, {
            MATCH: pattern,
            COUNT: 100,
          });
          
          cursor = result.cursor;
          const keys = result.keys;
          
          if (keys.length > 0) {
            await client.del(keys);
            totalDeleted += keys.length;
          }
        } while (cursor !== '0');
      }
      
      if (totalDeleted > 0) {
        logger.info(`Invalidated ${totalDeleted} course cache entries`);
      } else {
        logger.info('No course cache entries to invalidate');
      }
    } catch (error: any) {
      logger.warn('Redis cache invalidation error (non-critical):', error.message);
      // Fail gracefully
    }
  }

  /**
   * Get course by ID with Redis caching
   */
  public async getCourseById(courseId: string): Promise<ICourse | null> {
    try {
      const cacheKey = `public:course:id:${courseId}`;
      
      // Try to get from cache
      const cachedData = await this.getFromCache(cacheKey);
      if (cachedData) {
        logger.info(`Cache hit for course ID: ${courseId}`);
        return cachedData;
      }

      logger.info(`Cache miss for course ID: ${courseId}`);
      
      const course = await Course.findById(courseId).exec();
      
      // Cache the result (even if null, to prevent repeated DB queries)
      if (course) {
        await this.setCache(cacheKey, course, 600); // 10 minutes TTL
      }
      
      return course;
    } catch (error: any) {
      logger.error('Get course by ID error:', error);
      throw error;
    }
  }

  /**
   * Get course by slug with Redis caching and course details
   */
  public async getCourseBySlug(slug: string): Promise<ICourse | null> {
    try {
      const cacheKey = `public:course:slug:${slug}`;
      
      // Try to get from cache
      const cachedData = await this.getFromCache(cacheKey);
      if (cachedData) {
        logger.info(`Cache hit for course slug: ${slug}`);
        return cachedData;
      }

      logger.info(`Cache miss for course slug: ${slug}`);
      
      const course = await Course.findOne({ slug }).exec();
      
      // Cache the result (even if null, to prevent repeated DB queries)
      if (course) {
        await this.setCache(cacheKey, course, 600); // 10 minutes TTL
      }
      
      return course;
    } catch (error: any) {
      logger.error('Get course by slug error:', error);
      throw error;
    }
  }

  /**
   * Search courses by text query
   * Dedicated helper function for full-text search on title, description, and tags
   * @param q - Search query string
   * @param options - Optional filters and pagination
   * @returns Array of matching courses sorted by relevance
   */
  public async searchCourses(
    q: string,
    options?: {
      limit?: number;
      category?: string;
      difficultyLevel?: string;
      minPrice?: number;
      maxPrice?: number;
      minRating?: number;
    }
  ): Promise<ICourse[]> {
    try {
      if (!q || !q.trim()) {
        logger.warn('Empty search query provided to searchCourses');
        return [];
      }

      const filter: FilterQuery<ICourse> = {
        isActive: true,
        $text: { $search: q.trim() },
      };

      // Apply optional filters
      if (options?.category) {
        filter.category = options.category;
      }
      if (options?.difficultyLevel) {
        filter.difficultyLevel = options.difficultyLevel;
      }
      if (options?.minPrice !== undefined || options?.maxPrice !== undefined) {
        filter.price = {};
        if (options.minPrice !== undefined) {
          filter.price.$gte = options.minPrice;
        }
        if (options.maxPrice !== undefined) {
          filter.price.$lte = options.maxPrice;
        }
      }
      if (options?.minRating !== undefined) {
        filter.rating = { $gte: options.minRating };
      }

      const limit = Math.min(50, Math.max(1, options?.limit || 20));

      // Execute search query sorted by text relevance score
      const courses = await Course.find(filter)
        .sort({ score: { $meta: 'textScore' } }) // Sort by relevance
        .limit(limit)
        .exec();

      logger.info(`Search query "${q}" returned ${courses.length} results`);

      return courses;
    } catch (error: any) {
      logger.error('Search courses error:', error);
      throw error;
    }
  }

  /**
   * Get available filter options (for frontend filter UI) with Redis caching
   */
  public async getFilterOptions(): Promise<{
    categories: string[];
    difficultyLevels: string[];
    courseTypes: string[];
    priceRange: { min: number; max: number };
    tags: string[];
  }> {
    try {
      const cacheKey = 'public:courses:filter-options';
      
      // Try to get from cache
      const cachedData = await this.getFromCache(cacheKey);
      if (cachedData) {
        logger.info('Cache hit for filter options');
        return cachedData;
      }

      logger.info('Cache miss for filter options');
      
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

      const result = {
        categories: configs.categories,
        difficultyLevels: configs.difficultyLevels,
        courseTypes: configs.courseTypes,
        priceRange: {
          min: priceRange.minPrice || 0,
          max: priceRange.maxPrice || 0,
        },
        tags: allTags.filter(Boolean),
      };
      
      // Cache the result with 15 minutes TTL
      await this.setCache(cacheKey, result, 900);
      
      return result;
    } catch (error: any) {
      logger.error('Get filter options error:', error);
      throw error;
    }
  }
}

export const courseService = CourseService.getInstance();
