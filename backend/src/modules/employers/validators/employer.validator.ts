import { body, param, ValidationChain } from 'express-validator';

export class EmployerValidator {
  public static createJob(): ValidationChain[] {
    return [
      body('title').trim().notEmpty().withMessage('Job title is required'),
      body('description').trim().notEmpty().withMessage('Job description is required'),
      body('requirements').optional().isArray().withMessage('Requirements must be an array of strings'),
      body('skillsRequired').optional().isArray().withMessage('Skills required must be an array of strings'),
      body('location').trim().notEmpty().withMessage('Location is required'),
      body('locationType')
        .isIn(['Onsite', 'Remote', 'Hybrid'])
        .withMessage('Location type must be Onsite, Remote, or Hybrid'),
      body('salaryRange.min').optional().isNumeric().withMessage('Min salary must be a number'),
      body('salaryRange.max').optional().isNumeric().withMessage('Max salary must be a number'),
      body('jobType')
        .isIn(['Full-time', 'Part-time', 'Internship', 'Contract'])
        .withMessage('Job type must be Full-time, Part-time, Internship, or Contract'),
      body('applicationDeadline').optional().isISO8601().toDate().withMessage('Application deadline must be a valid date'),
      body('status').optional().isIn(['Draft', 'Active', 'Closed', 'Filled']).withMessage('Invalid job status'),
    ];
  }

  public static updateJob(): ValidationChain[] {
    return [
      param('id').isMongoId().withMessage('Invalid job ID'),
      body('title').optional().trim().notEmpty().withMessage('Job title cannot be empty'),
      body('description').optional().trim().notEmpty().withMessage('Job description cannot be empty'),
      body('requirements').optional().isArray().withMessage('Requirements must be an array of strings'),
      body('skillsRequired').optional().isArray().withMessage('Skills required must be an array of strings'),
      body('location').optional().trim().notEmpty().withMessage('Location cannot be empty'),
      body('locationType')
        .optional()
        .isIn(['Onsite', 'Remote', 'Hybrid'])
        .withMessage('Location type must be Onsite, Remote, or Hybrid'),
      body('salaryRange.min').optional().isNumeric().withMessage('Min salary must be a number'),
      body('salaryRange.max').optional().isNumeric().withMessage('Max salary must be a number'),
      body('jobType')
        .optional()
        .isIn(['Full-time', 'Part-time', 'Internship', 'Contract'])
        .withMessage('Job type must be Full-time, Part-time, Internship, or Contract'),
      body('applicationDeadline').optional().isISO8601().toDate().withMessage('Application deadline must be a valid date'),
      body('status').optional().isIn(['Draft', 'Active', 'Closed', 'Filled']).withMessage('Invalid job status'),
    ];
  }

  public static updateJobStatus(): ValidationChain[] {
    return [
      param('id').isMongoId().withMessage('Invalid job ID'),
      body('status')
        .isIn(['Draft', 'Active', 'Closed', 'Filled'])
        .withMessage('Status must be Draft, Active, Closed, or Filled'),
    ];
  }

  public static updateProfile(): ValidationChain[] {
    return [
      body('companyName').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
      body('industry')
        .optional()
        .isIn(['IT/Software', 'Fintech', 'E-Commerce', 'Healthcare', 'EdTech', 'Startup', 'Other'])
        .withMessage('Invalid industry value'),
      body('companySize')
        .optional()
        .isIn(['1-50', '51-200', '201-500', '500+'])
        .withMessage('Invalid company size value'),
      body('website').optional({ checkFalsy: true }).trim().isURL().withMessage('Website must be a valid URL'),
      body('hiringNeeds').optional().trim().isLength({ max: 1000 }).withMessage('Hiring needs cannot exceed 1000 characters'),
      body('contactPerson.name').optional().trim().notEmpty().withMessage('Contact person name cannot be empty'),
      body('contactPerson.email').optional().trim().isEmail().withMessage('Contact person email must be valid'),
      body('contactPerson.phone').optional().trim().notEmpty().withMessage('Contact person phone is required'),
    ];
  }

  public static updateApplicationStatus(): ValidationChain[] {
    return [
      param('id').isMongoId().withMessage('Invalid application ID'),
      body('status')
        .isIn(['Applied', 'Shortlisted', 'Interview', 'Hired', 'Rejected'])
        .withMessage('Status must be Applied, Shortlisted, Interview, Hired, or Rejected'),
    ];
  }
}

