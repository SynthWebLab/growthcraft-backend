import { Router, Request, Response, NextFunction } from 'express';
import { studentDashboardController } from '../controllers/student-dashboard.controller';
import { StudentValidator } from '../validators/student.validator';
import { authenticate } from '@/common/middleware/authenticate.middleware';

const router = Router();

// All student dashboard routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /students/dashboard:
 *   get:
 *     summary: Get aggregated student dashboard
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     description: Returns counts and recent items across courses, bootcamps, workshops, hackathons, training programs, and certificates for the authenticated student.
 *     responses:
 *       200:
 *         description: Dashboard retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard', (req: Request, res: Response, next: NextFunction) => {
  void studentDashboardController.getDashboard(req, res, next);
});

/**
 * @swagger
 * /students/profile:
 *   get:
 *     summary: Get the authenticated student's profile
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', (req: Request, res: Response, next: NextFunction) => {
  void studentDashboardController.getProfile(req, res, next);
});

/**
 * @swagger
 * /students/profile:
 *   put:
 *     summary: Create or update the authenticated student's profile
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     description: Partial update (upsert). Any subset of fields may be provided.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enrollmentNumber:
 *                 type: string
 *               collegeName:
 *                 type: string
 *               degree:
 *                 type: string
 *               branch:
 *                 type: string
 *               yearOfStudy:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 6
 *               graduationYear:
 *                 type: integer
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *               resume:
 *                 type: string
 *                 format: uri
 *               portfolio:
 *                 type: string
 *                 format: uri
 *               linkedIn:
 *                 type: string
 *                 format: uri
 *               github:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', StudentValidator.updateProfile(), (req: Request, res: Response, next: NextFunction) => {
  void studentDashboardController.updateProfile(req, res, next);
});

/**
 * @swagger
 * /students/courses:
 *   get:
 *     summary: Get the student's enrolled courses
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/courses', (req: Request, res: Response, next: NextFunction) => {
  void studentDashboardController.getCourses(req, res, next);
});

/**
 * @swagger
 * /students/bootcamps:
 *   get:
 *     summary: Get the student's enrolled bootcamps
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bootcamps retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/bootcamps', (req: Request, res: Response, next: NextFunction) => {
  void studentDashboardController.getBootcamps(req, res, next);
});

/**
 * @swagger
 * /students/workshops:
 *   get:
 *     summary: Get the student's enrolled workshops
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workshops retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/workshops', (req: Request, res: Response, next: NextFunction) => {
  void studentDashboardController.getWorkshops(req, res, next);
});

/**
 * @swagger
 * /students/hackathons:
 *   get:
 *     summary: Get the student's enrolled hackathons
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hackathons retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/hackathons', (req: Request, res: Response, next: NextFunction) => {
  void studentDashboardController.getHackathons(req, res, next);
});

/**
 * @swagger
 * /students/events:
 *   get:
 *     summary: Get the student's enrolled events (optionally filtered by type)
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Workshop, Bootcamp, Hackathon]
 *         description: Filter events by type
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *       400:
 *         description: Invalid event type
 *       401:
 *         description: Unauthorized
 */
router.get('/events', (req: Request, res: Response, next: NextFunction) => {
  void studentDashboardController.getEvents(req, res, next);
});

/**
 * @swagger
 * /students/training-programs:
 *   get:
 *     summary: Get the student's enrolled training programs
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Training programs retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/training-programs', (req: Request, res: Response, next: NextFunction) => {
  void studentDashboardController.getTrainingPrograms(req, res, next);
});

/**
 * @swagger
 * /students/certificates:
 *   get:
 *     summary: Get the student's certificates
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Certificates retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/certificates', (req: Request, res: Response, next: NextFunction) => {
  void studentDashboardController.getCertificates(req, res, next);
});

/**
 * @swagger
 * /students/support:
 *   post:
 *     summary: Submit a support ticket
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *             properties:
 *               subject:
 *                 type: string
 *                 example: Cannot access my course
 *               message:
 *                 type: string
 *                 example: I enrolled yesterday but the course isn't showing up.
 *     responses:
 *       201:
 *         description: Support ticket created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/support', StudentValidator.createSupportTicket(), (req: Request, res: Response, next: NextFunction) => {
  void studentDashboardController.createSupportTicket(req, res, next);
});

/**
 * @swagger
 * /students/support:
 *   get:
 *     summary: Get the student's support tickets
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Support tickets retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/support', (req: Request, res: Response, next: NextFunction) => {
  void studentDashboardController.getSupportTickets(req, res, next);
});

export default router;
