import { Request, Response, NextFunction } from 'express';
import { catalogueService } from '../services/catalogue.service';
import { bootcampService } from '@/modules/bootcamps/services/bootcamp.service';
import { CatalogueQueryParams } from '@/common/interfaces/catalogue.interface';
import { logger } from '@/common/utils/logger.util';
import { NotFoundError } from '@/common/errors/NotFoundError';

export class CatalogueController {
  private static instance: CatalogueController;

  private constructor() {}

  public static getInstance(): CatalogueController {
    if (!CatalogueController.instance) {
      CatalogueController.instance = new CatalogueController();
    }
    return CatalogueController.instance;
  }

  /**
   * Get courses (public endpoint)
   * GET /api/v1/courses
   */
  public async getCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams: CatalogueQueryParams = {
        type: 'course', // Force type to course
        cursor: req.query.cursor as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        category: req.query.category ? (req.query.category as string).trim() : undefined,
        level: req.query.level ? (req.query.level as string).trim() : undefined,
        difficultyLevel: req.query.difficultyLevel ? (req.query.difficultyLevel as string).trim() : undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
        tags: req.query.tags ? (req.query.tags as string).trim() : undefined,
        search: req.query.search ? (req.query.search as string).trim() : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
      };

      const result = await catalogueService.getCatalogueItems(queryParams);

      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get courses controller error:', error);
      next(error);
    }
  }

  /**
   * Get bootcamps (public endpoint)
   * GET /api/v1/bootcamps
   */
  public async getBootcamps(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams: CatalogueQueryParams = {
        type: 'bootcamp', // Force type to bootcamp
        cursor: req.query.cursor as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        category: req.query.category ? (req.query.category as string).trim() : undefined,
        mode: req.query.mode ? (req.query.mode as string).trim() as any : undefined,
        status: req.query.status ? (req.query.status as string).trim() : undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
        tags: req.query.tags ? (req.query.tags as string).trim() : undefined,
        search: req.query.search ? (req.query.search as string).trim() : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
      };

      const result = await catalogueService.getCatalogueItems(queryParams);

      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get bootcamps controller error:', error);
      next(error);
    }
  }

  /**
   * Get bootcamp by slug (public endpoint)
   * GET /api/v1/bootcamps/:slug
   */
  public async getBootcampBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const bootcamp = await bootcampService.getBootcampBySlug(slug);

      if (!bootcamp) {
        throw new NotFoundError(`Bootcamp with slug '${slug}' not found`, 'BOOTCAMP_NOT_FOUND');
      }

      res.status(200).json({ bootcamp });
    } catch (error: any) {
      logger.error('Get bootcamp by slug controller error:', error);
      next(error);
    }
  }

  /**
   * Get bootcamp by ID (public endpoint)
   * GET /api/v1/bootcamps/id/:id
   */
  public async getBootcampById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const bootcamp = await bootcampService.getBootcampById(id);

      if (!bootcamp) {
        throw new NotFoundError(`Bootcamp with ID '${id}' not found`, 'BOOTCAMP_NOT_FOUND');
      }

      res.status(200).json({ bootcamp });
    } catch (error: any) {
      logger.error('Get bootcamp by ID controller error:', error);
      next(error);
    }
  }

  /**
   * Get detailed course by slug (public endpoint)
   * GET /api/v1/courses/:slug
   * Returns course with eager-loaded modules, instructor, FAQ, and next 3 upcoming batches
   */
  public async getCourseDetailBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const courseDetail = await catalogueService.getCourseDetailBySlug(slug);

      res.status(200).json(courseDetail);
    } catch (error: any) {
      logger.error('Get course detail by slug controller error:', error);
      next(error);
    }
  }

  /**
   * Get detailed course by ID (public endpoint)
   * GET /api/v1/courses/id/:id
   * Returns course with eager-loaded modules, instructor, FAQ, and next 3 upcoming batches
   */
  public async getCourseDetailById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const courseDetail = await catalogueService.getCourseDetailById(id);

      res.status(200).json(courseDetail);
    } catch (error: any) {
      logger.error('Get course detail by ID controller error:', error);
      next(error);
    }
  }

  /**
   * Get detailed bootcamp by slug (public endpoint)
   * GET /api/v1/bootcamps/:slug (enhanced version)
   * Returns bootcamp with all details
   */
  public async getBootcampDetailBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const bootcampDetail = await catalogueService.getBootcampDetailBySlug(slug);

      res.status(200).json(bootcampDetail);
    } catch (error: any) {
      logger.error('Get bootcamp detail by slug controller error:', error);
      next(error);
    }
  }

  /**
   * Get detailed bootcamp by ID (public endpoint)
   * GET /api/v1/bootcamps/id/:id (enhanced version)
   * Returns bootcamp with all details
   */
  public async getBootcampDetailById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const bootcampDetail = await catalogueService.getBootcampDetailById(id);

      res.status(200).json(bootcampDetail);
    } catch (error: any) {
      logger.error('Get bootcamp detail by ID controller error:', error);
      next(error);
    }
  }

  /**
   * Get training programs (public endpoint)
   * GET /api/v1/training-programs
   */
  public async getTrainingPrograms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams: CatalogueQueryParams = {
        type: 'training-program',
        cursor: req.query.cursor as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        category: req.query.category ? (req.query.category as string).trim() : undefined,
        level: req.query.level ? (req.query.level as string).trim() : undefined,
        mode: req.query.mode ? (req.query.mode as string).trim() as any : undefined,
        status: req.query.status ? (req.query.status as string).trim() : undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
        tags: req.query.tags ? (req.query.tags as string).trim() : undefined,
        search: req.query.search ? (req.query.search as string).trim() : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
      };

      const result = await catalogueService.getTrainingPrograms(queryParams);

      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get training programs controller error:', error);
      next(error);
    }
  }

  /**
   * Get detailed training program by slug (public endpoint)
   * GET /api/v1/training-programs/:slug
   */
  public async getTrainingProgramDetailBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const programDetail = await catalogueService.getTrainingProgramDetailBySlug(slug);

      res.status(200).json(programDetail);
    } catch (error: any) {
      logger.error('Get training program detail by slug controller error:', error);
      next(error);
    }
  }

  /**
   * Get detailed training program by ID (public endpoint)
   * GET /api/v1/training-programs/id/:id
   */
  public async getTrainingProgramDetailById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const programDetail = await catalogueService.getTrainingProgramDetailById(id);

      res.status(200).json(programDetail);
    } catch (error: any) {
      logger.error('Get training program detail by ID controller error:', error);
      next(error);
    }
  }
}

export const catalogueController = CatalogueController.getInstance();
