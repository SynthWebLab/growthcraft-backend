import { Course, ICourse } from '@/database/models/Course.model';
import { Bootcamp, IBootcamp } from '@/database/models/Bootcamp.model';
import {
  CatalogueItem,
  CatalogueQueryParams,
  CataloguePaginatedResponse,
} from '@/common/interfaces/catalogue.interface';
import { logger } from '@/common/utils/logger.util';
import { redisConfig } from '@/config/redis.config';
import { ValidationError } from '@/common/errors/ValidationError';
import crypto from 'crypto';
import mongoose from 'mongoose';

export class CatalogueService {
  private static instance: CatalogueService;
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_VERSION = 'cta-v5';

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

      if (!queryParams.cursor && queryParams.type) {
        return await this.getCatalogueItemsWithOffset(queryParams, sortBy, sortOrder, limit, cacheKey);
      }

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
   * Get type-specific catalogue items with page/limit pagination.
   */
  private async getCatalogueItemsWithOffset(
    queryParams: CatalogueQueryParams,
    sortBy: string,
    sortOrder: number,
    limit: number,
    cacheKey: string
  ): Promise<CataloguePaginatedResponse> {
    const page = Math.max(1, queryParams.page || 1);
    const skip = (page - 1) * limit;

    let items: CatalogueItem[] = [];
    let total = 0;

    if (queryParams.type === 'course') {
      const [courses, courseTotal] = await Promise.all([
        this.fetchCourses(queryParams, sortBy, sortOrder, limit, skip),
        this.countCourses(queryParams),
      ]);

      items = courses.map(this.mapCourseToCatalogueItem);
      total = courseTotal;
    }

    if (queryParams.type === 'bootcamp') {
      const [bootcamps, bootcampTotal] = await Promise.all([
        this.fetchBootcamps(queryParams, sortBy, sortOrder, limit, skip),
        this.countBootcamps(queryParams),
      ]);

      items = bootcamps.map(this.mapBootcampToCatalogueItem);
      total = bootcampTotal;
    }

    const totalPages = Math.ceil(total / limit);
    const result: CataloguePaginatedResponse = {
      items,
      nextCursor: null,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    await this.setCache(cacheKey, result);
    logger.info(`Retrieved ${items.length} ${queryParams.type} catalogue items (page ${page}/${totalPages})`);

    return result;
  }

  /**
   * Fetch courses based on query parameters
   */
  private async fetchCourses(
    queryParams: CatalogueQueryParams,
    sortBy: string,
    sortOrder: number,
    limit: number,
    skip: number = 0
  ): Promise<ICourse[]> {
    const filter = this.buildCourseFilter(queryParams);

    this.applyCursorFilter(filter, queryParams.cursor, sortBy, sortOrder);

    const sort: any = { [sortBy]: sortOrder, _id: sortOrder };
    if (queryParams.search && queryParams.search.trim()) {
      sort.score = { $meta: 'textScore' };
    }

    return await Course.find(filter).sort(sort).skip(skip).limit(limit).exec();
  }

  /**
   * Fetch bootcamps based on query parameters
   */
  private async fetchBootcamps(
    queryParams: CatalogueQueryParams,
    sortBy: string,
    sortOrder: number,
    limit: number,
    skip: number = 0
  ): Promise<IBootcamp[]> {
    const filter = this.buildBootcampFilter(queryParams);
    
    // Debug logging
    logger.info(`Bootcamp filter: ${JSON.stringify(filter)}`);

    this.applyCursorFilter(filter, queryParams.cursor, sortBy, sortOrder);

    const sort: any = { [sortBy]: sortOrder, _id: sortOrder };
    if (queryParams.search && queryParams.search.trim()) {
      sort.score = { $meta: 'textScore' };
    }

    return await Bootcamp.find(filter).sort(sort).skip(skip).limit(limit).exec();
  }

  /**
   * Count courses for page/limit pagination.
   */
  private async countCourses(queryParams: CatalogueQueryParams): Promise<number> {
    return Course.countDocuments(this.buildCourseFilter(queryParams)).exec();
  }

  /**
   * Count bootcamps for page/limit pagination.
   */
  private async countBootcamps(queryParams: CatalogueQueryParams): Promise<number> {
    return Bootcamp.countDocuments(this.buildBootcampFilter(queryParams)).exec();
  }

  /**
   * Build course filters shared by list and count queries.
   */
  private buildCourseFilter(queryParams: CatalogueQueryParams): any {
    const filter: any = { isActive: true };

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

    return filter;
  }

  /**
   * Build bootcamp filters shared by list and count queries.
   */
  private buildBootcampFilter(queryParams: CatalogueQueryParams): any {
    const filter: any = { isActive: true };

    if (queryParams.status) {
      filter.status = queryParams.status;
    } else {
      filter.status = { $in: ['Open', 'Closed', 'Completed'] };
    }

    if (queryParams.category) filter.category = queryParams.category;
    if (queryParams.mode) filter.mode = queryParams.mode;
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

    return filter;
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
      primaryCTA: course.getPrimaryCTA(),
      secondaryCTA: course.getSecondaryCTA(),
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
      availableSeats: bootcamp.getAvailableSeats(),
      skillsCovered: bootcamp.skillsCovered,
      mentorNames: bootcamp.mentorNames,
      duration: bootcamp.duration,
      status: bootcamp.status,
      canRegister: bootcamp.canRegister(),
      primaryCTA: bootcamp.getPrimaryCTA(),
      secondaryCTA: bootcamp.getSecondaryCTA(),
      cta: bootcamp.getCTAState(),
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
   * Apply cursor condition at database level before fetching the next page.
   */
  private applyCursorFilter(filter: any, cursor: string | undefined, sortBy: string, sortOrder: number): void {
    if (!cursor) {
      return;
    }

    const cursorData = this.decodeCursor(cursor);
    if (!cursorData) {
      logger.warn(`Invalid cursor provided: ${cursor}`);
      throw new ValidationError('Invalid cursor format', [
        {
          field: 'cursor',
          message: 'The provided cursor is invalid or expired',
          value: cursor,
        },
      ]);
    }

    const sortValue = this.castCursorSortValue(cursorData.sortValue, sortBy);
    const objectId = new mongoose.Types.ObjectId(cursorData.id);
    const sortDirectionOperator = sortOrder === 1 ? '$gt' : '$lt';

    filter.$or = [
      { [sortBy]: { [sortDirectionOperator]: sortValue } },
      {
        [sortBy]: sortValue,
        _id: { [sortDirectionOperator]: objectId },
      },
    ];
  }

  /**
   * Cast cursor sort values back to the database field type.
   */
  private castCursorSortValue(sortValue: any, sortBy: string): any {
    switch (sortBy) {
      case 'createdAt':
      case 'startDate':
        return new Date(sortValue);
      case 'price':
      case 'rating':
        return Number(sortValue);
      default:
        return sortValue;
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
      cursor: queryParams.cursor,
      page: queryParams.page || 1,
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

    return `${prefix}:${this.CACHE_VERSION}:${hash}`;
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
}

export const catalogueService = CatalogueService.getInstance();
