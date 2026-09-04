import mongoose, { Schema, Document } from 'mongoose';

export interface IMentorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  experienceYears: number;
  areaOfExpertise: string;
  currentOrganization: string;
  bio: string;
  avatar?: string;
  // Additional fields for later use
  hourlyRate?: number;
  availability: {
    day: string;
    slots: { startTime: string; endTime: string }[];
  }[];
  specializations?: string[];
  linkedinUrl?: string;
  portfolioUrl?: string;
  availabilityCalendar?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }[];
  totalHoursMentored?: number;
  totalPayouts?: number;
  pendingPayout?: number;
  rating: number;
  totalSessions: number;
  coursesCreated: mongoose.Types.ObjectId[];
  linkedIn?: string;
  website?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const mentorProfileSchema = new Schema<IMentorProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    experienceYears: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Experience cannot be negative'],
    },
    areaOfExpertise: {
      type: String,
      required: [true, 'Area of expertise is required'],
      enum: [
        'Web Development',
        'Data Science & AI',
        'Mobile Development',
        'DevOps & Cloud',
        'UI/UX Design',
        'Cybersecurity',
        'Other',
      ],
    },
    currentOrganization: {
      type: String,
      required: [true, 'Current organization is required'],
      trim: true,
    },
    bio: {
      type: String,
      required: [true, 'Bio is required'],
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    },
    avatar: {
      type: String,
      default: '',
      trim: true,
    },
    hourlyRate: {
      type: Number,
      min: [0, 'Hourly rate cannot be negative'],
    },
    availability: {
      type: [
        {
          day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          },
          slots: [
            {
              startTime: { type: String, required: true },
              endTime: { type: String, required: true },
            },
          ],
        },
      ],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalSessions: {
      type: Number,
      default: 0,
    },
    coursesCreated: {
      type: [Schema.Types.ObjectId],
      ref: 'Course',
      default: [],
    },
    linkedIn: {
      type: String,
    },
    website: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    specializations: {
      type: [String],
      default: [],
    },
    linkedinUrl: {
      type: String,
    },
    portfolioUrl: {
      type: String,
    },
    availabilityCalendar: {
      type: [
        {
          dayOfWeek: { type: Number, min: 0, max: 6 },
          startTime: { type: String, required: true },
          endTime: { type: String, required: true },
          isAvailable: { type: Boolean, default: true },
        },
      ],
      default: [],
    },
    totalHoursMentored: {
      type: Number,
      default: 0,
    },
    totalPayouts: {
      type: Number,
      default: 0,
    },
    pendingPayout: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries (userId index already created by unique: true)
mentorProfileSchema.index({ areaOfExpertise: 1 });
mentorProfileSchema.index({ rating: -1 });

export const MentorProfile = mongoose.model<IMentorProfile>('MentorProfile', mentorProfileSchema);
