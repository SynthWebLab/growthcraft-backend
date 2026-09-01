import mongoose, { Schema, Document } from 'mongoose';

export type MentorCheckInStatus = 'checked-in' | 'checked-out' | 'missed';

export interface IMentorCheckIn extends Document {
  mentorId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  sessionDate: Date;
  checkInTime: Date;
  checkOutTime: Date | null;
  hoursWorked: number;
  status: MentorCheckInStatus;
  notes?: string;
  verifiedBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const mentorCheckInSchema = new Schema<IMentorCheckIn>(
  {
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Mentor ID is required'],
      index: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: [true, 'Batch ID is required'],
      index: true,
    },
    sessionDate: {
      type: Date,
      required: [true, 'Session date is required'],
      index: true,
    },
    checkInTime: {
      type: Date,
      required: [true, 'Check-in time is required'],
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    hoursWorked: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['checked-in', 'checked-out', 'missed'],
      default: 'checked-in',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
mentorCheckInSchema.index({ mentorId: 1, batchId: 1 });
mentorCheckInSchema.index({ mentorId: 1, sessionDate: -1 });
mentorCheckInSchema.index({ batchId: 1, sessionDate: -1 });
mentorCheckInSchema.index({ mentorId: 1, batchId: 1, status: 1 });
mentorCheckInSchema.index({ status: 1, sessionDate: -1 });

export const MentorCheckIn = mongoose.model<IMentorCheckIn>('MentorCheckIn', mentorCheckInSchema);
