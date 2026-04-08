import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { jwtConfig } from '@/config/jwt.config';
import { User, IRefreshToken } from '@/database/models/User.model';
import { logger } from '@/common/utils/logger.util';
import { config } from '@/config';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenRotationOptions {
  deviceInfo?: string;
  detectReuse?: boolean;
}

export class TokenService {
  private static instance: TokenService;

  private constructor() {}

  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  /**
   * Generate a cryptographically secure random refresh token
   */
  public generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Hash refresh token before storing in database
   */
  public async hashRefreshToken(token: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(token, salt);
  }

  /**
   * Verify refresh token against hashed version in database
   */
  public async verifyRefreshToken(token: string, hashedToken: string): Promise<boolean> {
    return bcrypt.compare(token, hashedToken);
  }

  /**
   * Generate access token (JWT) and refresh token (crypto random)
   */
  public generateTokenPair(payload: TokenPayload): TokenPair {
    // Generate JWT access token
    const accessToken = jwtConfig.generateAccessToken(payload);

    // Generate cryptographically secure refresh token
    const refreshToken = this.generateRefreshToken();

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Store hashed refresh token in database with metadata
   */
  public async storeRefreshToken(
    userId: string,
    refreshToken: string,
    deviceInfo?: string
  ): Promise<void> {
    try {
      const hashedToken = await this.hashRefreshToken(refreshToken);

      const user = await User.findById(userId).select('+refreshTokens');
      if (!user) {
        throw new Error('User not found');
      }

      // Calculate expiration date (30 days from now)
      const expiresAt = new Date();
      const refreshExpiresIn = config.JWT_REFRESH_EXPIRES_IN || '30d';
      const match = refreshExpiresIn.match(/^(\d+)([smhd])$/);

      if (match) {
        const value = parseInt(match[1], 10);
        const unit = match[2];

        switch (unit) {
          case 's':
            expiresAt.setSeconds(expiresAt.getSeconds() + value);
            break;
          case 'm':
            expiresAt.setMinutes(expiresAt.getMinutes() + value);
            break;
          case 'h':
            expiresAt.setHours(expiresAt.getHours() + value);
            break;
          case 'd':
            expiresAt.setDate(expiresAt.getDate() + value);
            break;
        }
      }

      // Create refresh token object with metadata
      const refreshTokenObj: IRefreshToken = {
        token: hashedToken,
        createdAt: new Date(),
        expiresAt,
        deviceInfo,
      };

      // Add hashed token to user's refresh tokens array
      user.refreshTokens.push(refreshTokenObj);

      // Remove expired tokens
      user.refreshTokens = user.refreshTokens.filter((rt) => rt.expiresAt > new Date());

      // Limit to last 5 refresh tokens per user (for multiple device support)
      if (user.refreshTokens.length > 5) {
        user.refreshTokens = user.refreshTokens.slice(-5);
      }

      await user.save();
      logger.info(`Refresh token stored for user: ${userId}`);
    } catch (error: any) {
      logger.error('Error storing refresh token:', error);
      throw error;
    }
  }

  /**
   * Validate refresh token against database
   */
  public async validateRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    try {
      const user = await User.findById(userId).select('+refreshTokens');
      if (!user || !user.isActive) {
        return false;
      }

      // Remove expired tokens
      user.refreshTokens = user.refreshTokens.filter((rt) => rt.expiresAt > new Date());
      await user.save();

      // Check if any hashed token matches the provided token
      for (const tokenObj of user.refreshTokens) {
        const isValid = await this.verifyRefreshToken(refreshToken, tokenObj.token);
        if (isValid) {
          // Update last used timestamp
          tokenObj.lastUsedAt = new Date();
          await user.save();
          return true;
        }
      }

      return false;
    } catch (error: any) {
      logger.error('Error validating refresh token:', error);
      return false;
    }
  }

  /**
   * Remove specific refresh token from database (logout)
   */
  public async removeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    try {
      const user = await User.findById(userId).select('+refreshTokens');
      if (!user) {
        throw new Error('User not found');
      }

      // Filter out the matching hashed token
      const updatedTokens: IRefreshToken[] = [];
      for (const tokenObj of user.refreshTokens) {
        const isMatch = await this.verifyRefreshToken(refreshToken, tokenObj.token);
        if (!isMatch) {
          updatedTokens.push(tokenObj);
        }
      }

      user.refreshTokens = updatedTokens;
      await user.save();

      logger.info(`Refresh token removed for user: ${userId}`);
    } catch (error: any) {
      logger.error('Error removing refresh token:', error);
      throw error;
    }
  }

  /**
   * Remove all refresh tokens for a user (logout from all devices)
   */
  public async removeAllRefreshTokens(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId).select('+refreshTokens');
      if (!user) {
        throw new Error('User not found');
      }

      user.refreshTokens = [];
      await user.save();

      logger.info(`All refresh tokens removed for user: ${userId}`);
    } catch (error: any) {
      logger.error('Error removing all refresh tokens:', error);
      throw error;
    }
  }

  /**
   * Rotate refresh token (remove old, generate new) with reuse detection
   */
  public async rotateRefreshToken(
    userId: string,
    oldRefreshToken: string,
    payload: TokenPayload,
    options: TokenRotationOptions = {}
  ): Promise<TokenPair> {
    try {
      const user = await User.findById(userId).select('+refreshTokens');
      if (!user) {
        throw new Error('User not found');
      }

      // Find the matching token
      let matchedToken: IRefreshToken | null = null;
      for (const tokenObj of user.refreshTokens) {
        const isValid = await this.verifyRefreshToken(oldRefreshToken, tokenObj.token);
        if (isValid) {
          matchedToken = tokenObj;
          break;
        }
      }

      if (!matchedToken) {
        // Token not found - possible reuse attack
        if (options.detectReuse) {
          logger.warn(`Possible token reuse detected for user: ${userId}`);
          // Invalidate all refresh tokens for this user as a security measure
          await this.removeAllRefreshTokens(userId);
          throw new Error('Token reuse detected - all sessions invalidated');
        }
        throw new Error('Invalid refresh token');
      }

      // Check if token is expired
      if (matchedToken.expiresAt < new Date()) {
        throw new Error('Refresh token expired');
      }

      // Check for suspicious reuse (token used multiple times in short period)
      if (matchedToken.lastUsedAt && options.detectReuse) {
        const timeSinceLastUse = Date.now() - matchedToken.lastUsedAt.getTime();
        if (timeSinceLastUse < 5000) {
          // Less than 5 seconds
          logger.warn(`Rapid token reuse detected for user: ${userId}`);
          await this.removeAllRefreshTokens(userId);
          throw new Error('Suspicious activity detected - all sessions invalidated');
        }
      }

      // Remove old refresh token
      await this.removeRefreshToken(userId, oldRefreshToken);

      // Generate new token pair
      const tokenPair = this.generateTokenPair(payload);

      // Store new hashed refresh token with metadata
      await this.storeRefreshToken(userId, tokenPair.refreshToken, options.deviceInfo);

      logger.info(`Refresh token rotated for user: ${userId}`);

      return tokenPair;
    } catch (error: any) {
      logger.error('Error rotating refresh token:', error);
      throw error;
    }
  }
}

export const tokenService = TokenService.getInstance();
