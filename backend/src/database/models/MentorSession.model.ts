import mongoose, { Schema, Document } from 'mongoose';

export type MentorSessionStatus = 'scheduled' | 'completed' | 'cancelled';
export type MentorSessionType = '1:1' | 'Group';

export interface IMentorSession extends Document {
  studentUserId: mongoose.Types.ObjectId;
  mentorUserId: mongoose.Types.ObjectId;
  topic: string;
  scheduledDate: Date;
  timeSlot: string; // e.g. "10:00 AM"
  durationMinutes: number;
  sessionType: MentorSessionType;
  status: MentorSessionStatus;
  meetingLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

const mentorSessionSchema = new Schema<IMentorSession>(
  {
    studentUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student user ID is required'],
      index: true,
    },
    mentorUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Mentor user ID is required'],
      index: true,
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
      maxlength: [150, 'Topic cannot exceed 150 characters'],
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
      index: true,
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
      trim: true,
    },
    durationMinutes: {
      type: Number,
      default: 45,
      min: [15, 'Duration must be at least 15 minutes'],
      max: [240, 'Duration cannot exceed 240 minutes'],
    },
    sessionType: {
      type: String,
      enum: ['1:1', 'Group'],
      default: '1:1',
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    meetingLink: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent the same student double-booking the same mentor at the same date+slot.
mentorSessionSchema.index(
  { studentUserId: 1, mentorUserId: 1, scheduledDate: 1, timeSlot: 1 },
  { unique: true }
);
mentorSessionSchema.index({ studentUserId: 1, scheduledDate: 1 });

mentorSessionSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const MentorSession = mongoose.model<IMentorSession>('MentorSession', mentorSessionSchema);
