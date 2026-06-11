import mongoose, { Schema, Document } from 'mongoose';
import { EventType } from './Bootcamp.model';

export interface IEventCallbackRequest extends Document {
  userId?: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  eventType: EventType; // Workshop, Bootcamp, or Hackathon
  fullName: string;
  email: string;
  phone: string;
  title: string; // Event title
  requestDate: Date;
  status: 'pending' | 'contacted' | 'completed' | 'cancelled';
  notes?: string;
  contactedAt?: Date;
  contactedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const eventCallbackRequestSchema = new Schema<IEventCallbackRequest>(
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
    requestDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    contactedAt: {
      type: Date,
    },
    contactedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying callback requests
eventCallbackRequestSchema.index({ eventId: 1, eventType: 1, status: 1 });
eventCallbackRequestSchema.index({ eventType: 1, status: 1 });
eventCallbackRequestSchema.index(
  { userId: 1, eventId: 1 },
  { partialFilterExpression: { userId: { $exists: true } } }
);
eventCallbackRequestSchema.index({ email: 1, eventId: 1, status: 1 });

// Remove __v from JSON response
eventCallbackRequestSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const EventCallbackRequest = mongoose.model<IEventCallbackRequest>(
  'EventCallbackRequest',
  eventCallbackRequestSchema
);
