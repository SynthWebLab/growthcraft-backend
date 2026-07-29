import { Router, Request, Response, NextFunction } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate, optionalAuthenticate } from '@/common/middleware/authenticate.middleware';

const router = Router();

/**
 * @swagger
 * /payments/create-order:
 *   post:
 *     summary: Create a Razorpay payment order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - itemType
 *               - itemId
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000
 *               currency:
 *                 type: string
 *                 example: "INR"
 *               itemType:
 *                 type: string
 *                 enum: [course, bootcamp, training-program, enrollment, reservation]
 *               itemId:
 *                 type: string
 *               receipt:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment order created successfully
 */
router.post(
  '/create-order',
  optionalAuthenticate,
  (req: Request, res: Response, next: NextFunction) => {
    void paymentController.createOrder(req, res, next);
  }
);

/**
 * @swagger
 * /payments/verify:
 *   post:
 *     summary: Verify Razorpay payment signature & fulfill order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razorpayOrderId
 *               - razorpayPaymentId
 *               - razorpaySignature
 *     responses:
 *       200:
 *         description: Payment verified successfully
 */
router.post(
  '/verify',
  optionalAuthenticate,
  (req: Request, res: Response, next: NextFunction) => {
    void paymentController.verifyPayment(req, res, next);
  }
);

/**
 * @swagger
 * /payments/create-link:
 *   post:
 *     summary: Create a Razorpay Payment Link (Admin/College)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/create-link',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    void paymentController.createPaymentLink(req, res, next);
  }
);

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Razorpay webhook event listener
 *     tags: [Payments]
 */
router.post('/webhook', (req: Request, res: Response, next: NextFunction) => {
  void paymentController.handleWebhook(req, res, next);
});

/**
 * @swagger
 * /payments/my-payments:
 *   get:
 *     summary: Get authenticated student payment history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/my-payments',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    void paymentController.getMyPayments(req, res, next);
  }
);

export default router;
