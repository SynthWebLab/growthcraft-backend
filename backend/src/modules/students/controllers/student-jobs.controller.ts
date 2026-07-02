import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { studentJobsService } from '../services/student-jobs.service';
import { logger } from '@/common/utils/logger.util';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { ValidationError } from '@/common/errors/ValidationError';

export class StudentJobsController {
  private static instance: StudentJobsController;

  private constructor() {}

  public static getInstance(): StudentJobsController {
    if (!StudentJobsController.instance) {
      StudentJobsController.instance = new StudentJobsController();
    }
    return StudentJobsController.instance;
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
   * GET /api/v1/students/jobs
   */
  public async getJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = this.getUserId(req);
      const jobs = await studentJobsService.getJobs(studentId);
      SuccessResponseHelper.ok(res, jobs, 'Jobs list retrieved successfully');
    } catch (error: any) {
      logger.error('StudentJobsController getJobs error:', error);
      next(error);
    }
  }

  /**
   * POST /api/v1/students/jobs/:id/apply
   */
  public async applyJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.assertValid(req);
      const studentId = this.getUserId(req);
      const jobId = req.params.id;
      const application = await studentJobsService.applyJob(studentId, jobId, req.body);
      SuccessResponseHelper.created(res, application, 'Applied for job successfully');
    } catch (error: any) {
      logger.error('StudentJobsController applyJob error:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/students/applications
   */
  public async getApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = this.getUserId(req);
      const applications = await studentJobsService.getApplications(studentId);
      SuccessResponseHelper.ok(res, applications, 'Submitted applications retrieved successfully');
    } catch (error: any) {
      logger.error('StudentJobsController getApplications error:', error);
      next(error);
    }
  }

  /**
   * POST /api/v1/students/resume/upload
   */
  public async uploadResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new ValidationError('No resume file uploaded.');
      }

      const host = req.get('host');
      const protocol = req.protocol;
      const resumeUrl = `${protocol}://${host}/uploads/resumes/${req.file.filename}`;

      SuccessResponseHelper.ok(res, { resumeUrl }, 'Resume uploaded successfully');
    } catch (error: any) {
      logger.error('StudentJobsController uploadResume error:', error);
      next(error);
    }
  }
}

export const studentJobsController = StudentJobsController.getInstance();

