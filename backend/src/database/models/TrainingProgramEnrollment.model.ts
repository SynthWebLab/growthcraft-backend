import mongoose, { Schema, Document } from 'mongoose';

export interface ITrainingProgramEnrollment extends Document {
  userId?: mongoose.Types.ObjectId;
  programId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  title: string; // Program title
  enrollmentDate: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const trainingProgramEnrollmentSchema = new Schema<ITrainingProgramEnrollment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    programId: {
      type: Schema.Types.ObjectId,
      ref: 'TrainingProgram',
      required: [true, 'Program ID is required'],
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Program title is required'],
      trim: true,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes to prevent duplicate enrollments for logged-in and guest users
trainingProgramEnrollmentSchema.index(
  { userId: 1, programId: 1 },
  { unique: true, partialFilterExpression: { userId: { $exists: true } } }
);
trainingProgramEnrollmentSchema.index({ email: 1, programId: 1 }, { unique: true });

// Index for querying enrollments by program
trainingProgramEnrollmentSchema.index({ programId: 1, status: 1 });

// Remove __v from JSON response
trainingProgramEnrollmentSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

trainingProgramEnrollmentSchema.post('save', function (doc) {
  if (doc.status === 'pending' || doc.status === 'confirmed') {
    const { autoLinkBatchEnrollment } = require('@/common/utils/auto-enroll.util');
    void autoLinkBatchEnrollment(doc.userId, doc.email, doc.programId, 'TrainingProgram');
  }
});

export const TrainingProgramEnrollment = mongoose.model<ITrainingProgramEnrollment>(
  'TrainingProgramEnrollment',
  trainingProgramEnrollmentSchema
);
