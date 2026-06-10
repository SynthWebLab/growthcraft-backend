import mongoose, { Schema, Document } from 'mongoose';

export interface IProgressNote extends Document {
  studentUserId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  mentorId: mongoose.Types.ObjectId;
  noteDate: Date;
  rubricScore: number; // 0-100
  feedback: string;
  strengths?: string;
  areasForImprovement?: string;
  createdAt: Date;
  updatedAt: Date;
}

const progressNoteSchema = new Schema<IProgressNote>(
  {
    studentUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student user ID is required'],
      index: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: [true, 'Batch ID is required'],
      index: true,
    },
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Mentor ID is required'],
      index: true,
    },
    noteDate: {
      type: Date,
      required: [true, 'Note date is required'],
      default: Date.now,
      index: true,
    },
    rubricScore: {
      type: Number,
      required: [true, 'Rubric score is required'],
      min: [0, 'Rubric score cannot be negative'],
      max: [100, 'Rubric score cannot exceed 100'],
    },
    feedback: {
      type: String,
      required: [true, 'Feedback is required'],
      trim: true,
      minlength: [10, 'Feedback must be at least 10 characters'],
      maxlength: [2000, 'Feedback cannot exceed 2000 characters'],
    },
    strengths: {
      type: String,
      trim: true,
      maxlength: [1000, 'Strengths cannot exceed 1000 characters'],
    },
    areasForImprovement: {
      type: String,
      trim: true,
      maxlength: [1000, 'Areas for improvement cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
progressNoteSchema.index({ studentUserId: 1, batchId: 1 });
progressNoteSchema.index({ batchId: 1, noteDate: 1 });
progressNoteSchema.index({ mentorId: 1, batchId: 1 });

// Remove __v from JSON response
progressNoteSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const ProgressNote = mongoose.model<IProgressNote>('ProgressNote', progressNoteSchema);
