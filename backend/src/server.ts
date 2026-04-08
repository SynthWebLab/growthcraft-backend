import app from './app';
import { config } from './config';
import { databaseConfig } from './config/database.config';
import { redisConfig } from './config/redis.config';
import { logger } from './common/utils/logger.util';

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await databaseConfig.connect();
    logger.info('Database connected successfully');

    // Connect to Redis (optional)
    await redisConfig.connect();
    if (redisConfig.getConnectionStatus()) {
      logger.info('Redis connected successfully');
    }

    // Start listening
    const server = app.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${config.PORT}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Disconnect Redis
          await redisConfig.disconnect();
          logger.info('Redis disconnected');

          // Disconnect Database
          await databaseConfig.disconnect();
          logger.info('Database disconnected');

          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => {
      gracefulShutdown('SIGTERM');
    });
    process.on('SIGINT', () => {
      gracefulShutdown('SIGINT');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
void startServer();
