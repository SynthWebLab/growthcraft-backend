import mongoose, { Schema, Document } from 'mongoose';

export interface ICourseConfig extends Document {
  key: string; // 'categories', 'difficultyLevels', 'courseTypes'
  values: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const courseConfigSchema = new Schema<ICourseConfig>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: ['categories', 'difficultyLevels', 'courseTypes'],
      index: true,
    },
    values: {
      type: [String],
      required: true,
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Remove __v from JSON response
courseConfigSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const CourseConfig = mongoose.model<ICourseConfig>('CourseConfig', courseConfigSchema);
