import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILesson {
  title: string;
  duration: number; // in minutes
  isFree: boolean; // Whether lesson is available for preview
  videoUrl?: string;
  order: number;
}

export interface ICourseModule extends Document {
  courseId: Types.ObjectId;
  title: string;
  description?: string;
  order: number; // Module order in the course
  lessons: ILesson[];
  totalDuration: number; // Total duration of all lessons in minutes (computed)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>(
  {
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      minlength: [3, 'Lesson title must be at least 3 characters'],
      maxlength: [200, 'Lesson title cannot exceed 200 characters'],
    },
    duration: {
      type: Number,
      required: [true, 'Lesson duration is required'],
      min: [1, 'Lesson duration must be at least 1 minute'],
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    videoUrl: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      required: [true, 'Lesson order is required'],
      min: [1, 'Lesson order must be at least 1'],
    },
  },
  { _id: false }
);

const courseModuleSchema = new Schema<ICourseModule>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
      minlength: [3, 'Module title must be at least 3 characters'],
      maxlength: [200, 'Module title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Module description cannot exceed 1000 characters'],
    },
    order: {
      type: Number,
      required: [true, 'Module order is required'],
      min: [1, 'Module order must be at least 1'],
    },
    lessons: {
      type: [lessonSchema],
      default: [],
    },
    totalDuration: {
      type: Number,
      default: 0,
      min: [0, 'Total duration cannot be negative'],
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
courseModuleSchema.index({ courseId: 1, order: 1 });
courseModuleSchema.index({ courseId: 1, isActive: 1 });

// Pre-save hook to calculate total duration
courseModuleSchema.pre('save', function (next) {
  if (this.lessons && this.lessons.length > 0) {
    this.totalDuration = this.lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
  } else {
    this.totalDuration = 0;
  }
  next();
});

// Remove __v from JSON response
courseModuleSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const CourseModule = mongoose.model<ICourseModule>('CourseModule', courseModuleSchema);
