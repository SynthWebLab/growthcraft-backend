import mongoose, { Schema, Document } from 'mongoose';

export enum PaymentStatus {
  CREATED = 'created',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentItemType {
  COURSE = 'course',
  BOOTCAMP = 'bootcamp',
  WORKSHOP = 'workshop',
  HACKATHON = 'hackathon',
  TRAINING_PROGRAM = 'training-program',
  ENROLLMENT = 'enrollment',
  RESERVATION = 'reservation',
  COLLEGE_EVENT_PURCHASE = 'college_event_purchase',
}

export interface IPaymentTransaction extends Document {
  studentUserId?: mongoose.Types.ObjectId;
  orderId: string;
  paymentId?: string;
  signature?: string;
  paymentLinkId?: string;
  paymentLinkUrl?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  itemType: PaymentItemType;
  itemId?: mongoose.Types.ObjectId | string;
  paymentMethod?: string;
  receipt?: string;
  notes?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    studentUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    orderId: {
      type: String,
      required: [true, 'Razorpay Order ID is required'],
      unique: true,
      index: true,
    },
    paymentId: {
      type: String,
      index: true,
    },
    signature: {
      type: String,
    },
    paymentLinkId: {
      type: String,
      index: true,
    },
    paymentLinkUrl: {
      type: String,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(PaymentStatus),
        message: '{VALUE} is not a valid payment status',
      },
      default: PaymentStatus.CREATED,
      index: true,
    },
    itemType: {
      type: String,
      enum: {
        values: Object.values(PaymentItemType),
        message: '{VALUE} is not a valid item type',
      },
      required: [true, 'Item type is required'],
    },
    itemId: {
      type: Schema.Types.Mixed,
    },
    paymentMethod: {
      type: String,
    },
    receipt: {
      type: String,
    },
    notes: {
      type: Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

paymentTransactionSchema.index({ studentUserId: 1, createdAt: -1 });
paymentTransactionSchema.index({ status: 1, itemType: 1 });

paymentTransactionSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const PaymentTransaction = mongoose.model<IPaymentTransaction>(
  'PaymentTransaction',
  paymentTransactionSchema
);
