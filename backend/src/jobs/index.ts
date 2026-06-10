import { scheduleNightlyJob, shutdownJobQueue, triggerManualJob } from './enrollment-metrics.job';
import logger from '@/common/utils/logger.util';

/**
 * Initialize all scheduled jobs
 */
export async function initializeJobs(): Promise<void> {
  try {
    logger.info('Initializing scheduled jobs...');
    
    // Schedule nightly enrollment metrics job
    await scheduleNightlyJob();
    
    logger.info('All scheduled jobs initialized successfully');
  } catch (error) {
    logger.error('Error initializing jobs:', error);
    // Don't throw - let the app continue without jobs
    logger.warn('⚠ Application will continue without scheduled jobs');
  }
}

/**
 * Shutdown all jobs gracefully
 */
export async function shutdownJobs(): Promise<void> {
  try {
    logger.info('Shutting down all jobs...');
    await shutdownJobQueue();
    logger.info('All jobs shut down successfully');
  } catch (error) {
    logger.error('Error shutting down jobs:', error);
  }
}

/**
 * Export manual trigger for testing
 */
export { triggerManualJob };
