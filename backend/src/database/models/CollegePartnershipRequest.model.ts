import mongoose, { Schema, Document } from 'mongoose';
import { PARTNERSHIP_TIERS, PartnershipTier } from './CollegeProfile.model';

export type PartnershipRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ICollegePartnershipRequest extends Document {
  userId: mongoose.Types.ObjectId;
  currentTier: PartnershipTier;
  requestedTier: PartnershipTier;
  note?: string;
  status: PartnershipRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const collegePartnershipRequestSchema = new Schema<ICollegePartnershipRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    currentTier: {
      type: String,
      enum: PARTNERSHIP_TIERS,
      required: true,
    },
    requestedTier: {
      type: String,
      enum: PARTNERSHIP_TIERS,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [1000, 'Note cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

collegePartnershipRequestSchema.index({ userId: 1, createdAt: -1 });

collegePartnershipRequestSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const CollegePartnershipRequest = mongoose.model<ICollegePartnershipRequest>(
  'CollegePartnershipRequest',
  collegePartnershipRequestSchema
);
