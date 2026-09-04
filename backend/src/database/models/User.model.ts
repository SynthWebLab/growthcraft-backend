import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, USER_ROLES } from '@/common/constants/user.constants';

export interface IRefreshToken {
  token: string;
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt: Date;
  deviceInfo?: string;
}

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  avatar?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  emailVerificationOTP?: string;
  emailVerificationOTPExpires?: Date;
  emailVerificationOTPAttempts?: number;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshTokens: IRefreshToken[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    avatar: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: function (v: string) {
          if (!v || v.trim() === '') return true;
          return /^\+?[\d\s-()]+$/.test(v);
        },
        message: 'Please provide a valid phone number',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: UserRole.STUDENT,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerificationOTP: {
      type: String,
      select: false,
    },
    emailVerificationOTPExpires: {
      type: Date,
      select: false,
    },
    emailVerificationOTPAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    refreshTokens: {
      type: [
        {
          token: { type: String, required: true },
          createdAt: { type: Date, required: true },
          lastUsedAt: { type: Date },
          expiresAt: { type: Date, required: true },
          deviceInfo: { type: String },
        },
      ],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data from JSON response
userSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.__v;
  return obj;
};
// Indexes
userSchema.index({ email: 1, role: 1 }, { unique: true });
userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ emailVerificationOTP: 1 }, { sparse: true });
userSchema.index({ passwordResetToken: 1 }, { sparse: true });

// Indexes for query performance
userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ emailVerificationOTP: 1 }, { sparse: true });
userSchema.index({ passwordResetToken: 1 }, { sparse: true });

export const User = mongoose.model<IUser>('User', userSchema);
