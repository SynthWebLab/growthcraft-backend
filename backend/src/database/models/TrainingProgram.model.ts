import mongoose, { Schema, Document } from 'mongoose';

export interface ITrainingProgram extends Document {
  slug: string;
  title: string;
  domain: string;
  durationDays: number;
  focusAreas: string[];
  toolsTech: string[];
  isPublished: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const trainingProgramSchema = new Schema<ITrainingProgram>(
  {
    slug: {
      type: String,
      required: [true, 'Training program slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Training program title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    domain: {
      type: String,
      required: [true, 'Domain is required'],
      trim: true,
    },
    durationDays: {
      type: Number,
      required: [true, 'Duration in days is required'],
      min: [1, 'Duration must be at least 1 day'],
    },
    focusAreas: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length > 0;
        },
        message: 'At least one focus area is required',
      },
    },
    toolsTech: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length > 0;
        },
        message: 'At least one tool/technology is required',
      },
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Remove __v from JSON response
trainingProgramSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const TrainingProgram = mongoose.model<ITrainingProgram>(
  'TrainingProgram',
  trainingProgramSchema
);
