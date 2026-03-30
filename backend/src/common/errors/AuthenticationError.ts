import { AppError } from './AppError';

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', code: string = 'AUTHENTICATION_ERROR') {
    super(message, 401, code);

    // Set the prototype explicitly
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }

  /**
   * Invalid credentials error
   */
  public static invalidCredentials(): AuthenticationError {
    return new AuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  /**
   * Invalid token error
   */
  public static invalidToken(): AuthenticationError {
    return new AuthenticationError('Invalid or expired token', 'INVALID_TOKEN');
  }

  /**
   * Token expired error
   */
  public static tokenExpired(): AuthenticationError {
    return new AuthenticationError('Token has expired', 'TOKEN_EXPIRED');
  }

  /**
   * Missing token error
   */
  public static missingToken(): AuthenticationError {
    return new AuthenticationError('Access token is required', 'MISSING_TOKEN');
  }

  /**
   * Account not verified error
   */
  public static accountNotVerified(): AuthenticationError {
    return new AuthenticationError('Please verify your email address', 'ACCOUNT_NOT_VERIFIED');
  }

  /**
   * Account disabled error
   */
  public static accountDisabled(): AuthenticationError {
    return new AuthenticationError('Your account has been disabled', 'ACCOUNT_DISABLED');
  }
}

export default AuthenticationError;
