import mongoose, { Schema, Document } from 'mongoose';

export interface IMentorPayout extends Document {
  mentorId: mongoose.Types.ObjectId;
  amount: number;
  period: string; // e.g. "June 2026"
  hoursForPeriod: number;
  hourlyRate: number; // snapshot at time of payout
  batchIds: mongoose.Types.ObjectId[]; // which batches this payout covers
  status: 'pending' | 'processing' | 'processed' | 'disputed' | 'failed';
  processedBy?: mongoose.Types.ObjectId;
  notes?: string;
  processedAt?: Date;
  // Razorpay payout fields
  razorpayLinkId?: string;    // Payment Link ID (rzplink_xxx)
  razorpayLinkUrl?: string;   // Short URL for admin to open & pay
  razorpayPaymentId?: string; // Confirmed Razorpay payment ID after admin confirms
  createdAt: Date;
  updatedAt: Date;
}

const mentorPayoutSchema = new Schema<IMentorPayout>(
  {
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Mentor ID is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payout amount is required'],
      min: [0, 'Payout amount cannot be negative'],
    },
    period: {
      type: String,
      required: [true, 'Payout period is required'],
      trim: true,
      index: true,
    },
    hoursForPeriod: {
      type: Number,
      default: 0,
      min: [0, 'Hours cannot be negative'],
    },
    hourlyRate: {
      type: Number,
      default: 0,
      min: [0, 'Hourly rate cannot be negative'],
    },
    batchIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Batch',
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'processed', 'disputed', 'failed'],
      default: 'pending',
      index: true,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
    },
    processedAt: {
      type: Date,
    },
    razorpayLinkId: {
      type: String,
      trim: true,
    },
    razorpayLinkUrl: {
      type: String,
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

mentorPayoutSchema.index({ mentorId: 1, createdAt: -1 });

mentorPayoutSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const MentorPayout = mongoose.model<IMentorPayout>('MentorPayout', mentorPayoutSchema);
