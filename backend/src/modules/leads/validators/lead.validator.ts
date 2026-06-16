import { body } from 'express-validator';

export const leadValidator = {
  create: [
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
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('phone')
      .optional({ nullable: true, checkFalsy: true })
      .trim(),
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ min: 1, max: 2000 })
      .withMessage('Message must be between 1 and 2000 characters'),
    body('role')
      .optional({ nullable: true, checkFalsy: true })
      .trim(),
    body('subject')
      .optional({ nullable: true, checkFalsy: true })
      .trim(),
    body('organization')
      .optional({ nullable: true, checkFalsy: true })
      .trim(),
    body('source')
      .optional({ nullable: true, checkFalsy: true })
      .trim(),
  ],
};
