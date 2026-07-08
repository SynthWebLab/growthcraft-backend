import mongoose, { Schema, Document } from 'mongoose';

export enum EnrollmentStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  COMPLETED = 'Completed',
  DROPPED = 'Dropped',
  REFUNDED = 'Refunded',
}

export interface IEnrollment extends Document {
  studentUserId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  status: EnrollmentStatus;
  feeQuoted: mongoose.Types.Decimal128;
  feeCollected: mongoose.Types.Decimal128;
  attendancePercent: number;
  avgRubricScore: number;
  enrolledAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
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
    status: {
      type: String,
      enum: {
        values: Object.values(EnrollmentStatus),
        message: '{VALUE} is not a valid enrollment status',
      },
      default: EnrollmentStatus.PENDING,
      index: true,
    },
    feeQuoted: {
      type: Schema.Types.Decimal128,
      required: [true, 'Fee quoted is required'],
      validate: {
        validator: function (value: mongoose.Types.Decimal128) {
          const numValue = parseFloat(value.toString());
          return numValue >= 0 && numValue <= 999999.99;
        },
        message: 'Fee quoted must be between 0.00 and 999,999.99',
      },
    },
    feeCollected: {
      type: Schema.Types.Decimal128,
      default: () => mongoose.Types.Decimal128.fromString('0.00'),
      validate: {
        validator: function (value: mongoose.Types.Decimal128) {
          const numValue = parseFloat(value.toString());
          return numValue >= 0 && numValue <= 999999.99;
        },
        message: 'Fee collected must be between 0.00 and 999,999.99',
      },
    },
    attendancePercent: {
      type: Number,
      default: 0,
      min: [0, 'Attendance percent cannot be negative'],
      max: [100, 'Attendance percent cannot exceed 100'],
    },
    avgRubricScore: {
      type: Number,
      default: 0,
      min: [0, 'Average rubric score cannot be negative'],
      max: [100, 'Average rubric score cannot exceed 100'],
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
      required: [true, 'Enrollment date is required'],
      immutable: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraint: one student can only enroll in a batch once
enrollmentSchema.index(
  { studentUserId: 1, batchId: 1 },
  { unique: true }
);

// Compound indexes for query performance (as specified in GC-601-T1)
enrollmentSchema.index({ studentUserId: 1, status: 1 });
enrollmentSchema.index({ batchId: 1, status: 1 });

// Additional compound indexes for performance
enrollmentSchema.index({ status: 1, enrolledAt: 1 });

// Pre-save hook to set completedAt when status becomes Completed
enrollmentSchema.pre('save', async function (next) {
  if (this.isModified('status') && this.status === EnrollmentStatus.COMPLETED && !this.completedAt) {
    this.completedAt = new Date();
  }

  if (this.isModified('status') && this.status === EnrollmentStatus.CONFIRMED) {
    try {
      const Referral = mongoose.model('Referral');
      const StudentProfile = mongoose.model('StudentProfile');
      const Batch = mongoose.model('Batch');

      // Find the referral document for this student with status 'registered' or 'sent'
      const referral = await Referral.findOne({
        referredUserId: this.studentUserId,
        status: { $in: ['registered', 'sent'] },
      });

      if (referral) {
        // Find batch to determine enrollment type
        const batch = await Batch.findById(this.batchId).lean().exec() as any;
        let enrollmentType: 'course' | 'event' | 'training-program' | null = null;
        if (batch) {
          if (batch.courseId) enrollmentType = 'course';
          else if (batch.bootcampId) enrollmentType = 'event';
          else if (batch.trainingProgramId) enrollmentType = 'training-program';
        }

        const fee = parseFloat(this.feeCollected ? this.feeCollected.toString() : this.feeQuoted.toString());
        // Default commission rate config is 5% initially
        const commissionAmount = parseFloat((fee * 0.05).toFixed(2));

        referral.status = 'enrolled';
        referral.enrollmentId = this._id;
        referral.enrollmentType = enrollmentType;
        referral.commissionAmount = commissionAmount;
        await referral.save();

        // Update the referring ambassador's profile metrics
        await StudentProfile.updateOne(
          { userId: referral.ambassadorUserId },
          {
            $inc: {
              totalConversions: 1,
              referralEarnings: commissionAmount,
              pendingReferralPayout: commissionAmount,
            },
          }
        ).exec();

        // Trigger notification for referring ambassador
        try {
          const { notificationService } = await import('@/modules/notifications/services/notification.service');
          await notificationService.createNotification(
            referral.ambassadorUserId.toString(),
            'referral.conversion',
            {
              studentUserId: this.studentUserId,
              commissionAmount,
            }
          );
        } catch (err) {
          console.error('Failed to trigger referral conversion notification:', err);
        }

        console.log(`Referral commission of INR ${commissionAmount} successfully applied for ambassador ${referral.ambassadorUserId}`);
      }
    } catch (err) {
      console.error('Error calculating referral commission on enrollment save:', err);
    }
  }
  next();
});

// Remove __v from JSON response
enrollmentSchema.methods.toJSON = function (): Record<string, unknown> {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.__v;
  return obj;
};

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
