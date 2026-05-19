import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICourseFAQ extends Document {
  courseId: Types.ObjectId;
  question: string;
  answer: string;
  order: number; // Display order
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const courseFAQSchema = new Schema<ICourseFAQ>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    question: {
      type: String,
      required: [true, 'FAQ question is required'],
      trim: true,
      minlength: [5, 'Question must be at least 5 characters'],
      maxlength: [500, 'Question cannot exceed 500 characters'],
    },
    answer: {
      type: String,
      required: [true, 'FAQ answer is required'],
      trim: true,
      minlength: [10, 'Answer must be at least 10 characters'],
      maxlength: [2000, 'Answer cannot exceed 2000 characters'],
    },
    order: {
      type: Number,
      required: [true, 'FAQ order is required'],
      min: [1, 'FAQ order must be at least 1'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for efficient queries
courseFAQSchema.index({ courseId: 1, order: 1 });
courseFAQSchema.index({ courseId: 1, isActive: 1 });

// Remove __v from JSON response
courseFAQSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const CourseFAQ = mongoose.model<ICourseFAQ>('CourseFAQ', courseFAQSchema);
