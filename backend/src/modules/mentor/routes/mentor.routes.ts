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
 * Get aggregated mentor dashboard details
 */
router.get('/dashboard', (req: Request, res: Response, next: NextFunction) => {
  void mentorDashboardController.getDashboard(req, res, next);
});

/**
 * GET /api/v1/mentor/batches
 * Get batches list (filtered by status)
 */
router.get('/batches', (req: Request, res: Response, next: NextFunction) => {
  void mentorDashboardController.getBatches(req, res, next);
});

/**
 * GET /api/v1/mentor/batches/:batchId
 * Get batch details, enrolled students, attendance logs, and progress notes
 */
router.get('/batches/:batchId', (req: Request, res: Response, next: NextFunction) => {
  void mentorDashboardController.getBatchById(req, res, next);
});

/**
 * POST /api/v1/mentor/check-in
 * Start a cohort session check-in
 */
router.post('/check-in', (req: Request, res: Response, next: NextFunction) => {
  void mentorDashboardController.checkIn(req, res, next);
});

/**
 * POST /api/v1/mentor/check-out
 * Complete check-out, compute hours
 */
router.post('/check-out', (req: Request, res: Response, next: NextFunction) => {
  void mentorDashboardController.checkOut(req, res, next);
});

/**
 * GET /api/v1/mentor/check-in/status
 * Get current check-in status
 */
router.get('/check-in/status', (req: Request, res: Response, next: NextFunction) => {
  void mentorDashboardController.getCheckInStatus(req, res, next);
});

/**
 * GET /api/v1/mentor/check-ins
 * Own check-in history, paginated
 */
router.get('/check-ins', (req: Request, res: Response, next: NextFunction) => {
  void mentorDashboardController.getCheckIns(req, res, next);
});

/**
 * POST /api/v1/mentor/attendance
 * Mark student attendance for a batch session
 */
router.post('/attendance', (req: Request, res: Response, next: NextFunction) => {
  void mentorDashboardController.markAttendance(req, res, next);
});

/**
 * POST /api/v1/mentor/progress-notes
 * Create progress note for student
 */
router.post('/progress-notes', (req: Request, res: Response, next: NextFunction) => {
  void mentorDashboardController.createProgressNote(req, res, next);
});

/**
 * GET /api/v1/mentor/earnings
 * Get earnings analysis
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
 * Get student details across all assigned batches
 */
router.get('/students', (req: Request, res: Response, next: NextFunction) => {
  void mentorDashboardController.getStudents(req, res, next);
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
