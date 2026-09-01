import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  type: string;
  userId: mongoose.Types.ObjectId;
  data?: Record<string, unknown>;
  readAt?: Date;
  isRead?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      trim: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Notification user is required'],
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    readAt: {
      type: Date,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Sync isRead with readAt on save
notificationSchema.pre('save', function (next) {
  if (this.readAt) {
    this.isRead = true;
  } else if (this.isRead) {
    this.readAt = this.readAt || new Date();
  }
  next();
});

// Indexes for query performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, readAt: 1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
