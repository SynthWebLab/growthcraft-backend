import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  performedBy: mongoose.Types.ObjectId;
  action: string;
  target: string;
  changes?: Record<string, any>;
  ip?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Performed by User ID is required'],
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Action description is required'],
      trim: true,
      index: true,
    },
    target: {
      type: String,
      required: [true, 'Target resource is required'],
      trim: true,
      index: true,
    },
    changes: {
      type: Schema.Types.Mixed,
      default: null,
    },
    ip: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index to clean old logs or sort efficiently
auditLogSchema.index({ timestamp: -1 });

// Remove __v from JSON response
auditLogSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
