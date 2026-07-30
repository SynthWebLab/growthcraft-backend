import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';
import {
  createOrderSchema,
  verifyPaymentSchema,
  createPaymentLinkSchema,
} from '../validators/payment.validator';
import { HttpStatus } from '@/common/constants/http-status.constant';

export class PaymentController {
  /**
   * POST /api/v1/payments/create-order
   */
  public async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createOrderSchema.parse(req.body);
      const studentUserId = (req as any).user?.userId;

      const order = await paymentService.createOrder({
        ...validated,
        studentUserId,
      });

      res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Razorpay payment order created successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/payments/verify
   */
  public async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = verifyPaymentSchema.parse(req.body);
      const studentUserId = (req as any).user?.userId;

      const result = await paymentService.verifyPayment({
        ...validated,
        studentUserId,
      });

      res.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/payments/create-link
   */
  public async createPaymentLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createPaymentLinkSchema.parse(req.body);

      const link = await paymentService.generatePaymentLink(validated);

      res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Payment link generated successfully',
        data: link,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/payments/webhook
   */
  public async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      const result = await paymentService.handleWebhook(rawBody, signature);

      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/payments/my-payments
   */
  public async getMyPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentUserId = (req as any).user?.userId;
      if (!studentUserId) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'User authentication required',
        });
        return;
      }

      const payments = await paymentService.getStudentPayments(studentUserId);

      res.status(HttpStatus.OK).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/payments/complete-enrollment-payment
   */
  public async completeEnrollmentPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentUserId = (req as any).user?.userId;
      const { enrollmentId, itemId, itemType, amount, paymentMethod } = req.body;

      const result = await paymentService.completeEnrollmentPayment({
        enrollmentId,
        itemId,
        itemType,
        studentUserId,
        amount,
        paymentMethod,
      });

      res.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
