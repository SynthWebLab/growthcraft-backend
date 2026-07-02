import mongoose, { Schema, Document } from 'mongoose';

export interface IJobApplication extends Document {
  jobId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  status: 'Applied' | 'Shortlisted' | 'Interview' | 'Hired' | 'Rejected';
  resumeUrl: string;
  coverLetter?: string;
  appliedAt: Date;
  updatedAt: Date;
}

const jobApplicationSchema = new Schema<IJobApplication>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'JobPosting',
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['Applied', 'Shortlisted', 'Interview', 'Hired', 'Rejected'],
      default: 'Applied',
      required: true,
    },
    resumeUrl: {
      type: String,
      required: [true, 'Resume URL is required'],
      trim: true,
    },
    coverLetter: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'appliedAt', updatedAt: 'updatedAt' },
  }
);

// Compound index to ensure a student can only apply once per job posting
jobApplicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });

export const JobApplication = mongoose.model<IJobApplication>('JobApplication', jobApplicationSchema);
