import mongoose, { Schema, Document } from 'mongoose';

export type ReferralStatus = 'sent' | 'registered' | 'enrolled' | 'expired';
export type ReferralPayoutStatus = 'unpaid' | 'paid'; // Keep for backward compatibility or status

export interface IReferral extends Document {
  ambassadorUserId: mongoose.Types.ObjectId;
  referralCode: string;
  referredEmail: string;
  referredUserId?: mongoose.Types.ObjectId | null;
  enrollmentId?: mongoose.Types.ObjectId | null;
  enrollmentType?: 'course' | 'event' | 'training-program' | null;
  status: ReferralStatus;
  commissionAmount: number;
  commissionPaid: boolean;
  inviteLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

const referralSchema = new Schema<IReferral>(
  {
    ambassadorUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Ambassador user ID is required'],
      index: true,
    },
    referralCode: {
      type: String,
      required: [true, 'Referral code is required'],
      index: true,
    },
    referredEmail: {
      type: String,
      required: [true, 'Referred email is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    referredUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      default: null,
    },
    enrollmentType: {
      type: String,
      enum: ['course', 'event', 'training-program', null],
      default: null,
    },
    status: {
      type: String,
      enum: ['sent', 'registered', 'enrolled', 'expired'],
      default: 'sent',
      index: true,
    },
    commissionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commissionPaid: {
      type: Boolean,
      default: false,
    },
    inviteLink: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimization
referralSchema.index({ ambassadorUserId: 1, referredEmail: 1 }, { unique: true });
referralSchema.index({ ambassadorUserId: 1, status: 1 });
referralSchema.index({ ambassadorUserId: 1, createdAt: -1 });
referralSchema.index({ referredEmail: 1, status: 1 });
referralSchema.index({ referredUserId: 1, status: 1 });

export const Referral = mongoose.model<IReferral>('Referral', referralSchema);
