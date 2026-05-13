import mongoose, { Schema, Document } from 'mongoose';

export type ReservationStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Expired';
export type ReservationType = 'course' | 'bootcamp';

export interface IReservation extends Document {
  // User Information
  name: string;
  email: string;
  phone: string;
  
  // Reservation Details
  itemType: ReservationType; // 'course' or 'bootcamp'
  itemId: mongoose.Types.ObjectId; // Reference to Course or Bootcamp
  itemTitle: string; // Cached for quick access
  
  // Status
  status: ReservationStatus;
  
  // Timestamps
  reservedAt: Date;
  expiresAt: Date; // Reservation expires after X hours
  confirmedAt?: Date;
  cancelledAt?: Date;
  
  // Payment (optional for future)
  paymentStatus?: 'Pending' | 'Completed' | 'Failed';
  paymentId?: string;
  amount?: number;
  
  // Metadata
  notes?: string;
  source?: string; // 'web', 'mobile', 'admin'
  
  createdAt: Date;
  updatedAt: Date;
}

const reservationSchema = new Schema<IReservation>(
  {
    // User Information
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[0-9+\-\s()]+$/, 'Please provide a valid phone number'],
    },
    
    // Reservation Details
    itemType: {
      type: String,
      enum: ['course', 'bootcamp'],
      required: [true, 'Item type is required'],
      index: true,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Item ID is required'],
      index: true,
    },
    itemTitle: {
      type: String,
      required: [true, 'Item title is required'],
      trim: true,
    },
    
    // Status
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Cancelled', 'Expired'],
      default: 'Pending',
      index: true,
    },
    
    // Timestamps
    reservedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    confirmedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    
    // Payment (optional)
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed'],
      default: 'Pending',
    },
    paymentId: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      min: [0, 'Amount cannot be negative'],
    },
    
    // Metadata
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    source: {
      type: String,
      enum: ['web', 'mobile', 'admin'],
      default: 'web',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
reservationSchema.index({ email: 1, itemId: 1, status: 1 });
reservationSchema.index({ itemType: 1, itemId: 1, status: 1 });
reservationSchema.index({ status: 1, expiresAt: 1 });

// Method to check if reservation is expired
reservationSchema.methods.isExpired = function (this: IReservation): boolean {
  return new Date() > this.expiresAt && this.status === 'Pending';
};

// Method to confirm reservation
reservationSchema.methods.confirm = function (this: IReservation): void {
  this.status = 'Confirmed';
  this.confirmedAt = new Date();
};

// Method to cancel reservation
reservationSchema.methods.cancel = function (this: IReservation): void {
  this.status = 'Cancelled';
  this.cancelledAt = new Date();
};

// Pre-save hook to auto-expire old reservations
reservationSchema.pre('save', function (next) {
  if (this.status === 'Pending' && new Date() > this.expiresAt) {
    this.status = 'Expired';
  }
  next();
});

// Remove __v from JSON response
reservationSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const Reservation = mongoose.model<IReservation>('Reservation', reservationSchema);
