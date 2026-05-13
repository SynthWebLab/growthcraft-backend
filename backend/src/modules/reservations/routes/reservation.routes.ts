import { Router, Request, Response, NextFunction } from 'express';
import { reservationController } from '../controllers/reservation.controller';
import { body, param } from 'express-validator';
import { validate } from '@/common/middleware/validate.middleware';

const router = Router();

/**
 * Validation rules
 */
const createReservationValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Please provide a valid phone number'),
  
  body('itemType')
    .trim()
    .notEmpty()
    .withMessage('Item type is required')
    .isIn(['course', 'bootcamp'])
    .withMessage('Item type must be either "course" or "bootcamp"'),
  
  body('itemId')
    .trim()
    .notEmpty()
    .withMessage('Item ID is required')
    .isMongoId()
    .withMessage('Please provide a valid item ID'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  
  body('source')
    .optional()
    .trim()
    .isIn(['web', 'mobile', 'admin'])
    .withMessage('Source must be either "web", "mobile", or "admin"'),
];

const idValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Reservation ID is required')
    .isMongoId()
    .withMessage('Please provide a valid reservation ID'),
];

const emailValidation = [
  param('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
];

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Create a new reservation
 *     tags: [Reservations]
 *     description: Reserve a seat for a course or bootcamp
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - itemType
 *               - itemId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               itemType:
 *                 type: string
 *                 enum: [course, bootcamp]
 *                 example: "bootcamp"
 *               itemId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               notes:
 *                 type: string
 *                 example: "Looking forward to this bootcamp"
 *               source:
 *                 type: string
 *                 enum: [web, mobile, admin]
 *                 example: "web"
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Course or bootcamp not found
 *       409:
 *         description: No seats available or duplicate reservation
 */
router.post(
  '/',
  createReservationValidation,
  validate,
  (req: Request, res: Response, next: NextFunction) => {
    void reservationController.createReservation(req, res, next);
  }
);

/**
 * @swagger
 * /reservations/{id}:
 *   get:
 *     summary: Get reservation by ID
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *     responses:
 *       200:
 *         description: Reservation found
 *       404:
 *         description: Reservation not found
 */
router.get(
  '/:id',
  idValidation,
  validate,
  (req: Request, res: Response, next: NextFunction) => {
    void reservationController.getReservationById(req, res, next);
  }
);

/**
 * @swagger
 * /reservations/email/{email}:
 *   get:
 *     summary: Get reservations by email
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: User email address
 *     responses:
 *       200:
 *         description: Reservations found
 */
router.get(
  '/email/:email',
  emailValidation,
  validate,
  (req: Request, res: Response, next: NextFunction) => {
    void reservationController.getReservationsByEmail(req, res, next);
  }
);

/**
 * @swagger
 * /reservations/{id}/confirm:
 *   post:
 *     summary: Confirm a reservation
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *     responses:
 *       200:
 *         description: Reservation confirmed
 *       404:
 *         description: Reservation not found
 *       400:
 *         description: Reservation cannot be confirmed
 */
router.post(
  '/:id/confirm',
  idValidation,
  validate,
  (req: Request, res: Response, next: NextFunction) => {
    void reservationController.confirmReservation(req, res, next);
  }
);

/**
 * @swagger
 * /reservations/{id}/cancel:
 *   post:
 *     summary: Cancel a reservation
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *     responses:
 *       200:
 *         description: Reservation cancelled
 *       404:
 *         description: Reservation not found
 */
router.post(
  '/:id/cancel',
  idValidation,
  validate,
  (req: Request, res: Response, next: NextFunction) => {
    void reservationController.cancelReservation(req, res, next);
  }
);

export default router;
