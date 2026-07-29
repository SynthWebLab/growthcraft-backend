import mongoose, { Schema, Document } from 'mongoose';

export interface ICourseEnrollment extends Document {
  userId?: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  title: string; // Course title
  enrollmentDate: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const courseEnrollmentSchema = new Schema<ICourseEnrollment>(
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
    enrollmentDate: {
      type: Date,
      default: Date.now,
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
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes to prevent duplicate enrollments for logged-in and guest users.
courseEnrollmentSchema.index(
  { userId: 1, courseId: 1 },
  { unique: true, partialFilterExpression: { userId: { $exists: true } } }
);
courseEnrollmentSchema.index({ email: 1, courseId: 1 }, { unique: true });

// Index for querying enrollments by course
courseEnrollmentSchema.index({ courseId: 1, status: 1 });

// Remove __v from JSON response
courseEnrollmentSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

courseEnrollmentSchema.post('save', function (doc) {
  if (doc.status === 'pending' || doc.status === 'confirmed') {
    const { autoLinkBatchEnrollment } = require('@/common/utils/auto-enroll.util');
    void autoLinkBatchEnrollment(doc.userId, doc.email, doc.courseId, 'Course');
  }
});

export const CourseEnrollment = mongoose.model<ICourseEnrollment>(
  'CourseEnrollment',
  courseEnrollmentSchema
);
