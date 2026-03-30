import app from './app';
import { config } from './config';
import { databaseConfig } from './config/database.config';
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

    // Start listening
    const server = app.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${config.PORT}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(() => {
        logger.info('HTTP server closed');

        databaseConfig
          .disconnect()
          .then(() => {
            logger.info('Database disconnected');
            process.exit(0);
          })
          .catch((error) => {
            logger.error('Error during shutdown:', error);
            process.exit(1);
          });
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
