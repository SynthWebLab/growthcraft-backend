import mongoose, { Schema, Document } from 'mongoose';

export interface ITrainingProgramCallbackRequest extends Document {
  userId?: mongoose.Types.ObjectId;
  programId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  title: string; // Program title
  requestDate: Date;
  status: 'pending' | 'contacted' | 'completed' | 'cancelled';
  notes?: string;
  contactedAt?: Date;
  contactedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const trainingProgramCallbackRequestSchema = new Schema<ITrainingProgramCallbackRequest>(
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
    requestDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    contactedAt: {
      type: Date,
    },
    contactedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying callback requests
trainingProgramCallbackRequestSchema.index({ programId: 1, status: 1 });
trainingProgramCallbackRequestSchema.index(
  { userId: 1, programId: 1 },
  { partialFilterExpression: { userId: { $exists: true } } }
);
trainingProgramCallbackRequestSchema.index({ email: 1, programId: 1, status: 1 });

// Remove __v from JSON response
trainingProgramCallbackRequestSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const TrainingProgramCallbackRequest = mongoose.model<ITrainingProgramCallbackRequest>(
  'TrainingProgramCallbackRequest',
  trainingProgramCallbackRequestSchema
);
