import mongoose from 'mongoose';
import {
  Lead,
  CourseCallbackRequest,
  TrainingProgramCallbackRequest,
  EventCallbackRequest,
} from '@/database/models';
import { logger } from '@/common/utils/logger.util';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { ValidationError } from '@/common/errors/ValidationError';

export interface UnifiedEnquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  enquiry_type: string;
  source_page: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export class EnquiryAdminService {
  private static instance: EnquiryAdminService | null = null;

  public constructor() {}

  public static getInstance(): EnquiryAdminService {
    if (!EnquiryAdminService.instance) {
      EnquiryAdminService.instance = new EnquiryAdminService();
    }
    return EnquiryAdminService.instance;
  }

  public static setInstance(instance: EnquiryAdminService | null): void {
    EnquiryAdminService.instance = instance;
  }

  public static resetInstance(): void {
    EnquiryAdminService.instance = null;
  }

  /**
   * Map backend status to frontend display status
   */
  private mapBackendToFrontendStatus(status: string): string {
    switch (status) {
      case 'pending': return 'new';
      case 'contacted': return 'contacted';
      case 'completed':
      case 'resolved': return 'resolved';
      case 'cancelled': return 'closed';
      default: return status;
    }
  }

  /**
   * Map frontend status to backend model status
   */
  private mapFrontendToBackendStatus(status: string, modelName: string): string {
    if (modelName === 'Lead') {
      switch (status) {
        case 'new': return 'pending';
        case 'contacted':
        case 'in_progress': return 'contacted';
        case 'resolved':
        case 'closed': return 'resolved';
        default: return 'pending';
      }
    } else {
      switch (status) {
        case 'new': return 'pending';
        case 'contacted':
        case 'in_progress': return 'contacted';
        case 'resolved': return 'completed';
        case 'closed': return 'cancelled';
        default: return 'pending';
      }
    }
  }

  /**
   * Get all leads and callback requests unified and sorted by creation date
   */
  public async listAllEnquiries(): Promise<UnifiedEnquiry[]> {
    try {
      const [leads, courseCallbacks, programCallbacks, eventCallbacks] = await Promise.all([
        Lead.find().lean().exec(),
        CourseCallbackRequest.find().lean().exec(),
        TrainingProgramCallbackRequest.find().lean().exec(),
        EventCallbackRequest.find().lean().exec(),
      ]);

      const unified: UnifiedEnquiry[] = [];

      // 1. Map Leads
      leads.forEach((lead: any) => {
        unified.push({
          id: lead._id.toString(),
          name: lead.name,
          email: lead.email,
          phone: lead.phone || null,
          message: lead.message,
          enquiry_type: lead.subject ? `general_enquiry (${lead.subject})` : 'general_enquiry',
          source_page: lead.source || '/contact',
          status: this.mapBackendToFrontendStatus(lead.status),
          notes: lead.notes || null,
          created_at: lead.createdAt.toISOString(),
        });
      });

      // 2. Map Course Callbacks
      courseCallbacks.forEach((cb: any) => {
        unified.push({
          id: cb._id.toString(),
          name: cb.fullName,
          email: cb.email,
          phone: cb.phone,
          message: `Callback request for Course: ${cb.title}`,
          enquiry_type: 'course_callback',
          source_page: `/courses/${cb.courseId || ''}`,
          status: this.mapBackendToFrontendStatus(cb.status),
          notes: cb.notes || null,
          created_at: (cb.createdAt || cb.requestDate || new Date()).toISOString(),
        });
      });

      // 3. Map Program Callbacks
      programCallbacks.forEach((cb: any) => {
        unified.push({
          id: cb._id.toString(),
          name: cb.fullName,
          email: cb.email,
          phone: cb.phone,
          message: `Callback request for Training Program: ${cb.title}`,
          enquiry_type: 'training_program_callback',
          source_page: `/training-programs/${cb.programId || ''}`,
          status: this.mapBackendToFrontendStatus(cb.status),
          notes: cb.notes || null,
          created_at: (cb.createdAt || cb.requestDate || new Date()).toISOString(),
        });
      });

      // 4. Map Event Callbacks
      eventCallbacks.forEach((cb: any) => {
        const typeLabel = cb.eventType ? cb.eventType.toLowerCase() : 'event';
        unified.push({
          id: cb._id.toString(),
          name: cb.fullName,
          email: cb.email,
          phone: cb.phone,
          message: `Callback request for ${cb.eventType || 'Event'}: ${cb.title}`,
          enquiry_type: `${typeLabel}_callback`,
          source_page: `/${typeLabel}s/${cb.eventId || ''}`,
          status: this.mapBackendToFrontendStatus(cb.status),
          notes: cb.notes || null,
          created_at: (cb.createdAt || cb.requestDate || new Date()).toISOString(),
        });
      });

      // Sort by creation date descending (newest first)
      return unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error: any) {
      logger.error('Error listing all enquiries:', error);
      throw error;
    }
  }

  /**
   * Update an enquiry status and notes in its respective collection
   */
  public async updateEnquiry(
    id: string,
    enquiryType: string,
    status: string,
    notes?: string
  ): Promise<any> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid enquiry ID format');
      }

      const type = enquiryType.toLowerCase();

      if (type.includes('course_callback')) {
        const mappedStatus = this.mapFrontendToBackendStatus(status, 'CourseCallbackRequest');
        const updated = await CourseCallbackRequest.findByIdAndUpdate(
          id,
          { status: mappedStatus, notes, contactedAt: new Date() },
          { new: true }
        );
        if (!updated) throw new NotFoundError('Course callback request not found');
        return updated;
      } else if (type.includes('training_program_callback')) {
        const mappedStatus = this.mapFrontendToBackendStatus(status, 'TrainingProgramCallbackRequest');
        const updated = await TrainingProgramCallbackRequest.findByIdAndUpdate(
          id,
          { status: mappedStatus, notes, contactedAt: new Date() },
          { new: true }
        );
        if (!updated) throw new NotFoundError('Training program callback request not found');
        return updated;
      } else if (
        type.includes('workshop_callback') ||
        type.includes('bootcamp_callback') ||
        type.includes('hackathon_callback') ||
        type.includes('event_callback')
      ) {
        const mappedStatus = this.mapFrontendToBackendStatus(status, 'EventCallbackRequest');
        const updated = await EventCallbackRequest.findByIdAndUpdate(
          id,
          { status: mappedStatus, notes, contactedAt: new Date() },
          { new: true }
        );
        if (!updated) throw new NotFoundError('Event callback request not found');
        return updated;
      } else {
        // Fallback or default to Lead
        const mappedStatus = this.mapFrontendToBackendStatus(status, 'Lead');
        const updated = await Lead.findByIdAndUpdate(
          id,
          { status: mappedStatus, notes },
          { new: true }
        );
        if (!updated) throw new NotFoundError('Lead / General enquiry not found');
        return updated;
      }
    } catch (error: any) {
      logger.error(`Error updating enquiry with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an enquiry from its respective collection
   */
  public async deleteEnquiry(id: string, enquiryType: string): Promise<boolean> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid enquiry ID format');
      }

      const type = enquiryType.toLowerCase();
      let result;

      if (type.includes('course_callback')) {
        result = await CourseCallbackRequest.findByIdAndDelete(id);
      } else if (type.includes('training_program_callback')) {
        result = await TrainingProgramCallbackRequest.findByIdAndDelete(id);
      } else if (
        type.includes('workshop_callback') ||
        type.includes('bootcamp_callback') ||
        type.includes('hackathon_callback') ||
        type.includes('event_callback')
      ) {
        result = await EventCallbackRequest.findByIdAndDelete(id);
      } else {
        result = await Lead.findByIdAndDelete(id);
      }

      return !!result;
    } catch (error: any) {
      logger.error(`Error deleting enquiry with ID ${id}:`, error);
      throw error;
    }
  }
}

export const enquiryAdminService = EnquiryAdminService.getInstance();
