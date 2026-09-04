import { TrainingProgram, TrainingProgramDetails, ITrainingProgramDetails } from '@/database/models';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { logger } from '@/common/utils/logger.util';
import { DEFAULT_INTERNSHIP_PARTNERS } from './training-program.service';

export class TrainingProgramDetailsService {
  private static instance: TrainingProgramDetailsService | null = null;

  public constructor() {}

  public static getInstance(): TrainingProgramDetailsService {
    if (!TrainingProgramDetailsService.instance) {
      TrainingProgramDetailsService.instance = new TrainingProgramDetailsService();
    }
    return TrainingProgramDetailsService.instance;
  }

  public static setInstance(instance: TrainingProgramDetailsService | null): void {
    TrainingProgramDetailsService.instance = instance;
  }

  public static resetInstance(): void {
    TrainingProgramDetailsService.instance = null;
  }

  /**
   * Get all training program details by slug.
   * If no TrainingProgramDetails document exists (e.g. program created via admin),
   * construct a minimal fallback from the TrainingProgram document so the page never 404s.
   */
  public async getProgramDetailsBySlug(slug: string): Promise<ITrainingProgramDetails> {
    try {
      const program = await TrainingProgram.findOne({ slug, deletedAt: null }).lean();
      let programDetails = await TrainingProgramDetails.findOne({ slug }).lean();

      if (!programDetails) {
        if (!program) {
          throw new NotFoundError('Training program not found');
        }
        programDetails = this.buildFallbackDetails(program);
      }

      // Priority 1: If base TrainingProgram has assigned mentors, use those real assigned mentors
      if (program && (program as any).mentors && (program as any).mentors.length > 0) {
        (programDetails as any).mentors = (program as any).mentors;
      }

      const partners = (program && (program as any).internshipPartners && (program as any).internshipPartners.length > 0)
        ? (program as any).internshipPartners
        : DEFAULT_INTERNSHIP_PARTNERS;

      (programDetails as any).internshipPartners = partners;
      if (program) {
        if (program.startDate && !program.endDate && !program.isDateTBA) {
          const days = program.durationDays || 60;
          if (days > 0) {
            (program as any).endDate = new Date(new Date(program.startDate).getTime() + days * 86400000);
          }
        }
        (programDetails as any).program = { ...program, internshipPartners: partners };
      }

      return programDetails as unknown as ITrainingProgramDetails;
    } catch (error: any) {
      logger.error('Get training program details by slug service error:', error);
      throw error;
    }
  }

  /**
   * Get training program overview — returns empty defaults if no details doc.
   */
  public async getProgramOverview(slug: string): Promise<any> {
    try {
      const programDetails = await TrainingProgramDetails.findOne({ slug })
        .select('overview')
        .lean();

      if (programDetails) return programDetails.overview;

      // Fallback: build from base program
      const program = await TrainingProgram.findOne({ slug, deletedAt: null }).lean();
      if (!program) throw new NotFoundError('Training program not found');

      return { aboutProgram: program.description, whatYouWillLearn: [], prerequisites: [], targetAudience: [] };
    } catch (error: any) {
      logger.error('Get training program overview service error:', error);
      throw error;
    }
  }

  /**
   * Get training program syllabus — returns empty defaults if no details doc.
   */
  public async getProgramSyllabus(slug: string): Promise<any> {
    try {
      const programDetails = await TrainingProgramDetails.findOne({ slug })
        .select('syllabus')
        .lean();

      if (programDetails) return programDetails.syllabus;

      // Fallback: derive from program tools
      const program = await TrainingProgram.findOne({ slug, deletedAt: null }).lean();
      if (!program) throw new NotFoundError('Training program not found');

      return [];
    } catch (error: any) {
      logger.error('Get training program syllabus service error:', error);
      throw error;
    }
  }

  /**
   * Get training program mentors — returns mentors from base program first if assigned.
   */
  public async getProgramMentors(slug: string): Promise<any> {
    try {
      const program = await TrainingProgram.findOne({ slug, deletedAt: null }).lean();
      if (program && (program as any).mentors && (program as any).mentors.length > 0) {
        return (program as any).mentors;
      }

      const programDetails = await TrainingProgramDetails.findOne({ slug })
        .select('mentors')
        .lean();

      if (programDetails && programDetails.mentors) return programDetails.mentors;

      return (program as any)?.mentors || [];
    } catch (error: any) {
      logger.error('Get training program mentors service error:', error);
      throw error;
    }
  }

  /**
   * Get training program FAQs — returns empty array if no details doc.
   */
  public async getProgramFAQs(slug: string): Promise<any> {
    try {
      const programDetails = await TrainingProgramDetails.findOne({ slug }).select('faqs').lean();

      if (programDetails) return programDetails.faqs;

      // Fallback: no FAQs yet
      const program = await TrainingProgram.findOne({ slug, deletedAt: null }).lean();
      if (!program) throw new NotFoundError('Training program not found');

      return [];
    } catch (error: any) {
      logger.error('Get training program FAQs service error:', error);
      throw error;
    }
  }

  /**
   * Build a minimal details fallback from a base TrainingProgram document.
   */
  private buildFallbackDetails(program: any): any {
    return {
      _id: null,
      programId: program._id,
      slug: program.slug,
      overview: {
        aboutProgram: program.description || '',
        whatYouWillLearn: [],
        prerequisites: [],
        targetAudience: [],
      },
      syllabus: [],
      mentors: program.mentors || [],
      faqs: [],
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
    };
  }
}

export const trainingProgramDetailsService = TrainingProgramDetailsService.getInstance();
