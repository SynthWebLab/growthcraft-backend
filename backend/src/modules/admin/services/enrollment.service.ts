import mongoose from 'mongoose';
import { Batch, Enrollment, EnrollmentStatus, User } from '@/database/models';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { ValidationError } from '@/common/errors/ValidationError';
import { logger } from '@/common/utils/logger.util';
import { UserRole } from '@/common/constants/user.constants';
import { notificationService } from '@/modules/notifications/services/notification.service';

export interface CreateEnrollmentInput {
  studentUserId: string;
  batchId: string;
  feeQuoted: number;
  paymentMethod?: 'razorpay' | 'offline';
}

export interface PaymentLink {
  id: string;
  url: string;
  amount: number;
  currency: string;
  expiresAt: Date;
}

export class EnrollmentService {
  private static instance: EnrollmentService;

  private constructor() {}

  public static getInstance(): EnrollmentService {
    if (!EnrollmentService.instance) {
      EnrollmentService.instance = new EnrollmentService();
    }
    return EnrollmentService.instance;
  }

  /**
   * Create a new enrollment
   * - Validates batch capacity
   * - Creates Pending enrollment
   * - Increments batch.enrolledCount atomically
   * - Optionally generates payment link for Razorpay
   */
  public async createEnrollment(input: CreateEnrollmentInput) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate student exists and has Student role
      const student = await User.findById(input.studentUserId).session(session).exec();
      if (!student) {
        throw NotFoundError.user();
      }

      if (student.role !== UserRole.STUDENT) {
        throw ValidationError.forField(
          'studentUserId',
          'User must have Student role to enroll in a batch'
        );
      }

      // Validate batch exists and has capacity
      const batch = await Batch.findById(input.batchId).session(session).exec();
      if (!batch) {
        throw NotFoundError.resource('Batch');
      }

      // Check if batch has available capacity
      if (batch.enrolledCount >= batch.capacity) {
        throw ValidationError.forField(
          'batchId',
          `Batch ${batch.code} has reached maximum capacity (${batch.capacity})`
        );
      }

      // Check for duplicate enrollment
      const existingEnrollment = await Enrollment.findOne({
        studentUserId: input.studentUserId,
        batchId: input.batchId,
      })
        .session(session)
        .exec();

      if (existingEnrollment) {
        throw ValidationError.forField(
          'studentUserId',
          'Student is already enrolled in this batch',
          { studentUserId: input.studentUserId, batchId: input.batchId }
        );
      }

      // Create enrollment with Pending status
      const enrollment = await Enrollment.create(
        [
          {
            studentUserId: input.studentUserId,
            batchId: input.batchId,
            status: EnrollmentStatus.PENDING,
            feeQuoted: mongoose.Types.Decimal128.fromString(input.feeQuoted.toFixed(2)),
            feeCollected: mongoose.Types.Decimal128.fromString('0.00'),
            attendancePercent: 0,
            avgRubricScore: 0,
            enrolledAt: new Date(),
          },
        ],
        { session }
      );

      // Increment batch.enrolledCount atomically
      await Batch.findByIdAndUpdate(
        input.batchId,
        { $inc: { enrolledCount: 1 } },
        { session, new: true }
      ).exec();

      // Commit transaction
      await session.commitTransaction();

      logger.info(
        `Enrollment created: Student ${input.studentUserId} enrolled in batch ${batch.code}`
      );

      // Trigger notification for student
      try {
        await notificationService.createNotification(
          input.studentUserId,
          'enrollment.created',
          {
            batchId: batch._id,
            batchCode: batch.code,
            feeQuoted: input.feeQuoted,
          }
        );
      } catch (err) {
        logger.error('Failed to trigger enrollment creation notification:', err);
      }

      // Generate payment link if Razorpay payment method is specified
      let paymentLink: PaymentLink | undefined;
      if (input.paymentMethod === 'razorpay') {
        paymentLink = await this.generateRazorpayPaymentLink(
          enrollment[0]._id.toString(),
          input.feeQuoted
        );
      }

      return {
        enrollment: enrollment[0],
        paymentLink,
      };
    } catch (error: any) {
      // Rollback transaction on error
      await session.abortTransaction();
      logger.error('Create enrollment error:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Generate Razorpay payment link
   */
  private async generateRazorpayPaymentLink(
    enrollmentId: string,
    amount: number
  ): Promise<PaymentLink> {
    try {
      const { paymentService } = await import('@/modules/payments/services/payment.service');
      const link = await paymentService.generatePaymentLink({
        amount,
        description: `Enrollment Fee for Enrollment #${enrollmentId}`,
        itemType: 'enrollment',
        itemId: enrollmentId,
        expiresInHours: 24,
      });

      return {
        id: link.id,
        url: link.url,
        amount: link.amount,
        currency: link.currency,
        expiresAt: link.expiresAt,
      };
    } catch (err: any) {
      logger.warn(`Razorpay payment link generation fallback to mock: ${err.message}`);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      return {
        id: `plink_mock_${enrollmentId}`,
        url: `https://razorpay.com/pay/mock_${enrollmentId}`,
        amount,
        currency: 'INR',
        expiresAt,
      };
    }
  }
}


export const enrollmentService = EnrollmentService.getInstance();
