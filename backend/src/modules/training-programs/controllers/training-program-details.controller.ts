import { Request, Response, NextFunction } from 'express';
import { trainingProgramDetailsService } from '../services/training-program-details.service';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { logger } from '@/common/utils/logger.util';

export class TrainingProgramDetailsController {
  private static instance: TrainingProgramDetailsController;

  private constructor() {}

  public static getInstance(): TrainingProgramDetailsController {
    if (!TrainingProgramDetailsController.instance) {
      TrainingProgramDetailsController.instance = new TrainingProgramDetailsController();
    }
    return TrainingProgramDetailsController.instance;
  }

  /**
   * Get all training program details (overview, syllabus, mentors, FAQs)
   * GET /api/v1/training-programs/:slug/details
   */
  public async getAllDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      let programDetails = await trainingProgramDetailsService.getProgramDetailsBySlug(slug);

      // Only check enrollment if we have a real programId (not a fallback null)
      if (req.user?.userId && programDetails && (programDetails as any).programId) {
        const userId = req.user.userId;
        const { TrainingProgramEnrollment } = await import('@/database/models/TrainingProgramEnrollment.model');
        const { TrainingProgramCallbackRequest } = await import('@/database/models/TrainingProgramCallbackRequest.model');
        
        const programIdStr = (programDetails as any).programId?.toString();
        if (programIdStr) {
          const isEnrolled = await TrainingProgramEnrollment.findOne({
            userId,
            programId: programIdStr,
            status: { $in: ['pending', 'confirmed'] },
          }).select('_id').lean().exec();
          
          const hasCallback = await TrainingProgramCallbackRequest.findOne({
            userId,
            programId: programIdStr,
            status: 'pending',
          }).select('_id').lean().exec();
          
          programDetails = JSON.parse(JSON.stringify(programDetails));
          (programDetails as any).isEnrolled = !!isEnrolled;
          (programDetails as any).hasCallbackRequest = !!hasCallback;
        }
      }

      SuccessResponseHelper.ok(res, { programDetails }, 'Training program details retrieved successfully');
    } catch (error: any) {
      logger.error('Get all training program details controller error:', error);
      next(error);
    }
  }

  /**
   * Get training program overview
   * GET /api/v1/training-programs/:slug/overview
   */
  public async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const overview = await trainingProgramDetailsService.getProgramOverview(slug);

      SuccessResponseHelper.ok(res, { overview }, 'Training program overview retrieved successfully');
    } catch (error: any) {
      logger.error('Get training program overview controller error:', error);
      next(error);
    }
  }

  /**
   * Get training program syllabus
   * GET /api/v1/training-programs/:slug/syllabus
   */
  public async getSyllabus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const syllabus = await trainingProgramDetailsService.getProgramSyllabus(slug);

      SuccessResponseHelper.ok(res, { syllabus }, 'Training program syllabus retrieved successfully');
    } catch (error: any) {
      logger.error('Get training program syllabus controller error:', error);
      next(error);
    }
  }

  /**
   * Get training program mentors
   * GET /api/v1/training-programs/:slug/mentors
   */
  public async getMentors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const mentors = await trainingProgramDetailsService.getProgramMentors(slug);

      SuccessResponseHelper.ok(res, { mentors }, 'Training program mentors retrieved successfully');
    } catch (error: any) {
      logger.error('Get training program mentors controller error:', error);
      next(error);
    }
  }

  /**
   * Get training program FAQs
   * GET /api/v1/training-programs/:slug/faqs
   */
  public async getFAQs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const faqs = await trainingProgramDetailsService.getProgramFAQs(slug);

      SuccessResponseHelper.ok(res, { faqs }, 'Training program FAQs retrieved successfully');
    } catch (error: any) {
      logger.error('Get training program FAQs controller error:', error);
      next(error);
    }
  }
}

export const trainingProgramDetailsController = TrainingProgramDetailsController.getInstance();
