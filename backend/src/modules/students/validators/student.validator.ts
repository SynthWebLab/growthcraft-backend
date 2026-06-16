import { body, ValidationChain } from 'express-validator';

export class StudentValidator {
  /**
   * Validate student profile update.
   * All fields are optional (partial update / upsert), but when present they must be valid.
   */
  public static updateProfile(): ValidationChain[] {
    return [
      body('enrollmentNumber')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Enrollment number cannot exceed 50 characters'),

      body('collegeName')
        .optional()
        .trim()
        .isLength({ max: 150 })
        .withMessage('College name cannot exceed 150 characters'),

      body('degree')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Degree cannot exceed 100 characters'),

      body('branch')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Branch cannot exceed 100 characters'),

      body('yearOfStudy')
        .optional()
        .isInt({ min: 1, max: 6 })
        .withMessage('Year of study must be between 1 and 6'),

      body('graduationYear')
        .optional()
        .isInt({ min: 1950, max: 2100 })
        .withMessage('Please provide a valid graduation year'),

      body('skills')
        .optional()
        .isArray()
        .withMessage('Skills must be an array of strings'),
      body('skills.*')
        .optional()
        .isString()
        .withMessage('Each skill must be a string'),

      body('interests')
        .optional()
        .isArray()
        .withMessage('Interests must be an array of strings'),
      body('interests.*')
        .optional()
        .isString()
        .withMessage('Each interest must be a string'),

      body('resume')
        .optional()
        .trim()
        .isURL()
        .withMessage('Resume must be a valid URL'),

      body('portfolio')
        .optional()
        .trim()
        .isURL()
        .withMessage('Portfolio must be a valid URL'),

      body('linkedIn')
        .optional()
        .trim()
        .isURL()
        .withMessage('LinkedIn must be a valid URL'),

      body('github')
        .optional()
        .trim()
        .isURL()
        .withMessage('GitHub must be a valid URL'),
    ];
  }

  /**
   * Validate a support ticket submission.
   */
  public static createSupportTicket(): ValidationChain[] {
    return [
      body('subject')
        .trim()
        .notEmpty()
        .withMessage('Subject is required')
        .isLength({ max: 150 })
        .withMessage('Subject cannot exceed 150 characters'),

      body('message')
        .trim()
        .notEmpty()
        .withMessage('Message is required')
        .isLength({ min: 10, max: 2000 })
        .withMessage('Message must be between 10 and 2000 characters'),
    ];
  }
}
