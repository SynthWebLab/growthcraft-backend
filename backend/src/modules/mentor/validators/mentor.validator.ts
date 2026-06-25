import { body, param, ValidationChain } from 'express-validator';

export class MentorValidator {
  /**
   * Validate mentor profile update.
   */
  public static updateProfile(): ValidationChain[] {
    return [
      body('bio')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Bio cannot exceed 1000 characters'),

      body('experienceYears')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Experience years must be a non-negative integer'),

      body('areaOfExpertise')
        .optional()
        .trim()
        .isIn([
          'Web Development',
          'Data Science & AI',
          'Mobile Development',
          'DevOps & Cloud',
          'UI/UX Design',
          'Cybersecurity',
          'Other',
        ])
        .withMessage('Invalid area of expertise'),

      body('currentOrganization')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Current organization cannot be empty'),

      body('linkedIn')
        .optional()
        .trim()
        .isURL()
        .withMessage('LinkedIn must be a valid URL'),

      body('website')
        .optional()
        .trim()
        .isURL()
        .withMessage('Website must be a valid URL'),

      body('hourlyRate')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Hourly rate must be a non-negative number'),
    ];
  }

  /**
   * Validate availability update.
   */
  public static updateAvailability(): ValidationChain[] {
    return [
      body('hourlyRate')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Hourly rate must be a non-negative number'),

      body('availability')
        .optional()
        .isArray()
        .withMessage('Availability must be an array of schedules'),

      body('availability.*.day')
        .optional()
        .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
        .withMessage('Day must be a valid day of the week'),

      body('availability.*.slots')
        .optional()
        .isArray()
        .withMessage('Slots must be an array'),

      body('availability.*.slots.*.startTime')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Start time is required for each slot'),

      body('availability.*.slots.*.endTime')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('End time is required for each slot'),
    ];
  }

  /**
   * Validate session status update.
   */
  public static updateSessionStatus(): ValidationChain[] {
    return [
      param('id')
        .isMongoId()
        .withMessage('Invalid session ID'),

      body('status')
        .trim()
        .isIn(['scheduled', 'completed', 'cancelled'])
        .withMessage('Status must be scheduled, completed, or cancelled'),
    ];
  }

  /**
   * Validate support ticket submission.
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

  /**
   * Validate account settings update.
   */
  public static updateSettingsAccount(): ValidationChain[] {
    return [
      body('fullName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),

      body('phone')
        .optional()
        .trim()
        .matches(/^\+?[\d\s-()]+$/)
        .withMessage('Please provide a valid phone number'),
    ];
  }

  /**
   * Validate change password.
   */
  public static changePassword(): ValidationChain[] {
    return [
      body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),

      body('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters'),

      body('confirmPassword')
        .custom((value, { req }) => {
          if (value !== req.body.newPassword) {
            throw new Error('Passwords do not match');
          }
          return true;
        }),
    ];
  }
}
