import { body, param, ValidationChain } from 'express-validator';
import { EventType } from '@/database/models/Bootcamp.model';
import mongoose from 'mongoose';

export class EventEnrollmentValidator {
  /**
   * Validate event type parameter
   */
  static validateEventType(): ValidationChain {
    return param('eventType')
      .isString()
      .withMessage('Event type must be a string')
      .isIn(Object.values(EventType))
      .withMessage('Invalid event type. Must be one of: Workshop, Bootcamp, Hackathon')
      .trim();
  }

  /**
   * Validate event ID parameter
   */
  static validateEventId(): ValidationChain {
    return param('eventId')
      .isString()
      .withMessage('Event ID must be a string')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid event ID format');
        }
        return true;
      })
      .trim();
  }

  /**
   * Validate enrollment/registration data
   */
  static registerForEvent(): ValidationChain[] {
    return [
      this.validateEventType(),
      this.validateEventId(),
      body('fullName')
        .isString()
        .withMessage('Full name must be a string')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Full name can only contain letters, spaces, hyphens, and apostrophes'),
      body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
        .isLength({ max: 100 })
        .withMessage('Email cannot exceed 100 characters'),
      body('phone')
        .isString()
        .withMessage('Phone number must be a string')
        .trim()
        .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{8,}$/)
        .withMessage('Please provide a valid phone number')
        .isLength({ min: 10, max: 20 })
        .withMessage('Phone number must be between 10 and 20 characters'),
    ];
  }

  /**
   * Validate callback request data
   */
  static requestCallback(): ValidationChain[] {
    return [
      this.validateEventType(),
      this.validateEventId(),
      body('fullName')
        .isString()
        .withMessage('Full name must be a string')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Full name can only contain letters, spaces, hyphens, and apostrophes'),
      body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
        .isLength({ max: 100 })
        .withMessage('Email cannot exceed 100 characters'),
      body('phone')
        .isString()
        .withMessage('Phone number must be a string')
        .trim()
        .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{8,}$/)
        .withMessage('Please provide a valid phone number')
        .isLength({ min: 10, max: 20 })
        .withMessage('Phone number must be between 10 and 20 characters'),
    ];
  }

  /**
   * Validate event ID parameter for status check
   */
  static checkEnrollmentStatus(): ValidationChain[] {
    return [this.validateEventType(), this.validateEventId()];
  }

  /**
   * Validate optional event type parameter for listing enrollments/callbacks
   */
  static validateOptionalEventType(): ValidationChain {
    return param('eventType')
      .optional()
      .isString()
      .withMessage('Event type must be a string')
      .isIn(Object.values(EventType))
      .withMessage('Invalid event type. Must be one of: Workshop, Bootcamp, Hackathon')
      .trim();
  }
}
