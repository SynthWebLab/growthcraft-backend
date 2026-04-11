import mongoose, { Schema, Document } from 'mongoose';

export interface IAmbassadorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  collegeName?: string;
  referralCode: string;
  totalReferrals: number;
  successfulReferrals: number;
  earnings: number;
  socialMedia: {
    instagram?: string;
    twitter?: string;
    linkedIn?: string;
    facebook?: string;
  };
  referredUsers: {
    userId: mongoose.Types.ObjectId;
    referredAt: Date;
    status: 'pending' | 'completed' | 'rejected';
  }[];
  rewards: {
    type: string;
    amount: number;
    earnedAt: Date;
    description?: string;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ambassadorProfileSchema = new Schema<IAmbassadorProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    collegeName: {
      type: String,
      trim: true,
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    totalReferrals: {
      type: Number,
      default: 0,
    },
    successfulReferrals: {
      type: Number,
      default: 0,
    },
    earnings: {
      type: Number,
      default: 0,
    },
    socialMedia: {
      instagram: { type: String },
      twitter: { type: String },
      linkedIn: { type: String },
      facebook: { type: String },
    },
    referredUsers: {
      type: [
        {
          userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          referredAt: { type: Date, default: Date.now },
          status: {
            type: String,
            enum: ['pending', 'completed', 'rejected'],
            default: 'pending',
          },
        },
      ],
      default: [],
    },
    rewards: {
      type: [
        {
          type: { type: String, required: true },
          amount: { type: Number, required: true },
          earnedAt: { type: Date, default: Date.now },
          description: { type: String },
        },
      ],
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

// Index for faster queries
ambassadorProfileSchema.index({ userId: 1 });
ambassadorProfileSchema.index({ referralCode: 1 });

export const AmbassadorProfile = mongoose.model<IAmbassadorProfile>(
  'AmbassadorProfile',
  ambassadorProfileSchema
);
