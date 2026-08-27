import { body, ValidationChain } from 'express-validator';

/**
 * Centralized password validation rules
 * Used across registration, password reset, and password change
 */
export class PasswordValidator {
  /**
   * Standard password validation rules
   * Requirements:
   * - Minimum 8 characters
   * - At least one uppercase letter (A-Z)
   * - At least one lowercase letter (a-z)
   * - At least one number (0-9)
   */
  public static passwordRules(fieldName: string = 'password'): ValidationChain {
    return body(fieldName)
      .notEmpty()
      .withMessage(`${fieldName === 'password' ? 'Password' : 'New password'} is required`)
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      );
  }

  /**
   * Password confirmation validation
   * Ensures confirmPassword matches the password field
   */
  public static confirmPasswordRules(
    passwordField: string = 'password',
    confirmField: string = 'confirmPassword'
  ): ValidationChain {
    return body(confirmField)
      .optional()
      .custom((value, { req }) => {
        if (value && value !== req.body[passwordField]) {
          throw new Error('Passwords do not match');
        }
        return true;
      });
  }

  /**
   * Strong password validation (optional, for enhanced security)
   * Additional requirements:
   * - At least one special character
   * - Minimum 10 characters
   */
  public static strongPasswordRules(fieldName: string = 'password'): ValidationChain {
    return body(fieldName)
      .notEmpty()
      .withMessage(`${fieldName === 'password' ? 'Password' : 'New password'} is required`)
      .isLength({ min: 10 })
      .withMessage('Password must be at least 10 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
      );
  }

  /**
   * Password strength checker (for informational purposes)
   * Returns strength level: weak, fair, good, strong
   */
  public static checkPasswordStrength(password: string): {
    strength: 'weak' | 'fair' | 'good' | 'strong';
    score: number;
    feedback: string[];
  } {
    let score = 0;
    const feedback: string[] = [];

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;

    // Character variety checks
    if (/[a-z]/.test(password)) {
      score++;
    } else {
      feedback.push('Add lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
      score++;
    } else {
      feedback.push('Add uppercase letters');
    }

    if (/\d/.test(password)) {
      score++;
    } else {
      feedback.push('Add numbers');
    }

    if (/[@$!%*?&]/.test(password)) {
      score++;
    } else {
      feedback.push('Add special characters');
    }

    // Determine strength
    let strength: 'weak' | 'fair' | 'good' | 'strong';
    if (score <= 3) {
      strength = 'weak';
    } else if (score <= 5) {
      strength = 'fair';
    } else if (score <= 6) {
      strength = 'good';
    } else {
      strength = 'strong';
    }

    return { strength, score, feedback };
  }

  /**
   * Common password blacklist
   * Prevents use of commonly compromised passwords
   */
  private static readonly COMMON_PASSWORDS = [
    'password',
    'password123',
    '12345678',
    'qwerty',
    'abc123',
    'monkey',
    '1234567',
    'letmein',
    'trustno1',
    'dragon',
    'baseball',
    'iloveyou',
    'master',
    'sunshine',
    'ashley',
    'bailey',
    'passw0rd',
    'shadow',
    '123123',
    '654321',
    'superman',
    'qazwsx',
    'michael',
    'football',
  ];

  /**
   * Check if password is in common password list
   */
  public static isCommonPassword(password: string): boolean {
    return this.COMMON_PASSWORDS.includes(password.toLowerCase());
  }

  /**
   * Blacklist validation - prevents common passwords
   */
  public static blacklistValidation(fieldName: string = 'password'): ValidationChain {
    return body(fieldName).custom((value) => {
      if (PasswordValidator.isCommonPassword(value)) {
        throw new Error('This password is too common. Please choose a more secure password.');
      }
      return true;
    });
  }
}
