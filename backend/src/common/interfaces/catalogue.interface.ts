/**
 * Unified catalogue item interface for SSG
 * Used by both courses and bootcamps
 */

export type CatalogueItemType = 'course' | 'bootcamp';

export interface CatalogueItem {
  // Common fields
  id: string;
  type: CatalogueItemType;
  title: string;
  slug: string;
  description: string;
  category: string;
  
  // Pricing
  price: number;
  originalPrice?: number;
  
  // Media
  thumbnail?: string;
  banner?: string;
  
  // Metadata
  rating: number;
  tags: string[];
  
  // Dates (optional for courses, required for bootcamps)
  startDate?: string;
  endDate?: string;
  
  // Type-specific fields (optional)
  // For courses
  difficultyLevel?: string;
  duration?: number; // hours for courses, days for bootcamps
  lessonsCount?: number;
  instructor?: {
    name: string;
    avatar?: string;
  };
  enrollmentCount?: number;
  
  // For bootcamps
  mode?: 'Online' | 'Offline' | 'Hybrid';
  maxSeats?: number;
  enrolledCount?: number;
  availableSeats?: number;
  skillsCovered?: string[];
  mentorNames?: string[];
  
  // Status
  status: string;
  canEnroll?: boolean; // For courses
  canRegister?: boolean; // For bootcamps
  primaryCTA?: string;
  secondaryCTA?: string | null;
  cta?: {
    status: string;
    condition: string;
    seatsAvailable: boolean;
    primaryCTA: string;
    secondaryCTA: string | null;
    codeLocation: string;
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface CatalogueQueryParams {
  // Pagination (cursor-based only for public endpoints)
  cursor?: string;
  limit?: number;
  page?: number; // For backward compatibility
  
  // Filtering
  type?: CatalogueItemType; // Filter by course or bootcamp
  category?: string;
  level?: string; // Alias for difficultyLevel
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  tags?: string; // Comma-separated
  
  // Bootcamp-specific filters
  mode?: 'Online' | 'Offline' | 'Hybrid';
  status?: string;
  
  // Course-specific filters
  difficultyLevel?: string;
  
  // Search
  search?: string;
  
  // Sorting
  sortBy?: 'title' | 'price' | 'rating' | 'createdAt' | 'startDate';
  sortOrder?: 'asc' | 'desc';
}

export interface CataloguePaginatedResponse {
  items: CatalogueItem[];
  nextCursor: string | null;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
