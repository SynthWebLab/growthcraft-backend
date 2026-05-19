import { Request, Response, NextFunction } from 'express';
import { courseConfigService } from '../services/course-config.service';
import { logger } from '@/common/utils/logger.util';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { ValidationError } from '@/common/errors/ValidationError';

export class CourseConfigController {
  private static instance: CourseConfigController;

  private constructor() {}

  public static getInstance(): CourseConfigController {
    if (!CourseConfigController.instance) {
      CourseConfigController.instance = new CourseConfigController();
    }
    return CourseConfigController.instance;
  }

  /**
   * Get all course configurations
   * GET /api/v1/courses/config
   */
  public async getAllConfigs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const configs = await courseConfigService.getAllConfigs();
      SuccessResponseHelper.ok(res, configs, 'Course configurations retrieved successfully');
    } catch (error: any) {
      logger.error('Get all configs controller error:', error);
      next(error);
    }
  }

  /**
   * Get categories
   * GET /api/v1/courses/config/categories
   */
  public async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await courseConfigService.getCategories();
      SuccessResponseHelper.ok(res, { categories }, 'Categories retrieved successfully');
    } catch (error: any) {
      logger.error('Get categories controller error:', error);
      next(error);
    }
  }

  /**
   * Get difficulty levels
   * GET /api/v1/courses/config/difficulty-levels
   */
  public async getDifficultyLevels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const difficultyLevels = await courseConfigService.getDifficultyLevels();
      SuccessResponseHelper.ok(res, { difficultyLevels }, 'Difficulty levels retrieved successfully');
    } catch (error: any) {
      logger.error('Get difficulty levels controller error:', error);
      next(error);
    }
  }

  /**
   * Get course types
   * GET /api/v1/courses/config/course-types
   */
  public async getCourseTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseTypes = await courseConfigService.getCourseTypes();
      SuccessResponseHelper.ok(res, { courseTypes }, 'Course types retrieved successfully');
    } catch (error: any) {
      logger.error('Get course types controller error:', error);
      next(error);
    }
  }

  /**
   * Update configuration (Admin only)
   * PUT /api/v1/courses/config/:key
   */
  public async updateConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;
      const { values } = req.body;

      // Validate key
      const validKeys = ['categories', 'difficultyLevels', 'courseTypes'];
      if (!validKeys.includes(key)) {
        throw new ValidationError('Invalid configuration key', [
          {
            field: 'key',
            message: `Key must be one of: ${validKeys.join(', ')}`,
            value: key,
          },
        ]);
      }

      // Validate values
      if (!Array.isArray(values) || values.length === 0) {
        throw new ValidationError('Invalid values', [
          {
            field: 'values',
            message: 'Values must be a non-empty array of strings',
            value: values,
          },
        ]);
      }

      // Validate all values are strings
      if (!values.every((v) => typeof v === 'string' && v.trim().length > 0)) {
        throw new ValidationError('Invalid values', [
          {
            field: 'values',
            message: 'All values must be non-empty strings',
            value: values,
          },
        ]);
      }

      const config = await courseConfigService.updateConfig(key, values);
      SuccessResponseHelper.ok(res, { config }, 'Configuration updated successfully');
    } catch (error: any) {
      logger.error('Update config controller error:', error);
      next(error);
    }
  }

  /**
   * Clear cache (Admin only)
   * POST /api/v1/courses/config/clear-cache
   */
  public async clearCache(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      courseConfigService.clearCache();
      SuccessResponseHelper.ok(res, null, 'Cache cleared successfully');
    } catch (error: any) {
      logger.error('Clear cache controller error:', error);
      next(error);
    }
  }
}

export const courseConfigController = CourseConfigController.getInstance();
