import { Bootcamp, IBootcamp } from '@/database/models/Bootcamp.model';
import { logger } from '@/common/utils/logger.util';
import { FilterQuery } from 'mongoose';
import { redisConfig } from '@/config/redis.config';
import { ValidationError } from '@/common/errors/ValidationError';

export interface BootcampQueryParams {
  cursor?: string;
  limit?: number;
  category?: string;
  mode?: 'Online' | 'Offline' | 'Hybrid';
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  tags?: string;
  search?: string;
  sortBy?: 'title' | 'price' | 'rating' | 'createdAt' | 'startDate';
  sortOrder?: 'asc' | 'desc';
}

export class BootcampService {
  private static instance: BootcampService;
  private readonly CACHE_TTL = 300; // 5 minutes

  private constructor() {}

  public static getInstance(): BootcampService {
    if (!BootcampService.instance) {
      BootcampService.instance = new BootcampService();
    }
    return BootcampService.instance;
  }

  /**
   * Get bootcamps with cursor-based pagination and caching
   */
  public async getBootcamps(queryParams: BootcampQueryParams): Promise<{
    items: IBootcamp[];
    nextCursor: string | null;
  }> {
    try {
      const limit = Math.min(50, Math.max(1, queryParams.limit || 10));
      const sortBy = queryParams.sortBy || 'startDate';
      const sortOrder = queryParams.sortOrder === 'asc' ? 1 : -1;

      // Build filter query
      const filter = this.buildFilterQuery(queryParams);

      // Handle cursor pagination
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

        // Add cursor condition to filter
        const cursorCondition = sortOrder === 1 ? { $gt: cursorData.sortValue } : { $lt: cursorData.sortValue };

        filter.$or = [
          { [sortBy]: cursorCondition },
          {
            [sortBy]: cursorData.sortValue,
            _id: sortOrder === 1 ? { $gt: cursorData.id } : { $lt: cursorData.id },
          },
        ];
      }

      // Build sort query
      const sort: Record<string, 1 | -1 | any> = {
        [sortBy]: sortOrder,
        _id: sortOrder,
      };

      if (queryParams.search && queryParams.search.trim()) {
        sort.score = { $meta: 'textScore' };
      }

      // Fetch limit + 1 to check if there are more items
      const bootcamps = await Bootcamp.find(filter)
        .sort(sort)
        .limit(limit + 1)
        .exec();

      // Check if there are more items
      const hasMore = bootcamps.length > limit;
      const items = hasMore ? bootcamps.slice(0, limit) : bootcamps;

      // Generate next cursor if there are more items
      let nextCursor: string | null = null;
      if (hasMore && items.length > 0) {
        const lastItem = items[items.length - 1];
        const sortValue = (lastItem as any)[sortBy];
        nextCursor = this.encodeCursor(lastItem._id.toString(), sortBy, sortValue);
      }

      logger.info(`Retrieved ${items.length} bootcamps with cursor pagination (hasMore: ${hasMore})`);

      return {
        items,
        nextCursor,
      };
    } catch (error: any) {
      logger.error('Get bootcamps error:', error);
      throw error;
    }
  }

  /**
   * Get bootcamp by ID with caching
   */
  public async getBootcampById(bootcampId: string): Promise<IBootcamp | null> {
    try {
      const cacheKey = `public:bootcamp:id:${bootcampId}`;

      // Try cache
      const cachedData = await this.getFromCache(cacheKey);
      if (cachedData) {
        logger.info(`Cache hit for bootcamp ID: ${bootcampId}`);
        return cachedData;
      }

      logger.info(`Cache miss for bootcamp ID: ${bootcampId}`);

      const bootcamp = await Bootcamp.findById(bootcampId).exec();

      if (bootcamp) {
        await this.setCache(cacheKey, bootcamp, 600);
      }

      return bootcamp;
    } catch (error: any) {
      logger.error('Get bootcamp by ID error:', error);
      throw error;
    }
  }

  /**
   * Get bootcamp by slug with caching
   */
  public async getBootcampBySlug(slug: string): Promise<IBootcamp | null> {
    try {
      const cacheKey = `public:bootcamp:slug:${slug}`;

      // Try cache
      const cachedData = await this.getFromCache(cacheKey);
      if (cachedData) {
        logger.info(`Cache hit for bootcamp slug: ${slug}`);
        return cachedData;
      }

      logger.info(`Cache miss for bootcamp slug: ${slug}`);

      const bootcamp = await Bootcamp.findOne({ slug }).exec();

      if (bootcamp) {
        await this.setCache(cacheKey, bootcamp, 600);
      }

      return bootcamp;
    } catch (error: any) {
      logger.error('Get bootcamp by slug error:', error);
      throw error;
    }
  }

  /**
   * Build filter query from query parameters
   */
  private buildFilterQuery(queryParams: BootcampQueryParams): FilterQuery<IBootcamp> {
    const filter: FilterQuery<IBootcamp> = { isActive: true };

    // Only show published bootcamps (Open, Closed, or Completed)
    if (queryParams.status) {
      filter.status = queryParams.status;
    } else {
      filter.status = { $in: ['Open', 'Closed', 'Completed'] };
    }

    // Category filter
    if (queryParams.category) {
      filter.category = queryParams.category;
    }

    // Mode filter
    if (queryParams.mode) {
      filter.mode = queryParams.mode;
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

    // Search filter
    if (queryParams.search && queryParams.search.trim()) {
      filter.$text = { $search: queryParams.search.trim() };
    }

    return filter;
  }

  /**
   * Encode cursor for pagination
   */
  private encodeCursor(id: string, sortField: string, sortValue: any): string {
    const cursorData = { id, sortField, sortValue };
    return Buffer.from(JSON.stringify(cursorData)).toString('base64');
  }

  /**
   * Decode cursor for pagination
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
      return null;
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
    }
  }

  /**
   * Invalidate all bootcamp caches
   */
  public async invalidateCache(): Promise<void> {
    try {
      const client = redisConfig.getClient();
      if (!client || !redisConfig.getConnectionStatus()) {
        logger.warn('Redis not connected. Skipping cache invalidation.');
        return;
      }

      let cursor = 0;
      let totalDeleted = 0;
      const patterns = ['public:bootcamp:id:*', 'public:bootcamp:slug:*', 'public:bootcamps:*'];

      for (const pattern of patterns) {
        cursor = 0;
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
        } while (cursor !== 0);
      }

      if (totalDeleted > 0) {
        logger.info(`Invalidated ${totalDeleted} bootcamp cache entries`);
      } else {
        logger.info('No bootcamp cache entries to invalidate');
      }
    } catch (error: any) {
      logger.warn('Redis cache invalidation error (non-critical):', error.message);
    }
  }
}

export const bootcampService = BootcampService.getInstance();
