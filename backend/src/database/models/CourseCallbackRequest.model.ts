import mongoose, { Schema, Document } from 'mongoose';

export interface ICourseCallbackRequest extends Document {
  userId?: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  title: string; // Course title
  requestDate: Date;
  status: 'pending' | 'contacted' | 'completed' | 'cancelled';
  notes?: string;
  contactedAt?: Date;
  contactedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const courseCallbackRequestSchema = new Schema<ICourseCallbackRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
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
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },
    requestDate: {
      type: Date,
      default: Date.now,
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
courseCallbackRequestSchema.index({ courseId: 1, status: 1 });
courseCallbackRequestSchema.index(
  { userId: 1, courseId: 1 },
  { partialFilterExpression: { userId: { $exists: true } } }
);
courseCallbackRequestSchema.index({ email: 1, courseId: 1, status: 1 });

// Remove __v from JSON response
courseCallbackRequestSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const CourseCallbackRequest = mongoose.model<ICourseCallbackRequest>(
  'CourseCallbackRequest',
  courseCallbackRequestSchema
);
