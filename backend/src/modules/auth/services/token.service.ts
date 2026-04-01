import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { jwtConfig } from '@/config/jwt.config';
import { User } from '@/database/models/User.model';
import { logger } from '@/common/utils/logger.util';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
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
   * Store hashed refresh token in database
   */
  public async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    try {
      const hashedToken = await this.hashRefreshToken(refreshToken);

      const user = await User.findById(userId).select('+refreshTokens');
      if (!user) {
        throw new Error('User not found');
      }

      // Add hashed token to user's refresh tokens array
      user.refreshTokens.push(hashedToken);

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

      // Check if any hashed token matches the provided token
      for (const hashedToken of user.refreshTokens) {
        const isValid = await this.verifyRefreshToken(refreshToken, hashedToken);
        if (isValid) {
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
      const updatedTokens: string[] = [];
      for (const hashedToken of user.refreshTokens) {
        const isMatch = await this.verifyRefreshToken(refreshToken, hashedToken);
        if (!isMatch) {
          updatedTokens.push(hashedToken);
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
   * Rotate refresh token (remove old, generate new)
   */
  public async rotateRefreshToken(
    userId: string,
    oldRefreshToken: string,
    payload: TokenPayload
  ): Promise<TokenPair> {
    try {
      // Validate old refresh token
      const isValid = await this.validateRefreshToken(userId, oldRefreshToken);
      if (!isValid) {
        throw new Error('Invalid refresh token');
      }

      // Remove old refresh token
      await this.removeRefreshToken(userId, oldRefreshToken);

      // Generate new token pair
      const tokenPair = this.generateTokenPair(payload);

      // Store new hashed refresh token
      await this.storeRefreshToken(userId, tokenPair.refreshToken);

      logger.info(`Refresh token rotated for user: ${userId}`);

      return tokenPair;
    } catch (error: any) {
      logger.error('Error rotating refresh token:', error);
      throw error;
    }
  }
}

export const tokenService = TokenService.getInstance();
