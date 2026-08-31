import crypto from 'crypto';
import { redisConfig } from '@/config/redis.config';
import { logger } from '@/common/utils/logger.util';
import { config } from '@/config';

export interface RedisTokenMetadata {
  userId: string;
  deviceInfo?: string;
  createdAt: number;
  expiresAt: number;
}

export class RedisTokenService {
  private static instance: RedisTokenService | null = null;
  private readonly TOKEN_PREFIX = 'refresh_token:';
  private readonly USER_TOKENS_PREFIX = 'user_tokens:';
  private readonly BLACKLIST_PREFIX = 'blacklist:access:';  // for invalidated access tokens

  public constructor() {}

  public static getInstance(): RedisTokenService {
    if (!RedisTokenService.instance) {
      RedisTokenService.instance = new RedisTokenService();
    }
    return RedisTokenService.instance;
  }

  public static setInstance(instance: RedisTokenService | null): void {
    RedisTokenService.instance = instance;
  }

  public static resetInstance(): void {
    RedisTokenService.instance = null;
  }

  /**
   * Generate a cryptographically secure refresh token
   */
  public generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Hash token for storage key
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Get Redis key for token
   */
  private getTokenKey(token: string): string {
    const hashedToken = this.hashToken(token);
    return `${this.TOKEN_PREFIX}${hashedToken}`;
  }

  /**
   * Get Redis key for user's token set
   */
  private getUserTokensKey(userId: string): string {
    return `${this.USER_TOKENS_PREFIX}${userId}`;
  }

  /**
   * Calculate expiration time in seconds
   */
  private getExpirationSeconds(): number {
    const refreshExpiresIn = config.JWT_REFRESH_EXPIRES_IN || '7d';
    const match = refreshExpiresIn.match(/^(\d+)([smhd])$/);

    if (!match) {
      return 7 * 24 * 60 * 60; // Default 7 days
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 7 * 24 * 60 * 60;
    }
  }

  /**
   * Store refresh token in Redis
   */
  public async storeRefreshToken(
    userId: string,
    refreshToken: string,
    deviceInfo?: string
  ): Promise<void> {
    const client = redisConfig.getClient();
    if (!client || !redisConfig.getConnectionStatus()) {
      logger.warn('Redis not connected. Cannot store refresh token.');
      throw new Error('Redis service unavailable');
    }

    try {
      const tokenKey = this.getTokenKey(refreshToken);
      const userTokensKey = this.getUserTokensKey(userId);
      const expirationSeconds = this.getExpirationSeconds();
      const now = Date.now();

      const metadata: RedisTokenMetadata = {
        userId,
        deviceInfo,
        createdAt: now,
        expiresAt: now + expirationSeconds * 1000,
      };

      // Store token metadata with expiration
      await client.setEx(tokenKey, expirationSeconds, JSON.stringify(metadata));

      // Add token hash to user's token set
      const hashedToken = this.hashToken(refreshToken);
      await client.sAdd(userTokensKey, hashedToken);

      // Set expiration on user's token set (slightly longer than token expiration)
      await client.expire(userTokensKey, expirationSeconds + 3600);

      logger.info(`Refresh token stored in Redis for user: ${userId}`);
    } catch (error: any) {
      logger.error('Error storing refresh token in Redis:', error);
      throw new Error('Failed to store refresh token');
    }
  }

  /**
   * Validate refresh token from Redis
   */
  public async validateRefreshToken(refreshToken: string): Promise<RedisTokenMetadata | null> {
    const client = redisConfig.getClient();
    if (!client || !redisConfig.getConnectionStatus()) {
      logger.warn('Redis not connected. Cannot validate refresh token.');
      return null;
    }

    try {
      const tokenKey = this.getTokenKey(refreshToken);
      const data = await client.get(tokenKey);

      if (!data) {
        return null;
      }

      const metadata: RedisTokenMetadata = JSON.parse(data);

      // Check if token is expired
      if (metadata.expiresAt < Date.now()) {
        await this.removeRefreshToken(metadata.userId, refreshToken);
        return null;
      }

      return metadata;
    } catch (error: any) {
      logger.error('Error validating refresh token in Redis:', error);
      return null;
    }
  }

  /**
   * Remove specific refresh token from Redis (logout)
   */
  public async removeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const client = redisConfig.getClient();
    if (!client || !redisConfig.getConnectionStatus()) {
      logger.warn('Redis not connected. Cannot remove refresh token.');
      throw new Error('Redis service unavailable');
    }

    try {
      const tokenKey = this.getTokenKey(refreshToken);
      const userTokensKey = this.getUserTokensKey(userId);
      const hashedToken = this.hashToken(refreshToken);

      // Remove token metadata
      await client.del(tokenKey);

      // Remove token hash from user's token set
      await client.sRem(userTokensKey, hashedToken);

      logger.info(`Refresh token removed from Redis for user: ${userId}`);
    } catch (error: any) {
      logger.error('Error removing refresh token from Redis:', error);
      throw new Error('Failed to remove refresh token');
    }
  }

  /**
   * Remove all refresh tokens for a user (logout from all devices)
   */
  public async removeAllRefreshTokens(userId: string): Promise<void> {
    const client = redisConfig.getClient();
    if (!client || !redisConfig.getConnectionStatus()) {
      logger.warn('Redis not connected. Cannot remove all refresh tokens.');
      throw new Error('Redis service unavailable');
    }

    try {
      const userTokensKey = this.getUserTokensKey(userId);

      // Get all token hashes for this user
      const tokenHashes = await client.sMembers(userTokensKey);

      // Delete all token metadata
      if (tokenHashes.length > 0) {
        const tokenKeys = tokenHashes.map((hash) => `${this.TOKEN_PREFIX}${hash}`);
        await client.del(tokenKeys);
      }

      // Delete user's token set
      await client.del(userTokensKey);

      logger.info(`All refresh tokens removed from Redis for user: ${userId}`);
    } catch (error: any) {
      logger.error('Error removing all refresh tokens from Redis:', error);
      throw new Error('Failed to remove all refresh tokens');
    }
  }

  /**
   * Get count of active tokens for a user
   */
  public async getActiveTokenCount(userId: string): Promise<number> {
    const client = redisConfig.getClient();
    if (!client || !redisConfig.getConnectionStatus()) {
      logger.warn('Redis not connected. Cannot get active token count.');
      return 0;
    }

    try {
      const userTokensKey = this.getUserTokensKey(userId);
      return await client.sCard(userTokensKey);
    } catch (error: any) {
      logger.error('Error getting active token count from Redis:', error);
      return 0;
    }
  }

  /**
   * Blacklist an access token until its natural expiry.
   * Call this on logout so stolen access tokens are rejected immediately.
   * @param token   Raw JWT access token
   * @param expAt   Token `exp` claim (Unix seconds). If undefined, defaults to 15 min from now.
   */
  public async blacklistAccessToken(token: string, expAt?: number): Promise<void> {
    const client = redisConfig.getClient();
    if (!client || !redisConfig.getConnectionStatus()) {
      logger.warn('Redis not connected. Access token blacklisting skipped.');
      return; // Gracefully degrade — still clear the cookies
    }

    try {
      const hashedToken = this.hashToken(token);
      const key = `${this.BLACKLIST_PREFIX}${hashedToken}`;

      // TTL = remaining lifetime of the token (minimum 1 second)
      const nowSeconds = Math.floor(Date.now() / 1000);
      const ttl = expAt ? Math.max(expAt - nowSeconds, 1) : 15 * 60;

      await client.setEx(key, ttl, '1');
      logger.debug(`Access token blacklisted (TTL: ${ttl}s)`);
    } catch (error: any) {
      // Non-fatal — log and continue
      logger.error('Error blacklisting access token:', error);
    }
  }

  /**
   * Returns true if the given access token has been blacklisted (i.e. the user logged out).
   */
  public async isAccessTokenBlacklisted(token: string): Promise<boolean> {
    const client = redisConfig.getClient();
    if (!client || !redisConfig.getConnectionStatus()) {
      // Redis unavailable — cannot check blacklist, allow through (fail-open)
      logger.warn('Redis not connected. Blacklist check skipped — allowing request.');
      return false;
    }

    try {
      const hashedToken = this.hashToken(token);
      const key = `${this.BLACKLIST_PREFIX}${hashedToken}`;
      const result = await client.get(key);
      return result !== null;
    } catch (error: any) {
      logger.error('Error checking access token blacklist:', error);
      return false; // Fail-open: don't break authenticated requests if Redis glitches
    }
  }

  /**
   * Check if Redis is available
   */
  public isAvailable(): boolean {
    return redisConfig.getConnectionStatus();
  }
}

export const redisTokenService = RedisTokenService.getInstance();
