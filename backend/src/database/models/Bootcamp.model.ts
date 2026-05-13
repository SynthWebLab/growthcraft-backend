import mongoose, { Schema, Document } from 'mongoose';

export type BootcampCategory = string; // Dynamic from database (MERN, DataScience, DevOps, UI/UX, etc.)
export type BootcampStatus = 'Draft' | 'Open' | 'Closed' | 'Completed';
export type BootcampMode = 'Online' | 'Offline' | 'Hybrid';

export interface IBootcamp extends Document {
  title: string;
  slug: string;
  description: string;
  banner: string; // Banner image URL
  category: BootcampCategory;
  
  // Dates
  startDate: Date;
  endDate: Date;
  registrationDeadline?: Date;
  
  // Capacity
  maxSeats: number; // Total seats available
  enrolledCount: number; // Number of enrolled students
  availableSeats: number; // Computed: maxSeats - enrolledCount
  
  // Pricing
  price: number;
  originalPrice?: number;
  
  // Mode (Online/Offline/Hybrid)
  mode: BootcampMode;
  
  // Skills and Mentors
  skillsCovered: string[]; // Array of skills taught
  mentorNames: string[]; // Array of mentor names
  
  // Status
  status: BootcampStatus; // Draft, Open, Closed, Completed
  
  // Metadata
  rating: number;
  tags: string[];
  isActive: boolean;
  publishedAt?: Date;
  
  // Computed fields
  duration: number; // in days (computed from start/end date)
  
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual/computed methods
  canRegister(): boolean;
  hasStarted(): boolean;
  hasEnded(): boolean;
  isFull(): boolean;
}

const bootcampSchema = new Schema<IBootcamp>(
  {
    title: {
      type: String,
      required: [true, 'Bootcamp title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: 'text',
    },
    slug: {
      type: String,
      required: [true, 'Bootcamp slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Bootcamp description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      index: 'text',
    },
    banner: {
      type: String,
      required: [true, 'Banner image is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Bootcamp category is required'],
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      index: true,
    },
    registrationDeadline: {
      type: Date,
      index: true,
    },
    maxSeats: {
      type: Number,
      required: [true, 'Max seats is required'],
      min: [1, 'Max seats must be at least 1'],
    },
    enrolledCount: {
      type: Number,
      default: 0,
      min: [0, 'Enrolled count cannot be negative'],
    },
    availableSeats: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'Bootcamp price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
    },
    mode: {
      type: String,
      enum: ['Online', 'Offline', 'Hybrid'],
      required: [true, 'Mode is required'],
      index: true,
    },
    skillsCovered: {
      type: [String],
      default: [],
      required: [true, 'Skills covered is required'],
    },
    mentorNames: {
      type: [String],
      default: [],
      required: [true, 'Mentor names is required'],
    },
    status: {
      type: String,
      enum: ['Draft', 'Open', 'Closed', 'Completed'],
      default: 'Draft',
      index: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    publishedAt: {
      type: Date,
      index: true,
    },
    duration: {
      type: Number,
      min: [0, 'Duration cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Create compound text index for search
bootcampSchema.index({ title: 'text', description: 'text' });

// Create compound index for common queries
bootcampSchema.index({ category: 1, mode: 1, status: 1, isActive: 1 });
bootcampSchema.index({ startDate: 1, endDate: 1 });
bootcampSchema.index({ status: 1, publishedAt: 1 });

// Pre-save hook to calculate duration and available seats
bootcampSchema.pre('save', function (next) {
  // Calculate duration in days
  if (this.startDate && this.endDate) {
    const durationMs = this.endDate.getTime() - this.startDate.getTime();
    this.duration = Math.round(durationMs / (1000 * 60 * 60 * 24)); // Convert to days
  }
  
  // Calculate available seats
  this.availableSeats = Math.max(0, this.maxSeats - this.enrolledCount);
  
  next();
});

// Method to check if bootcamp has started
bootcampSchema.methods.hasStarted = function (): boolean {
  return new Date() >= new Date(this.startDate);
};

// Method to check if bootcamp has ended
bootcampSchema.methods.hasEnded = function (): boolean {
  return new Date() > new Date(this.endDate);
};

// Method to check if bootcamp is full
bootcampSchema.methods.isFull = function (): boolean {
  return this.enrolledCount >= this.maxSeats;
};

// Method to check if registration is possible
bootcampSchema.methods.canRegister = function (): boolean {
  const now = new Date();
  
  // Can only register if status is Open
  if (this.status !== 'Open') {
    return false;
  }
  
  // Check registration deadline
  if (this.registrationDeadline && now > new Date(this.registrationDeadline)) {
    return false;
  }
  
  // Check if seats available
  if (this.isFull()) {
    return false;
  }
  
  // Check if bootcamp has started
  if (this.hasStarted()) {
    return false;
  }
  
  return true;
};

// Remove __v from JSON response
bootcampSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  
  // Add computed fields
  obj.canRegister = this.canRegister();
  obj.hasStarted = this.hasStarted();
  obj.hasEnded = this.hasEnded();
  obj.isFull = this.isFull();
  
  return obj;
};

export const Bootcamp = mongoose.model<IBootcamp>('Bootcamp', bootcampSchema);
