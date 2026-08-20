import mongoose, { Schema, Document } from 'mongoose';

export enum ProgramLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}

export type ProgramStatus = 'active' | 'coming-soon' | 'draft';

export interface ITrainingProgram extends Document {
  slug: string;
  title: string;
  programName?: string;
  fullTitle?: string;
  description: string;
  domain: string;
  durationDays: number;
  tools: string[];
  price: number;
  originalPrice?: number;
  status: ProgramStatus;
  enrollmentCount: number;
  rating: number;
  level: ProgramLevel;
  thumbnail?: string;
  startDate?: Date;
  maxSeats?: number;
  enrolledCount?: number;
  isPublished: boolean;
  isFeatured?: boolean;
  prerequisites?: string[];
  careerOutcomes?: string[];
  mentors?: Array<{
    userId?: mongoose.Types.ObjectId;
    mentorProfileId?: mongoose.Types.ObjectId;
    name: string;
    avatar?: string;
    designation?: string;
    areaOfExpertise?: string;
    bio?: string;
  }>;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  getPrimaryCTA(): string;
  getSecondaryCTA(): string | null;
  canEnroll(): boolean;
}

const trainingProgramSchema = new Schema<ITrainingProgram>(
  {
    slug: {
      type: String,
      required: [true, 'Training program slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Training program title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: 'text',
    },
    programName: {
      type: String,
      trim: true,
    },
    fullTitle: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Program description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
      index: 'text',
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
    tools: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length > 0;
        },
        message: 'At least one tool/technology is required',
      },
    },
    prerequisites: {
      type: [String],
      default: [],
    },
    careerOutcomes: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'coming-soon', 'draft'],
        message: '{VALUE} is not a valid status',
      },
      default: 'draft',
      index: true,
    },
    enrollmentCount: {
      type: Number,
      default: 0,
      min: [0, 'Enrollment count cannot be negative'],
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
    },
    level: {
      type: String,
      required: [true, 'Level is required'],
      enum: {
        values: Object.values(ProgramLevel),
        message: '{VALUE} is not a valid level',
      },
      index: true,
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      index: true,
    },
    maxSeats: {
      type: Number,
      min: [0, 'Max seats cannot be negative'],
    },
    enrolledCount: {
      type: Number,
      default: 0,
      min: [0, 'Enrolled count cannot be negative'],
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
    mentors: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        mentorProfileId: { type: Schema.Types.ObjectId, ref: 'MentorProfile' },
        name: { type: String, required: true },
        avatar: { type: String },
        designation: { type: String },
        areaOfExpertise: { type: String },
        bio: { type: String },
      },
    ],
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound text index for search
trainingProgramSchema.index({ title: 'text', description: 'text' });

// Compound indexes for common queries
trainingProgramSchema.index({ isPublished: 1, status: 1 });
trainingProgramSchema.index({ domain: 1, level: 1, status: 1 });
trainingProgramSchema.index({ rating: -1, enrollmentCount: -1 });

// Methods for CTAs
trainingProgramSchema.methods.getPrimaryCTA = function (): string {
  switch (this.status) {
    case 'active':
      return 'Enroll Now';
    case 'coming-soon':
      return 'Register Interest';
    case 'draft':
    default:
      return 'Request Callback';
  }
};

trainingProgramSchema.methods.getSecondaryCTA = function (): string | null {
  switch (this.status) {
    case 'active':
      return 'Request Callback';
    case 'coming-soon':
    case 'draft':
    default:
      return null;
  }
};

trainingProgramSchema.methods.canEnroll = function (): boolean {
  return this.status === 'active';
};

// Remove __v from JSON response
trainingProgramSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  
  // Add computed fields
  obj.primaryCTA = this.getPrimaryCTA();
  obj.secondaryCTA = this.getSecondaryCTA();
  obj.canEnroll = this.canEnroll();
  
  return obj;
};

export const TrainingProgram = mongoose.model<ITrainingProgram>(
  'TrainingProgram',
  trainingProgramSchema
);
