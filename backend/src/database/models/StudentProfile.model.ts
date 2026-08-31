import mongoose, { Schema, Document } from 'mongoose';

export interface IStudentProfile extends Document {
  userId: mongoose.Types.ObjectId;
  enrollmentNumber?: string;
  collegeName?: string;
  degree?: string;
  branch?: string;
  yearOfStudy?: number;
  graduationYear?: number;
  skills: string[];
  interests: string[];
  enrolledCourses: mongoose.Types.ObjectId[];
  completedCourses: mongoose.Types.ObjectId[];
  certifications: {
    name: string;
    issuedBy: string;
    issuedDate: Date;
    certificateUrl?: string;
  }[];
  resume?: string;
  portfolio?: string;
  linkedIn?: string;
  github?: string;
  isAmbassador?: boolean;
  referralCode?: string;
  ambassadorActivatedBy?: 'self' | 'college' | 'admin';
  ambassadorActivatedAt?: Date;
  totalReferrals: number;
  totalConversions: number;
  referralEarnings: number;
  pendingReferralPayout: number;
  createdAt: Date;
  updatedAt: Date;
}

const studentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    enrollmentNumber: {
      type: String,
      trim: true,
    },
    collegeName: {
      type: String,
      trim: true,
    },
    degree: {
      type: String,
      trim: true,
    },
    branch: {
      type: String,
      trim: true,
    },
    yearOfStudy: {
      type: Number,
      min: 1,
      max: 6,
    },
    graduationYear: {
      type: Number,
    },
    skills: {
      type: [String],
      default: [],
    },
    interests: {
      type: [String],
      default: [],
    },
    enrolledCourses: {
      type: [Schema.Types.ObjectId],
      ref: 'Course',
      default: [],
    },
    completedCourses: {
      type: [Schema.Types.ObjectId],
      ref: 'Course',
      default: [],
    },
    certifications: {
      type: [
        {
          name: { type: String, required: true },
          issuedBy: { type: String, required: true },
          issuedDate: { type: Date, required: true },
          certificateUrl: { type: String },
        },
      ],
      default: [],
    },
    resume: {
      type: String,
    },
    portfolio: {
      type: String,
    },
    linkedIn: {
      type: String,
    },
    github: {
      type: String,
    },
    isAmbassador: {
      type: Boolean,
      default: false,
      index: true,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    ambassadorActivatedBy: {
      type: String,
      enum: ['self', 'college', 'admin'],
    },
    ambassadorActivatedAt: {
      type: Date,
    },
    totalReferrals: {
      type: Number,
      default: 0,
    },
    totalConversions: {
      type: Number,
      default: 0,
    },
    referralEarnings: {
      type: Number,
      default: 0,
    },
    pendingReferralPayout: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index already created by unique: true on userId field
studentProfileSchema.index({ collegeName: 1, yearOfStudy: 1 });
studentProfileSchema.index({ isAmbassador: 1, totalConversions: -1 });

export const StudentProfile = mongoose.model<IStudentProfile>('StudentProfile', studentProfileSchema);
