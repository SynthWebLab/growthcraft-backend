import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { authService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { logger } from '@/common/utils/logger.util';
import { config } from '@/config';
import { jwtConfig } from '@/config/jwt.config';

export class AuthController {
  private static instance: AuthController;

  private constructor() {}

  public static getInstance(): AuthController {
    if (!AuthController.instance) {
      AuthController.instance = new AuthController();
    }
    return AuthController.instance;
  }

  /**
   * Set secure httpOnly cookies for tokens
   */
  private setTokenCookies(res: Response, accessToken: string, refreshToken: string): void {
    const isProduction = config.NODE_ENV === 'production';

    // Access token cookie (15 minutes)
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    // Refresh token cookie (30 days)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });
  }

  /**
   * Clear authentication cookies
   */
  private clearTokenCookies(res: Response): void {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
  }

  public async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors.array(),
          },
        });
        return;
      }

      const registerDto: RegisterDto = req.body;

      // Register user
      const result = await authService.register(registerDto);

      // Set httpOnly cookies
      this.setTokenCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

      const responseData: any = {
        user: result.user,
        requiresEmailVerification: !result.user.isEmailVerified,
        // DEVELOPMENT ONLY: Show tokens in response for testing
        ...(config.NODE_ENV === 'development' && {
          tokens: {
            accessToken: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
          },
        }),
      };

      // Add college profile to response if available
      if (result.collegeProfile) {
        responseData.collegeProfile = result.collegeProfile;
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email to verify your account.',
        data: responseData,
      });
    } catch (error: any) {
      logger.error('Register controller error:', error);

      if (error.message === 'User with this email already exists') {
        res.status(409).json({
          success: false,
          error: {
            message: error.message,
            code: 'USER_EXISTS',
          },
        });
        return;
      }

      if (error.message === 'Failed to create college profile. Please try again.') {
        res.status(500).json({
          success: false,
          error: {
            message: error.message,
            code: 'PROFILE_CREATION_FAILED',
          },
        });
        return;
      }

      next(error);
    }
  }

  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors.array(),
          },
        });
        return;
      }

      const { email, password } = req.body;

      // Login user
      const result = await authService.login(email, password);

      // Set httpOnly cookies
      this.setTokenCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
        },
      });
    } catch (error: any) {
      logger.error('Login controller error:', error);

      if (
        error.message === 'Invalid email or password' ||
        error.message === 'Account is deactivated' ||
        error.message === 'Email not verified. Please verify your email before logging in.'
      ) {
        const statusCode = error.message.includes('Email not verified') ? 403 : 401;
        res.status(statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.message.includes('Email not verified')
              ? 'EMAIL_NOT_VERIFIED'
              : 'AUTHENTICATION_FAILED',
          },
        });
        return;
      }

      next(error);
    }
  }

  public async getProfile(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;

      const user = await authService.getUserById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      _next(error);
    }
  }

  public async refreshToken(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      // Get refresh token from cookie
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Refresh token not provided',
            code: 'NO_REFRESH_TOKEN',
          },
        });
        return;
      }

      // Get userId from access_token cookie (even if expired, we can decode it)
      const expiredAccessToken = req.cookies.access_token;
      let userId: string | undefined;

      if (expiredAccessToken) {
        const decoded = jwtConfig.decodeToken(expiredAccessToken);
        userId = decoded?.userId;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Cannot identify user',
            code: 'USER_IDENTIFICATION_FAILED',
          },
        });
        return;
      }

      // Extract device info from user agent
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const deviceInfo = `${userAgent.substring(0, 100)}`;

      // Refresh tokens (validates and rotates with reuse detection)
      const tokens = await authService.refreshToken(userId, refreshToken, deviceInfo);

      // Set new httpOnly cookies
      this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
      });
    } catch (error: any) {
      logger.error('Refresh token controller error:', error);

      // Clear invalid cookies
      this.clearTokenCookies(res);

      // Check if it's a token reuse attack
      if (
        error.message.includes('reuse detected') ||
        error.message.includes('Suspicious activity')
      ) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Security violation detected. Please login again.',
            code: 'TOKEN_REUSE_DETECTED',
          },
        });
        return;
      }

      res.status(401).json({
        success: false,
        error: {
          message: error.message || 'Token refresh failed',
          code: 'REFRESH_FAILED',
        },
      });
    }
  }

  public async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        await authService.logout(userId, refreshToken);
      }

      // Clear cookies
      this.clearTokenCookies(res);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;

      await authService.logoutAll(userId);

      // Clear cookies
      this.clearTokenCookies(res);

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Email and OTP are required',
            code: 'MISSING_FIELDS',
          },
        });
        return;
      }

      // Validate OTP format (should be 6 digits)
      if (!/^\d{6}$/.test(otp)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid OTP format. OTP must be 6 digits.',
            code: 'INVALID_OTP_FORMAT',
          },
        });
        return;
      }

      const result = await authService.verifyEmail(email, otp);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        data: {
          user: result.user,
        },
      });
    } catch (error: any) {
      logger.error('Email verification controller error:', error);

      if (
        error.message.includes('Invalid OTP') ||
        error.message.includes('OTP has expired') ||
        error.message.includes('Maximum verification attempts') ||
        error.message.includes('No verification OTP found')
      ) {
        res.status(400).json({
          success: false,
          error: {
            message: error.message,
            code: 'VERIFICATION_FAILED',
          },
        });
        return;
      }

      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          error: {
            message: error.message,
            code: 'USER_NOT_FOUND',
          },
        });
        return;
      }

      next(error);
    }
  }

  public async resendVerificationEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Email is required',
            code: 'MISSING_EMAIL',
          },
        });
        return;
      }

      await authService.resendVerificationOTP(email);

      res.status(200).json({
        success: true,
        message: 'Verification OTP sent successfully',
      });
    } catch (error: any) {
      logger.error('Resend verification OTP controller error:', error);

      if (error.message === 'User not found' || error.message === 'Email is already verified') {
        res.status(400).json({
          success: false,
          error: {
            message: error.message,
            code: 'RESEND_FAILED',
          },
        });
        return;
      }

      if (error.message.includes('Please wait')) {
        res.status(429).json({
          success: false,
          error: {
            message: error.message,
            code: 'RATE_LIMIT_EXCEEDED',
          },
        });
        return;
      }

      next(error);
    }
  }

  public async requestPasswordReset(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Email is required',
            code: 'MISSING_EMAIL',
          },
        });
        return;
      }

      await authService.requestPasswordReset(email);

      // Always return success to prevent email enumeration
      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    } catch (error) {
      next(error);
    }
  }

  public async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Token and new password are required',
            code: 'MISSING_FIELDS',
          },
        });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Password must be at least 8 characters',
            code: 'INVALID_PASSWORD',
          },
        });
        return;
      }

      await authService.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error: any) {
      logger.error('Password reset controller error:', error);

      if (error.message === 'Invalid or expired reset token') {
        res.status(400).json({
          success: false,
          error: {
            message: error.message,
            code: 'INVALID_TOKEN',
          },
        });
        return;
      }

      next(error);
    }
  }
}

export const authController = AuthController.getInstance();
