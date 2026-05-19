import { Request, Response, NextFunction } from 'express';
import { courseDetailsService } from '../services/course-details.service';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { logger } from '@/common/utils/logger.util';

class CourseDetailsController {
  /**
   * Get all course details (overview, curriculum, instructor, FAQs)
   * GET /api/v1/courses/:slug/details
   */
  public async getAllDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const courseDetails = await courseDetailsService.getCourseDetailsBySlug(slug);

      SuccessResponseHelper.ok(res, { courseDetails }, 'Course details retrieved successfully');
    } catch (error: any) {
      logger.error('Get all course details controller error:', error);
      next(error);
    }
  }

  /**
   * Get course overview
   * GET /api/v1/courses/:slug/overview
   */
  public async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const overview = await courseDetailsService.getCourseOverview(slug);

      SuccessResponseHelper.ok(res, { overview }, 'Course overview retrieved successfully');
    } catch (error: any) {
      logger.error('Get course overview controller error:', error);
      next(error);
    }
  }

  /**
   * Get course curriculum
   * GET /api/v1/courses/:slug/curriculum
   */
  public async getCurriculum(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const curriculum = await courseDetailsService.getCourseCurriculum(slug);

      SuccessResponseHelper.ok(res, { curriculum }, 'Course curriculum retrieved successfully');
    } catch (error: any) {
      logger.error('Get course curriculum controller error:', error);
      next(error);
    }
  }

  /**
   * Get course instructor details
   * GET /api/v1/courses/:slug/instructor
   */
  public async getInstructor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const instructor = await courseDetailsService.getCourseInstructor(slug);

      SuccessResponseHelper.ok(res, { instructor }, 'Course instructor retrieved successfully');
    } catch (error: any) {
      logger.error('Get course instructor controller error:', error);
      next(error);
    }
  }

  /**
   * Get course FAQs
   * GET /api/v1/courses/:slug/faqs
   */
  public async getFAQs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const faqs = await courseDetailsService.getCourseFAQs(slug);

      SuccessResponseHelper.ok(res, { faqs }, 'Course FAQs retrieved successfully');
    } catch (error: any) {
      logger.error('Get course FAQs controller error:', error);
      next(error);
    }
  }
}

export const courseDetailsController = new CourseDetailsController();
