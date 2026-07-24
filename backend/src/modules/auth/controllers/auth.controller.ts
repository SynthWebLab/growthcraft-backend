import { Request, Response, NextFunction, CookieOptions } from 'express';
import { validationResult } from 'express-validator';
import { authService } from '../services/auth.service';
import { redisTokenService } from '../services/redis-token.service';
import { RegisterDto } from '../dto/register.dto';
import { logger } from '@/common/utils/logger.util';
import { StudentProfile } from '@/database/models/StudentProfile.model';
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
    const accessTokenMaxAge = this.parseDurationToMs(config.JWT_EXPIRES_IN, 15 * 60 * 1000);
    const refreshTokenMaxAge = this.parseDurationToMs(
      config.JWT_REFRESH_EXPIRES_IN,
      7 * 24 * 60 * 60 * 1000
    );
    const cookieOptions = this.getTokenCookieOptions();

    // Access token cookie
    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: accessTokenMaxAge,
    });

    // Refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: refreshTokenMaxAge,
    });
  }

  private getTokenCookieOptions(): CookieOptions {
    const isProduction = config.NODE_ENV === 'production';

    return {
      httpOnly: true,
      secure: isProduction,
      // 'strict' blocks the browser from sending cookies on any cross-site request,
      // preventing CSRF force-logout (and other CSRF attacks) on the unprotected logout endpoint.
      // NOTE: If the frontend (Vercel) and backend (Railway) are on DIFFERENT domains in prod,
      // you must keep this as 'lax' and add explicit CSRF token validation instead.
      sameSite: isProduction ? 'strict' : 'lax',
      domain: isProduction ? 'growthcraft.cloud' : undefined,
      path: '/',
    };
  }

  private parseDurationToMs(duration: string, fallbackMs: number): number {
    const match = duration.match(/^(\d+)([smhd])$/);

    if (!match) {
      return fallbackMs;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return fallbackMs;
    }
  }

  /**
   * Clear authentication cookies
   */
  private clearTokenCookies(res: Response): void {
    const cookieOptions = this.getTokenCookieOptions();

    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
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
      };

      // Add college profile to response if available
      if (result.collegeProfile) {
        responseData.collegeProfile = result.collegeProfile;
      }

      // Add employer profile to response if available
      if (result.employerProfile) {
        responseData.employerProfile = result.employerProfile;
      }

      // Add mentor profile to response if available
      if (result.mentorProfile) {
        responseData.mentorProfile = result.mentorProfile;
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

      if (error.message === 'Failed to create employer profile. Please try again.') {
        res.status(500).json({
          success: false,
          error: {
            message: error.message,
            code: 'PROFILE_CREATION_FAILED',
          },
        });
        return;
      }

      if (error.message === 'Failed to create mentor profile. Please try again.') {
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

      let userObj = user.toJSON();
      if (user.role === 'student') {
        const studentProfile = await StudentProfile.findOne({ userId });
        userObj.isAmbassador = studentProfile ? (studentProfile.isAmbassador || false) : false;
      }

      res.status(200).json({
        success: true,
        data: { user: userObj },
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

      // Decode userId from refreshToken (not from access_token!)
      let userId: string | undefined;
      try {
        const decoded = jwtConfig.verifyRefreshToken(refreshToken);
        userId = decoded?.userId;
      } catch (error) {
        // If refresh token is invalid/expired, try to decode without verification
        const decoded = jwtConfig.decodeToken(refreshToken);
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
      const refreshToken = req.cookies.refreshToken;
      const accessToken = req.cookies.access_token; // may be expired — blacklist it anyway

      if (refreshToken) {
        try {
          // Derive userId from the refresh token — no need for a valid access token
          const decoded = jwtConfig.verifyRefreshToken(refreshToken);
          await authService.logout(decoded.userId, refreshToken, accessToken);
        } catch (dbError) {
          // Token may be expired/invalid — still clear cookies and blacklist access token below
          logger.warn('Could not invalidate refresh token during logout (may already be expired):', dbError);
          // Even if refresh token is bad, still try to blacklist the access token
          if (accessToken) {
            const decoded = jwtConfig.decodeToken(accessToken);
            if (decoded) {
              await redisTokenService.blacklistAccessToken(accessToken, decoded.exp);
            }
          }
        }
      } else {
        // No refresh token — at least blacklist the access token if present
        if (accessToken) {
          const decoded = jwtConfig.decodeToken(accessToken);
          if (decoded) {
            await redisTokenService.blacklistAccessToken(accessToken, decoded.exp);
          }
        }
        logger.debug('Logout called with no refresh token cookie — clearing cookies anyway');
      }

      // Always clear cookies regardless of token state
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
      const refreshToken = req.cookies.refreshToken;
      const accessToken = req.cookies.access_token;

      if (refreshToken) {
        try {
          // Derive userId from the refresh token — no need for a valid access token
          const decoded = jwtConfig.verifyRefreshToken(refreshToken);
          await authService.logoutAll(decoded.userId, accessToken);
        } catch (dbError) {
          logger.warn('Could not invalidate all tokens during logout-all (refresh token may be expired):', dbError);
        }
      } else {
        logger.debug('Logout-all called with no refresh token cookie — clearing cookies anyway');
      }

      // Always clear cookies regardless of token state
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

      const { email, otp } = req.body;

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

      const { email } = req.body;

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

      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Email, verification code (OTP), and new password are required',
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

      await authService.resetPassword(email, otp, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error: any) {
      logger.error('Password reset controller error:', error);

      if (error.message === 'Invalid or expired verification code') {
        res.status(400).json({
          success: false,
          error: {
            message: error.message,
            code: 'INVALID_OTP',
          },
        });
        return;
      }

      next(error);
    }
  }

  public async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const userId = (req as any).user.userId;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Current password and new password are required',
            code: 'MISSING_FIELDS',
          },
        });
        return;
      }

      await authService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      logger.error('Change password controller error:', error);

      if (
        error.message === 'Current password is incorrect' ||
        error.message === 'New password must be different from current password'
      ) {
        res.status(400).json({
          success: false,
          error: {
            message: error.message,
            code: 'PASSWORD_CHANGE_FAILED',
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
}

export const authController = AuthController.getInstance();
