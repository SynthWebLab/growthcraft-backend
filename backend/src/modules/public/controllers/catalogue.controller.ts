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
}

export const catalogueController = CatalogueController.getInstance();
