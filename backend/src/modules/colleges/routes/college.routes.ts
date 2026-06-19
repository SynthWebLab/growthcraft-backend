import { Router, Request, Response, NextFunction } from 'express';
import { collegeDashboardController } from '../controllers/college-dashboard.controller';
import { CollegeValidator } from '../validators/college.validator';
import { authenticate } from '@/common/middleware/authenticate.middleware';
import { authorize } from '@/common/middleware/authorize.middleware';
import { UserRole } from '@/common/constants/user.constants';

const router = Router();

// All college dashboard routes require an authenticated college account.
router.use(authenticate);
router.use(authorize([UserRole.COLLEGE]));

/**
 * @swagger
 * /colleges/dashboard:
 *   get:
 *     summary: Get aggregated college dashboard
 *     tags: [College Dashboard]
 *     security:
 *       - bearerAuth: []
 *     description: KPIs (total students, active courses, partnership tier), 6-month enrollment trend, top performers, and recent activity for the authenticated college.
 *     responses:
 *       200:
 *         description: Dashboard retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a college account)
 *       404:
 *         description: College profile not found
 */
router.get('/dashboard', (req: Request, res: Response, next: NextFunction) => {
  void collegeDashboardController.getDashboard(req, res, next);
});

/**
 * @swagger
 * /colleges/students:
 *   get:
 *     summary: List students enrolled from the college's campus
 *     tags: [College Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, pending]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Match against student name or email
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Students retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/students',
  CollegeValidator.listStudents(),
  (req: Request, res: Response, next: NextFunction) => {
    void collegeDashboardController.getStudents(req, res, next);
  }
);

/**
 * @swagger
 * /colleges/cohort:
 *   get:
 *     summary: Get cohort usage vs the partnership tier cap
 *     tags: [College Dashboard]
 *     security:
 *       - bearerAuth: []
 *     description: Returns `{ tier, limit, used, remaining, unlimited }`. `limit`/`remaining` are null for Platinum (unlimited).
 *     responses:
 *       200:
 *         description: Cohort status retrieved successfully
 */
router.get('/cohort', (req: Request, res: Response, next: NextFunction) => {
  void collegeDashboardController.getCohort(req, res, next);
});

/**
 * @swagger
 * /colleges/students/import:
 *   post:
 *     summary: Bulk-import students into the cohort (enforces the tier cap)
 *     tags: [College Dashboard]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Adds students to the college cohort from a parsed `students` array and/or a raw
 *       `csv` string. The tier cohort cap (Silver 50, Gold 150, Platinum unlimited) is
 *       enforced server-side BEFORE any writes: if the import would exceed the limit it
 *       fails with 403 `COHORT_LIMIT_EXCEEDED` and `error.details` carries the numbers to
 *       prompt an upgrade. Imported students become student accounts and can optionally be
 *       enrolled into the supplied `eventIds`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               students:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [fullName, email, phone]
 *                   properties:
 *                     fullName: { type: string }
 *                     email: { type: string, format: email }
 *                     phone: { type: string }
 *                     enrollmentNumber: { type: string }
 *                     degree: { type: string }
 *                     branch: { type: string }
 *                     yearOfStudy: { type: integer }
 *               csv:
 *                 type: string
 *                 description: Raw CSV with a header row (fullName,email,phone,...)
 *               eventIds:
 *                 type: array
 *                 items: { type: string }
 *                 description: Optional events to enroll the imported students into
 *               defaultPassword:
 *                 type: string
 *                 description: Optional shared initial password; otherwise a random one is set per student
 *     responses:
 *       201:
 *         description: Students imported successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Cohort limit exceeded (COHORT_LIMIT_EXCEEDED) — upgrade required
 */
router.post(
  '/students/import',
  CollegeValidator.importStudents(),
  (req: Request, res: Response, next: NextFunction) => {
    void collegeDashboardController.importStudents(req, res, next);
  }
);

/**
 * @swagger
 * /colleges/profile:
 *   get:
 *     summary: Get the college's institution profile
 *     tags: [College Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       404:
 *         description: College profile not found
 */
router.get('/profile', (req: Request, res: Response, next: NextFunction) => {
  void collegeDashboardController.getProfile(req, res, next);
});

/**
 * @swagger
 * /colleges/profile:
 *   put:
 *     summary: Update the college's institution details and point of contact
 *     tags: [College Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               collegeName:
 *                 type: string
 *               website:
 *                 type: string
 *                 format: uri
 *               address:
 *                 type: object
 *                 properties:
 *                   street: { type: string }
 *                   city: { type: string }
 *                   state: { type: string }
 *                   country: { type: string }
 *                   pincode: { type: string }
 *               contactPerson:
 *                 type: object
 *                 properties:
 *                   name: { type: string }
 *                   designation: { type: string }
 *                   email: { type: string, format: email }
 *                   phone: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 */
router.put(
  '/profile',
  CollegeValidator.updateProfile(),
  (req: Request, res: Response, next: NextFunction) => {
    void collegeDashboardController.updateProfile(req, res, next);
  }
);

/**
 * @swagger
 * /colleges/partnership:
 *   get:
 *     summary: Get partnership tier, benefits, SPOC and tier comparison
 *     tags: [College Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Partnership details retrieved successfully
 */
router.get('/partnership', (req: Request, res: Response, next: NextFunction) => {
  void collegeDashboardController.getPartnership(req, res, next);
});

/**
 * @swagger
 * /colleges/subscription:
 *   post:
 *     summary: Activate / choose a subscription plan
 *     tags: [College Dashboard]
 *     security:
 *       - bearerAuth: []
 *     description: Activates the given tier immediately (sets it active and stamps the start date). Required before cohort import/export when no subscription is active.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tier]
 *             properties:
 *               tier:
 *                 type: string
 *                 enum: [Silver, Gold, Platinum]
 *     responses:
 *       200:
 *         description: Subscription activated; returns cohort status
 *       400:
 *         description: Validation error
 */
router.post(
  '/subscription',
  CollegeValidator.subscribe(),
  (req: Request, res: Response, next: NextFunction) => {
    void collegeDashboardController.subscribe(req, res, next);
  }
);

/**
 * @swagger
 * /colleges/partnership/upgrade-request:
 *   post:
 *     summary: Request a partnership tier upgrade
 *     tags: [College Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [requestedTier]
 *             properties:
 *               requestedTier:
 *                 type: string
 *                 enum: [Silver, Gold, Platinum]
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Upgrade request created
 *       400:
 *         description: Validation error (e.g. requested tier not higher than current)
 */
router.post(
  '/partnership/upgrade-request',
  CollegeValidator.requestUpgrade(),
  (req: Request, res: Response, next: NextFunction) => {
    void collegeDashboardController.requestUpgrade(req, res, next);
  }
);

/**
 * @swagger
 * /colleges/reports:
 *   get:
 *     summary: Get monthly campus program reports (trailing 6 months)
 *     tags: [College Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 */
router.get('/reports', (req: Request, res: Response, next: NextFunction) => {
  void collegeDashboardController.getReports(req, res, next);
});

/**
 * @swagger
 * /colleges/settings:
 *   get:
 *     summary: Get account settings (institution name, email, phone, notifications)
 *     tags: [College Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 */
router.get('/settings', (req: Request, res: Response, next: NextFunction) => {
  void collegeDashboardController.getSettings(req, res, next);
});

/**
 * @swagger
 * /colleges/settings/account:
 *   put:
 *     summary: Update editable account fields (institution name, phone)
 *     tags: [College Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               institutionName:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account updated successfully
 *       400:
 *         description: Validation error
 */
router.put(
  '/settings/account',
  CollegeValidator.updateAccount(),
  (req: Request, res: Response, next: NextFunction) => {
    void collegeDashboardController.updateAccount(req, res, next);
  }
);

/**
 * @swagger
 * /colleges/settings/notifications:
 *   put:
 *     summary: Update notification preferences
 *     tags: [College Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentEnrollments: { type: boolean }
 *               programUpdates: { type: boolean }
 *               reportsReady: { type: boolean }
 *               marketingEmails: { type: boolean }
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
 */
router.put(
  '/settings/notifications',
  CollegeValidator.updateNotificationPreferences(),
  (req: Request, res: Response, next: NextFunction) => {
    void collegeDashboardController.updateNotifications(req, res, next);
  }
);

/**
 * @swagger
 * /colleges/support:
 *   post:
 *     summary: Submit a support query
 *     tags: [College Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, message]
 *             properties:
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Support ticket created
 *       400:
 *         description: Validation error
 */
router.post(
  '/support',
  CollegeValidator.createSupportTicket(),
  (req: Request, res: Response, next: NextFunction) => {
    void collegeDashboardController.createSupportTicket(req, res, next);
  }
);

/**
 * @swagger
 * /colleges/support:
 *   get:
 *     summary: Get the college's support tickets
 *     tags: [College Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Support tickets retrieved successfully
 */
router.get('/support', (req: Request, res: Response, next: NextFunction) => {
  void collegeDashboardController.getSupportTickets(req, res, next);
});

export default router;
