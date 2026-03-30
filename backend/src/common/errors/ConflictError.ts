import { AppError } from './AppError';

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', code: string = 'CONFLICT_ERROR') {
    super(message, 409, code);

    // Set the prototype explicitly
    Object.setPrototypeOf(this, ConflictError.prototype);
  }

  /**
   * Email already exists error
   */
  public static emailExists(): ConflictError {
    return new ConflictError('An account with this email already exists', 'EMAIL_ALREADY_EXISTS');
  }

  /**
   * Username already exists error
   */
  public static usernameExists(): ConflictError {
    return new ConflictError('This username is already taken', 'USERNAME_ALREADY_EXISTS');
  }

  /**
   * Resource already exists error
   */
  public static resourceExists(resourceName: string): ConflictError {
    return new ConflictError(`${resourceName} already exists`, 'RESOURCE_ALREADY_EXISTS');
  }

  /**
   * Duplicate entry error
   */
  public static duplicateEntry(field: string): ConflictError {
    return new ConflictError(`Duplicate entry for ${field}`, 'DUPLICATE_ENTRY');
  }

  /**
   * Already enrolled error
   */
  public static alreadyEnrolled(): ConflictError {
    return new ConflictError('You are already enrolled in this course', 'ALREADY_ENROLLED');
  }
}

export default ConflictError;
