import { Course, ICourse } from '@/database/models/Course.model';
import { Bootcamp, IBootcamp } from '@/database/models/Bootcamp.model';
import { CourseModule, ICourseModule } from '@/database/models/CourseModule.model';
import { CourseFAQ, ICourseFAQ } from '@/database/models/CourseFAQ.model';
import { CourseBatch, ICourseBatch } from '@/database/models/CourseBatch.model';
import {
  CatalogueItem,
  CatalogueQueryParams,
  CataloguePaginatedResponse,
} from '@/common/interfaces/catalogue.interface';
import { ICourseDetail, IBootcampDetail } from '../interfaces/course-detail.interface';
import { logger } from '@/common/utils/logger.util';
import { redisConfig } from '@/config/redis.config';
import { ValidationError } from '@/common/errors/ValidationError';
import { NotFoundError } from '@/common/errors/NotFoundError';
import crypto from 'crypto';

export class CatalogueService {
  private static instance: CatalogueService;
  private readonly CACHE_TTL = 300; // 5 minutes

  private constructor() {}

  public static getInstance(): CatalogueService {
    if (!CatalogueService.instance) {
      CatalogueService.instance = new CatalogueService();
    }
    return CatalogueService.instance;
  }

  /**
   * Get catalogue items (courses and/or bootcamps) with unified format
   */
  public async getCatalogueItems(
    queryParams: CatalogueQueryParams
  ): Promise<CataloguePaginatedResponse> {
    try {
      // Debug logging
      logger.info(`Query params received: ${JSON.stringify(queryParams)}`);
      
      // Generate cache key
      const cacheKey = this.generateCacheKey(queryParams);

      // Try cache
      const cachedData = await this.getFromCache(cacheKey);
      if (cachedData) {
        logger.info(`Cache hit for catalogue: ${cacheKey}`);
        return cachedData;
      }

      logger.info(`Cache miss for catalogue: ${cacheKey}`);

      const limit = Math.min(50, Math.max(1, queryParams.limit || 10));
      const sortBy = queryParams.sortBy || 'createdAt';
      const sortOrder = queryParams.sortOrder === 'asc' ? 1 : -1;

      let allItems: CatalogueItem[] = [];

      // Fetch courses if type is not specified or is 'course'
      if (!queryParams.type || queryParams.type === 'course') {
        const courses = await this.fetchCourses(queryParams, sortBy, sortOrder, limit + 1);
        allItems.push(...courses.map(this.mapCourseToCatalogueItem));
      }

      // Fetch bootcamps if type is not specified or is 'bootcamp'
      if (!queryParams.type || queryParams.type === 'bootcamp') {
        const bootcamps = await this.fetchBootcamps(queryParams, sortBy, sortOrder, limit + 1);
        allItems.push(...bootcamps.map(this.mapBootcampToCatalogueItem));
      }

      // Sort combined results
      allItems = this.sortCatalogueItems(allItems, sortBy, sortOrder);

      // Apply cursor filtering if provided
      if (queryParams.cursor) {
        const cursorData = this.decodeCursor(queryParams.cursor);
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

        allItems = this.filterByCursor(allItems, cursorData, sortBy, sortOrder);
      }

      // Paginate
      const hasMore = allItems.length > limit;
      const items = hasMore ? allItems.slice(0, limit) : allItems;

      // Generate next cursor
      let nextCursor: string | null = null;
      if (hasMore && items.length > 0) {
        const lastItem = items[items.length - 1];
        const sortValue = this.getSortValue(lastItem, sortBy);
        nextCursor = this.encodeCursor(lastItem.id, sortBy, sortValue);
      }

      const result: CataloguePaginatedResponse = {
        items,
        nextCursor,
      };

      // Cache the result
      await this.setCache(cacheKey, result);

      logger.info(`Retrieved ${items.length} catalogue items (hasMore: ${hasMore})`);

      return result;
    } catch (error: any) {
      logger.error('Get catalogue items error:', error);
      throw error;
    }
  }

  /**
   * Fetch courses based on query parameters
   */
  private async fetchCourses(
    queryParams: CatalogueQueryParams,
    sortBy: string,
    sortOrder: number,
    limit: number
  ): Promise<ICourse[]> {
    const filter: any = { isActive: true };

    // Apply filters
    if (queryParams.category) filter.category = queryParams.category;
    if (queryParams.level || queryParams.difficultyLevel) {
      filter.difficultyLevel = queryParams.level || queryParams.difficultyLevel;
    }
    if (queryParams.minPrice !== undefined || queryParams.maxPrice !== undefined) {
      filter.price = {};
      if (queryParams.minPrice !== undefined) filter.price.$gte = queryParams.minPrice;
      if (queryParams.maxPrice !== undefined) filter.price.$lte = queryParams.maxPrice;
    }
    if (queryParams.minRating !== undefined) filter.rating = { $gte: queryParams.minRating };
    if (queryParams.tags) {
      const tagsArray = queryParams.tags.split(',').map(tag => tag.trim());
      if (tagsArray.length > 0) filter.tags = { $in: tagsArray };
    }
    if (queryParams.search && queryParams.search.trim()) {
      filter.$text = { $search: queryParams.search.trim() };
    }

    const sort: any = { [sortBy]: sortOrder, _id: sortOrder };
    if (queryParams.search && queryParams.search.trim()) {
      sort.score = { $meta: 'textScore' };
    }

    return await Course.find(filter).sort(sort).limit(limit).exec();
  }

  /**
   * Fetch bootcamps based on query parameters
   */
  private async fetchBootcamps(
    queryParams: CatalogueQueryParams,
    sortBy: string,
    sortOrder: number,
    limit: number
  ): Promise<IBootcamp[]> {
    const filter: any = { isActive: true };

    // Only show published bootcamps
    if (queryParams.status) {
      filter.status = queryParams.status;
    } else {
      filter.status = { $in: ['Open', 'Closed', 'Completed'] };
    }

    // Apply filters
    if (queryParams.category) filter.category = queryParams.category;
    if (queryParams.mode) filter.mode = queryParams.mode;
    
    // Debug logging
    logger.info(`Bootcamp filter: ${JSON.stringify(filter)}`);
    
    if (queryParams.minPrice !== undefined || queryParams.maxPrice !== undefined) {
      filter.price = {};
      if (queryParams.minPrice !== undefined) filter.price.$gte = queryParams.minPrice;
      if (queryParams.maxPrice !== undefined) filter.price.$lte = queryParams.maxPrice;
    }
    if (queryParams.minRating !== undefined) filter.rating = { $gte: queryParams.minRating };
    if (queryParams.tags) {
      const tagsArray = queryParams.tags.split(',').map(tag => tag.trim());
      if (tagsArray.length > 0) filter.tags = { $in: tagsArray };
    }
    if (queryParams.search && queryParams.search.trim()) {
      filter.$text = { $search: queryParams.search.trim() };
    }

    const sort: any = { [sortBy]: sortOrder, _id: sortOrder };
    if (queryParams.search && queryParams.search.trim()) {
      sort.score = { $meta: 'textScore' };
    }

    return await Bootcamp.find(filter).sort(sort).limit(limit).exec();
  }

  /**
   * Map course to catalogue item
   */
  private mapCourseToCatalogueItem(course: ICourse): CatalogueItem {
    return {
      id: course._id.toString(),
      type: 'course',
      title: course.title,
      slug: course.slug,
      description: course.description,
      category: course.category,
      price: course.price,
      originalPrice: course.originalPrice,
      thumbnail: course.thumbnail,
      rating: course.rating,
      tags: course.tags,
      difficultyLevel: course.difficultyLevel,
      duration: course.duration,
      lessonsCount: course.lessonsCount,
      instructor: course.instructor,
      enrollmentCount: course.enrollmentCount,
      status: course.getStatus(),
      canEnroll: course.canEnroll(),
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
    };
  }

  /**
   * Map bootcamp to catalogue item
   */
  private mapBootcampToCatalogueItem(bootcamp: IBootcamp): CatalogueItem {
    return {
      id: bootcamp._id.toString(),
      type: 'bootcamp',
      title: bootcamp.title,
      slug: bootcamp.slug,
      description: bootcamp.description,
      category: bootcamp.category,
      price: bootcamp.price,
      originalPrice: bootcamp.originalPrice,
      banner: bootcamp.banner,
      rating: bootcamp.rating,
      tags: bootcamp.tags,
      startDate: bootcamp.startDate.toISOString(),
      endDate: bootcamp.endDate.toISOString(),
      mode: bootcamp.mode,
      maxSeats: bootcamp.maxSeats,
      enrolledCount: bootcamp.enrolledCount,
      availableSeats: bootcamp.availableSeats,
      skillsCovered: bootcamp.skillsCovered,
      mentorNames: bootcamp.mentorNames,
      duration: bootcamp.duration,
      status: bootcamp.status,
      canRegister: bootcamp.canRegister(),
      createdAt: bootcamp.createdAt.toISOString(),
      updatedAt: bootcamp.updatedAt.toISOString(),
    };
  }

  /**
   * Sort catalogue items
   */
  private sortCatalogueItems(
    items: CatalogueItem[],
    sortBy: string,
    sortOrder: number
  ): CatalogueItem[] {
    return items.sort((a, b) => {
      const aValue = this.getSortValue(a, sortBy);
      const bValue = this.getSortValue(b, sortBy);

      if (aValue < bValue) return -1 * sortOrder;
      if (aValue > bValue) return 1 * sortOrder;
      return 0;
    });
  }

  /**
   * Get sort value from catalogue item
   */
  private getSortValue(item: CatalogueItem, sortBy: string): any {
    switch (sortBy) {
      case 'title':
        return item.title;
      case 'price':
        return item.price;
      case 'rating':
        return item.rating;
      case 'startDate':
        return item.startDate || item.createdAt;
      case 'createdAt':
      default:
        return item.createdAt;
    }
  }

  /**
   * Filter items by cursor
   */
  private filterByCursor(
    items: CatalogueItem[],
    cursorData: { id: string; sortField: string; sortValue: any },
    sortBy: string,
    sortOrder: number
  ): CatalogueItem[] {
    return items.filter(item => {
      const itemValue = this.getSortValue(item, sortBy);
      if (sortOrder === 1) {
        return itemValue > cursorData.sortValue || (itemValue === cursorData.sortValue && item.id > cursorData.id);
      } else {
        return itemValue < cursorData.sortValue || (itemValue === cursorData.sortValue && item.id < cursorData.id);
      }
    });
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(queryParams: CatalogueQueryParams): string {
    const filterParams: Record<string, any> = {
      type: queryParams.type,
      category: queryParams.category,
      level: queryParams.level,
      difficultyLevel: queryParams.difficultyLevel,
      mode: queryParams.mode,
      status: queryParams.status,
      minPrice: queryParams.minPrice,
      maxPrice: queryParams.maxPrice,
      minRating: queryParams.minRating,
      tags: queryParams.tags,
      search: queryParams.search,
      sortBy: queryParams.sortBy || 'createdAt',
      sortOrder: queryParams.sortOrder || 'desc',
      limit: queryParams.limit || 10,
    };

    // Remove undefined values
    Object.keys(filterParams).forEach(key => {
      if (filterParams[key] === undefined) {
        delete filterParams[key];
      }
    });

    const paramsString = JSON.stringify(filterParams);
    const hash = crypto.createHash('md5').update(paramsString).digest('hex');

    // Use type-specific cache key prefix
    const prefix = queryParams.type === 'course' ? 'public:courses' : 
                   queryParams.type === 'bootcamp' ? 'public:bootcamps' : 
                   'public:catalogue';

    return `${prefix}:${hash}`;
  }

  /**
   * Encode cursor
   */
  private encodeCursor(id: string, sortField: string, sortValue: any): string {
    const cursorData = { id, sortField, sortValue };
    return Buffer.from(JSON.stringify(cursorData)).toString('base64');
  }

  /**
   * Decode cursor
   */
  private decodeCursor(cursor: string): { id: string; sortField: string; sortValue: any } | null {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get from cache
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
      return null;
    }
  }

  /**
   * Set cache
   */
  private async setCache(key: string, data: any): Promise<void> {
    try {
      await redisConfig.set(key, JSON.stringify(data), this.CACHE_TTL);
      logger.info(`Cached catalogue data with key: ${key} (TTL: ${this.CACHE_TTL}s)`);
    } catch (error: any) {
      logger.warn('Redis set error (non-critical):', error.message);
    }
  }

  /**
   * Get detailed course by slug with eager-loaded modules, FAQs, and upcoming batches
   * Returns 404 if course is not published
   */
  public async getCourseDetailBySlug(slug: string): Promise<ICourseDetail> {
    try {
      const cacheKey = `public:course:detail:slug:${slug}`;

      // Try cache
      const cachedData = await this.getFromCache(cacheKey);
      if (cachedData) {
        logger.info(`Cache hit for course detail: ${slug}`);
        return cachedData;
      }

      logger.info(`Cache miss for course detail: ${slug}`);

      // Find course
      const course = await Course.findOne({ slug, isActive: true }).exec();

      if (!course) {
        throw new NotFoundError(`Course with slug '${slug}' not found`, 'COURSE_NOT_FOUND');
      }

      // Check if course is published
      const now = new Date();
      if (course.isDraft || (course.publishedAt && now < new Date(course.publishedAt))) {
        throw new NotFoundError(`Course with slug '${slug}' is not published`, 'COURSE_NOT_PUBLISHED');
      }

      // Fetch related data in parallel
      const [modules, faqs, upcomingBatches] = await Promise.all([
        // Get all active modules sorted by order
        CourseModule.find({ courseId: course._id, isActive: true })
          .sort({ order: 1 })
          .exec(),

        // Get all active FAQs sorted by order
        CourseFAQ.find({ courseId: course._id, isActive: true })
          .sort({ order: 1 })
          .exec(),

        // Get next 3 upcoming batches
        this.getUpcomingBatches(course._id.toString(), 3),
      ]);

      const result: ICourseDetail = {
        course,
        modules,
        faqs,
        upcomingBatches,
      };

      // Cache the result with 10 minutes TTL
      await this.setCache(cacheKey, result);

      logger.info(`Retrieved detailed course: ${slug} with ${modules.length} modules, ${faqs.length} FAQs, ${upcomingBatches.length} batches`);

      return result;
    } catch (error: any) {
      logger.error('Get course detail by slug error:', error);
      throw error;
    }
  }

  /**
   * Get detailed course by ID with eager-loaded modules, FAQs, and upcoming batches
   * Returns 404 if course is not published
   */
  public async getCourseDetailById(courseId: string): Promise<ICourseDetail> {
    try {
      const cacheKey = `public:course:detail:id:${courseId}`;

      // Try cache
      const cachedData = await this.getFromCache(cacheKey);
      if (cachedData) {
        logger.info(`Cache hit for course detail: ${courseId}`);
        return cachedData;
      }

      logger.info(`Cache miss for course detail: ${courseId}`);

      // Find course
      const course = await Course.findById(courseId).exec();

      if (!course || !course.isActive) {
        throw new NotFoundError(`Course with ID '${courseId}' not found`, 'COURSE_NOT_FOUND');
      }

      // Check if course is published
      const now = new Date();
      if (course.isDraft || (course.publishedAt && now < new Date(course.publishedAt))) {
        throw new NotFoundError(`Course with ID '${courseId}' is not published`, 'COURSE_NOT_PUBLISHED');
      }

      // Fetch related data in parallel
      const [modules, faqs, upcomingBatches] = await Promise.all([
        // Get all active modules sorted by order
        CourseModule.find({ courseId: course._id, isActive: true })
          .sort({ order: 1 })
          .exec(),

        // Get all active FAQs sorted by order
        CourseFAQ.find({ courseId: course._id, isActive: true })
          .sort({ order: 1 })
          .exec(),

        // Get next 3 upcoming batches
        this.getUpcomingBatches(course._id.toString(), 3),
      ]);

      const result: ICourseDetail = {
        course,
        modules,
        faqs,
        upcomingBatches,
      };

      // Cache the result with 10 minutes TTL
      await this.setCache(cacheKey, result);

      logger.info(`Retrieved detailed course: ${courseId} with ${modules.length} modules, ${faqs.length} FAQs, ${upcomingBatches.length} batches`);

      return result;
    } catch (error: any) {
      logger.error('Get course detail by ID error:', error);
      throw error;
    }
  }

  /**
   * Get upcoming batches for a course
   * Returns batches where startDate >= today and status in ['Open', 'Filling']
   * Sorted by startDate ASC
   */
  private async getUpcomingBatches(courseId: string, limit: number = 3): Promise<ICourseBatch[]> {
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Start of today

      const batches = await CourseBatch.find({
        courseId,
        isActive: true,
        startDate: { $gte: now },
        status: { $in: ['Open', 'Filling'] },
      })
        .sort({ startDate: 1 }) // ASC order
        .limit(limit)
        .exec();

      return batches;
    } catch (error: any) {
      logger.error('Get upcoming batches error:', error);
      throw error;
    }
  }

  /**
   * Get detailed bootcamp by slug with eager-loaded modules and FAQs
   * Returns 404 if bootcamp is not published
   */
  public async getBootcampDetailBySlug(slug: string): Promise<IBootcampDetail> {
    try {
      const cacheKey = `public:bootcamp:detail:slug:${slug}`;

      // Try cache
      const cachedData = await this.getFromCache(cacheKey);
      if (cachedData) {
        logger.info(`Cache hit for bootcamp detail: ${slug}`);
        return cachedData;
      }

      logger.info(`Cache miss for bootcamp detail: ${slug}`);

      // Find bootcamp
      const bootcamp = await Bootcamp.findOne({ slug, isActive: true }).exec();

      if (!bootcamp) {
        throw new NotFoundError(`Bootcamp with slug '${slug}' not found`, 'BOOTCAMP_NOT_FOUND');
      }

      // Check if bootcamp is published (status should not be Draft)
      if (bootcamp.status === 'Draft') {
        throw new NotFoundError(`Bootcamp with slug '${slug}' is not published`, 'BOOTCAMP_NOT_PUBLISHED');
      }

      const result: IBootcampDetail = {
        bootcamp,
      };

      // Cache the result with 10 minutes TTL
      await this.setCache(cacheKey, result);

      logger.info(`Retrieved detailed bootcamp: ${slug}`);

      return result;
    } catch (error: any) {
      logger.error('Get bootcamp detail by slug error:', error);
      throw error;
    }
  }

  /**
   * Get detailed bootcamp by ID with eager-loaded modules and FAQs
   * Returns 404 if bootcamp is not published
   */
  public async getBootcampDetailById(bootcampId: string): Promise<IBootcampDetail> {
    try {
      const cacheKey = `public:bootcamp:detail:id:${bootcampId}`;

      // Try cache
      const cachedData = await this.getFromCache(cacheKey);
      if (cachedData) {
        logger.info(`Cache hit for bootcamp detail: ${bootcampId}`);
        return cachedData;
      }

      logger.info(`Cache miss for bootcamp detail: ${bootcampId}`);

      // Find bootcamp
      const bootcamp = await Bootcamp.findById(bootcampId).exec();

      if (!bootcamp || !bootcamp.isActive) {
        throw new NotFoundError(`Bootcamp with ID '${bootcampId}' not found`, 'BOOTCAMP_NOT_FOUND');
      }

      // Check if bootcamp is published (status should not be Draft)
      if (bootcamp.status === 'Draft') {
        throw new NotFoundError(`Bootcamp with ID '${bootcampId}' is not published`, 'BOOTCAMP_NOT_PUBLISHED');
      }

      const result: IBootcampDetail = {
        bootcamp,
      };

      // Cache the result with 10 minutes TTL
      await this.setCache(cacheKey, result);

      logger.info(`Retrieved detailed bootcamp: ${bootcampId}`);

      return result;
    } catch (error: any) {
      logger.error('Get bootcamp detail by ID error:', error);
      throw error;
    }
  }
}

export const catalogueService = CatalogueService.getInstance();
