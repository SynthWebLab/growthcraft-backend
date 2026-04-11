import mongoose, { Schema, Document } from 'mongoose';

export interface IMentorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  expertise: string[];
  bio?: string;
  experience: number; // years of experience
  company?: string;
  designation?: string;
  hourlyRate?: number;
  availability: {
    day: string;
    slots: { startTime: string; endTime: string }[];
  }[];
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
    expertise: {
      type: [String],
      required: [true, 'At least one area of expertise is required'],
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    experience: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Experience cannot be negative'],
    },
    company: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
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
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
mentorProfileSchema.index({ userId: 1 });
mentorProfileSchema.index({ expertise: 1 });
mentorProfileSchema.index({ rating: -1 });

export const MentorProfile = mongoose.model<IMentorProfile>('MentorProfile', mentorProfileSchema);
