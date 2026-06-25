import { Router, Request, Response, NextFunction } from 'express';
import { mentorDashboardController } from '../controllers/mentor-dashboard.controller';
import { MentorValidator } from '../validators/mentor.validator';
import { authenticate } from '@/common/middleware/authenticate.middleware';
import { authorize } from '@/common/middleware/authorize.middleware';
import { UserRole } from '@/common/constants/user.constants';

const router = Router();

// All mentor dashboard routes require authentication and mentor role
router.use(authenticate);
router.use(authorize([UserRole.MENTOR]));

/**
 * GET /api/v1/mentor/dashboard
 * Get aggregated mentor dashboard details (stats, today's calendar, reviews, earnings trend)
 */
router.get('/dashboard', (req: Request, res: Response, next: NextFunction) => {
  void mentorDashboardController.getDashboard(req, res, next);
});

/**
 * GET /api/v1/mentor/sessions
 * Get sessions list (filtered by status)
 */
router.get('/sessions', (req: Request, res: Response, next: NextFunction) => {
  void mentorDashboardController.getSessions(req, res, next);
});

/**
 * PATCH /api/v1/mentor/sessions/:id/status
 * Update session status (completed/cancelled)
 */
router.patch(
  '/sessions/:id/status',
  MentorValidator.updateSessionStatus(),
  (req: Request, res: Response, next: NextFunction) => {
    void mentorDashboardController.updateSessionStatus(req, res, next);
  }
);

/**
 * GET /api/v1/mentor/availability
 * Get availability schedule and hourly rate
 */
router.get('/availability', (req: Request, res: Response, next: NextFunction) => {
  void mentorDashboardController.getAvailability(req, res, next);
});

/**
 * PUT /api/v1/mentor/availability
 * Update availability schedule and hourly rate
 */
router.put(
  '/availability',
  MentorValidator.updateAvailability(),
  (req: Request, res: Response, next: NextFunction) => {
    void mentorDashboardController.updateAvailability(req, res, next);
  }
);

/**
 * GET /api/v1/mentor/students
 * Get students list
 */
router.get('/students', (req: Request, res: Response, next: NextFunction) => {
  void mentorDashboardController.getStudents(req, res, next);
});

/**
 * GET /api/v1/mentor/earnings
 * Get earnings analysis, monthly breakdown, payout history
 */
router.get('/earnings', (req: Request, res: Response, next: NextFunction) => {
  void mentorDashboardController.getEarnings(req, res, next);
});

/**
 * POST /api/v1/mentor/earnings/withdraw
 * Submit withdrawal request
 */
router.post('/earnings/withdraw', (req: Request, res: Response, next: NextFunction) => {
  void mentorDashboardController.withdrawEarnings(req, res, next);
});

/**
 * GET /api/v1/mentor/profile
 * Get mentor profile details
 */
router.get('/profile', (req: Request, res: Response, next: NextFunction) => {
  void mentorDashboardController.getProfile(req, res, next);
});

/**
 * PUT /api/v1/mentor/profile
 * Update mentor profile details
 */
router.put(
  '/profile',
  MentorValidator.updateProfile(),
  (req: Request, res: Response, next: NextFunction) => {
    void mentorDashboardController.updateProfile(req, res, next);
  }
);

/**
 * POST /api/v1/mentor/support
 * Submit a support query ticket
 */
router.post(
  '/support',
  MentorValidator.createSupportTicket(),
  (req: Request, res: Response, next: NextFunction) => {
    void mentorDashboardController.createSupportTicket(req, res, next);
  }
);

/**
 * GET /api/v1/mentor/support
 * Get support query tickets submitted by the mentor
 */
router.get('/support', (req: Request, res: Response, next: NextFunction) => {
  void mentorDashboardController.getSupportTickets(req, res, next);
});

/**
 * PUT /api/v1/mentor/settings/account
 * Update mentor account info settings (fullName, phone)
 */
router.put(
  '/settings/account',
  MentorValidator.updateSettingsAccount(),
  (req: Request, res: Response, next: NextFunction) => {
    void mentorDashboardController.updateSettingsAccount(req, res, next);
  }
);

/**
 * POST /api/v1/mentor/settings/password
 * Change mentor password
 */
router.post(
  '/settings/password',
  MentorValidator.changePassword(),
  (req: Request, res: Response, next: NextFunction) => {
    void mentorDashboardController.changePassword(req, res, next);
  }
);

export default router;
