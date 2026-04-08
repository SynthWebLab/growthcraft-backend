import { createClient, RedisClientType } from 'redis';
import { config } from './index';
import { logger } from '@/common/utils/logger.util';

export class RedisConfig {
  private static instance: RedisConfig;
  private client: RedisClientType | null = null;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): RedisConfig {
    if (!RedisConfig.instance) {
      RedisConfig.instance = new RedisConfig();
    }
    return RedisConfig.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      logger.info('Redis already connected');
      return;
    }

    // Skip Redis connection if URL is not provided
    if (!config.REDIS_URL) {
      logger.warn('Redis URL not provided. Skipping Redis connection.');
      return;
    }

    try {
      // Create Redis client
      this.client = createClient({
        url: config.REDIS_URL,
        password: config.REDIS_PASSWORD || undefined,
        socket: {
          connectTimeout: 10000,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis reconnection failed after 10 attempts');
              return new Error('Redis reconnection failed');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      // Handle Redis events
      this.client.on('error', (error) => {
        logger.error('Redis client error:', error);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connecting...');
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        logger.warn('Redis client reconnecting...');
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.warn('Redis client connection ended');
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.error('Redis connection failed:', error);
      this.client = null;
      this.isConnected = false;
      // Don't throw error - allow app to run without Redis
      logger.warn('Application will continue without Redis');
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis disconnected');
    } catch (error) {
      logger.error('Redis disconnection error:', error);
      throw error;
    }
  }

  public getClient(): RedisClientType | null {
    return this.client;
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && this.client !== null && this.client.isOpen;
  }

  // Helper methods for common Redis operations
  public async set(key: string, value: string, expirationInSeconds?: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis not connected. Skipping SET operation.');
      return;
    }

    try {
      if (expirationInSeconds) {
        await this.client.setEx(key, expirationInSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error('Redis SET error:', error);
      throw error;
    }
  }

  public async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis not connected. Skipping GET operation.');
      return null;
    }

    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis GET error:', error);
      throw error;
    }
  }

  public async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis not connected. Skipping DEL operation.');
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis DEL error:', error);
      throw error;
    }
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis not connected. Skipping EXISTS operation.');
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      throw error;
    }
  }
}

export const redisConfig = RedisConfig.getInstance();
