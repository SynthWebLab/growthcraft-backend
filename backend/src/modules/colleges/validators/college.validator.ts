import { body, query, ValidationChain } from 'express-validator';
import { PARTNERSHIP_TIERS } from '@/database/models/CollegeProfile.model';

export class CollegeValidator {
  /**
   * Validate the students list query params.
   */
  public static listStudents(): ValidationChain[] {
    return [
      query('status')
        .optional()
        .isIn(['active', 'completed', 'pending'])
        .withMessage('Status must be active, completed, or pending'),
      query('search').optional().trim().isLength({ max: 150 }).withMessage('Search is too long'),
      query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 10000 })
        .withMessage('Limit must be between 1 and 10000'),
    ];
  }

  /**
   * Validate institution profile / point-of-contact update (all optional).
   */
  public static updateProfile(): ValidationChain[] {
    return [
      body('collegeName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 150 })
        .withMessage('College name must be 1-150 characters'),
      body('website')
        .optional({ checkFalsy: true })
        .trim()
        .isURL()
        .withMessage('Website must be a valid URL'),

      body('address.street').optional().trim().isLength({ max: 200 }),
      body('address.city').optional().trim().isLength({ max: 100 }),
      body('address.state').optional().trim().isLength({ max: 100 }),
      body('address.country').optional().trim().isLength({ max: 100 }),
      body('address.pincode').optional().trim().isLength({ max: 20 }),

      body('contactPerson.name').optional().trim().isLength({ max: 100 }),
      body('contactPerson.designation').optional().trim().isLength({ max: 100 }),
      body('contactPerson.email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('POC email must be valid'),
      body('contactPerson.phone').optional().trim().isLength({ max: 20 }),
    ];
  }

  /**
   * Validate a subscription activation (choose a plan).
   */
  public static subscribe(): ValidationChain[] {
    return [
      body('tier')
        .notEmpty()
        .withMessage('Tier is required')
        .isIn(PARTNERSHIP_TIERS)
        .withMessage(`Tier must be one of: ${PARTNERSHIP_TIERS.join(', ')}`),
    ];
  }

  /**
   * Validate a partnership tier upgrade request.
   */
  public static requestUpgrade(): ValidationChain[] {
    return [
      body('requestedTier')
        .notEmpty()
        .withMessage('Requested tier is required')
        .isIn(PARTNERSHIP_TIERS)
        .withMessage(`Requested tier must be one of: ${PARTNERSHIP_TIERS.join(', ')}`),
      body('note')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Note cannot exceed 1000 characters'),
    ];
  }

  /**
   * Validate account settings update.
   */
  public static updateAccount(): ValidationChain[] {
    return [
      body('institutionName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 150 })
        .withMessage('Institution name must be 1-150 characters'),
      body('phone')
        .optional()
        .trim()
        .matches(/^\+?[\d\s\-()]+$/)
        .withMessage('Please provide a valid phone number'),
    ];
  }

  /**
   * Validate notification preferences update (all optional booleans).
   */
  public static updateNotificationPreferences(): ValidationChain[] {
    return [
      body('studentEnrollments')
        .optional()
        .isBoolean()
        .withMessage('studentEnrollments must be a boolean'),
      body('programUpdates').optional().isBoolean().withMessage('programUpdates must be a boolean'),
      body('reportsReady').optional().isBoolean().withMessage('reportsReady must be a boolean'),
      body('marketingEmails')
        .optional()
        .isBoolean()
        .withMessage('marketingEmails must be a boolean'),
    ];
  }

  /**
   * Validate a bulk student import. Requires `students` (non-empty array) and/or
   * a `csv` string. Per-row field validation happens in the service.
   */
  public static importStudents(): ValidationChain[] {
    return [
      body('students')
        .optional()
        .isArray({ min: 1 })
        .withMessage('students must be a non-empty array'),
      body('students.*.fullName')
        .if(body('students').exists())
        .trim()
        .notEmpty()
        .withMessage('Each student needs a fullName'),
      body('students.*.email')
        .if(body('students').exists())
        .trim()
        .isEmail()
        .withMessage('Each student needs a valid email'),
      body('students.*.phone')
        .if(body('students').exists())
        .trim()
        .notEmpty()
        .withMessage('Each student needs a phone'),
      body('csv').optional().isString().withMessage('csv must be a string'),
      body('eventIds').optional().isArray().withMessage('eventIds must be an array'),
      body('eventIds.*').optional().isMongoId().withMessage('Each eventId must be a valid id'),
      body('defaultPassword')
        .optional()
        .isLength({ min: 8 })
        .withMessage('defaultPassword must be at least 8 characters'),
      body().custom((value) => {
        const hasStudents = Array.isArray(value.students) && value.students.length > 0;
        const hasCsv = typeof value.csv === 'string' && value.csv.trim().length > 0;
        if (!hasStudents && !hasCsv) {
          throw new Error('Provide students[] or a csv string');
        }
        return true;
      }),
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
