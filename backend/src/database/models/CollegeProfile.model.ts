import mongoose, { Schema, Document } from 'mongoose';

export const PARTNERSHIP_TIERS = ['Silver', 'Gold', 'Platinum'] as const;
export type PartnershipTier = (typeof PARTNERSHIP_TIERS)[number];

export interface ICollegeNotificationPreferences {
  studentEnrollments: boolean;
  programUpdates: boolean;
  reportsReady: boolean;
  marketingEmails: boolean;
}

export interface ICollegeProfile extends Document {
  userId: mongoose.Types.ObjectId;
  collegeName: string;
  collegeCode?: string;
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
  establishedYear?: number;
  accreditation?: string[];
  website?: string;
  totalStudents?: number;
  registeredStudents: mongoose.Types.ObjectId[];
  programs: {
    name: string;
    duration: number;
    description?: string;
  }[];
  partnershipTier: PartnershipTier;
  partnershipStartDate?: Date;
  spoc?: {
    name?: string;
    email?: string;
    phone?: string;
    designation?: string;
  };
  notificationPreferences: ICollegeNotificationPreferences;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const collegeProfileSchema = new Schema<ICollegeProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    collegeName: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
    },
    collegeCode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
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
    establishedYear: {
      type: Number,
    },
    accreditation: {
      type: [String],
      default: [],
    },
    website: {
      type: String,
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    registeredStudents: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    programs: {
      type: [
        {
          name: { type: String, required: true },
          duration: { type: Number, required: true },
          description: { type: String },
        },
      ],
      default: [],
    },
    partnershipTier: {
      type: String,
      enum: PARTNERSHIP_TIERS,
      default: 'Silver',
    },
    partnershipStartDate: {
      type: Date,
    },
    spoc: {
      name: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
      designation: { type: String, trim: true },
    },
    notificationPreferences: {
      studentEnrollments: { type: Boolean, default: true },
      programUpdates: { type: Boolean, default: true },
      reportsReady: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false },
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
collegeProfileSchema.index({ collegeName: 1 });

export const CollegeProfile = mongoose.model<ICollegeProfile>(
  'CollegeProfile',
  collegeProfileSchema
);
