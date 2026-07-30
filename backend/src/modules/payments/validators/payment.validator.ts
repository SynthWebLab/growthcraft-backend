import { z } from 'zod';

export const createOrderSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().default('INR').optional(),
  itemType: z.enum(['course', 'bootcamp', 'workshop', 'hackathon', 'training-program', 'enrollment', 'reservation']),
  itemId: z.string().min(1, 'Item ID is required'),
  receipt: z.string().optional(),
  notes: z.record(z.any()).optional(),
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, 'Razorpay Order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay Payment ID is required'),
  razorpaySignature: z.string().min(1, 'Razorpay Signature is required'),
});

export const createPaymentLinkSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().optional(),
  customer: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  itemType: z.enum(['course', 'bootcamp', 'workshop', 'hackathon', 'training-program', 'enrollment', 'reservation']),
  itemId: z.string().min(1, 'Item ID is required'),
  expiresInHours: z.number().int().positive().default(24).optional(),
});
