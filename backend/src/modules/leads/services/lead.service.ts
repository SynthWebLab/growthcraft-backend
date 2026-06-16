import { Lead, ILead } from '@/database/models';
import { logger } from '@/common/utils/logger.util';

interface CreateLeadData {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  subject?: string;
  message: string;
  organization?: string;
  source?: string;
}

export class LeadService {
  private static instance: LeadService;

  private constructor() {}

  public static getInstance(): LeadService {
    if (!LeadService.instance) {
      LeadService.instance = new LeadService();
    }
    return LeadService.instance;
  }

  /**
   * Create a new lead/enquiry
   */
  public async createLead(data: CreateLeadData): Promise<ILead> {
    try {
      const lead = await Lead.create({
        ...data,
        status: 'pending',
      });
      return lead;
    } catch (error: any) {
      logger.error('Create lead service error:', error);
      throw error;
    }
  }
}

export const leadService = LeadService.getInstance();
