import crypto from 'crypto';
import { CourseQueryParams } from '../interfaces/course-query.interface';

/**
 * Generate a cache key based on query parameters
 * Format: public:courses:<hash>
 * Note: cursor and useCursor are excluded to prevent cache bloat
 */
export function generateCacheKey(queryParams: CourseQueryParams): string {
  // Create a normalized object with only the filter parameters
  // Exclude cursor and useCursor to prevent one-time-use cache entries
  const filterParams: Record<string, any> = {
    category: queryParams.category,
    difficultyLevel: queryParams.difficultyLevel,
    minPrice: queryParams.minPrice,
    maxPrice: queryParams.maxPrice,
    minRating: queryParams.minRating,
    tags: queryParams.tags, // Already a string after validation
    search: queryParams.search,
    sortBy: queryParams.sortBy || 'createdAt',
    sortOrder: queryParams.sortOrder || 'desc',
    page: queryParams.page || 1,
    limit: queryParams.limit || 10,
  };

  // Remove undefined values
  Object.keys(filterParams).forEach(key => {
    if (filterParams[key] === undefined) {
      delete filterParams[key];
    }
  });

  // Sort keys for consistent hashing
  const sortedKeys = Object.keys(filterParams).sort();
  const normalizedParams: Record<string, any> = {};
  sortedKeys.forEach(key => {
    normalizedParams[key] = filterParams[key];
  });

  // Create hash from normalized parameters
  const paramsString = JSON.stringify(normalizedParams);
  const hash = crypto
    .createHash('md5')
    .update(paramsString)
    .digest('hex');

  return `public:courses:${hash}`;
}

/**
 * Generate cache key pattern for invalidation
 * Returns pattern to match all course cache keys
 */
export function getCourseCachePattern(): string {
  return 'public:courses:*';
}

/**
 * Encode cursor for pagination
 */
export function encodeCursor(id: string, sortField: string, sortValue: any): string {
  const cursorData = {
    id,
    sortField,
    sortValue,
  };
  return Buffer.from(JSON.stringify(cursorData)).toString('base64');
}

/**
 * Decode cursor for pagination
 */
export function decodeCursor(cursor: string): { id: string; sortField: string; sortValue: any } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}
