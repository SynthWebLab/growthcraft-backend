import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployerProfile extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  contactPerson: {
    name: string;
    email: string;
    phone: string;
  };
  industry: string;
  companySize: string;
  website?: string;
  hiringNeeds?: string;
  jobsPosted: mongoose.Types.ObjectId[];
  totalHires: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const employerProfileSchema = new Schema<IEmployerProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    contactPerson: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      enum: ['IT/Software', 'Fintech', 'E-Commerce', 'Healthcare', 'EdTech', 'Startup', 'Other'],
    },
    companySize: {
      type: String,
      required: [true, 'Company size is required'],
      enum: ['1-50', '51-200', '201-500', '500+'],
    },
    website: {
      type: String,
    },
    hiringNeeds: {
      type: String,
      maxlength: [1000, 'Hiring needs cannot exceed 1000 characters'],
    },
    jobsPosted: {
      type: [Schema.Types.ObjectId],
      ref: 'JobPosting',
      default: [],
    },
    totalHires: {
      type: Number,
      default: 0,
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

// Index for faster queries (userId index already created by unique: true)
employerProfileSchema.index({ companyName: 1 });
employerProfileSchema.index({ industry: 1 });

export const EmployerProfile = mongoose.model<IEmployerProfile>(
  'EmployerProfile',
  employerProfileSchema
);
