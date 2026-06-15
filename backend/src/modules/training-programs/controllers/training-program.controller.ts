import { Request, Response, NextFunction } from 'express';
import { trainingProgramService } from '../services/training-program.service';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { logger } from '@/common/utils/logger.util';

export class TrainingProgramController {
  private static instance: TrainingProgramController;

  private constructor() {}

  public static getInstance(): TrainingProgramController {
    if (!TrainingProgramController.instance) {
      TrainingProgramController.instance = new TrainingProgramController();
    }
    return TrainingProgramController.instance;
  }

  /**
   * Get all training programs with filtering and pagination
   * GET /api/v1/training-programs
   */
  public async getAllPrograms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        domain,
        level,
        status,
        search,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await trainingProgramService.getAllPrograms({
        domain: domain as string,
        level: level as string,
        status: status as string,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      SuccessResponseHelper.ok(res, result, 'Training programs retrieved successfully');
    } catch (error: any) {
      logger.error('Get all training programs controller error:', error);
      next(error);
    }
  }

  /**
   * Get training program by slug
   * GET /api/v1/training-programs/:slug
   */
  public async getProgramBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const program = await trainingProgramService.getProgramBySlug(slug);

      SuccessResponseHelper.ok(res, { program }, 'Training program retrieved successfully');
    } catch (error: any) {
      logger.error('Get training program by slug controller error:', error);
      next(error);
    }
  }

  /**
   * Get all domains for filtering
   * GET /api/v1/training-programs/filters/domains
   */
  public async getAllDomains(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const domains = await trainingProgramService.getAllDomains();

      SuccessResponseHelper.ok(res, { domains }, 'Domains retrieved successfully');
    } catch (error: any) {
      logger.error('Get all domains controller error:', error);
      next(error);
    }
  }

  /**
   * Get popular training programs
   * GET /api/v1/training-programs/popular
   */
  public async getPopularPrograms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit } = req.query;

      const programs = await trainingProgramService.getPopularPrograms(
        limit ? parseInt(limit as string) : undefined
      );

      SuccessResponseHelper.ok(res, { programs }, 'Popular training programs retrieved successfully');
    } catch (error: any) {
      logger.error('Get popular training programs controller error:', error);
      next(error);
    }
  }

  /**
   * Get similar training programs
   * GET /api/v1/training-programs/:slug/similar
   */
  public async getSimilarPrograms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const { limit } = req.query;

      // First get the program to extract domain and ID
      const program = await trainingProgramService.getProgramBySlug(slug);

      const programs = await trainingProgramService.getSimilarPrograms(
        program._id.toString(),
        program.domain,
        limit ? parseInt(limit as string) : undefined
      );

      SuccessResponseHelper.ok(res, { programs }, 'Similar training programs retrieved successfully');
    } catch (error: any) {
      logger.error('Get similar training programs controller error:', error);
      next(error);
    }
  }
}

export const trainingProgramController = TrainingProgramController.getInstance();
