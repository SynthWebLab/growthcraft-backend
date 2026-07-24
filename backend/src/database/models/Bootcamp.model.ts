import mongoose, { Schema, Document } from 'mongoose';

export type BootcampCategory = string; // Dynamic from database (MERN, DataScience, DevOps, UI/UX, etc.)
export type BootcampStatus = 'Draft' | 'Open' | 'Closed' | 'Completed';
export type BootcampMode = 'Online' | 'Offline' | 'Hybrid';

export interface IBootcampCTA {
  status: BootcampStatus;
  condition: string;
  seatsAvailable: boolean;
  primaryCTA: string;
  secondaryCTA: string | null;
  disabled: boolean;
  codeLocation: string;
}

// GC-S401-T1: Event types (Bootcamp is a type of event)
export enum EventType {
  WORKSHOP = 'Workshop',
  BOOTCAMP = 'Bootcamp',
  HACKATHON = 'Hackathon',
}

export interface IBootcampMentor {
  userId?: mongoose.Types.ObjectId | string;
  mentorProfileId?: mongoose.Types.ObjectId | string;
  name: string;
  avatar?: string;
  designation?: string;
  areaOfExpertise?: string;
  bio?: string;
}

export interface IBootcamp extends Document {
  // GC-S401-T1: Core Event fields
  slug: string; // @unique
  title: string;
  type: EventType; // Workshop, Bootcamp, or Hackathon
  domain: string; // Domain/field of the event
  durationDays: number; // Duration in days
  keyTopics: string[]; // Key topics covered
  isPublished: boolean; // Publication status
  isFeatured: boolean; // Featured/Trending status
  mentors: IBootcampMentor[]; // Array of assigned real mentors
  deletedAt?: Date; // Soft delete
  
  // Legacy/additional fields
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
  duration: number; // in days (computed from start/end date, same as durationDays)
  
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual/computed methods
  canRegister(): boolean;
  hasStarted(): boolean;
  hasEnded(): boolean;
  isFull(): boolean;
  getAvailableSeats(): number;
  getCTAState(): IBootcampCTA;
  getPrimaryCTA(): string;
  getSecondaryCTA(): string | null;
}

const bootcampSchema = new Schema<IBootcamp>(
  {
    // GC-S401-T1: Core Event fields
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: 'text',
    },
    type: {
      type: String,
      required: [true, 'Event type is required'],
      enum: {
        values: Object.values(EventType),
        message: '{VALUE} is not a valid event type',
      },
      default: EventType.BOOTCAMP,
      index: true,
    },
    domain: {
      type: String,
      required: [true, 'Domain is required'],
      trim: true,
      index: true,
    },
    durationDays: {
      type: Number,
      required: [true, 'Duration in days is required'],
      min: [1, 'Duration must be at least 1 day'],
    },
    keyTopics: {
      type: [String],
      default: [],
      required: [true, 'Key topics are required'],
      validate: {
        validator: function (v: string[]) {
          return v.length > 0;
        },
        message: 'At least one key topic is required',
      },
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    
    // Legacy/additional fields
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      index: 'text',
    },
    banner: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      index: true,
    },
    startDate: {
      type: Date,
      index: true,
    },
    endDate: {
      type: Date,
      index: true,
    },
    registrationDeadline: {
      type: Date,
      index: true,
    },
    maxSeats: {
      type: Number,
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
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
    },
    mode: {
      type: String,
      enum: ['Online', 'Offline', 'Hybrid'],
      index: true,
    },
    skillsCovered: {
      type: [String],
      default: [],
    },
    mentorNames: {
      type: [String],
      default: [],
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    mentors: {
      type: [
        {
          userId: { type: Schema.Types.ObjectId, ref: 'User' },
          mentorProfileId: { type: Schema.Types.ObjectId, ref: 'MentorProfile' },
          name: { type: String, required: true },
          avatar: { type: String, default: '' },
          designation: { type: String, default: '' },
          areaOfExpertise: { type: String, default: '' },
          bio: { type: String, default: '' },
        },
      ],
      default: [],
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

// GC-S401-T1: Compound index for (isPublished, type)
bootcampSchema.index({ isPublished: 1, type: 1 });

// Additional compound indexes for common queries
bootcampSchema.index({ category: 1, mode: 1, status: 1, isActive: 1 });
bootcampSchema.index({ startDate: 1, endDate: 1 });
bootcampSchema.index({ status: 1, publishedAt: 1 });

// Pre-save hook to calculate duration and available seats
bootcampSchema.pre('save', function (next) {
  // Calculate duration in days (sync durationDays with duration)
  if (this.startDate && this.endDate) {
    const durationMs = this.endDate.getTime() - this.startDate.getTime();
    const calculatedDays = Math.round(durationMs / (1000 * 60 * 60 * 24));
    this.duration = calculatedDays;
    
    // If durationDays not set, use calculated value
    if (!this.durationDays) {
      this.durationDays = calculatedDays;
    }
  }
  
  // Calculate available seats
  if (this.maxSeats) {
    this.availableSeats = Math.max(0, this.maxSeats - this.enrolledCount);
  }
  
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

// Method to get current available seats from capacity and enrollment
bootcampSchema.methods.getAvailableSeats = function (): number {
  return Math.max(0, (this.maxSeats || 0) - (this.enrolledCount || 0));
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

// Method to get primary CTA from the current bootcamp state
bootcampSchema.methods.getCTAState = function (): IBootcampCTA {
  const seatsAvailable = this.getAvailableSeats() > 0;

  switch (this.status) {
    case 'Open':
      if (this.hasStarted()) {
        return {
          status: this.status,
          condition: 'hasStarted === true',
          seatsAvailable,
          primaryCTA: 'Request Callback',
          secondaryCTA: null,
          disabled: false,
          codeLocation: 'if (hasStarted)',
        };
      }

      if (seatsAvailable) {
        return {
          status: this.status,
          condition: 'seatsAvailable === true',
          seatsAvailable,
          primaryCTA: 'Reserve Seat',
          secondaryCTA: 'Request Callback',
          disabled: false,
          codeLocation: 'if (seatsAvailable)',
        };
      }

      return {
        status: this.status,
        condition: 'seatsAvailable === false',
        seatsAvailable,
        primaryCTA: 'Request Callback',
        secondaryCTA: null,
        disabled: false,
        codeLocation: 'else after seatsAvailable',
      };
    case 'Closed':
      return {
        status: this.status,
        condition: '-',
        seatsAvailable,
        primaryCTA: 'Request Callback',
        secondaryCTA: null,
        disabled: false,
        codeLocation: 'case "Closed"',
      };
    case 'Completed':
      return {
        status: this.status,
        condition: '-',
        seatsAvailable,
        primaryCTA: 'Completed',
        secondaryCTA: null,
        disabled: true,
        codeLocation: 'case "Completed"',
      };
    case 'Draft':
    default:
      return {
        status: this.status,
        condition: '-',
        seatsAvailable,
        primaryCTA: 'Register Interest',
        secondaryCTA: null,
        disabled: false,
        codeLocation: 'case "Draft"',
      };
  }
};

// Method to get primary CTA from the current bootcamp state
bootcampSchema.methods.getPrimaryCTA = function (): string {
  return this.getCTAState().primaryCTA;
};

// Method to get secondary CTA from the current bootcamp state
bootcampSchema.methods.getSecondaryCTA = function (): string | null {
  return this.getCTAState().secondaryCTA;
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
  obj.availableSeats = this.getAvailableSeats();
  obj.primaryCTA = this.getPrimaryCTA();
  obj.secondaryCTA = this.getSecondaryCTA();
  obj.cta = this.getCTAState();
  
  return obj;
};

export const Bootcamp = mongoose.model<IBootcamp>('Bootcamp', bootcampSchema);
