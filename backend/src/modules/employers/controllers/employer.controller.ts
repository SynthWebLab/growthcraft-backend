import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { employerService } from '../services/employer.service';
import { logger } from '@/common/utils/logger.util';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { ValidationError } from '@/common/errors/ValidationError';

export class EmployerController {
  private static instance: EmployerController;

  private constructor() {}

  public static getInstance(): EmployerController {
    if (!EmployerController.instance) {
      EmployerController.instance = new EmployerController();
    }
    return EmployerController.instance;
  }

  private getUserId(req: Request): string {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ValidationError('User authentication required');
    }
    return userId;
  }

  private assertValid(req: Request): void {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = errors.array().map((err: any) => ({
        field: err.path || err.param || 'unknown',
        message: err.msg,
        value: err.value,
      }));
      throw new ValidationError('Validation failed', validationErrors);
    }
  }

  /**
   * GET /api/v1/employers/dashboard
   */
  public async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const dashboard = await employerService.getDashboard(userId);
      SuccessResponseHelper.ok(res, dashboard, 'Dashboard retrieved successfully');
    } catch (error: any) {
      logger.error('Get employer dashboard controller error:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/talent
   */
  public async getTalentPool(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const talent = await employerService.getTalentPool();
      SuccessResponseHelper.ok(res, talent, 'Talent pool retrieved successfully');
    } catch (error: any) {
      logger.error('Get talent pool controller error:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/employers/jobs
   */
  public async getJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const jobs = await employerService.getJobs(userId);
      SuccessResponseHelper.ok(res, jobs, 'Jobs retrieved successfully');
    } catch (error: any) {
      logger.error('Get jobs controller error:', error);
      next(error);
    }
  }

  /**
   * POST /api/v1/employers/jobs
   */
  public async createJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.assertValid(req);
      const userId = this.getUserId(req);
      const job = await employerService.createJob(userId, req.body);
      SuccessResponseHelper.created(res, job, 'Job posting created successfully');
    } catch (error: any) {
      logger.error('Create job controller error:', error);
      next(error);
    }
  }

  /**
   * PUT /api/v1/employers/jobs/:id
   */
  public async updateJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.assertValid(req);
      const userId = this.getUserId(req);
      const jobId = req.params.id;
      const job = await employerService.updateJob(userId, jobId, req.body);
      SuccessResponseHelper.ok(res, job, 'Job posting updated successfully');
    } catch (error: any) {
      logger.error('Update job controller error:', error);
      next(error);
    }
  }

  /**
   * PATCH /api/v1/employers/jobs/:id/status
   */
  public async updateJobStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.assertValid(req);
      const userId = this.getUserId(req);
      const jobId = req.params.id;
      const { status } = req.body;
      const job = await employerService.updateJobStatus(userId, jobId, status);
      SuccessResponseHelper.ok(res, job, 'Job status updated successfully');
    } catch (error: any) {
      logger.error('Update job status controller error:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/v1/employers/jobs/:id
   */
  public async deleteJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const jobId = req.params.id;
      await employerService.deleteJob(userId, jobId);
      SuccessResponseHelper.ok(res, null, 'Job posting deleted successfully');
    } catch (error: any) {
      logger.error('Delete job controller error:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/employers/profile
   */
  public async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const profile = await employerService.getProfile(userId);
      SuccessResponseHelper.ok(res, profile, 'Profile retrieved successfully');
    } catch (error: any) {
      logger.error('Get employer profile controller error:', error);
      next(error);
    }
  }

  /**
   * PATCH /api/v1/employers/profile
   */
  public async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.assertValid(req);
      const userId = this.getUserId(req);
      const profile = await employerService.updateProfile(userId, req.body);
      SuccessResponseHelper.ok(res, profile, 'Profile updated successfully');
    } catch (error: any) {
      logger.error('Update employer profile controller error:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/public/jobs
   */
  public async getPublicActiveJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobs = await employerService.getPublicActiveJobs();
      SuccessResponseHelper.ok(res, jobs, 'Active public jobs retrieved successfully');
    } catch (error: any) {
      logger.error('Get public active jobs controller error:', error);
      next(error);
    }
  }
}

export const employerController = EmployerController.getInstance();
