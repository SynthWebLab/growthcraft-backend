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
        .isIn(['student', 'college', 'mentor', 'employer'])
        .withMessage('Invalid role. Must be one of: student, college, mentor, employer'),

      // College-specific validations (conditional)
      body('collegeData.institutionName')
        .if(body('role').equals('college'))
        .trim()
        .notEmpty()
        .withMessage('Institution name is required for college registration')
        .isLength({ min: 2, max: 200 })
        .withMessage('Institution name must be between 2 and 200 characters'),

      body('collegeData.contactPerson')
        .if(body('role').equals('college'))
        .trim()
        .notEmpty()
        .withMessage('Contact person name is required for college registration')
        .isLength({ min: 2, max: 100 })
        .withMessage('Contact person name must be between 2 and 100 characters'),

      body('collegeData.designation')
        .if(body('role').equals('college'))
        .trim()
        .notEmpty()
        .withMessage('Designation is required for college registration')
        .isLength({ min: 2, max: 100 })
        .withMessage('Designation must be between 2 and 100 characters'),

      body('collegeData.officialEmail')
        .if(body('role').equals('college'))
        .trim()
        .notEmpty()
        .withMessage('Official email is required for college registration')
        .isEmail()
        .withMessage('Please provide a valid official email')
        .normalizeEmail(),

      body('collegeData.phone')
        .if(body('role').equals('college'))
        .trim()
        .notEmpty()
        .withMessage('College phone number is required')
        .matches(/^\+?[\d\s-()]+$/)
        .withMessage('Please provide a valid phone number'),

      body('collegeData.city')
        .if(body('role').equals('college'))
        .trim()
        .notEmpty()
        .withMessage('City is required for college registration')
        .isLength({ min: 2, max: 100 })
        .withMessage('City must be between 2 and 100 characters'),

      body('collegeData.state')
        .if(body('role').equals('college'))
        .trim()
        .notEmpty()
        .withMessage('State is required for college registration')
        .isLength({ min: 2, max: 100 })
        .withMessage('State must be between 2 and 100 characters'),

      body('collegeData.website')
        .if(body('role').equals('college'))
        .optional()
        .trim()
        .isURL()
        .withMessage('Please provide a valid website URL'),

      // Employer-specific validations (conditional)
      body('employerData.companyName')
        .if(body('role').equals('employer'))
        .trim()
        .notEmpty()
        .withMessage('Company name is required for employer registration')
        .isLength({ min: 2, max: 200 })
        .withMessage('Company name must be between 2 and 200 characters'),

      body('employerData.contactPerson')
        .if(body('role').equals('employer'))
        .trim()
        .notEmpty()
        .withMessage('Contact person name is required for employer registration')
        .isLength({ min: 2, max: 100 })
        .withMessage('Contact person name must be between 2 and 100 characters'),

      body('employerData.industry')
        .if(body('role').equals('employer'))
        .trim()
        .notEmpty()
        .withMessage('Industry is required for employer registration')
        .isIn(['IT/Software', 'Fintech', 'E-Commerce', 'Healthcare', 'EdTech', 'Startup', 'Other'])
        .withMessage('Invalid industry. Must be one of: IT/Software, Fintech, E-Commerce, Healthcare, EdTech, Startup, Other'),

      body('employerData.officialEmail')
        .if(body('role').equals('employer'))
        .trim()
        .notEmpty()
        .withMessage('Official email is required for employer registration')
        .isEmail()
        .withMessage('Please provide a valid official email')
        .normalizeEmail(),

      body('employerData.phone')
        .if(body('role').equals('employer'))
        .trim()
        .notEmpty()
        .withMessage('Company phone number is required')
        .matches(/^\+?[\d\s-()]+$/)
        .withMessage('Please provide a valid phone number'),

      body('employerData.companySize')
        .if(body('role').equals('employer'))
        .trim()
        .notEmpty()
        .withMessage('Company size is required for employer registration')
        .isIn(['1-50', '51-200', '201-500', '500+'])
        .withMessage('Invalid company size. Must be one of: 1-50, 51-200, 201-500, 500+'),

      body('employerData.website')
        .if(body('role').equals('employer'))
        .optional()
        .trim()
        .isURL()
        .withMessage('Please provide a valid website URL'),

      body('employerData.hiringNeeds')
        .if(body('role').equals('employer'))
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Hiring needs cannot exceed 1000 characters'),
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
