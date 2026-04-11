import mongoose, { Schema, Document } from 'mongoose';

export interface IHiringPartnerProfile extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  companySize?: string;
  industry?: string;
  website?: string;
  description?: string;
  address: {
    street?: string;
    city: string;
    state: string;
    country: string;
    pincode?: string;
  };
  contactPerson: {
    name: string;
    designation: string;
    email: string;
    phone: string;
  };
  jobsPosted: mongoose.Types.ObjectId[];
  totalHires: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const hiringPartnerProfileSchema = new Schema<IHiringPartnerProfile>(
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
    companySize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
    },
    industry: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    address: {
      street: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      pincode: { type: String },
    },
    contactPerson: {
      name: { type: String, required: true },
      designation: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    jobsPosted: {
      type: [Schema.Types.ObjectId],
      ref: 'Job',
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

// Index for faster queries
hiringPartnerProfileSchema.index({ userId: 1 });
hiringPartnerProfileSchema.index({ companyName: 1 });

export const HiringPartnerProfile = mongoose.model<IHiringPartnerProfile>(
  'HiringPartnerProfile',
  hiringPartnerProfileSchema
);
