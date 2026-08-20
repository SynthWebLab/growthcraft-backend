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

      const processedPrograms = await this.processProgramsCTAs(req, result.programs);

      SuccessResponseHelper.ok(res, { ...result, programs: processedPrograms }, 'Training programs retrieved successfully');
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

      const [processedProgram] = await this.processProgramsCTAs(req, [program]);

      SuccessResponseHelper.ok(res, { program: processedProgram }, 'Training program retrieved successfully');
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

      const processedPrograms = await this.processProgramsCTAs(req, programs);

      SuccessResponseHelper.ok(res, { programs: processedPrograms }, 'Popular training programs retrieved successfully');
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

      const processedPrograms = await this.processProgramsCTAs(req, programs);

      SuccessResponseHelper.ok(res, { programs: processedPrograms }, 'Similar training programs retrieved successfully');
    } catch (error: any) {
      logger.error('Get similar training programs controller error:', error);
      next(error);
    }
  }

  private async processProgramsCTAs(req: Request, programs: any[]): Promise<any[]> {
    const userId = req.user?.userId;
    
    // First map the default CTAs for everyone since they are lean objects
    const mappedPrograms = programs.map(p => {
      const obj = JSON.parse(JSON.stringify(p));
      const defaults = this.getProgramDefaultCTAs(obj.status);
      obj.primaryCTA = defaults.primaryCTA;
      obj.secondaryCTA = defaults.secondaryCTA;
      obj.canEnroll = defaults.canEnroll;
      obj.isEnrolled = false;
      obj.hasCallbackRequest = false;
      return obj;
    });

    if (!userId || mappedPrograms.length === 0) {
      return mappedPrograms;
    }

    const programIds = mappedPrograms.map(p => (p._id || p.id).toString());
    const { TrainingProgramEnrollment } = await import('@/database/models/TrainingProgramEnrollment.model');
    const { TrainingProgramCallbackRequest } = await import('@/database/models/TrainingProgramCallbackRequest.model');

    const enrollments = await TrainingProgramEnrollment.find({
      userId,
      programId: { $in: programIds },
      status: { $in: ['confirmed', 'active', 'completed', 'enrolled'] },
      paymentStatus: { $nin: ['pending', 'failed', 'cancelled', 'unpaid'] },
    }).select('programId').lean().exec();

    const callbacks = await TrainingProgramCallbackRequest.find({
      userId,
      programId: { $in: programIds },
      status: 'pending',
    }).select('programId').lean().exec();

    const enrolledSet = new Set(enrollments.map(e => e.programId.toString()));
    const callbackSet = new Set(callbacks.map(c => c.programId.toString()));

    return mappedPrograms.map(obj => {
      const programIdStr = (obj._id || obj.id).toString();
      const isEnrolled = enrolledSet.has(programIdStr);
      const hasCallback = callbackSet.has(programIdStr);

      obj.isEnrolled = isEnrolled;
      obj.hasCallbackRequest = hasCallback;

      if (isEnrolled) {
        obj.primaryCTA = 'Already Enrolled';
        obj.secondaryCTA = null;
      } else if (hasCallback) {
        if (obj.primaryCTA && obj.primaryCTA.toLowerCase().includes('register')) {
          obj.primaryCTA = 'Interest Registered';
          obj.secondaryCTA = null;
        } else if (obj.primaryCTA && obj.primaryCTA.toLowerCase().includes('callback')) {
          obj.primaryCTA = 'Callback Requested';
          obj.secondaryCTA = null;
        } else {
          obj.secondaryCTA = 'Callback Requested';
        }
      }

      return obj;
    });
  }

  private getProgramDefaultCTAs(status: string) {
    switch (status) {
      case 'active':
        return { primaryCTA: 'Enroll Now', secondaryCTA: 'Request Callback', canEnroll: true };
      case 'coming-soon':
        return { primaryCTA: 'Register Interest', secondaryCTA: null, canEnroll: false };
      case 'draft':
      default:
        return { primaryCTA: 'Request Callback', secondaryCTA: null, canEnroll: false };
    }
  }
}

export const trainingProgramController = TrainingProgramController.getInstance();
