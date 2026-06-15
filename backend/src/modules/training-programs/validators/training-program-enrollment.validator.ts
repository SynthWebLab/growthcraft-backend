import { body, param } from 'express-validator';

export const trainingProgramEnrollmentValidator = {
  enroll: [
    param('programId')
      .notEmpty()
      .withMessage('Program ID is required')
      .isMongoId()
      .withMessage('Invalid program ID'),
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
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .isMobilePhone('any')
      .withMessage('Invalid phone number'),
  ],
  requestCallback: [
    param('programId')
      .notEmpty()
      .withMessage('Program ID is required')
      .isMongoId()
      .withMessage('Invalid program ID'),
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
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .isMobilePhone('any')
      .withMessage('Invalid phone number'),
  ],
  checkStatus: [
    param('programId')
      .notEmpty()
      .withMessage('Program ID is required')
      .isMongoId()
      .withMessage('Invalid program ID'),
  ],
};
