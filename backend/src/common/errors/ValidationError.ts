import { AppError } from './AppError';

export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
}

export class ValidationError extends AppError {
  public readonly errors: ValidationErrorDetail[];

  constructor(
    message: string = 'Validation failed',
    errors: ValidationErrorDetail[] = [],
    code: string = 'VALIDATION_ERROR'
  ) {
    super(message, 400, code);
    this.errors = errors;

    // Set the prototype explicitly
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  /**
   * Create ValidationError from Zod error
   */
  public static fromZodError(zodError: any): ValidationError {
    const errors: ValidationErrorDetail[] = zodError.errors.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
      value: err.received,
    }));

    return new ValidationError('Validation failed', errors);
  }

  /**
   * Create ValidationError from Mongoose validation error
   */
  public static fromMongooseError(mongooseError: any): ValidationError {
    const errors: ValidationErrorDetail[] = Object.values(mongooseError.errors).map((err: any) => ({
      field: err.path,
      message: err.message,
      value: err.value,
    }));

    return new ValidationError('Validation failed', errors);
  }

  /**
   * Create ValidationError for a single field
   */
  public static forField(field: string, message: string, value?: any): ValidationError {
    return new ValidationError('Validation failed', [{ field, message, value }]);
  }

  /**
   * Convert error to JSON for API responses
   */
  public toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        timestamp: this.timestamp,
        errors: this.errors,
        ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
      },
    };
  }
}

export default ValidationError;
