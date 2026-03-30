import { AppError } from './AppError';

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', code: string = 'AUTHORIZATION_ERROR') {
    super(message, 403, code);

    // Set the prototype explicitly
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }

  /**
   * Insufficient permissions error
   */
  public static insufficientPermissions(): AuthorizationError {
    return new AuthorizationError(
      'You do not have permission to perform this action',
      'INSUFFICIENT_PERMISSIONS'
    );
  }

  /**
   * Role required error
   */
  public static roleRequired(requiredRole: string): AuthorizationError {
    return new AuthorizationError(
      `${requiredRole} role is required to access this resource`,
      'ROLE_REQUIRED'
    );
  }

  /**
   * Resource access denied error
   */
  public static resourceAccessDenied(): AuthorizationError {
    return new AuthorizationError(
      'You do not have access to this resource',
      'RESOURCE_ACCESS_DENIED'
    );
  }

  /**
   * Account suspended error
   */
  public static accountSuspended(): AuthorizationError {
    return new AuthorizationError('Your account has been suspended', 'ACCOUNT_SUSPENDED');
  }
}

export default AuthorizationError;
