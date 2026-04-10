import { body, ValidationChain } from 'express-validator';

export class AuthValidator {
  public static register(): ValidationChain[] {
    return [
      body('fullName')
        .trim()
        .notEmpty()
        .withMessage('Full name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),

      body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),

      body('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^\+?[\d\s-()]+$/)
        .withMessage('Please provide a valid phone number'),

      body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage(
          'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),

      body('role')
        .notEmpty()
        .withMessage('Role is required')
        .isIn(['student', 'college', 'mentor', 'ambassador', 'hiring_partner'])
        .withMessage('Invalid role. Must be one of: student, college, mentor, ambassador, hiring_partner'),
    ];
  }

  public static login(): ValidationChain[] {
    return [
      body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),

      body('password').notEmpty().withMessage('Password is required'),
    ];
  }
}
