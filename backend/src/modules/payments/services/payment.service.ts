import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { config } from '@/config';
import { logger } from '@/common/utils/logger.util';
import { AppError } from '@/common/errors/AppError';
import { ValidationError } from '@/common/errors/ValidationError';
import { NotFoundError } from '@/common/errors/NotFoundError';
import {
  PaymentTransaction,
  PaymentStatus,
  PaymentItemType,
  Enrollment,
  EnrollmentStatus,
  Reservation,
  CourseEnrollment,
  TrainingProgramEnrollment,
  EventEnrollment,
} from '@/database/models';


class PaymentService {
  private razorpayClient: Razorpay | null = null;

  constructor() {
    this.initRazorpay();
  }

  private initRazorpay(): void {
    const keyId = config.RAZORPAY_KEY_ID;
    const keySecret = config.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret) {
      try {
        this.razorpayClient = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });
        logger.info('Razorpay SDK successfully initialized.');
      } catch (err) {
        logger.error('Failed to initialize Razorpay SDK:', err);
      }
    } else {
      logger.warn('Razorpay credentials missing in environment variables. Operating in fallback mode.');
    }
  }

  private getRazorpay(): Razorpay {
    if (!this.razorpayClient) {
      // Retry initialization if config was updated after instance creation
      this.initRazorpay();
    }
    if (!this.razorpayClient) {
      throw new ValidationError('Razorpay payment gateway is not configured on the server.');
    }
    return this.razorpayClient;
  }

  /**
   * Create Razorpay Order & persist PaymentTransaction
   */
  public async createOrder(input: {
    amount: number;
    currency?: string;
    itemType: string;
    itemId: string;
    studentUserId?: string;
    receipt?: string;
    notes?: Record<string, any>;
  }) {
    const razorpay = this.getRazorpay();
    const currency = (input.currency || 'INR').toUpperCase();
    const amountInPaise = Math.round(input.amount * 100);
    const receipt = input.receipt || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency,
        receipt,
        notes: {
          itemType: input.itemType,
          itemId: input.itemId,
          studentUserId: input.studentUserId || '',
          ...input.notes,
        },
      });

      const transaction = await PaymentTransaction.create({
        studentUserId: input.studentUserId ? new mongoose.Types.ObjectId(input.studentUserId) : undefined,
        orderId: razorpayOrder.id,
        amount: input.amount,
        currency,
        status: PaymentStatus.CREATED,
        itemType: input.itemType as PaymentItemType,
        itemId: input.itemId,
        receipt,
        notes: input.notes || {},
      });

      return {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: config.RAZORPAY_KEY_ID,
        transactionId: transaction._id,
      };
    } catch (error: any) {
      logger.error('Razorpay createOrder error:', error);
      throw new ValidationError(`Failed to create Razorpay payment order: ${error.message || error}`);
    }
  }

  /**
   * Verify Payment Signature (HMAC SHA256) & Fulfill Order
   */
  public async verifyPayment(input: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    studentUserId?: string;
  }) {
    const keySecret = config.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      throw new ValidationError('Razorpay key secret is not configured');
    }

    // Find transaction record
    const transaction = await PaymentTransaction.findOne({ orderId: input.razorpayOrderId });
    if (!transaction) {
      throw new NotFoundError(`Payment transaction for order ID ${input.razorpayOrderId} not found`);
    }

    // Already processed check
    if (transaction.status === PaymentStatus.CAPTURED) {
      return {
        success: true,
        message: 'Payment already processed and verified',
        transaction,
      };
    }

    // Generate expected HMAC SHA256 signature
    const text = `${input.razorpayOrderId}|${input.razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(text)
      .digest('hex');

    const isSignatureValid = generatedSignature === input.razorpaySignature;

    if (!isSignatureValid) {
      transaction.status = PaymentStatus.FAILED;
      await transaction.save();
      logger.warn(`Invalid Razorpay signature for order ID ${input.razorpayOrderId}`);
      throw new ValidationError('Invalid payment signature. Verification failed.');
    }

    // Update payment transaction to CAPTURED
    transaction.status = PaymentStatus.CAPTURED;
    transaction.paymentId = input.razorpayPaymentId;
    transaction.signature = input.razorpaySignature;

    if (input.studentUserId && !transaction.studentUserId) {
      transaction.studentUserId = new mongoose.Types.ObjectId(input.studentUserId);
    }
    await transaction.save();

    // Fulfill associated business item
    await this.fulfillItemPayment(transaction);

    logger.info(`Successfully verified and captured Razorpay payment ${input.razorpayPaymentId} for order ${input.razorpayOrderId}`);

    return {
      success: true,
      message: 'Payment verified and fulfilled successfully',
      paymentId: input.razorpayPaymentId,
      orderId: input.razorpayOrderId,
      transaction,
    };
  }

  /**
   * Fulfill order/enrollment/reservation after payment capture
   */
  private async fulfillItemPayment(transaction: any) {
    try {
      const { itemType, itemId, amount, studentUserId } = transaction;

      if (itemType === PaymentItemType.ENROLLMENT) {
        // Legacy Enrollment model (used by older Batch enrollment flow)
        if (mongoose.Types.ObjectId.isValid(itemId)) {
          const enrollment = await Enrollment.findById(itemId);
          if (enrollment) {
            enrollment.status = EnrollmentStatus.CONFIRMED;
            enrollment.feeCollected = mongoose.Types.Decimal128.fromString(amount.toString());
            await enrollment.save(); // Pre-save hook triggers referral commission calculation!
          }
        }
      } else if (itemType === PaymentItemType.COURSE) {
        // Course enrollment — CourseEnrollment model
        if (mongoose.Types.ObjectId.isValid(itemId)) {
          await CourseEnrollment.findByIdAndUpdate(itemId, {
            status: 'confirmed',
            paymentStatus: 'completed',
          });
          logger.info(`[Payment] Fulfilled CourseEnrollment ${itemId}`);
        }
      } else if (itemType === PaymentItemType.TRAINING_PROGRAM) {
        // Training program enrollment — TrainingProgramEnrollment model
        if (mongoose.Types.ObjectId.isValid(itemId)) {
          await TrainingProgramEnrollment.findByIdAndUpdate(itemId, {
            status: 'confirmed',
            paymentStatus: 'completed',
          });
          logger.info(`[Payment] Fulfilled TrainingProgramEnrollment ${itemId}`);
        }
      } else if (
        itemType === PaymentItemType.BOOTCAMP ||
        itemType === PaymentItemType.WORKSHOP ||
        itemType === PaymentItemType.HACKATHON
      ) {
        // Event enrollment (bootcamp, workshop, hackathon) — EventEnrollment model
        if (mongoose.Types.ObjectId.isValid(itemId)) {
          await EventEnrollment.findByIdAndUpdate(itemId, {
            status: 'confirmed',
            paymentStatus: 'completed',
          });
          logger.info(`[Payment] Fulfilled EventEnrollment ${itemId} (type: ${itemType})`);
        }
      } else if (itemType === PaymentItemType.RESERVATION) {
        if (mongoose.Types.ObjectId.isValid(itemId)) {
          const reservation = await Reservation.findById(itemId);
          if (reservation) {
            reservation.status = 'Confirmed';
            reservation.paymentStatus = 'Completed';
            reservation.paymentId = transaction.paymentId;
            await reservation.save();
            logger.info(`[Payment] Fulfilled Reservation ${itemId}`);
          }
        }
      } else {
        logger.warn(`[Payment] Unknown itemType '${itemType}' for transaction ${transaction._id} — skipping fulfillment`);
      }

    } catch (err) {
      logger.error('Error fulfilling item payment:', err);
    }
  }

  /**
   * Generate Razorpay Payment Link
   */
  public async generatePaymentLink(input: {
    amount: number;
    description?: string;
    customer?: { name?: string; email?: string; phone?: string };
    itemType: string;
    itemId: string;
    expiresInHours?: number;
  }) {
    const razorpay = this.getRazorpay();

    const amountInPaise = Math.round(input.amount * 100);
    const expireBy = Math.floor(Date.now() / 1000) + (input.expiresInHours || 24) * 3600;

    try {
      const payload: any = {
        amount: amountInPaise,
        currency: 'INR',
        accept_partial: false,
        description: input.description || `Payment for ${input.itemType}`,
        customer: {
          name: input.customer?.name || 'Student',
          email: input.customer?.email || '',
          contact: input.customer?.phone || '',
        },
        notify: {
          sms: true,
          email: true,
        },
        reminder_enable: true,
        notes: {
          itemType: input.itemType,
          itemId: input.itemId,
        },
        expire_by: expireBy,
      };

      const link = await razorpay.paymentLink.create(payload);

      // Save transaction record
      await PaymentTransaction.create({
        orderId: link.id, // Using link ID as tracking order ID
        paymentLinkId: link.id,
        paymentLinkUrl: link.short_url,
        amount: input.amount,
        currency: 'INR',
        status: PaymentStatus.CREATED,
        itemType: input.itemType as PaymentItemType,
        itemId: input.itemId,
        notes: payload.notes,
      });

      return {
        id: link.id,
        url: link.short_url,
        amount: input.amount,
        currency: 'INR',
        expiresAt: new Date(expireBy * 1000),
      };
    } catch (error: any) {
      logger.error('Razorpay paymentLink error:', error);
      throw new ValidationError(`Failed to generate payment link: ${error.message || error}`);
    }
  }

  /**
   * Handle Webhook notifications from Razorpay
   */
  public async handleWebhook(rawBody: string | Buffer, signature: string) {
    const webhookSecret = config.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new ValidationError('Invalid webhook signature');
      }
    }

    const event = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString('utf8'));
    logger.info(`Received Razorpay webhook event: ${event.event}`);

    if (event.event === 'payment.captured') {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      if (orderId) {
        const transaction = await PaymentTransaction.findOne({ orderId });
        if (transaction && transaction.status !== PaymentStatus.CAPTURED) {
          transaction.status = PaymentStatus.CAPTURED;
          transaction.paymentId = paymentId;
          transaction.paymentMethod = paymentEntity.method;
          await transaction.save();
          await this.fulfillItemPayment(transaction);
        }
      }
    } else if (event.event === 'payment.failed') {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      if (orderId) {
        const transaction = await PaymentTransaction.findOne({ orderId });
        if (transaction) {
          transaction.status = PaymentStatus.FAILED;
          await transaction.save();
        }
      }
    }

    return { received: true };
  }

  /**
   * Get payments history for a student
   */
  public async getStudentPayments(studentUserId: string) {
    return PaymentTransaction.find({
      studentUserId: new mongoose.Types.ObjectId(studentUserId),
    })
      .sort({ createdAt: -1 })
      .lean();
  }
}

export const paymentService = new PaymentService();
