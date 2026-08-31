import { logger } from './logger.util';

/**
 * @deprecated Backfilling enrollments at runtime on server startup is disabled to prevent data corruption and race conditions.
 * Use the standalone script via `npm run backfill:batches` instead.
 */
export async function backfillEnrollmentBatches() {
  logger.warn('backfillEnrollmentBatches() is deprecated and should not be invoked at runtime. Use `npm run backfill:batches` instead.');
}

