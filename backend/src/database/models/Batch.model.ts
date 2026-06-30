import mongoose, { Schema, Document } from 'mongoose';

export enum BatchType {
  COURSE = 'Course',
  TRAINING_PROGRAM = 'TrainingProgram',
  BOOTCAMP = 'Bootcamp',
}

export enum BatchMode {
  ONLINE = 'Online',
  OFFLINE = 'Offline',
  HYBRID = 'Hybrid',
}

export enum BatchStatus {
  DRAFT = 'Draft',
  OPEN = 'Open',
  FILLING = 'Filling',
  FULL = 'Full',
  IN_PROGRESS = 'InProgress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export interface IBatch extends Document {
  batchType: BatchType;
  courseId?: mongoose.Types.ObjectId;
  trainingProgramId?: mongoose.Types.ObjectId;
  bootcampId?: mongoose.Types.ObjectId;
  code: string;
  startDate: Date;
  endDate: Date;
  venue?: string;
  mode: BatchMode;
  capacity: number;
  enrolledCount: number;
  status: BatchStatus;
  assignedMentorId?: mongoose.Types.ObjectId;
  assignedMentorIds?: mongoose.Types.ObjectId[];
  fee: mongoose.Types.Decimal128;
  createdAt: Date;
  updatedAt: Date;
}

const batchSchema = new Schema<IBatch>(
  {
    batchType: {
      type: String,
      required: [true, 'Batch type is required'],
      enum: {
        values: Object.values(BatchType),
        message: '{VALUE} is not a valid batch type',
      },
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      index: true,
    },
    trainingProgramId: {
      type: Schema.Types.ObjectId,
      ref: 'TrainingProgram',
      index: true,
    },
    bootcampId: {
      type: Schema.Types.ObjectId,
      ref: 'Bootcamp',
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Batch code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      index: true,
      validate: {
        validator: function (this: IBatch, value: Date) {
          return !this.startDate || value >= this.startDate;
        },
        message: 'End date must be on or after start date',
      },
    },
    venue: {
      type: String,
      trim: true,
    },
    mode: {
      type: String,
      required: [true, 'Batch mode is required'],
      enum: {
        values: Object.values(BatchMode),
        message: '{VALUE} is not a valid batch mode',
      },
      index: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Batch capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    enrolledCount: {
      type: Number,
      default: 0,
      min: [0, 'Enrolled count cannot be negative'],
      validate: {
        validator: function (this: IBatch, value: number) {
          return !this.capacity || value <= this.capacity;
        },
        message: 'Enrolled count cannot exceed capacity',
      },
    },
    status: {
      type: String,
      enum: {
        values: Object.values(BatchStatus),
        message: '{VALUE} is not a valid batch status',
      },
      default: BatchStatus.DRAFT,
      index: true,
    },
    assignedMentorId: {
      type: Schema.Types.ObjectId,
      ref: 'MentorProfile',
      index: true,
    },
    assignedMentorIds: {
      type: [Schema.Types.ObjectId],
      ref: 'MentorProfile',
      default: [],
      index: true,
    },
    fee: {
      type: Schema.Types.Decimal128,
      required: [true, 'Batch fee is required'],
      min: [0, 'Fee cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

batchSchema.pre('validate', function (next) {
  const linkedEntityCount = [
    this.courseId,
    this.trainingProgramId,
    this.bootcampId,
  ].filter(Boolean).length;

  if (linkedEntityCount !== 1) {
    this.invalidate(
      'linkedEntity',
      'Exactly one of courseId, trainingProgramId, or bootcampId is required'
    );
  }

  next();
});

batchSchema.index({ status: 1, startDate: 1 });
batchSchema.index({ batchType: 1, status: 1 });

batchSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const Batch = mongoose.model<IBatch>('Batch', batchSchema);
