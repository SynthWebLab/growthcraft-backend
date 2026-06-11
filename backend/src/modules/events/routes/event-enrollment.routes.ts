import { Router, Request, Response, NextFunction } from 'express';
import { eventEnrollmentController } from '../controllers/event-enrollment.controller';
import { EventEnrollmentValidator } from '../validators/event-enrollment.validator';
import { authenticate } from '@/common/middleware/authenticate.middleware';

const router = Router();

// ============================================
// EVENT ENROLLMENT ROUTES
// ============================================

/**
 * @swagger
 * /events/{eventType}/{eventId}/register:
 *   post:
 *     summary: Register/Enroll in an event (Bootcamp/Workshop/Hackathon)
 *     tags: [Event Enrollment]
 *     description: |
 *       Register for a bootcamp, workshop, or hackathon.
 *       - For Bootcamps: This is the "Reserve Seat" action
 *       - For Workshops: This is the "Register Now" action
 *       - For Hackathons: This is the "Register Now" action
 *       
 *       User must be authenticated. Works for Open status events with available seats.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Bootcamp, Workshop, Hackathon]
 *         description: Type of event
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - phone
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *     responses:
 *       201:
 *         description: Successfully registered for the event
 *       400:
 *         description: Validation error or event not available
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Event not found
 *       409:
 *         description: Already registered for this event
 */
router.post(
  '/:eventType/:eventId/register',
  authenticate,
  EventEnrollmentValidator.registerForEvent(),
  (req: Request, res: Response, next: NextFunction) => {
    void eventEnrollmentController.registerForEvent(req, res, next);
  }
);

/**
 * @swagger
 * /events/{eventType}/{eventId}/request-callback:
 *   post:
 *     summary: Request callback for an event
 *     tags: [Event Enrollment]
 *     description: |
 *       Request a callback for a bootcamp, workshop, or hackathon.
 *       Works for all event statuses (Open, Closed, Completed, Draft).
 *       Can be used when seats are full, event has started, or for general inquiries.
 *       
 *       Authentication is optional - works for both logged-in users and guests.
 *     parameters:
 *       - in: path
 *         name: eventType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Bootcamp, Workshop, Hackathon]
 *         description: Type of event
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - phone
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *     responses:
 *       201:
 *         description: Callback request created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Event not found
 *       409:
 *         description: Pending callback request already exists
 */
router.post(
  '/:eventType/:eventId/request-callback',
  EventEnrollmentValidator.requestCallback(),
  (req: Request, res: Response, next: NextFunction) => {
    void eventEnrollmentController.requestCallback(req, res, next);
  }
);

/**
 * @swagger
 * /events/enrollments/my-enrollments:
 *   get:
 *     summary: Get user's event enrollments (all event types)
 *     tags: [Event Enrollment]
 *     description: Get all event enrollments for the authenticated user across all event types
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enrollments retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get(
  '/enrollments/my-enrollments',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    void eventEnrollmentController.getMyEnrollments(req, res, next);
  }
);

/**
 * @swagger
 * /events/{eventType}/enrollments/my-enrollments:
 *   get:
 *     summary: Get user's event enrollments (filtered by event type)
 *     tags: [Event Enrollment]
 *     description: Get event enrollments for the authenticated user filtered by event type
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Bootcamp, Workshop, Hackathon]
 *         description: Type of event to filter by
 *     responses:
 *       200:
 *         description: Enrollments retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get(
  '/:eventType/enrollments/my-enrollments',
  authenticate,
  EventEnrollmentValidator.validateOptionalEventType(),
  (req: Request, res: Response, next: NextFunction) => {
    void eventEnrollmentController.getMyEnrollments(req, res, next);
  }
);

/**
 * @swagger
 * /events/callbacks/my-requests:
 *   get:
 *     summary: Get user's callback requests (all event types)
 *     tags: [Event Enrollment]
 *     description: Get all callback requests for the authenticated user across all event types
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Callback requests retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get(
  '/callbacks/my-requests',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    void eventEnrollmentController.getMyCallbackRequests(req, res, next);
  }
);

/**
 * @swagger
 * /events/{eventType}/callbacks/my-requests:
 *   get:
 *     summary: Get user's callback requests (filtered by event type)
 *     tags: [Event Enrollment]
 *     description: Get callback requests for the authenticated user filtered by event type
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Bootcamp, Workshop, Hackathon]
 *         description: Type of event to filter by
 *     responses:
 *       200:
 *         description: Callback requests retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get(
  '/:eventType/callbacks/my-requests',
  authenticate,
  EventEnrollmentValidator.validateOptionalEventType(),
  (req: Request, res: Response, next: NextFunction) => {
    void eventEnrollmentController.getMyCallbackRequests(req, res, next);
  }
);

/**
 * @swagger
 * /events/{eventType}/{eventId}/enrollment-status:
 *   get:
 *     summary: Check enrollment status for an event
 *     tags: [Event Enrollment]
 *     description: |
 *       Check if the authenticated user is enrolled in an event and has any pending callback requests.
 *       Returns { isEnrolled: boolean, hasCallbackRequest: boolean }
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Bootcamp, Workshop, Hackathon]
 *         description: Type of event
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Enrollment status retrieved successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Event not found
 */
router.get(
  '/:eventType/:eventId/enrollment-status',
  authenticate,
  EventEnrollmentValidator.checkEnrollmentStatus(),
  (req: Request, res: Response, next: NextFunction) => {
    void eventEnrollmentController.checkEnrollmentStatus(req, res, next);
  }
);

export default router;
