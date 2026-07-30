import { Reservation, IReservation } from '@/database/models/Reservation.model';
import { Course } from '@/database/models/Course.model';
import { Bootcamp } from '@/database/models/Bootcamp.model';
import { logger } from '@/common/utils/logger.util';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { ConflictError } from '@/common/errors/ConflictError';
import { ValidationError } from '@/common/errors/ValidationError';

export interface CreateReservationDTO {
  name: string;
  email: string;
  phone: string;
  itemType: 'course' | 'bootcamp';
  itemId: string;
  notes?: string;
  source?: 'web' | 'mobile' | 'admin';
}

export class ReservationService {
  private static instance: ReservationService;
  private readonly RESERVATION_EXPIRY_HOURS = 24; // Reservation expires after 24 hours

  private constructor() {}

  public static getInstance(): ReservationService {
    if (!ReservationService.instance) {
      ReservationService.instance = new ReservationService();
    }
    return ReservationService.instance;
  }

  /**
   * Create a new reservation
   */
  public async createReservation(data: CreateReservationDTO): Promise<IReservation> {
    try {
      // Validate and get item details
      const itemDetails = await this.validateAndGetItem(data.itemType, data.itemId);

      // Check if seats are available
      if (!itemDetails.hasSeats) {
        throw new ConflictError('No seats available for this ' + data.itemType);
      }

      // Check for existing active reservation
      const existingReservation = await Reservation.findOne({
        email: data.email.toLowerCase().trim(),
        itemId: data.itemId,
        status: { $in: ['Pending', 'Confirmed'] },
      });

      if (existingReservation) {
        throw new ConflictError('You already have an active reservation for this ' + data.itemType);
      }

      // Calculate expiry time
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.RESERVATION_EXPIRY_HOURS);

      // Create reservation
      const reservation = await Reservation.create({
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone.trim(),
        itemType: data.itemType,
        itemId: data.itemId,
        itemTitle: itemDetails.title,
        status: 'Pending',
        reservedAt: new Date(),
        expiresAt,
        amount: itemDetails.price,
        notes: data.notes?.trim(),
        source: data.source || 'web',
      });

      // Increment enrolled/reserved count
      await this.incrementReservedCount(data.itemType, data.itemId);

      logger.info(`Reservation created: ${reservation._id} for ${data.itemType} ${data.itemId}`);

      return reservation;
    } catch (error: any) {
      logger.error('Create reservation error:', error);
      throw error;
    }
  }

  /**
   * Get reservation by ID
   */
  public async getReservationById(reservationId: string): Promise<IReservation | null> {
    try {
      const reservation = await Reservation.findById(reservationId);
      return reservation;
    } catch (error: any) {
      logger.error('Get reservation by ID error:', error);
      throw error;
    }
  }

  /**
   * Get reservations by email
   */
  public async getReservationsByEmail(email: string): Promise<IReservation[]> {
    try {
      const reservations = await Reservation.find({
        email: email.toLowerCase().trim(),
      }).sort({ createdAt: -1 });

      return reservations;
    } catch (error: any) {
      logger.error('Get reservations by email error:', error);
      throw error;
    }
  }

  /**
   * Confirm reservation
   */
  public async confirmReservation(reservationId: string): Promise<IReservation> {
    try {
      const reservation = await Reservation.findById(reservationId);

      if (!reservation) {
        throw new NotFoundError('Reservation not found', 'RESERVATION_NOT_FOUND');
      }

      if (reservation.status !== 'Pending') {
        throw new ValidationError('Only pending reservations can be confirmed', [
          {
            field: 'status',
            message: `Reservation is already ${reservation.status}`,
            value: reservation.status,
          },
        ]);
      }

      if (reservation.status === 'Pending' && new Date() > reservation.expiresAt) {
        reservation.status = 'Expired';
        await reservation.save();
        throw new ValidationError('Reservation has expired', [
          {
            field: 'expiresAt',
            message: 'Reservation expired on ' + reservation.expiresAt.toISOString(),
            value: reservation.expiresAt,
          },
        ]);
      }

      reservation.status = 'Confirmed';
      reservation.confirmedAt = new Date();
      await reservation.save();

      logger.info(`Reservation confirmed: ${reservationId}`);

      return reservation;
    } catch (error: any) {
      logger.error('Confirm reservation error:', error);
      throw error;
    }
  }

  /**
   * Cancel reservation
   */
  public async cancelReservation(reservationId: string): Promise<IReservation> {
    try {
      const reservation = await Reservation.findById(reservationId);

      if (!reservation) {
        throw new NotFoundError('Reservation not found', 'RESERVATION_NOT_FOUND');
      }

      if (reservation.status === 'Cancelled') {
        throw new ValidationError('Reservation is already cancelled', [
          {
            field: 'status',
            message: 'Reservation was cancelled on ' + reservation.cancelledAt?.toISOString(),
            value: reservation.status,
          },
        ]);
      }

      reservation.status = 'Cancelled';
      reservation.cancelledAt = new Date();
      await reservation.save();

      // Decrement reserved count
      await this.decrementReservedCount(reservation.itemType, reservation.itemId.toString());

      logger.info(`Reservation cancelled: ${reservationId}`);

      return reservation;
    } catch (error: any) {
      logger.error('Cancel reservation error:', error);
      throw error;
    }
  }

  /**
   * Validate and get item details
   */
  private async validateAndGetItem(
    itemType: 'course' | 'bootcamp',
    itemId: string
  ): Promise<{ title: string; price: number; hasSeats: boolean }> {
    if (itemType === 'course') {
      const course = await Course.findById(itemId);
      if (!course) {
        throw new NotFoundError('Course not found', 'COURSE_NOT_FOUND');
      }
      if (!course.isActive || course.isDraft) {
        throw new ValidationError('Course is not available for reservation', [
          {
            field: 'courseId',
            message: 'Course is not active or is in draft mode',
            value: itemId,
          },
        ]);
      }
      return {
        title: course.title,
        price: course.price,
        hasSeats: course.canEnroll(), // Check if enrollment is open
      };
    } else {
      const bootcamp = await Bootcamp.findById(itemId);
      if (!bootcamp) {
        throw new NotFoundError('Bootcamp not found', 'BOOTCAMP_NOT_FOUND');
      }
      if (!bootcamp.isActive) {
        throw new ValidationError('Bootcamp is not available for reservation', [
          {
            field: 'bootcampId',
            message: 'Bootcamp is not active',
            value: itemId,
          },
        ]);
      }
      return {
        title: bootcamp.title,
        price: bootcamp.price,
        hasSeats: bootcamp.canRegister(), // Check if registration is open and seats available
      };
    }
  }

  /**
   * Increment reserved count
   */
  private async incrementReservedCount(itemType: 'course' | 'bootcamp', itemId: string): Promise<void> {
    if (itemType === 'course') {
      await Course.findByIdAndUpdate(itemId, { $inc: { enrollmentCount: 1 } });
    } else {
      await Bootcamp.findByIdAndUpdate(itemId, { $inc: { enrolledCount: 1 } });
    }
  }

  /**
   * Decrement reserved count
   */
  private async decrementReservedCount(itemType: 'course' | 'bootcamp', itemId: string): Promise<void> {
    if (itemType === 'course') {
      await Course.findByIdAndUpdate(itemId, { $inc: { enrollmentCount: -1 } });
    } else {
      await Bootcamp.findByIdAndUpdate(itemId, { $inc: { enrolledCount: -1 } });
    }
  }

  public async expireOldReservations(): Promise<number> {
    try {
      const expiredList = await Reservation.find({
        status: 'Pending',
        expiresAt: { $lt: new Date() },
      });

      if (expiredList.length === 0) return 0;

      let count = 0;
      for (const res of expiredList) {
        res.status = 'Expired';
        await res.save();
        await this.decrementReservedCount(res.itemType, res.itemId.toString());
        count++;
      }

      logger.info(`Expired and released seat count for ${count} reservations`);
      return count;
    } catch (error: any) {
      logger.error('Expire old reservations error:', error);
      throw error;
    }
  }
}

export const reservationService = ReservationService.getInstance();
