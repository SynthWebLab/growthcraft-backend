import mongoose from 'mongoose';
import {
  CourseEnrollment,
  TrainingProgramEnrollment,
  EventEnrollment,
} from '@/database/models';
import { logger } from '@/common/utils/logger.util';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { ValidationError } from '@/common/errors/ValidationError';

export interface UnifiedRegistration {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  payment_status: string | null;
  amount: number | null;
  notes: string | null;
  course_id: string | null;
  training_program_id: string | null;
  event_id: string | null;
  item_type: 'course' | 'training-program' | 'event';
  item_title: string;
  selected_company?: {
    companyName: string;
    role?: string;
    duration?: string;
    stipend?: string;
    mode?: string;
  } | null;
  created_at: string;
}

export class RegistrationAdminService {
  private static instance: RegistrationAdminService;

  private constructor() {}

  public static getInstance(): RegistrationAdminService {
    if (!RegistrationAdminService.instance) {
      RegistrationAdminService.instance = new RegistrationAdminService();
    }
    return RegistrationAdminService.instance;
  }

  /**
   * Map backend status to frontend status
   */
  private mapBackendToFrontendStatus(status: string): string {
    switch (status) {
      case 'confirmed': return 'approved';
      case 'pending': return 'pending';
      case 'cancelled': return 'cancelled';
      default: return 'pending';
    }
  }

  /**
   * Map frontend status to backend status
   */
  private mapFrontendToBackendStatus(status: string): 'pending' | 'confirmed' | 'cancelled' {
    switch (status) {
      case 'approved': return 'confirmed';
      case 'pending': return 'pending';
      case 'cancelled':
      case 'rejected': return 'cancelled';
      default: return 'pending';
    }
  }

  /**
   * Map backend payment status to frontend payment status
   */
  private mapBackendToFrontendPaymentStatus(paymentStatus: string): string {
    switch (paymentStatus) {
      case 'completed': return 'paid';
      case 'pending': return 'pending';
      case 'failed': return 'unpaid';
      default: return 'pending';
    }
  }

  /**
   * Map frontend payment status to backend payment status
   */
  private mapFrontendToBackendPaymentStatus(paymentStatus: string): 'pending' | 'completed' | 'failed' {
    switch (paymentStatus) {
      case 'paid': return 'completed';
      case 'pending': return 'pending';
      case 'unpaid':
      case 'refunded': return 'failed';
      default: return 'pending';
    }
  }

  /**
   * List all registrations unified and sorted by creation date
   */
  public async listAllRegistrations(): Promise<UnifiedRegistration[]> {
    try {
      const [courseEnrollments, programEnrollments, eventEnrollments] = await Promise.all([
        CourseEnrollment.find().populate('courseId').lean().exec(),
        TrainingProgramEnrollment.find().populate('programId').lean().exec(),
        EventEnrollment.find().populate('eventId').lean().exec(),
      ]);

      const unified: UnifiedRegistration[] = [];

      // 1. Map Course Enrollments
      courseEnrollments.forEach((e: any) => {
        const amount = e.courseId ? (e.courseId.price || e.courseId.discountedPrice || 4999) : 4999;
        unified.push({
          id: e._id.toString(),
          name: e.fullName,
          email: e.email,
          phone: e.phone || null,
          status: this.mapBackendToFrontendStatus(e.status),
          payment_status: this.mapBackendToFrontendPaymentStatus(e.paymentStatus),
          amount,
          notes: e.notes || null,
          course_id: e.courseId ? (e.courseId.slug || e.courseId._id.toString()) : null,
          training_program_id: null,
          event_id: null,
          item_type: 'course',
          item_title: e.title || (e.courseId ? e.courseId.title : 'Course'),
          created_at: (e.createdAt || e.enrollmentDate || new Date()).toISOString(),
        });
      });

      // 2. Map Program Enrollments
      programEnrollments.forEach((e: any) => {
        const amount = e.programId ? (e.programId.price || 9999) : 9999;
        unified.push({
          id: e._id.toString(),
          name: e.fullName,
          email: e.email,
          phone: e.phone || null,
          status: this.mapBackendToFrontendStatus(e.status),
          payment_status: this.mapBackendToFrontendPaymentStatus(e.paymentStatus),
          amount,
          notes: e.notes || null,
          course_id: null,
          training_program_id: e.programId ? (e.programId.slug || e.programId._id.toString()) : null,
          event_id: null,
          item_type: 'training-program',
          item_title: e.title || (e.programId ? e.programId.title : 'Training Program'),
          selected_company: e.selectedCompany || null,
          created_at: (e.createdAt || e.enrollmentDate || new Date()).toISOString(),
        });
      });

      // 3. Map Event Enrollments
      eventEnrollments.forEach((e: any) => {
        const amount = e.eventId ? (e.eventId.price || 0) : 0;
        unified.push({
          id: e._id.toString(),
          name: e.fullName,
          email: e.email,
          phone: e.phone || null,
          status: this.mapBackendToFrontendStatus(e.status),
          payment_status: this.mapBackendToFrontendPaymentStatus(e.paymentStatus),
          amount,
          notes: e.notes || null,
          course_id: null,
          training_program_id: null,
          event_id: e.eventId ? (e.eventId.slug || e.eventId._id.toString()) : null,
          item_type: 'event',
          item_title: e.title || (e.eventId ? e.eventId.title : 'Event'),
          created_at: (e.createdAt || e.enrollmentDate || new Date()).toISOString(),
        });
      });

      // Sort by newest first
      return unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      logger.error('Error listing registrations:', error);
      throw error;
    }
  }

  /**
   * Update registration status, payment status, and notes
   */
  public async updateRegistration(
    id: string,
    itemType: string,
    status: string,
    paymentStatus: string,
    notes?: string
  ): Promise<any> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid registration ID format');
      }

      const backendStatus = this.mapFrontendToBackendStatus(status);
      const backendPaymentStatus = this.mapFrontendToBackendPaymentStatus(paymentStatus);

      let updated;
      const type = itemType.toLowerCase();

      if (type === 'course') {
        updated = await CourseEnrollment.findByIdAndUpdate(
          id,
          { status: backendStatus, paymentStatus: backendPaymentStatus, notes },
          { new: true }
        );
        if (!updated) throw new NotFoundError('Course enrollment not found');
      } else if (type === 'training-program') {
        updated = await TrainingProgramEnrollment.findByIdAndUpdate(
          id,
          { status: backendStatus, paymentStatus: backendPaymentStatus, notes },
          { new: true }
        );
        if (!updated) throw new NotFoundError('Training program enrollment not found');
      } else if (type === 'event') {
        updated = await EventEnrollment.findByIdAndUpdate(
          id,
          { status: backendStatus, paymentStatus: backendPaymentStatus, notes },
          { new: true }
        );
        if (!updated) throw new NotFoundError('Event enrollment not found');
      } else {
        throw new ValidationError(`Unsupported item type: ${itemType}`);
      }

      return updated;
    } catch (error) {
      logger.error(`Error updating registration ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a registration
   */
  public async deleteRegistration(id: string, itemType: string): Promise<boolean> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid registration ID format');
      }

      const type = itemType.toLowerCase();
      let result;

      if (type === 'course') {
        result = await CourseEnrollment.findByIdAndDelete(id);
      } else if (type === 'training-program') {
        result = await TrainingProgramEnrollment.findByIdAndDelete(id);
      } else if (type === 'event') {
        result = await EventEnrollment.findByIdAndDelete(id);
      } else {
        throw new ValidationError(`Unsupported item type: ${itemType}`);
      }

      return !!result;
    } catch (error) {
      logger.error(`Error deleting registration ${id}:`, error);
      throw error;
    }
  }
}

export const registrationAdminService = RegistrationAdminService.getInstance();
