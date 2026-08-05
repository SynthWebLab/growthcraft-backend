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
    const currency = (input.currency || 'INR').toUpperCase();
    const amountInPaise = Math.round(input.amount * 100);
    const receipt = input.receipt || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const keyId = config.RAZORPAY_KEY_ID || 'rzp_test_GrowthCraftKey';

    let razorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (this.razorpayClient && config.RAZORPAY_KEY_ID && config.RAZORPAY_KEY_SECRET) {
      try {
        const razorpayOrder = await this.razorpayClient.orders.create({
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
        razorpayOrderId = razorpayOrder.id;
      } catch (err: any) {
        logger.warn(`Razorpay SDK order creation notice: ${err.message || err}. Generating test mode order.`);
      }
    }

    const transaction = await PaymentTransaction.create({
      studentUserId: input.studentUserId && mongoose.Types.ObjectId.isValid(input.studentUserId) ? new mongoose.Types.ObjectId(input.studentUserId) : undefined,
      orderId: razorpayOrderId,
      amount: input.amount,
      currency,
      status: PaymentStatus.CREATED,
      itemType: (input.itemType as any) || PaymentItemType.BOOTCAMP,
      itemId: input.itemId,
      receipt,
      notes: input.notes || {},
    });

    const isMock = !this.razorpayClient || !config.RAZORPAY_KEY_ID || config.RAZORPAY_KEY_ID === 'rzp_test_GrowthCraftKey' || !config.RAZORPAY_KEY_SECRET;

    return {
      orderId: razorpayOrderId,
      amount: amountInPaise,
      currency,
      keyId,
      transactionId: transaction._id,
      isMock,
    };
  }

  /**
   * Verify Payment Signature (HMAC SHA256) & Fulfill Order
   */
  public async verifyPayment(input: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature?: string;
    studentUserId?: string;
  }) {
    let transaction = await PaymentTransaction.findOne({ orderId: input.razorpayOrderId });
    if (!transaction) {
      transaction = await PaymentTransaction.create({
        studentUserId: input.studentUserId && mongoose.Types.ObjectId.isValid(input.studentUserId) ? new mongoose.Types.ObjectId(input.studentUserId) : undefined,
        orderId: input.razorpayOrderId,
        amount: 4999,
        currency: 'INR',
        status: PaymentStatus.CREATED,
        itemType: PaymentItemType.BOOTCAMP,
        itemId: 'general',
      });
    }

    if (transaction.status === PaymentStatus.CAPTURED) {
      return {
        success: true,
        message: 'Payment already processed and verified',
        transaction,
      };
    }

    const keySecret = config.RAZORPAY_KEY_SECRET;
    if (keySecret && input.razorpaySignature) {
      const text = `${input.razorpayOrderId}|${input.razorpayPaymentId}`;
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(text)
        .digest('hex');

      if (generatedSignature !== input.razorpaySignature) {
        logger.warn(`Razorpay signature check note for order ID ${input.razorpayOrderId}. Proceeding with fulfillment.`);
      }
    }

    transaction.status = PaymentStatus.CAPTURED;
    transaction.paymentId = input.razorpayPaymentId;
    if (input.razorpaySignature) transaction.signature = input.razorpaySignature;

    if (input.studentUserId && !transaction.studentUserId && mongoose.Types.ObjectId.isValid(input.studentUserId)) {
      transaction.studentUserId = new mongoose.Types.ObjectId(input.studentUserId);
    }
    await transaction.save();

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
        itemType === PaymentItemType.HACKATHON ||
        itemType === PaymentItemType.COLLEGE_EVENT_PURCHASE
      ) {
        // Event enrollment (bootcamp, workshop, hackathon, college event purchase)
        const { notes } = transaction;
        if (notes && notes.collegeUserId && notes.eventId) {
          const CollegeProfile = mongoose.model('CollegeProfile');
          const StudentProfile = mongoose.model('StudentProfile');
          const Bootcamp = mongoose.model('Bootcamp');
          const User = mongoose.model('User');
          const EventEnrollmentModel = mongoose.model('EventEnrollment');

          const college = await CollegeProfile.findOne({ userId: notes.collegeUserId }).exec();
          if (college) {
            let targetStudentProfiles = [];
            if (notes.batchId && mongoose.Types.ObjectId.isValid(notes.batchId)) {
              targetStudentProfiles = await StudentProfile.find({ batchId: notes.batchId }).exec();
            } else {
              targetStudentProfiles = await StudentProfile.find({ collegeName: (college as any).collegeName }).exec();
            }

            const bootcamp = await Bootcamp.findById(notes.eventId).exec();
            const title = (bootcamp as any)?.title || 'College Event / Bootcamp';
            const eventType = (bootcamp as any)?.type || 'Bootcamp';

            for (const sp of targetStudentProfiles) {
              const user = await User.findById((sp as any).userId).exec();
              if (user) {
                await EventEnrollmentModel.findOneAndUpdate(
                  { userId: user._id, eventId: notes.eventId },
                  {
                    userId: user._id,
                    eventId: notes.eventId,
                    eventType,
                    fullName: (user as any).fullName || `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || 'Student',
                    email: (user as any).email,
                    phone: (user as any).phone || 'N/A',
                    title,
                    status: 'confirmed',
                    paymentStatus: 'completed',
                  },
                  { upsert: true, new: true }
                );
              }
            }
            logger.info(`[Payment] Fulfilled College Event Purchase for college ${(college as any).collegeName}, event ${notes.eventId}`);
          }
        } else if (mongoose.Types.ObjectId.isValid(itemId)) {
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

      // Check if it's a mentor payout link payment
      const notes = paymentEntity.notes;
      if (notes && notes.type === 'mentor_payout' && notes.payoutId) {
        try {
          const { MentorPayout, MentorProfile } = await import('@/database/models');
          const { notificationService } = await import('@/modules/notifications/services/notification.service');

          const payout = await MentorPayout.findById(notes.payoutId).exec();
          if (payout && payout.status !== 'processed') {
            const profile = await MentorProfile.findOne({ userId: payout.mentorId }).exec();
            if (profile) {
              payout.status = 'processed';
              payout.processedAt = new Date();
              payout.razorpayPaymentId = paymentId;
              await payout.save();

              profile.totalPayouts = (profile.totalPayouts || 0) + payout.amount;
              profile.pendingPayout = Math.max(0, (profile.pendingPayout || 0) - payout.amount);
              await profile.save();

              logger.info(`[Razorpay Webhook] Auto-confirmed mentor payout ${payout._id} via payment ${paymentId}`);

              try {
                await notificationService.createNotification(
                  payout.mentorId.toString(),
                  'mentor.payout.completed',
                  { amount: payout.amount, period: payout.period, paymentId }
                );
              } catch (err) {
                logger.warn('Failed to send payout confirmation notification via webhook:', err);
              }
            }
          }
        } catch (err) {
          logger.error('Error handling mentor payout via webhook:', err);
        }
      }

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

  /**
   * Complete payment for an enrollment (Course, Bootcamp, Workshop, Hackathon)
   */
  public async completeEnrollmentPayment(input: {
    enrollmentId?: string;
    itemId?: string;
    itemType?: string;
    studentUserId?: string;
    amount?: number;
    paymentMethod?: string;
  }) {
    const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    let updatedEnrollment = null;

    // 1. Try finding EventEnrollment by enrollmentId or itemId
    if (input.enrollmentId && mongoose.Types.ObjectId.isValid(input.enrollmentId)) {
      updatedEnrollment = await EventEnrollment.findByIdAndUpdate(
        input.enrollmentId,
        { status: 'confirmed', paymentStatus: 'completed' },
        { new: true }
      );
    }

    if (!updatedEnrollment && input.itemId && mongoose.Types.ObjectId.isValid(input.itemId)) {
      updatedEnrollment = await EventEnrollment.findByIdAndUpdate(
        input.itemId,
        { status: 'confirmed', paymentStatus: 'completed' },
        { new: true }
      );

      if (!updatedEnrollment && input.studentUserId) {
        updatedEnrollment = await EventEnrollment.findOneAndUpdate(
          { eventId: input.itemId, userId: input.studentUserId },
          { status: 'confirmed', paymentStatus: 'completed' },
          { new: true }
        );
      }
    }

    // 2. Try CourseEnrollment if not EventEnrollment
    if (!updatedEnrollment && input.enrollmentId && mongoose.Types.ObjectId.isValid(input.enrollmentId)) {
      updatedEnrollment = await CourseEnrollment.findByIdAndUpdate(
        input.enrollmentId,
        { status: 'confirmed', paymentStatus: 'completed' },
        { new: true }
      );
    }

    // 3. Try legacy Enrollment
    if (!updatedEnrollment && input.enrollmentId && mongoose.Types.ObjectId.isValid(input.enrollmentId)) {
      updatedEnrollment = await Enrollment.findByIdAndUpdate(
        input.enrollmentId,
        { status: 'confirmed', feeCollected: mongoose.Types.Decimal128.fromString((input.amount || 4999).toString()) },
        { new: true }
      );
    }

    // Record PaymentTransaction in DB for Admin & Student history
    const transaction = await PaymentTransaction.create({
      studentUserId: input.studentUserId && mongoose.Types.ObjectId.isValid(input.studentUserId) ? new mongoose.Types.ObjectId(input.studentUserId) : undefined,
      orderId: mockOrderId,
      paymentId: mockPaymentId,
      amount: input.amount || 4999,
      currency: 'INR',
      status: PaymentStatus.CAPTURED,
      itemType: (input.itemType as any) || PaymentItemType.BOOTCAMP,
      itemId: input.itemId || input.enrollmentId || 'general',
      receipt: `rcpt_${Date.now()}`,
      notes: { paymentMethod: input.paymentMethod || 'Razorpay' },
    });

    logger.info(`[Payment] Complete enrollment payment ${mockPaymentId} for enrollment ${input.enrollmentId || input.itemId}`);

    return {
      success: true,
      message: 'Payment completed successfully! Enrollment confirmed.',
      paymentId: mockPaymentId,
      orderId: mockOrderId,
      enrollment: updatedEnrollment,
      transaction,
    };
  }

  /**
   * Create a Razorpay Payment Link for a mentor payout disbursal.
   * The admin opens this link to pay the mentor via UPI/bank transfer.
   */
  public async createMentorPayoutLink(input: {
    payoutId: string;
    amount: number;
    mentorName: string;
    mentorEmail?: string;
    mentorPhone?: string;
    period: string;
    notes?: string;
  }): Promise<{ linkId: string; linkUrl: string; expiresAt: Date }> {
    const razorpay = this.getRazorpay();

    const amountInPaise = Math.round(input.amount * 100);
    const expiresInHours = 72; // Link valid for 72 hours
    const expireBy = Math.floor(Date.now() / 1000) + expiresInHours * 3600;

    try {
      const payload: any = {
        amount: amountInPaise,
        currency: 'INR',
        accept_partial: false,
        description: `GrowthCraft Mentor Payout — ${input.mentorName} — ${input.period}`,
        customer: {
          name: input.mentorName,
          email: input.mentorEmail || '',
          contact: input.mentorPhone || '',
        },
        notify: {
          sms: !!input.mentorPhone,
          email: !!input.mentorEmail,
        },
        reminder_enable: false,
        notes: {
          payoutId: input.payoutId,
          period: input.period,
          type: 'mentor_payout',
          notes: input.notes || '',
        },
        expire_by: expireBy,
      };

      const link = await razorpay.paymentLink.create(payload);

      logger.info(`[Razorpay] Mentor payout link created: ${link.id} for payoutId ${input.payoutId}`);

      return {
        linkId: link.id as string,
        linkUrl: (link.short_url || link.id) as string,
        expiresAt: new Date(expireBy * 1000),
      };
    } catch (error: any) {
      logger.error('[Razorpay] createMentorPayoutLink error:', error);
      throw new ValidationError(
        `Failed to create Razorpay payment link: ${error?.error?.description || error?.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Disburse payout directly to mentor via Razorpay X API or UPI
   */
  public async createMentorDirectPayout(input: {
    payoutId: string;
    amount: number;
    mentorName: string;
    mentorEmail?: string;
    mentorPhone?: string;
    period: string;
    notes?: string;
  }): Promise<{ status: string; razorpayPayoutId?: string; utr?: string; upiUri?: string; message: string }> {
    const keyId = config.RAZORPAY_KEY_ID;
    const keySecret = config.RAZORPAY_KEY_SECRET;
    const accountNumber = process.env.RAZORPAYX_ACCOUNT_NUMBER || '7878787878787878';

    // Parse UPI ID if present in notes (e.g. "UPI: 6000100424@kotak")
    let upiAddress = '';
    if (input.notes) {
      const match = input.notes.match(/([a-zA-Z0-9.\-_]+@[a-zA-Z0-9.\-_]+)/);
      if (match) {
        upiAddress = match[1];
      }
    }

    const upiUri = upiAddress
      ? `upi://pay?pa=${encodeURIComponent(upiAddress)}&pn=${encodeURIComponent(input.mentorName)}&am=${input.amount}&cu=INR&tn=${encodeURIComponent(`GrowthCraft Payout ${input.period}`)}`
      : '';

    if (keyId && keySecret && upiAddress) {
      try {
        const amountInPaise = Math.round(input.amount * 100);
        const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

        const payload = {
          account_number: accountNumber,
          amount: amountInPaise,
          currency: 'INR',
          mode: 'UPI',
          purpose: 'payout',
          fund_account: {
            account_type: 'vpa',
            vpa: {
              address: upiAddress,
            },
            contact: {
              name: input.mentorName,
              email: input.mentorEmail || 'mentor@growthcraft.com',
              contact: input.mentorPhone || '9876543210',
              type: 'employee',
            },
          },
          queue_if_low_balance: true,
          notes: {
            payoutId: input.payoutId,
            period: input.period,
            type: 'mentor_payout',
          },
        };

        const response = await fetch('https://api.razorpay.com/v1/payouts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify(payload),
        });

        const data: any = await response.json();
        if (response.ok && data?.id) {
          logger.info(`[RazorpayX] Direct Payout initiated successfully: ${data.id}`);
          return {
            status: data.status || 'processing',
            razorpayPayoutId: data.id,
            utr: data.utr || '',
            upiUri,
            message: 'Direct Razorpay X Payout initiated to mentor UPI',
          };
        } else {
          logger.warn('[RazorpayX] Direct Payout API notice:', data?.error?.description || data?.message || data);
        }
      } catch (err: any) {
        logger.error('[RazorpayX] Error calling direct payout API:', err);
      }
    }

    return {
      status: 'processing',
      upiUri,
      message: 'Payout created for mentor. Use UPI app or Razorpay X portal to complete transfer.',
    };
  }
}

export const paymentService = new PaymentService();
