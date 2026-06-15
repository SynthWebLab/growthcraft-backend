import { TrainingProgramDetails, ITrainingProgramDetails } from '@/database/models';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { logger } from '@/common/utils/logger.util';

export class TrainingProgramDetailsService {
  private static instance: TrainingProgramDetailsService;

  private constructor() {}

  public static getInstance(): TrainingProgramDetailsService {
    if (!TrainingProgramDetailsService.instance) {
      TrainingProgramDetailsService.instance = new TrainingProgramDetailsService();
    }
    return TrainingProgramDetailsService.instance;
  }

  /**
   * Get all training program details by slug
   */
  public async getProgramDetailsBySlug(slug: string): Promise<ITrainingProgramDetails> {
    try {
      const programDetails = await TrainingProgramDetails.findOne({ slug }).lean();

      if (!programDetails) {
        throw new NotFoundError('Training program details not found');
      }

      return programDetails as unknown as ITrainingProgramDetails;
    } catch (error: any) {
      logger.error('Get training program details by slug service error:', error);
      throw error;
    }
  }

  /**
   * Get training program overview
   */
  public async getProgramOverview(slug: string): Promise<any> {
    try {
      const programDetails = await TrainingProgramDetails.findOne({ slug })
        .select('overview')
        .lean();

      if (!programDetails) {
        throw new NotFoundError('Training program details not found');
      }

      return programDetails.overview;
    } catch (error: any) {
      logger.error('Get training program overview service error:', error);
      throw error;
    }
  }

  /**
   * Get training program syllabus
   */
  public async getProgramSyllabus(slug: string): Promise<any> {
    try {
      const programDetails = await TrainingProgramDetails.findOne({ slug })
        .select('syllabus')
        .lean();

      if (!programDetails) {
        throw new NotFoundError('Training program details not found');
      }

      return programDetails.syllabus;
    } catch (error: any) {
      logger.error('Get training program syllabus service error:', error);
      throw error;
    }
  }

  /**
   * Get training program mentors
   */
  public async getProgramMentors(slug: string): Promise<any> {
    try {
      const programDetails = await TrainingProgramDetails.findOne({ slug })
        .select('mentors')
        .lean();

      if (!programDetails) {
        throw new NotFoundError('Training program details not found');
      }

      return programDetails.mentors;
    } catch (error: any) {
      logger.error('Get training program mentors service error:', error);
      throw error;
    }
  }

  /**
   * Get training program FAQs
   */
  public async getProgramFAQs(slug: string): Promise<any> {
    try {
      const programDetails = await TrainingProgramDetails.findOne({ slug }).select('faqs').lean();

      if (!programDetails) {
        throw new NotFoundError('Training program details not found');
      }

      return programDetails.faqs;
    } catch (error: any) {
      logger.error('Get training program FAQs service error:', error);
      throw error;
    }
  }
}

export const trainingProgramDetailsService = TrainingProgramDetailsService.getInstance();
