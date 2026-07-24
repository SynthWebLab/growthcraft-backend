import mongoose, { Schema, Document } from 'mongoose';

// Enums for Course
export enum CourseLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
  EXPERT = 'Expert',
}

export enum CourseCategory {
  PROGRAMMING = 'Programming',
  DATA_SCIENCE = 'Data Science',
  WEB_DEVELOPMENT = 'Web Development',
  MOBILE_DEVELOPMENT = 'Mobile Development',
  CLOUD_COMPUTING = 'Cloud Computing',
  CYBERSECURITY = 'Cybersecurity',
  AI_ML = 'AI/ML',
  DEVOPS = 'DevOps',
  DESIGN = 'Design',
  BUSINESS = 'Business',
  OTHER = 'Other',
}

// Legacy types for backward compatibility
export type DifficultyLevel = string;
export type CourseStatus = 'Active' | 'Coming Soon' | 'Draft'; // Status is computed, not stored
export type CourseType = string;

export interface IInstructor {
  name: string;
  avatar?: string;
}

export interface IBootcampDetails {
  totalSeats: number;
  availableSeats: number;
  startDate: Date;
  endDate: Date;
  registrationDeadline?: Date;
}

export interface ICourse extends Document {
  // Core fields (GC-S401-T1 requirements)
  slug: string; // URL-friendly identifier @unique
  title: string;
  shortDescription?: string; // Optional for backward compatibility
  description: string;
  thumbnailUrl?: string;
  level?: CourseLevel; // Optional - derived from difficultyLevel if not set
  category: CourseCategory; // enum
  tags: string[];
  totalHours?: number; // Optional - uses duration if not set
  instructorId?: string; // Optional for backward compatibility
  isPublished: boolean;
  isFeatured?: boolean;
  deletedAt?: Date;
  
  // Legacy/additional fields for backward compatibility
  difficultyLevel: DifficultyLevel;
  duration: number; // in hours (maps to durationHours in frontend)
  lessonsCount: number; // maps to totalLessons in frontend
  price: number;
  originalPrice?: number; // maps to price in frontend (before discount)
  rating: number; // maps to avgRating in frontend
  instructor: IInstructor;
  thumbnail?: string;
  isActive: boolean;
  enrollmentCount: number;
  
  // Publishing fields
  publishedAt?: Date; // When course becomes available
  isDraft: boolean; // Whether course is in draft mode
  
  // Course type
  type: CourseType; // Course or Bootcamp
  
  // Bootcamp-specific fields (optional)
  bootcampDetails?: IBootcampDetails;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual/computed methods
  getStatus(): CourseStatus; // Dynamically computed
  getPrimaryCTA(): string;
  getSecondaryCTA(): string | null;
  canEnroll(): boolean;
  hasStarted(): boolean;
}

const courseSchema = new Schema<ICourse>(
  {
    // Core fields (GC-S401-T1)
    slug: {
      type: String,
      required: [true, 'Course slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: 'text', // Enable text search on title
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Short description cannot exceed 500 characters'],
      default: '', // Make optional for backward compatibility
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
      index: 'text', // Enable text search on description
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    level: {
      type: String,
      enum: {
        values: Object.values(CourseLevel),
        message: '{VALUE} is not a valid course level',
      },
      index: true,
      // Optional - will be derived from difficultyLevel if not set
    },
    category: {
      type: String,
      required: [true, 'Course category is required'],
      enum: {
        values: Object.values(CourseCategory),
        message: '{VALUE} is not a valid course category',
      },
      index: true, // Index for filtering
    },
    tags: {
      type: [String],
      default: [],
      index: true, // Index for filtering by tags
    },
    totalHours: {
      type: Number,
      min: [0, 'Total hours cannot be negative'],
      // Optional - will use 'duration' field if not set
    },
    instructorId: {
      type: String,
      index: true,
      // Optional - for backward compatibility
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    
    // Legacy fields for backward compatibility
    difficultyLevel: {
      type: String,
      index: true, // Index for filtering
    },
    duration: {
      type: Number,
      required: [true, 'Course duration is required'],
      min: [0, 'Duration cannot be negative'],
    },
    lessonsCount: {
      type: Number,
      required: [true, 'Lessons count is required'],
      min: [1, 'Course must have at least 1 lesson'],
    },
    price: {
      type: Number,
      required: [true, 'Course price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
    },
    instructor: {
      name: {
        type: String,
        required: [true, 'Instructor name is required'],
        trim: true,
      },
      avatar: {
        type: String,
        trim: true,
      },
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true, // Index for filtering
    },
    enrollmentCount: {
      type: Number,
      default: 0,
      min: [0, 'Enrollment count cannot be negative'],
    },
    publishedAt: {
      type: Date,
      index: true,
    },
    isDraft: {
      type: Boolean,
      default: true,
      index: true,
    },
    type: {
      type: String,
      default: 'Course',
      index: true,
    },
    bootcampDetails: {
      totalSeats: {
        type: Number,
        min: [0, 'Total seats cannot be negative'],
      },
      availableSeats: {
        type: Number,
        min: [0, 'Available seats cannot be negative'],
      },
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
      registrationDeadline: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create compound text index for search
courseSchema.index({ title: 'text', description: 'text' });

// GC-S401-T1: Compound index for (isPublished, category)
courseSchema.index({ isPublished: 1, category: 1 });

// Additional compound indexes for common queries
courseSchema.index({ category: 1, difficultyLevel: 1, isActive: 1 });
courseSchema.index({ rating: -1, enrollmentCount: -1 });
courseSchema.index({ isDraft: 1, type: 1, publishedAt: 1 });

// Pre-validate hook to normalize legacy data before schema validation runs
courseSchema.pre('validate', function (next) {
  // Normalize legacy category strings to valid enum values
  if (this.category) {
    const catMap: Record<string, CourseCategory> = {
      MERN: CourseCategory.WEB_DEVELOPMENT,
      'UI/UX': CourseCategory.DESIGN,
      DataScience: CourseCategory.DATA_SCIENCE,
      'Data Science': CourseCategory.DATA_SCIENCE,
      'Web Development': CourseCategory.WEB_DEVELOPMENT,
      'Mobile Development': CourseCategory.MOBILE_DEVELOPMENT,
      'Cloud Computing': CourseCategory.CLOUD_COMPUTING,
      Cybersecurity: CourseCategory.CYBERSECURITY,
      'AI/ML': CourseCategory.AI_ML,
      DevOps: CourseCategory.DEVOPS,
      Design: CourseCategory.DESIGN,
      Business: CourseCategory.BUSINESS,
      Programming: CourseCategory.PROGRAMMING,
      Other: CourseCategory.OTHER,
    };
    if (catMap[this.category]) {
      this.category = catMap[this.category];
    }
  }

  // Ensure instructor object is populated
  if (!this.instructor || !this.instructor.name) {
    const name = this.instructorId || 'GrowthCraft Team';
    this.instructor = { name };
  }

  // Ensure duration & lessonsCount are populated
  if (!this.duration && this.totalHours) {
    this.duration = this.totalHours;
  } else if (!this.duration) {
    this.duration = 20;
  }

  if (!this.lessonsCount || this.lessonsCount < 1) {
    this.lessonsCount = Math.max(1, Math.floor(this.duration * 2));
  }

  next();
});

// Pre-save hook to ensure backward compatibility
courseSchema.pre('save', function (next) {
  // Auto-populate new fields from legacy fields if not set
  
  // Map difficultyLevel to level if level is not set
  if (!this.level && this.difficultyLevel) {
    const levelMap: Record<string, CourseLevel> = {
      'Beginner': CourseLevel.BEGINNER,
      'Intermediate': CourseLevel.INTERMEDIATE,
      'Advanced': CourseLevel.ADVANCED,
      'Expert': CourseLevel.EXPERT,
    };
    this.level = levelMap[this.difficultyLevel] || CourseLevel.BEGINNER;
  }
  
  // Use duration as totalHours if totalHours is not set
  if (!this.totalHours && this.duration) {
    this.totalHours = this.duration;
  }
  
  // Generate shortDescription from description if not set
  if (!this.shortDescription && this.description) {
    this.shortDescription = this.description.substring(0, 200);
  }
  
  // Use instructor.name as instructorId if instructorId is not set
  if (!this.instructorId && this.instructor?.name) {
    this.instructorId = this.instructor.name;
  }
  
  // Sync isPublished with isDraft (isPublished = !isDraft)
  // If isPublished is not explicitly set, derive from isDraft
  if (this.isPublished === undefined || this.isPublished === null) {
    this.isPublished = !this.isDraft;
  }
  
  next();
});

// Method to check if bootcamp/course has started
courseSchema.methods.hasStarted = function (): boolean {
  if (this.type === 'Bootcamp' && this.bootcampDetails?.startDate) {
    return new Date() >= new Date(this.bootcampDetails.startDate);
  }
  return false;
};

// Method to dynamically compute status
courseSchema.methods.getStatus = function (): CourseStatus {
  const now = new Date();
  
  // If in draft mode
  if (this.isDraft) {
    return 'Draft';
  }
  
  // If not published yet or published in future
  if (this.publishedAt && now < new Date(this.publishedAt)) {
    return 'Coming Soon';
  }
  
  // For bootcamps, check registration deadline
  if (this.type === 'Bootcamp' && this.bootcampDetails) {
    const { registrationDeadline, endDate } = this.bootcampDetails;
    
    // If registration deadline passed
    if (registrationDeadline && now > new Date(registrationDeadline)) {
      return 'Draft'; // Treat as unavailable
    }
    
    // If bootcamp ended
    if (endDate && now > new Date(endDate)) {
      return 'Draft'; // Treat as unavailable
    }
  }
  
  // Otherwise, it's active
  return 'Active';
};

// Method to get Primary CTA based on dynamic status
courseSchema.methods.getPrimaryCTA = function (): string {
  const status = this.getStatus();
  
  if (this.type === 'Course') {
    // For Courses
    switch (status) {
      case 'Active':
        return 'Enroll Now';
      case 'Coming Soon':
        return 'Register Interest';
      case 'Draft':
        return 'Request Callback';
      default:
        return 'Request Callback';
    }
  } else {
    // For Bootcamps
    if (status === 'Draft') {
      return 'Register Interest';
    }
    
    if (!this.bootcampDetails) {
      return 'Request Callback';
    }
    
    const { availableSeats } = this.bootcampDetails;
    const started = this.hasStarted();
    
    // Check if bootcamp has started
    if (started) {
      return 'Request Callback';
    }
    
    // Check if seats are available
    if (availableSeats > 0) {
      return 'Enroll Now';
    }
    
    // No seats available
    return 'Request Callback';
  }
};

// Method to get Secondary CTA
courseSchema.methods.getSecondaryCTA = function (): string | null {
  const status = this.getStatus();
  
  if (this.type === 'Course') {
    // For Courses
    switch (status) {
      case 'Active':
        return 'Request Callback';
      case 'Coming Soon':
        return null;
      case 'Draft':
        return null;
      default:
        return null;
    }
  } else {
    // For Bootcamps
    if (status === 'Draft') {
      return null;
    }
    
    if (!this.bootcampDetails) {
      return null;
    }
    
    const { availableSeats } = this.bootcampDetails;
    const started = this.hasStarted();
    
    // Secondary CTA is "Request Callback" for all bootcamp states except draft
    if (started || availableSeats === 0) {
      return null; // Only primary CTA shown
    }
    
    return 'Request Callback';
  }
};

// Method to check if enrollment is possible
courseSchema.methods.canEnroll = function (): boolean {
  const status = this.getStatus();
  
  if (this.type === 'Course') {
    return status === 'Active';
  } else {
    // For Bootcamps
    if (status === 'Draft' || !this.bootcampDetails) {
      return false;
    }
    
    const { availableSeats } = this.bootcampDetails;
    const started = this.hasStarted();
    
    return availableSeats > 0 && !started;
  }
};

// Remove __v from JSON response
courseSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  
  // Add computed fields
  obj.status = this.getStatus(); // Dynamically computed
  obj.primaryCTA = this.getPrimaryCTA();
  obj.secondaryCTA = this.getSecondaryCTA();
  obj.canEnroll = this.canEnroll();
  obj.hasStarted = this.hasStarted();
  
  // Map fields to match frontend interface
  obj.durationHours = obj.duration;
  obj.totalLessons = obj.lessonsCount;
  obj.avgRating = obj.rating;
  obj.discountedPrice = obj.price;
  obj.instructorName = (obj.instructor as any)?.name;
  
  // Keep original fields for backward compatibility
  return obj;
};

export const Course = mongoose.model<ICourse>('Course', courseSchema);
