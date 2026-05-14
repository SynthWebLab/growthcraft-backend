import mongoose, { Schema, Document, Types } from 'mongoose';

export type BatchStatus = 'Open' | 'Filling' | 'Closed' | 'Completed' | 'Cancelled';

export interface ICourseBatch extends Document {
  courseId: Types.ObjectId;
  batchName: string; // e.g., "Batch 7", "January 2026 Cohort"
  startDate: Date;
  endDate: Date;
  registrationDeadline?: Date;
  maxSeats: number;
  enrolledCount: number;
  availableSeats: number; // Computed: maxSeats - enrolledCount
  status: BatchStatus;
  instructorName?: string; // Specific instructor for this batch
  schedule?: string; // e.g., "Mon-Wed-Fri, 6 PM - 8 PM"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual/computed methods
  isFull(): boolean;
  hasStarted(): boolean;
  hasEnded(): boolean;
  canEnroll(): boolean;
}

const courseBatchSchema = new Schema<ICourseBatch>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    batchName: {
      type: String,
      required: [true, 'Batch name is required'],
      trim: true,
      minlength: [3, 'Batch name must be at least 3 characters'],
      maxlength: [100, 'Batch name cannot exceed 100 characters'],
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
    },
    registrationDeadline: {
      type: Date,
      index: true,
    },
    maxSeats: {
      type: Number,
      required: [true, 'Max seats is required'],
      min: [1, 'Max seats must be at least 1'],
    },
    enrolledCount: {
      type: Number,
      default: 0,
      min: [0, 'Enrolled count cannot be negative'],
    },
    availableSeats: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Open', 'Filling', 'Closed', 'Completed', 'Cancelled'],
      default: 'Open',
      index: true,
    },
    instructorName: {
      type: String,
      trim: true,
    },
    schedule: {
      type: String,
      trim: true,
      maxlength: [500, 'Schedule cannot exceed 500 characters'],
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

// Create compound indexes for efficient queries
courseBatchSchema.index({ courseId: 1, startDate: 1 });
courseBatchSchema.index({ courseId: 1, status: 1, isActive: 1 });
courseBatchSchema.index({ startDate: 1, status: 1 });

// Pre-save hook to calculate available seats
courseBatchSchema.pre('save', function (next) {
  this.availableSeats = Math.max(0, this.maxSeats - this.enrolledCount);
  next();
});

// Method to check if batch is full
courseBatchSchema.methods.isFull = function (): boolean {
  return this.enrolledCount >= this.maxSeats;
};

// Method to check if batch has started
courseBatchSchema.methods.hasStarted = function (): boolean {
  return new Date() >= new Date(this.startDate);
};

// Method to check if batch has ended
courseBatchSchema.methods.hasEnded = function (): boolean {
  return new Date() > new Date(this.endDate);
};

// Method to check if enrollment is possible
courseBatchSchema.methods.canEnroll = function (): boolean {
  const now = new Date();
  
  // Can only enroll if status is Open or Filling
  if (this.status !== 'Open' && this.status !== 'Filling') {
    return false;
  }
  
  // Check if batch is active
  if (!this.isActive) {
    return false;
  }
  
  // Check registration deadline
  if (this.registrationDeadline && now > new Date(this.registrationDeadline)) {
    return false;
  }
  
  // Check if seats available
  if (this.isFull()) {
    return false;
  }
  
  // Check if batch has started
  if (this.hasStarted()) {
    return false;
  }
  
  return true;
};

// Remove __v from JSON response
courseBatchSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  
  // Add computed fields
  obj.isFull = this.isFull();
  obj.hasStarted = this.hasStarted();
  obj.hasEnded = this.hasEnded();
  obj.canEnroll = this.canEnroll();
  
  return obj;
};

export const CourseBatch = mongoose.model<ICourseBatch>('CourseBatch', courseBatchSchema);
