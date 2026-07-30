import { scheduleNightlyJob, shutdownJobQueue, triggerManualJob } from './enrollment-metrics.job';
import { shutdownEmailQueue } from './email-delivery.job';
import { reservationService } from '@/modules/reservations/services/reservation.service';
import logger from '@/common/utils/logger.util';

let reservationCleanupInterval: NodeJS.Timeout | undefined;

/**
 * Initialize all scheduled jobs
 */
export async function initializeJobs(): Promise<void> {
  try {
    logger.info('Initializing scheduled jobs...');
    
    // Schedule nightly enrollment metrics job
    await scheduleNightlyJob();

    // Schedule reservation seat-hold release task (every 30 minutes)
    logger.info('Scheduling reservation cleanup worker...');
    
    // Run once immediately on start
    void reservationService.expireOldReservations().catch((err) => {
      logger.error('Error running initial reservation cleanup:', err);
    });

    reservationCleanupInterval = setInterval(async () => {
      try {
        await reservationService.expireOldReservations();
      } catch (error) {
        logger.error('Error running periodic reservation cleanup:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes
    
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
    if (reservationCleanupInterval) {
      clearInterval(reservationCleanupInterval);
    }
    await shutdownJobQueue();
    await shutdownEmailQueue();
    logger.info('All jobs shut down successfully');
  } catch (error) {
    logger.error('Error shutting down jobs:', error);
  }
}

/**
 * Export manual trigger for testing
 */
export { triggerManualJob };
