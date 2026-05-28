import mongoose, { Schema, Document } from 'mongoose';

export interface ICourseModule extends Document {
  courseId: mongoose.Types.ObjectId;
  order: number;
  title: string;
  durationHours: number;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const courseModuleSchema = new Schema<ICourseModule>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
      index: true,
    },
    order: {
      type: Number,
      required: [true, 'Module order is required'],
      min: [1, 'Module order must be at least 1'],
    },
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
      minlength: [3, 'Module title must be at least 3 characters'],
      maxlength: [200, 'Module title cannot exceed 200 characters'],
    },
    durationHours: {
      type: Number,
      required: [true, 'Module duration is required'],
      min: [0, 'Module duration cannot be negative'],
    },
    summary: {
      type: String,
      trim: true,
      maxlength: [1000, 'Module summary cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

courseModuleSchema.index({ courseId: 1, order: 1 }, { unique: true });

courseModuleSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const CourseModule = mongoose.model<ICourseModule>(
  'CourseModule',
  courseModuleSchema
);
