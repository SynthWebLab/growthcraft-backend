import mongoose, { Schema, Document } from 'mongoose';

export interface IJobPosting extends Document {
  hiringPartnerId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  requirements: string[];
  skillsRequired: string[];
  location: string;
  locationType: 'Onsite' | 'Remote' | 'Hybrid';
  salaryRange: {
    min?: number;
    max?: number;
  };
  jobType: 'Full-time' | 'Part-time' | 'Internship' | 'Contract';
  applicationDeadline?: Date;
  status: 'Draft' | 'Active' | 'Closed' | 'Filled';
  applicantsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const jobPostingSchema = new Schema<IJobPosting>(
  {
    hiringPartnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },
    requirements: {
      type: [String],
      default: [],
    },
    skillsRequired: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      required: [true, 'Job location is required'],
      trim: true,
    },
    locationType: {
      type: String,
      enum: ['Onsite', 'Remote', 'Hybrid'],
      required: true,
    },
    salaryRange: {
      min: { type: Number },
      max: { type: Number },
    },
    jobType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Internship', 'Contract'],
      required: true,
    },
    applicationDeadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Closed', 'Filled'],
      default: 'Draft',
    },
    applicantsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
jobPostingSchema.index({ hiringPartnerId: 1 });
jobPostingSchema.index({ status: 1 });
jobPostingSchema.index({ createdAt: -1 });
jobPostingSchema.index({ hiringPartnerId: 1, status: 1 });

export const JobPosting = mongoose.model<IJobPosting>('JobPosting', jobPostingSchema);
