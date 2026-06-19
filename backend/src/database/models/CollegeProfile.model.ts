import mongoose, { Schema, Document } from 'mongoose';

export const PARTNERSHIP_TIERS = ['Silver', 'Gold', 'Platinum'] as const;
export type PartnershipTier = (typeof PARTNERSHIP_TIERS)[number];

/**
 * Maximum number of students a college can hold in its cohort per partnership
 * tier (see the public /for-colleges page). `null` means unlimited (Platinum).
 */
export const COHORT_LIMITS: Record<PartnershipTier, number | null> = {
  Silver: 50,
  Gold: 150,
  Platinum: null,
};

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
  partnershipActive: boolean;
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
    // Whether the college has an active subscription. A college without one must
    // choose a plan before using cohort features (import/export students).
    // TESTING PHASE: defaults to `true` so every college (new and existing, via
    // Mongoose default-on-hydration) is auto-activated on Silver. Flip to `false`
    // once paid subscriptions go live to enforce the "choose a plan first" gate.
    partnershipActive: {
      type: Boolean,
      default: true,
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
