import { CourseCategory, DifficultyLevel } from '@/database/models/Course.model';

export interface CourseQueryParams {
  // Pagination (offset-based)
  page?: number;
  limit?: number;

  // Pagination (cursor-based)
  cursor?: string; // Base64 encoded cursor for cursor-based pagination
  useCursor?: boolean; // Flag to enable cursor-based pagination

  // Filtering
  category?: CourseCategory;
  difficultyLevel?: DifficultyLevel;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  tags?: string; // Always a string (comma-separated) after validation

  // Search (supports both 'q' and 'search' for backward compatibility)
  q?: string;
  search?: string;

  // Sorting
  sortBy?: 'title' | 'price' | 'rating' | 'enrollmentCount' | 'createdAt' | 'duration';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedCoursesResponse {
  courses: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CursorPaginatedCoursesResponse {
  items: any[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number; // Optional, can be expensive to calculate
}
