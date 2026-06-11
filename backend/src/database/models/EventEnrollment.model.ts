import mongoose, { Schema, Document } from 'mongoose';
import { EventType } from './Bootcamp.model';

export interface IEventEnrollment extends Document {
  userId?: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  eventType: EventType; // Workshop, Bootcamp, or Hackathon
  fullName: string;
  email: string;
  phone: string;
  title: string; // Event title
  enrollmentDate: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const eventEnrollmentSchema = new Schema<IEventEnrollment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Bootcamp', // References the unified Bootcamp collection (holds all event types)
      required: [true, 'Event ID is required'],
      index: true,
    },
    eventType: {
      type: String,
      enum: {
        values: Object.values(EventType),
        message: '{VALUE} is not a valid event type',
      },
      required: [true, 'Event type is required'],
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes to prevent duplicate enrollments for logged-in and guest users
eventEnrollmentSchema.index(
  { userId: 1, eventId: 1 },
  { unique: true, partialFilterExpression: { userId: { $exists: true } } }
);
eventEnrollmentSchema.index({ email: 1, eventId: 1 }, { unique: true });

// Index for querying enrollments by event and type
eventEnrollmentSchema.index({ eventId: 1, eventType: 1, status: 1 });
eventEnrollmentSchema.index({ eventType: 1, status: 1 });

// Remove __v from JSON response
eventEnrollmentSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const EventEnrollment = mongoose.model<IEventEnrollment>(
  'EventEnrollment',
  eventEnrollmentSchema
);
