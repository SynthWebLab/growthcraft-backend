import mongoose from 'mongoose';
import { CollegeProfile } from '@/database/models/CollegeProfile.model';
import { Bootcamp } from '@/database/models/Bootcamp.model';
import { EventEnrollment } from '@/database/models/EventEnrollment.model';
import { User } from '@/database/models/User.model';
import { UserRole } from '@/common/constants/user.constants';
import { AppError } from '@/common/errors/AppError';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { logger } from '@/common/utils/logger.util';
import { paymentService } from '@/modules/payments/services/payment.service';
import { PaymentItemType } from '@/database/models/PaymentTransaction.model';
import { collegeProfileService } from './college-profile.service';

export class CollegeEventAccessService {
  private static instance: CollegeEventAccessService;

  private constructor() {}

  public static getInstance(): CollegeEventAccessService {
    if (!CollegeEventAccessService.instance) {
      CollegeEventAccessService.instance = new CollegeEventAccessService();
    }
    return CollegeEventAccessService.instance;
  }

  /**
   * Get all cohort students and their access status (enrolled vs not enrolled) for a particular event.
   */
  public async getEventAccessStatus(
    userId: string,
    eventId: string
  ): Promise<{ userId: string; name: string; email: string; phone: string; hasAccess: boolean }[]> {
    try {
      const college = await collegeProfileService.getProfileOrThrow(userId);
      if (!college.partnershipActive) {
        throw new AppError(
          'No active subscription. Activate a partnership plan before managing event access.',
          403,
          'SUBSCRIPTION_REQUIRED'
        );
      }
      const studentUserIds = await collegeProfileService.resolveStudentUserIds(college);
      if (studentUserIds.length === 0) {
        return [];
      }

      // Query student users
      const users = await User.find({ _id: { $in: studentUserIds }, role: UserRole.STUDENT })
        .select('fullName email phone')
        .lean()
        .exec();

      // Query active event enrollments for the event and student IDs
      const enrollments = await EventEnrollment.find({
        eventId: new mongoose.Types.ObjectId(eventId),
        userId: { $in: studentUserIds },
        status: { $in: ['pending', 'confirmed'] },
      })
        .select('userId')
        .lean()
        .exec();

      const enrolledSet = new Set(enrollments.map((e) => String(e.userId)));

      return users.map((user) => ({
        userId: String(user._id),
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        hasAccess: enrolledSet.has(String(user._id)),
      }));
    } catch (error: any) {
      logger.error('Get event access status error:', error);
      throw error;
    }
  }

  /**
   * Grant or revoke access to a specific event for a set of cohort students.
   */
  public async updateEventAccess(
    userId: string,
    eventId: string,
    payload: { studentIds: string[]; action: 'grant' | 'revoke' }
  ): Promise<{ success: boolean; modifiedCount: number }> {
    try {
      const college = await collegeProfileService.getProfileOrThrow(userId);
      if (!college.partnershipActive) {
        throw new AppError(
          'No active subscription. Activate a partnership plan before granting event access.',
          403,
          'SUBSCRIPTION_REQUIRED'
        );
      }
      const collegeStudentIds = await collegeProfileService.resolveStudentUserIds(college);
      const collegeStudentIdStrings = new Set(collegeStudentIds.map((id) => String(id)));

      // Filter input student IDs to only those belonging to this college's cohort
      const validStudentIds = payload.studentIds.filter((id) => collegeStudentIdStrings.has(id));

      if (validStudentIds.length === 0) {
        return { success: true, modifiedCount: 0 };
      }

      const event = await Bootcamp.findById(eventId);
      if (!event) {
        throw new NotFoundError('Event not found');
      }

      let modifiedCount = 0;

      if (payload.action === 'grant') {
        const users = await User.find({ _id: { $in: validStudentIds }, role: UserRole.STUDENT })
          .select('fullName email phone')
          .lean()
          .exec();

        for (const student of users) {
          try {
            // Find existing enrollment (including pending or cancelled to reactivate/overwrite)
            const existing = await EventEnrollment.findOne({
              eventId: event._id,
              userId: student._id,
            });

            if (existing) {
              if (existing.status !== 'confirmed') {
                existing.status = 'confirmed';
                existing.paymentStatus = 'completed';
                await existing.save();
                modifiedCount++;
              }
            } else {
              await EventEnrollment.create({
                userId: student._id,
                eventId: event._id,
                eventType: event.type,
                fullName: student.fullName,
                email: student.email,
                phone: student.phone,
                title: event.title,
                status: 'confirmed',
                paymentStatus: 'completed',
                enrollmentDate: new Date(),
              });
              modifiedCount++;
            }
          } catch (err: any) {
            logger.error(`Failed to grant access to student ${student._id}:`, err.message);
          }
        }

        if (modifiedCount > 0) {
          // Increment enrolledCount on the event
          await Bootcamp.findByIdAndUpdate(eventId, {
            $inc: { enrolledCount: modifiedCount },
          });
        }
      } else if (payload.action === 'revoke') {
        // Find existing confirmed/pending enrollments to know how much to decrement enrolledCount
        const existingCount = await EventEnrollment.countDocuments({
          eventId: event._id,
          userId: { $in: validStudentIds },
          status: { $in: ['pending', 'confirmed'] },
        });

        if (existingCount > 0) {
          const deleteResult = await EventEnrollment.deleteMany({
            eventId: event._id,
            userId: { $in: validStudentIds },
          });
          modifiedCount = deleteResult.deletedCount || existingCount;

          // Decrement enrolledCount on the event
          await Bootcamp.findByIdAndUpdate(eventId, {
            $inc: { enrolledCount: -modifiedCount },
          });
        }
      }

      return { success: true, modifiedCount };
    } catch (error: any) {
      logger.error('Update event access error:', error);
      throw error;
    }
  }

  /**
   * Creates a Razorpay payment order for purchasing an event for a college cohort.
   */
  public async createEventOrder(
    collegeUserId: string,
    eventId: string,
    batchId?: string,
    customAmount?: number
  ) {
    try {
      const college = await CollegeProfile.findOne({ userId: collegeUserId }).exec();
      if (!college) {
        throw new NotFoundError('College profile not found');
      }

      const bootcamp = await Bootcamp.findById(eventId).exec();
      if (!bootcamp) {
        throw new NotFoundError('Event/Bootcamp not found');
      }

      const amount = customAmount || (bootcamp as any).discountedPrice || bootcamp.price || 4999;

      const orderData = await paymentService.createOrder({
        amount,
        currency: 'INR',
        itemType: PaymentItemType.COLLEGE_EVENT_PURCHASE,
        itemId: eventId,
        receipt: `clg_ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        notes: {
          collegeUserId,
          eventId,
          batchId: batchId || '',
          collegeName: college.collegeName,
          eventTitle: bootcamp.title,
        },
      });

      return orderData;
    } catch (error: any) {
      logger.error('Create college event order error:', error);
      throw error;
    }
  }

  /**
   * Verifies Razorpay payment signature & unlocks event access for college students.
   */
  public async verifyEventPayment(
    collegeUserId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature?: string
  ) {
    try {
      const college = await CollegeProfile.findOne({ userId: collegeUserId }).exec();
      if (!college) {
        throw new NotFoundError('College profile not found');
      }

      const result = await paymentService.verifyPayment({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      return result;
    } catch (error: any) {
      logger.error('Verify college event payment error:', error);
      throw error;
    }
  }
}

export const collegeEventAccessService = CollegeEventAccessService.getInstance();
