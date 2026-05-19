import { body, ValidationChain } from 'express-validator';

export class EnrollmentValidator {
  /**
   * Validate course enrollment request
   */
  public static enrollCourse(): ValidationChain[] {
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

      body('enrollmentNumber')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Enrollment number cannot exceed 50 characters'),

      body('collegeName')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('College name cannot exceed 200 characters'),
    ];
  }

  /**
   * Validate callback request
   */
  public static requestCallback(): ValidationChain[] {
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
    ];
  }
}
