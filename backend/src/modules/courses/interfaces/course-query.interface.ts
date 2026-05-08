import { CourseCategory, DifficultyLevel } from '@/database/models/Course.model';

export interface CourseQueryParams {
  // Pagination
  page?: number;
  limit?: number;

  // Filtering
  category?: CourseCategory;
  difficultyLevel?: DifficultyLevel;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  tags?: string | string[];

  // Search
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
