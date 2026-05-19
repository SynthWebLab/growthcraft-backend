import mongoose, { Schema, Document } from 'mongoose';

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

export const CollegeProfile = mongoose.model<ICollegeProfile>('CollegeProfile', collegeProfileSchema);
