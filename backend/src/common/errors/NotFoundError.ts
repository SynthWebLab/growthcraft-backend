import { AppError } from './AppError';

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', code: string = 'NOT_FOUND') {
    super(message, 404, code);

    // Set the prototype explicitly
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  /**
   * User not found error
   */
  public static user(): NotFoundError {
    return new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  /**
   * Course not found error
   */
  public static course(): NotFoundError {
    return new NotFoundError('Course not found', 'COURSE_NOT_FOUND');
  }

  /**
   * Route not found error
   */
  public static route(): NotFoundError {
    return new NotFoundError('The requested route does not exist', 'ROUTE_NOT_FOUND');
  }

  /**
   * Generic resource not found error
   */
  public static resource(resourceName: string): NotFoundError {
    return new NotFoundError(`${resourceName} not found`, 'RESOURCE_NOT_FOUND');
  }

  /**
   * File not found error
   */
  public static file(): NotFoundError {
    return new NotFoundError('File not found', 'FILE_NOT_FOUND');
  }
}

export default NotFoundError;
