import { Request, Response, NextFunction } from 'express';
import { publicMentorService } from '../services/mentor.service';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { logger } from '@/common/utils/logger.util';

export class PublicMentorController {
  private static instance: PublicMentorController | null = null;

  private constructor() {}

  public static getInstance(): PublicMentorController {
    if (!PublicMentorController.instance) {
      PublicMentorController.instance = new PublicMentorController();
    }
    return PublicMentorController.instance;
  }

  /**
   * GET /api/v1/mentors
   * Retrieve active public mentors
   */
  public async getMentors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const search = req.query.search ? (req.query.search as string) : undefined;
      const areaOfExpertise = req.query.areaOfExpertise
        ? (req.query.areaOfExpertise as string)
        : undefined;
      const sortBy = req.query.sortBy as any;
      const sortOrder = req.query.sortOrder as any;

      const result = await publicMentorService.getMentors({
        limit,
        page,
        search,
        areaOfExpertise,
        sortBy,
        sortOrder,
      });

      SuccessResponseHelper.ok(res, result, 'Mentors retrieved successfully');
    } catch (error: any) {
      logger.error('PublicMentorController.getMentors error:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/mentors/:id
   * Retrieve single public mentor details
   */
  public async getMentorById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const mentor = await publicMentorService.getMentorById(id);
      SuccessResponseHelper.ok(res, { mentor }, 'Mentor retrieved successfully');
    } catch (error: any) {
      logger.error('PublicMentorController.getMentorById error:', error);
      next(error);
    }
  }
}

export const publicMentorController = PublicMentorController.getInstance();
