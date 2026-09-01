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
          connectTimeout: 5000, // Reduced timeout to fail faster
          keepAlive: true, // Enable keepalive packets
          keepAliveInitialDelay: 30000, // Send keepalive packets after 30 seconds idle
          reconnectStrategy: (retries) => {
            const maxRetries = config.REDIS_MAX_RETRIES;
            if (retries > maxRetries) {
              logger.warn(`Redis reconnection stopped after ${maxRetries} attempts. App will run without Redis.`);
              return false; // Stop reconnecting
            }
            // Quick retries: 500ms, 1000ms, 1500ms, 2000ms, 2500ms...
            return retries * 500;
          },
        },
        pingInterval: 60000, // Ping server every 60 seconds to keep connection alive
      });

      // Handle Redis events - don't let errors crash the app
      this.client.on('error', (error) => {
        logger.warn('Redis client error (non-critical):', error.message);
        this.isConnected = false;
        // Don't throw - just log
      });

      this.client.on('connect', () => {
        logger.info('Redis client connecting...');
      });

      this.client.on('ready', () => {
        logger.info('✓ Redis client ready and connected');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting...');
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.info('Redis client connection ended');
        this.isConnected = false;
      });

      // Connect to Redis with timeout
      const connectPromise = this.client.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
      );

      await Promise.race([connectPromise, timeoutPromise]);
      logger.info('✓ Redis connected successfully');
    } catch (error: any) {
      logger.warn('⚠ Redis connection failed:', error.message);
      logger.warn('⚠ Application will continue without Redis (features like rate limiting may be affected)');
      
      // Clean up failed client
      if (this.client) {
        try {
          await this.client.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
      }
      
      this.client = null;
      this.isConnected = false;
      // Don't throw error - allow app to run without Redis
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

  /**
   * Find keys matching pattern using SCAN instead of KEYS to avoid blocking the Redis server.
   * Iterates incrementally through the keyspace in batches.
   */
  public async keys(pattern: string, count: number = 100): Promise<string[]> {
    if (!this.client || !this.isConnected) {
      return [];
    }

    try {
      const matchedKeys: string[] = [];
      let cursor = '0';

      do {
        const result = await this.client.scan(cursor, {
          MATCH: pattern,
          COUNT: count,
        });

        cursor = String(result.cursor);
        if (result.keys && result.keys.length > 0) {
          matchedKeys.push(...result.keys);
        }
      } while (cursor !== '0');

      return matchedKeys;
    } catch (error) {
      logger.error('Redis SCAN error:', error);
      return [];
    }
  }

  /**
   * Alias for keys() using non-blocking SCAN iteration.
   */
  public async scanKeys(pattern: string, count: number = 100): Promise<string[]> {
    return this.keys(pattern, count);
  }

  /**
   * Delete keys matching a pattern using SCAN to avoid blocking Redis at scale.
   * Iterates incrementally through keys and deletes matching keys in batches.
   */
  public async delByPattern(pattern: string, count: number = 100): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    let totalDeleted = 0;

    try {
      let cursor = '0';

      do {
        const result = await this.client.scan(cursor, {
          MATCH: pattern,
          COUNT: count,
        });

        cursor = String(result.cursor);
        const keys = result.keys;

        if (keys && keys.length > 0) {
          await this.client.del(keys);
          totalDeleted += keys.length;
        }
      } while (cursor !== '0');

      return totalDeleted;
    } catch (error) {
      logger.error('Redis DEL pattern error:', error);
      return totalDeleted;
    }
  }

  /**
   * Delete keys matching multiple patterns using SCAN iteration.
   */
  public async delByPatterns(patterns: string[], count: number = 100): Promise<number> {
    let totalDeleted = 0;
    for (const pattern of patterns) {
      totalDeleted += await this.delByPattern(pattern, count);
    }
    return totalDeleted;
  }
}

export const redisConfig = RedisConfig.getInstance();
