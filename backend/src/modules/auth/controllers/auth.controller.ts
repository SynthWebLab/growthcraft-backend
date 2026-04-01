import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { authService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { logger } from '@/common/utils/logger.util';

export class AuthController {
  private static instance: AuthController;

  private constructor() {}

  public static getInstance(): AuthController {
    if (!AuthController.instance) {
      AuthController.instance = new AuthController();
    }
    return AuthController.instance;
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

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
        },
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

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
        },
      });
    } catch (error: any) {
      logger.error('Login controller error:', error);

      if (
        error.message === 'Invalid email or password' ||
        error.message === 'Account is deactivated'
      ) {
        res.status(401).json({
          success: false,
          error: {
            message: error.message,
            code: 'AUTHENTICATION_FAILED',
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
      // Get refresh token from cookie or body
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

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

      // Refresh tokens
      const tokens = await authService.refreshToken(refreshToken);

      // Set new refresh token in cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: tokens.accessToken,
        },
      });
    } catch (error: any) {
      logger.error('Refresh token controller error:', error);

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
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (refreshToken) {
        await authService.logout(userId, refreshToken);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

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

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = AuthController.getInstance();
