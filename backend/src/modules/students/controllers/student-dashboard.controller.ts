
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { studentDashboardService } from '../services/student-dashboard.service';
import { logger } from '@/common/utils/logger.util';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { ValidationError } from '@/common/errors/ValidationError';
import { EventType } from '@/database/models/Bootcamp.model';

export class StudentDashboardController {
  private static instance: StudentDashboardController;

  private constructor() {}

  public static getInstance(): StudentDashboardController {
    if (!StudentDashboardController.instance) {
      StudentDashboardController.instance = new StudentDashboardController();
    }
    return StudentDashboardController.instance;
  }

  private getUserId(req: Request): string {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ValidationError('User authentication required');
    }
    return userId;
  }

  /**
   * Get aggregated student dashboard
   * GET /api/v1/students/dashboard
   */
  public async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const dashboard = await studentDashboardService.getDashboard(userId);
      SuccessResponseHelper.ok(res, dashboard, 'Dashboard retrieved successfully');
    } catch (error: any) {
      logger.error('Get student dashboard controller error:', error);
      next(error);
    }
  }

  /**
   * Get student profile
   * GET /api/v1/students/profile
   */
  public async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const profile = await studentDashboardService.getProfile(userId);
      SuccessResponseHelper.ok(res, { profile }, 'Profile retrieved successfully');
    } catch (error: any) {
      logger.error('Get student profile controller error:', error);
      next(error);
    }
  }

  /**
   * Create or update the authenticated student's profile
   * PUT /api/v1/students/profile
   */
  public async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = errors.array().map((err: any) => ({
          field: err.path || err.param || 'unknown',
          message: err.msg,
          value: err.value,
        }));
        throw new ValidationError('Validation failed', validationErrors);
      }

      const userId = this.getUserId(req);
      const profile = await studentDashboardService.updateProfile(userId, req.body);
      SuccessResponseHelper.ok(res, { profile }, 'Profile updated successfully');
    } catch (error: any) {
      logger.error('Update student profile controller error:', error);
      next(error);
    }
  }

  /**
   * Get student's enrolled courses
   * GET /api/v1/students/courses
   */
  public async getCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const courses = await studentDashboardService.getCourses(userId);
      SuccessResponseHelper.ok(res, { courses }, 'Courses retrieved successfully');
    } catch (error: any) {
      logger.error('Get student courses controller error:', error);
      next(error);
    }
  }

  /**
   * Get student's enrolled bootcamps
   * GET /api/v1/students/bootcamps
   */
  public async getBootcamps(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const bootcamps = await studentDashboardService.getEvents(userId, EventType.BOOTCAMP);
      SuccessResponseHelper.ok(res, { bootcamps }, 'Bootcamps retrieved successfully');
    } catch (error: any) {
      logger.error('Get student bootcamps controller error:', error);
      next(error);
    }
  }

  /**
   * Get student's enrolled cohort batches
   * GET /api/v1/students/batches
   */
  public async getBatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const batches = await studentDashboardService.getBatches(userId);
      SuccessResponseHelper.ok(res, { batches }, 'Batches retrieved successfully');
    } catch (error: any) {
      logger.error('Get student batches controller error:', error);
      next(error);
    }
  }

  /**
   * Get student's enrolled workshops
   * GET /api/v1/students/workshops
   */
  public async getWorkshops(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const workshops = await studentDashboardService.getEvents(userId, EventType.WORKSHOP);
      SuccessResponseHelper.ok(res, { workshops }, 'Workshops retrieved successfully');
    } catch (error: any) {
      logger.error('Get student workshops controller error:', error);
      next(error);
    }
  }

  /**
   * Get student's enrolled hackathons
   * GET /api/v1/students/hackathons
   */
  public async getHackathons(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const hackathons = await studentDashboardService.getEvents(userId, EventType.HACKATHON);
      SuccessResponseHelper.ok(res, { hackathons }, 'Hackathons retrieved successfully');
    } catch (error: any) {
      logger.error('Get student hackathons controller error:', error);
      next(error);
    }
  }

  /**
   * Get student's enrolled events (optionally filtered by ?type=)
   * GET /api/v1/students/events
   */
  public async getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);

      let eventType: EventType | undefined;
      const typeParam = req.query.type;
      if (typeof typeParam === 'string' && typeParam.length > 0) {
        const match = Object.values(EventType).find(
          (value) => value.toLowerCase() === typeParam.toLowerCase()
        );
        if (!match) {
          throw new ValidationError(
            `Invalid event type. Allowed values: ${Object.values(EventType).join(', ')}`
          );
        }
        eventType = match;
      }

      const events = await studentDashboardService.getEvents(userId, eventType);
      SuccessResponseHelper.ok(res, { events }, 'Events retrieved successfully');
    } catch (error: any) {
      logger.error('Get student events controller error:', error);
      next(error);
    }
  }

  /**
   * Get student's enrolled training programs
   * GET /api/v1/students/training-programs
   */
  public async getTrainingPrograms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const trainingPrograms = await studentDashboardService.getTrainingPrograms(userId);
      SuccessResponseHelper.ok(
        res,
        { trainingPrograms },
        'Training programs retrieved successfully'
      );
    } catch (error: any) {
      logger.error('Get student training programs controller error:', error);
      next(error);
    }
  }

  /**
   * Get student's certificates
   * GET /api/v1/students/certificates
   */
  public async getCertificates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const certificates = await studentDashboardService.getCertificates(userId);
      SuccessResponseHelper.ok(res, { certificates }, 'Certificates retrieved successfully');
    } catch (error: any) {
      logger.error('Get student certificates controller error:', error);
      next(error);
    }
  }

  /**
   * Submit a support ticket
   * POST /api/v1/students/support
   */
  public async createSupportTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = errors.array().map((err: any) => ({
          field: err.path || err.param || 'unknown',
          message: err.msg,
          value: err.value,
        }));
        throw new ValidationError('Validation failed', validationErrors);
      }

      const userId = this.getUserId(req);
      const { subject, message } = req.body;
      const ticket = await studentDashboardService.createSupportTicket(userId, { subject, message });
      SuccessResponseHelper.created(
        res,
        { ticket },
        'Your message has been sent. Our team will get back to you soon.'
      );
    } catch (error: any) {
      logger.error('Create support ticket controller error:', error);
      next(error);
    }
  }

  /**
   * Get the student's support tickets
   * GET /api/v1/students/support
   */
  public async getSupportTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const tickets = await studentDashboardService.getSupportTickets(userId);
      SuccessResponseHelper.ok(res, { tickets }, 'Support tickets retrieved successfully');
    } catch (error: any) {
      logger.error('Get support tickets controller error:', error);
      next(error);
    }
  }

  /**
   * Get available mentors (optionally filtered by ?expertise=)
   * GET /api/v1/students/mentors
   */
  public async getMentors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const expertise =
        typeof req.query.expertise === 'string' && req.query.expertise.length > 0
          ? req.query.expertise
          : undefined;
      const mentors = await studentDashboardService.getMentors(userId, expertise);
      SuccessResponseHelper.ok(res, { mentors }, 'Mentors retrieved successfully');
    } catch (error: any) {
      logger.error('Get mentors controller error:', error);
      next(error);
    }
  }

  /**
   * Book a mentor session
   * POST /api/v1/students/mentor-sessions
   */
  public async bookMentorSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(403).json({
        success: false,
        error: {
          message: 'Direct bookings are disabled as mentors are directly assigned to cohorts by admin.',
          code: 'DIRECT_BOOKINGS_DISABLED',
        },
      });
      return;
    } catch (error: any) {
      logger.error('Book mentor session controller error:', error);
      next(error);
    }
  }

  /**
   * Get the student's mentor sessions
   * GET /api/v1/students/mentor-sessions
   */
  public async getMentorSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const sessions = await studentDashboardService.getMentorSessions(userId);
      SuccessResponseHelper.ok(res, { sessions }, 'Mentor sessions retrieved successfully');
    } catch (error: any) {
      logger.error('Get mentor sessions controller error:', error);
      next(error);
    }
  }

  /**
   * POST /api/v1/students/ambassador/activate
   */
  public async activateAmbassador(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const profile = await studentDashboardService.activateAmbassador(userId);
      SuccessResponseHelper.ok(res, { profile }, 'Ambassador activated successfully');
    } catch (error: any) {
      logger.error('Activate ambassador controller error:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/students/ambassador/dashboard
   */
  public async getAmbassadorDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const dashboard = await studentDashboardService.getAmbassadorDashboard(userId);
      SuccessResponseHelper.ok(res, dashboard, 'Ambassador dashboard retrieved successfully');
    } catch (error: any) {
      logger.error('Get ambassador dashboard controller error:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/students/ambassador/referrals
   */
  public async getAmbassadorReferrals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const result = await studentDashboardService.getAmbassadorReferrals(userId, { status, page, limit });
      SuccessResponseHelper.paginated(
        res,
        result.referrals,
        { page: result.page, limit: result.limit, total: result.total },
        'Ambassador referrals retrieved successfully'
      );
    } catch (error: any) {
      logger.error('Get ambassador referrals controller error:', error);
      next(error);
    }
  }

  /**
   * POST /api/v1/students/ambassador/invite
   */
  public async inviteFriends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { emails, programType, programId } = req.body;

      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        throw new ValidationError('emails must be a non-empty array');
      }

      const result = await studentDashboardService.inviteFriends(userId, { emails, programType, programId });
      SuccessResponseHelper.ok(res, result, 'Invites sent successfully');
    } catch (error: any) {
      logger.error('Invite friends controller error:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/students/ambassador/earnings
   */
  public async getEarnings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const earnings = await studentDashboardService.getEarnings(userId);
      SuccessResponseHelper.ok(res, earnings, 'Ambassador earnings retrieved successfully');
    } catch (error: any) {
      logger.error('Get ambassador earnings controller error:', error);
      next(error);
    }
  }

  /**
   * Get workspace details for a specific course
   * GET /api/v1/students/courses/workspace/:courseSlug
   */
  public async getCourseWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const slug = req.params.courseSlug || req.params.slug;
      const workspace = await studentDashboardService.getCourseWorkspace(userId, slug);
      SuccessResponseHelper.ok(res, workspace, 'Course workspace retrieved successfully');
    } catch (error: any) {
      logger.error('Get course workspace controller error:', error);
      next(error);
    }
  }

  /**
   * Get workspace details for a specific hackathon/event
   * GET /api/v1/students/hackathons/workspace/:slug
   */
  public async getHackathonWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { slug } = req.params;
      const workspace = await studentDashboardService.getHackathonWorkspace(userId, slug);
      SuccessResponseHelper.ok(res, workspace, 'Hackathon workspace retrieved successfully');
    } catch (error: any) {
      logger.error('Get hackathon workspace controller error:', error);
      next(error);
    }
  }

  /**
   * Submit project for a hackathon
   * POST /api/v1/students/hackathons/workspace/:slug/submission
   */
  public async submitHackathonProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { slug } = req.params;
      const submission = await studentDashboardService.submitHackathonProject(userId, slug, req.body);
      SuccessResponseHelper.ok(res, submission, 'Project submitted successfully');
    } catch (error: any) {
      logger.error('Submit hackathon project controller error:', error);
      next(error);
    }
  }

  /**
   * Get workspace details for a specific workshop
   * GET /api/v1/students/workshops/workspace/:slug
   */
  public async getWorkshopWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { slug } = req.params;
      const workspace = await studentDashboardService.getWorkshopWorkspace(userId, slug);
      SuccessResponseHelper.ok(res, workspace, 'Workshop workspace retrieved successfully');
    } catch (error: any) {
      logger.error('Get workshop workspace controller error:', error);
      next(error);
    }
  }

  /**
   * Submit assignment for a workshop
   * POST /api/v1/students/workshops/workspace/:slug/submission
   */
  public async submitWorkshopAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { slug } = req.params;
      const submission = await studentDashboardService.submitWorkshopAssignment(userId, slug, req.body);
      SuccessResponseHelper.ok(res, submission, 'Assignment submitted successfully');
    } catch (error: any) {
      logger.error('Submit workshop assignment controller error:', error);
      next(error);
    }
  }

  /**
   * Get workspace details for a specific bootcamp
   * GET /api/v1/students/bootcamps/workspace/:slug
   */
  public async getBootcampWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { slug } = req.params;
      const workspace = await studentDashboardService.getBootcampWorkspace(userId, slug);
      SuccessResponseHelper.ok(res, workspace, 'Bootcamp workspace retrieved successfully');
    } catch (error: any) {
      logger.error('Get bootcamp workspace controller error:', error);
      next(error);
    }
  }

  /**
   * Submit capstone project for a bootcamp
   * POST /api/v1/students/bootcamps/workspace/:slug/submission
   */
  public async submitBootcampProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { slug } = req.params;
      const submission = await studentDashboardService.submitBootcampProject(userId, slug, req.body);
      SuccessResponseHelper.ok(res, submission, 'Bootcamp project submitted successfully');
    } catch (error: any) {
      logger.error('Submit bootcamp project controller error:', error);
      next(error);
    }
  }



  /**
   * Submit capstone project for a course
   * POST /api/v1/students/courses/workspace/:slug/submission
   */
  public async submitCourseProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { slug } = req.params;
      const submission = await studentDashboardService.submitCourseProject(userId, slug, req.body);
      SuccessResponseHelper.ok(res, submission, 'Course project submitted successfully');
    } catch (error: any) {
      logger.error('Submit course project controller error:', error);
      next(error);
    }
  }

  /**
   * Get workspace details for a specific training program
   * GET /api/v1/students/training-programs/workspace/:slug
   */
  public async getTrainingProgramWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { slug } = req.params;
      const workspace = await studentDashboardService.getTrainingProgramWorkspace(userId, slug);
      SuccessResponseHelper.ok(res, workspace, 'Training program workspace retrieved successfully');
    } catch (error: any) {
      logger.error('Get training program workspace controller error:', error);
      next(error);
    }
  }

  /**
   * Submit capstone project for a training program
   * POST /api/v1/students/training-programs/workspace/:slug/submission
   */
  public async submitTrainingProgramProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { slug } = req.params;
      const submission = await studentDashboardService.submitTrainingProgramProject(userId, slug, req.body);
      SuccessResponseHelper.ok(res, submission, 'Training program project submitted successfully');
    } catch (error: any) {
      logger.error('Submit training program project controller error:', error);
      next(error);
    }
  }
}

export const studentDashboardController = StudentDashboardController.getInstance();
