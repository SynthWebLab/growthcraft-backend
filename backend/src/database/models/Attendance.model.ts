import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  studentUserId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  attendanceDate: Date;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  remarks?: string;
  markedBy: mongoose.Types.ObjectId; // mentor/admin who marked attendance
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    studentUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student user ID is required'],
      index: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: [true, 'Batch ID is required'],
      index: true,
    },
    attendanceDate: {
      type: Date,
      required: [true, 'Attendance date is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Present', 'Absent', 'Late', 'Excused'],
        message: '{VALUE} is not a valid attendance status',
      },
      required: [true, 'Attendance status is required'],
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters'],
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Marked by is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
attendanceSchema.index({ studentUserId: 1, batchId: 1 });
attendanceSchema.index({ batchId: 1, attendanceDate: 1 });
attendanceSchema.index({ studentUserId: 1, batchId: 1, attendanceDate: 1 }, { unique: true });
attendanceSchema.index({ batchId: 1, attendanceDate: -1, createdAt: -1 });
attendanceSchema.index({ studentUserId: 1, attendanceDate: -1 });

// Remove __v from JSON response
attendanceSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
