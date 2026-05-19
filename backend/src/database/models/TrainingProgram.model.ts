import mongoose, { Schema, Document } from 'mongoose';

export type TrainingProgramCategory = string; // Dynamic from database (MERN, DataScience, DevOps, UI/UX, etc.)
export type TrainingProgramStatus = 'Draft' | 'Open' | 'Closed' | 'Completed';
export type TrainingProgramMode = 'Online' | 'Offline' | 'Hybrid';
export type TrainingProgramLevel = string; // Beginner, Intermediate, Advanced

export interface IMentor {
  name: string;
  avatar?: string;
  designation?: string;
}

export interface ITrainingProgram extends Document {
  title: string;
  slug: string;
  description: string;
  banner: string; // Banner image URL
  category: TrainingProgramCategory; // Domain (MERN, DataScience, etc.)
  
  // Dates
  startDate: Date;
  endDate: Date;
  registrationDeadline?: Date;
  
  // Duration (typically 40 days for internships)
  duration: number; // in days
  
  // Capacity
  maxSeats: number;
  enrolledCount: number;
  availableSeats: number; // Computed: maxSeats - enrolledCount
  
  // Pricing
  price: number;
  originalPrice?: number;
  isFeeOnRequest: boolean; // If true, show "Fee on Request" instead of price
  
  // Mode
  mode: TrainingProgramMode;
  
  // Level
  level: TrainingProgramLevel;
  
  // Skills and Tools
  toolsCovered: string[]; // Tools/technologies (max 4 for display)
  skillsCovered: string[]; // Skills taught
  
  // Mentors
  mentors: IMentor[]; // Array of mentor objects
  
  // Status
  status: TrainingProgramStatus;
  
  // Metadata
  rating: number;
  tags: string[];
  isActive: boolean;
  publishedAt?: Date;
  isDraft: boolean;
  
  // Internship-specific
  certificateOffered: boolean;
  placementAssistance: boolean;
  projectsCount: number; // Number of projects in the program
  
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual/computed methods
  canRegister(): boolean;
  hasStarted(): boolean;
  hasEnded(): boolean;
  isFull(): boolean;
  getStatus(): TrainingProgramStatus;
  getPrimaryCTA(): string;
  getSecondaryCTA(): string | null;
}

const mentorSchema = new Schema<IMentor>(
  {
    name: {
      type: String,
      required: [true, 'Mentor name is required'],
      trim: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const trainingProgramSchema = new Schema<ITrainingProgram>(
  {
    title: {
      type: String,
      required: [true, 'Training program title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: 'text',
    },
    slug: {
      type: String,
      required: [true, 'Training program slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Training program description is required'],
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
      required: [true, 'Training program category is required'],
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
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      default: 40, // Default 40 days for internships
      min: [1, 'Duration must be at least 1 day'],
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
      required: [true, 'Training program price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
    },
    isFeeOnRequest: {
      type: Boolean,
      default: false,
    },
    mode: {
      type: String,
      enum: ['Online', 'Offline', 'Hybrid'],
      required: [true, 'Mode is required'],
      index: true,
    },
    level: {
      type: String,
      required: [true, 'Level is required'],
      index: true,
    },
    toolsCovered: {
      type: [String],
      default: [],
      required: [true, 'Tools covered is required'],
      validate: {
        validator: function(v: string[]) {
          return v.length <= 10; // Max 10 tools, display first 4
        },
        message: 'Tools covered cannot exceed 10 items',
      },
    },
    skillsCovered: {
      type: [String],
      default: [],
      required: [true, 'Skills covered is required'],
    },
    mentors: {
      type: [mentorSchema],
      default: [],
      required: [true, 'At least one mentor is required'],
      validate: {
        validator: function(v: IMentor[]) {
          return v.length > 0;
        },
        message: 'At least one mentor is required',
      },
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
    isDraft: {
      type: Boolean,
      default: true,
      index: true,
    },
    certificateOffered: {
      type: Boolean,
      default: true,
    },
    placementAssistance: {
      type: Boolean,
      default: true,
    },
    projectsCount: {
      type: Number,
      default: 0,
      min: [0, 'Projects count cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Create compound text index for search
trainingProgramSchema.index({ title: 'text', description: 'text' });

// Create compound index for common queries
trainingProgramSchema.index({ category: 1, level: 1, mode: 1, status: 1, isActive: 1 });
trainingProgramSchema.index({ startDate: 1, endDate: 1 });
trainingProgramSchema.index({ status: 1, publishedAt: 1, isDraft: 1 });

// Pre-save hook to calculate available seats
trainingProgramSchema.pre('save', function (next) {
  this.availableSeats = Math.max(0, this.maxSeats - this.enrolledCount);
  next();
});

// Method to check if training program has started
trainingProgramSchema.methods.hasStarted = function (): boolean {
  return new Date() >= new Date(this.startDate);
};

// Method to check if training program has ended
trainingProgramSchema.methods.hasEnded = function (): boolean {
  return new Date() > new Date(this.endDate);
};

// Method to check if training program is full
trainingProgramSchema.methods.isFull = function (): boolean {
  return this.enrolledCount >= this.maxSeats;
};

// Method to dynamically compute status
trainingProgramSchema.methods.getStatus = function (): TrainingProgramStatus {
  const now = new Date();
  
  // If in draft mode
  if (this.isDraft) {
    return 'Draft';
  }
  
  // If not published yet or published in future
  if (this.publishedAt && now < new Date(this.publishedAt)) {
    return 'Draft';
  }
  
  // Check registration deadline
  if (this.registrationDeadline && now > new Date(this.registrationDeadline)) {
    return 'Closed';
  }
  
  // If program ended
  if (this.hasEnded()) {
    return 'Completed';
  }
  
  // If program started but not ended
  if (this.hasStarted() && !this.hasEnded()) {
    return 'Closed'; // No new registrations once started
  }
  
  // If full
  if (this.isFull()) {
    return 'Closed';
  }
  
  // Otherwise, it's open
  return 'Open';
};

// Method to check if registration is possible
trainingProgramSchema.methods.canRegister = function (): boolean {
  const now = new Date();
  const computedStatus = this.getStatus();
  
  // Can only register if status is Open
  if (computedStatus !== 'Open') {
    return false;
  }
  
  // Check if active
  if (!this.isActive) {
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
  
  // Check if program has started
  if (this.hasStarted()) {
    return false;
  }
  
  return true;
};

// Method to get Primary CTA based on dynamic status
trainingProgramSchema.methods.getPrimaryCTA = function (): string {
  const status = this.getStatus();
  const started = this.hasStarted();
  
  if (status === 'Draft') {
    return 'Register Interest';
  }
  
  if (started) {
    return 'Request Callback';
  }
  
  if (this.availableSeats > 0 && status === 'Open') {
    return 'Apply Now';
  }
  
  return 'Request Callback';
};

// Method to get Secondary CTA
trainingProgramSchema.methods.getSecondaryCTA = function (): string | null {
  const status = this.getStatus();
  const started = this.hasStarted();
  
  if (status === 'Draft' || started || this.isFull()) {
    return null;
  }
  
  if (status === 'Open' && this.availableSeats > 0) {
    return 'Request Callback';
  }
  
  return null;
};

// Remove __v from JSON response
trainingProgramSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  
  // Add computed fields
  obj.status = this.getStatus();
  obj.canRegister = this.canRegister();
  obj.hasStarted = this.hasStarted();
  obj.hasEnded = this.hasEnded();
  obj.isFull = this.isFull();
  obj.primaryCTA = this.getPrimaryCTA();
  obj.secondaryCTA = this.getSecondaryCTA();
  
  // Add display fields
  obj.durationBadge = `${this.duration} Days`;
  obj.displayTools = this.toolsCovered.slice(0, 4); // Max 4 for display
  
  return obj;
};

export const TrainingProgram = mongoose.model<ITrainingProgram>('TrainingProgram', trainingProgramSchema);
