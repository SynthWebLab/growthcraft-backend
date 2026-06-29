import mongoose, { Schema, Document } from 'mongoose';

export type ReferralStatus = 'pending' | 'joined' | 'completed';
export type ReferralPayoutStatus = 'unpaid' | 'paid';

export interface IReferral extends Document {
  referrerId: mongoose.Types.ObjectId;
  referredEmail: string;
  referredUserId?: mongoose.Types.ObjectId;
  referredItemType: 'Course' | 'TrainingProgram' | 'Bootcamp';
  referredItemId: mongoose.Types.ObjectId;
  status: ReferralStatus;
  commissionEarned: number;
  payoutStatus: ReferralPayoutStatus;
  createdAt: Date;
  updatedAt: Date;
}

const referralSchema = new Schema<IReferral>(
  {
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Referrer ID is required'],
      index: true,
    },
    referredEmail: {
      type: String,
      required: [true, 'Referred email is required'],
      trim: true,
      lowercase: true,
    },
    referredUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    referredItemType: {
      type: String,
      required: true,
      enum: ['Course', 'TrainingProgram', 'Bootcamp'],
    },
    referredItemId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'joined', 'completed'],
      default: 'pending',
      index: true,
    },
    commissionEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    payoutStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
referralSchema.index({ referrerId: 1, referredEmail: 1, referredItemId: 1 }, { unique: true });
referralSchema.index({ referredEmail: 1, status: 1 });

export const Referral = mongoose.model<IReferral>('Referral', referralSchema);
