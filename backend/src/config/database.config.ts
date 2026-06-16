import dns from 'dns';
import mongoose from 'mongoose';
import { config } from './index';
import { logger } from '@/common/utils/logger.util';

export class DatabaseConfig {
  private static instance: DatabaseConfig;
  private isConnected = false;

  private constructor() { }

  public static getInstance(): DatabaseConfig {
    if (!DatabaseConfig.instance) {
      DatabaseConfig.instance = new DatabaseConfig();
    }
    return DatabaseConfig.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Database already connected');
      return;
    }

    try {
      // On some Windows setups c-ares fails to read the system DNS config and
      // falls back to 127.0.0.1, where nothing listens on port 53 — this breaks
      // the SRV lookup required by mongodb+srv:// (ECONNREFUSED querySrv). Detect
      // that broken state and fall back to public resolvers. Note: the callback
      // API (dns) and the promise API (dns.promises) use SEPARATE resolver
      // instances, and the MongoDB driver resolves SRV via dns.promises — so we
      // must set servers on BOTH.
      const servers = dns.getServers();
      if (servers.length === 0 || servers.every((s) => s === '127.0.0.1' || s === '::1')) {
        const fallback = ['8.8.8.8', '1.1.1.1'];
        dns.setServers(fallback);
        dns.promises.setServers(fallback);
        logger.warn(`No usable system DNS resolver (${servers.join(', ') || 'none'}); falling back to ${fallback.join(', ')}`);
      }

      const mongoUri = config.NODE_ENV === 'test' ? config.MONGODB_TEST_URI : config.MONGODB_URI;

      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        heartbeatFrequencyMS: 10000, // Check connection health every 10 seconds
        retryWrites: true,
        retryReads: true,
      });

      this.isConnected = true;
      logger.info(`MongoDB connected: ${mongoUri}`);

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        this.isConnected = true;
      });
    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('MongoDB disconnected');
    } catch (error) {
      logger.error('MongoDB disconnection error:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

export const databaseConfig = DatabaseConfig.getInstance();
