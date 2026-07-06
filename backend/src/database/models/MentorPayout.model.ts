import mongoose, { Schema, Document } from 'mongoose';

export interface IMentorPayout extends Document {
  mentorId: mongoose.Types.ObjectId;
  amount: number;
  period: string; // e.g. "June 2026"
  hoursForPeriod: number;
  hourlyRate: number; // snapshot at time of payout
  batchIds: mongoose.Types.ObjectId[]; // which batches this payout covers
  status: 'processed' | 'disputed';
  processedBy: mongoose.Types.ObjectId;
  notes?: string;
  processedAt: Date;
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
      required: [true, 'Hours for period is required'],
      min: [0, 'Hours cannot be negative'],
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate snapshot is required'],
      min: [0, 'Hourly rate cannot be negative'],
    },
    batchIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Batch',
      default: [],
      index: true,
    },
    status: {
      type: String,
      enum: ['processed', 'disputed'],
      default: 'processed',
      index: true,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Processed by admin ID is required'],
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
mentorPayoutSchema.index({ mentorId: 1, period: 1 }, { unique: true });

// Remove __v from JSON response
mentorPayoutSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const MentorPayout = mongoose.model<IMentorPayout>('MentorPayout', mentorPayoutSchema);
