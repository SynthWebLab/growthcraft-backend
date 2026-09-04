import crypto from 'crypto';
import mongoose from 'mongoose';
import { paymentService } from '@/modules/payments/services/payment.service';
import { PaymentTransaction, PaymentStatus, PaymentItemType } from '@/database/models';
import { config } from '@/config';

describe('Payment Service & Verification Tests', () => {
  const studentUserId = new mongoose.Types.ObjectId().toString();

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await PaymentTransaction.deleteMany({ studentUserId: new mongoose.Types.ObjectId(studentUserId) });
    }
  });

  describe('Order Creation Tests', () => {
    it('should create order and return formatted order metadata', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const result = await paymentService.createOrder({
        amount: 2999,
        itemType: 'Bootcamp',
        itemId: 'bootcamp-123',
        studentUserId,
      });

      expect(result).toBeDefined();
      expect(result.orderId).toBeDefined();
      expect(result.amount).toBe(299900); // Amount in paise
      expect(result.currency).toBe('INR');
      expect(result.transactionId).toBeDefined();

      const transaction = await PaymentTransaction.findById(result.transactionId);
      expect(transaction).toBeDefined();
      expect(transaction?.status).toBe(PaymentStatus.CREATED);
    });
  });

  describe('Payment Verification Tests', () => {
    it('should verify payment and update transaction status to CAPTURED', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const orderResult = await paymentService.createOrder({
        amount: 1500,
        itemType: 'Bootcamp',
        itemId: 'bootcamp-456',
        studentUserId,
      });

      const paymentId = `pay_${Date.now()}_test`;
      const secret = config.RAZORPAY_KEY_SECRET || 'test_secret';
      const text = `${orderResult.orderId}|${paymentId}`;
      const signature = crypto.createHmac('sha256', secret).update(text).digest('hex');

      const verificationResult = await paymentService.verifyPayment({
        razorpayOrderId: orderResult.orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        studentUserId,
      });

      expect(verificationResult.success).toBe(true);
      expect(verificationResult.paymentId).toBe(paymentId);

      const updatedTx = await PaymentTransaction.findOne({ orderId: orderResult.orderId });
      expect(updatedTx?.status).toBe(PaymentStatus.CAPTURED);
      expect(updatedTx?.paymentId).toBe(paymentId);
    });

    it('should return already processed status when payment is verified twice', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const orderResult = await paymentService.createOrder({
        amount: 1000,
        itemType: 'Bootcamp',
        itemId: 'bootcamp-789',
        studentUserId,
      });

      const paymentId = `pay_${Date.now()}_dup`;

      await paymentService.verifyPayment({
        razorpayOrderId: orderResult.orderId,
        razorpayPaymentId: paymentId,
        studentUserId,
      });

      const secondVerify = await paymentService.verifyPayment({
        razorpayOrderId: orderResult.orderId,
        razorpayPaymentId: paymentId,
        studentUserId,
      });

      expect(secondVerify.success).toBe(true);
      expect(secondVerify.message).toContain('already processed');
    });
  });

  describe('Webhook Handler Tests', () => {
    it('should process payment.captured webhook event', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const orderResult = await paymentService.createOrder({
        amount: 500,
        itemType: 'Bootcamp',
        itemId: 'webhook-item',
        studentUserId,
      });

      const webhookPayload = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: `pay_wh_${Date.now()}`,
              order_id: orderResult.orderId,
              amount: 50000,
              method: 'upi',
            },
          },
        },
      });

      const result = await paymentService.handleWebhook(webhookPayload, '');
      expect(result.received).toBe(true);

      const updatedTx = await PaymentTransaction.findOne({ orderId: orderResult.orderId });
      expect(updatedTx?.status).toBe(PaymentStatus.CAPTURED);
      expect(updatedTx?.paymentMethod).toBe('upi');
    });
  });

  describe('Student Payments History', () => {
    it('should fetch all transactions for a given student', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const history = await paymentService.getStudentPayments(studentUserId);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });
  });
});
