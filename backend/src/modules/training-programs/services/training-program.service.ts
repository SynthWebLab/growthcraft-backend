import { TrainingProgram, ITrainingProgram } from '@/database/models';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { logger } from '@/common/utils/logger.util';

export class TrainingProgramService {
  private static instance: TrainingProgramService;

  private constructor() {}

  public static getInstance(): TrainingProgramService {
    if (!TrainingProgramService.instance) {
      TrainingProgramService.instance = new TrainingProgramService();
    }
    return TrainingProgramService.instance;
  }

  /**
   * Get all published training programs with filtering and pagination
   */
  public async getAllPrograms(filters: {
    domain?: string;
    level?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ programs: ITrainingProgram[]; total: number; page: number; totalPages: number }> {
    try {
      const {
        domain,
        level,
        status = 'active',
        search,
        page = 1,
        limit = 12,
        sortBy = 'enrollmentCount',
        sortOrder = 'desc',
      } = filters;

      // Build query
      const query: any = {
        isPublished: true,
        deletedAt: null,
      };

      if (domain) {
        query.domain = domain;
      }

      if (level) {
        query.level = level;
      }

      if (status) {
        query.status = status;
      }

      if (search) {
        query.$text = { $search: search };
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Build sort: Featured first, then most recent (updatedAt/createdAt)
      const sort: any = { isFeatured: -1, updatedAt: -1, createdAt: -1 };
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query
      const [programs, total] = await Promise.all([
        TrainingProgram.find(query).sort(sort).skip(skip).limit(limit).lean(),
        TrainingProgram.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        programs: programs as unknown as ITrainingProgram[],
        total,
        page,
        totalPages,
      };
    } catch (error: any) {
      logger.error('Get all training programs service error:', error);
      throw error;
    }
  }

  /**
   * Get training program by slug
   */
  public async getProgramBySlug(slug: string): Promise<ITrainingProgram> {
    try {
      const program = await TrainingProgram.findOne({
        slug,
        isPublished: true,
        deletedAt: null,
      }).lean();

      if (!program) {
        throw new NotFoundError('Training program not found');
      }

      return program as unknown as ITrainingProgram;
    } catch (error: any) {
      logger.error('Get training program by slug service error:', error);
      throw error;
    }
  }

  /**
   * Get training program by ID
   */
  public async getProgramById(programId: string): Promise<ITrainingProgram> {
    try {
      const program = await TrainingProgram.findOne({
        _id: programId,
        isPublished: true,
        deletedAt: null,
      }).lean();

      if (!program) {
        throw new NotFoundError('Training program not found');
      }

      return program as unknown as ITrainingProgram;
    } catch (error: any) {
      logger.error('Get training program by ID service error:', error);
      throw error;
    }
  }

  /**
   * Get all unique domains for filtering
   */
  public async getAllDomains(): Promise<string[]> {
    try {
      const domains = await TrainingProgram.distinct('domain', {
        isPublished: true,
        deletedAt: null,
      });

      return domains;
    } catch (error: any) {
      logger.error('Get all domains service error:', error);
      throw error;
    }
  }

  /**
   * Get popular training programs
   */
  public async getPopularPrograms(limit: number = 6): Promise<ITrainingProgram[]> {
    try {
      const programs = await TrainingProgram.find({
        isPublished: true,
        status: 'active',
        deletedAt: null,
      })
        .sort({ enrollmentCount: -1, rating: -1 })
        .limit(limit)
        .lean();

      return programs as unknown as ITrainingProgram[];
    } catch (error: any) {
      logger.error('Get popular training programs service error:', error);
      throw error;
    }
  }

  /**
   * Get similar training programs
   */
  public async getSimilarPrograms(
    programId: string,
    domain: string,
    limit: number = 4
  ): Promise<ITrainingProgram[]> {
    try {
      const programs = await TrainingProgram.find({
        _id: { $ne: programId },
        domain,
        isPublished: true,
        status: 'active',
        deletedAt: null,
      })
        .sort({ enrollmentCount: -1, rating: -1 })
        .limit(limit)
        .lean();

      return programs as unknown as ITrainingProgram[];
    } catch (error: any) {
      logger.error('Get similar training programs service error:', error);
      throw error;
    }
  }
}

export const trainingProgramService = TrainingProgramService.getInstance();
