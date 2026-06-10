import { Queue, Worker, ConnectionOptions } from 'bullmq';
import { Enrollment, EnrollmentStatus, Attendance, ProgressNote } from '@/database/models';
import logger from '@/common/utils/logger.util';
import { config } from '@/config';

// Queue name
const QUEUE_NAME = 'enrollment-metrics';

// Redis connection configuration for BullMQ (uses ioredis)
// Parse REDIS_URL which can be in format: rediss://user:pass@host:port
const getRedisConnection = (): ConnectionOptions => {
  const redisUrl = config.REDIS_URL;
  
  if (!redisUrl) {
    throw new Error('REDIS_URL is not configured');
  }

  // If it's a full URL (redis:// or rediss://), parse it properly for ioredis
  if (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')) {
    try {
      const url = new URL(redisUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port || '6379', 10),
        password: url.password || config.REDIS_PASSWORD || undefined,
        tls: redisUrl.startsWith('rediss://') ? {} : undefined,
      };
    } catch (error) {
      logger.error('Failed to parse REDIS_URL:', error);
      throw new Error('Invalid REDIS_URL format');
    }
  }

  // Otherwise, parse as host:port
  const [host, port] = redisUrl.split(':');
  return {
    host: host || 'localhost',
    port: parseInt(port || '6379', 10),
    password: config.REDIS_PASSWORD || undefined,
  };
};

const redisConnection = getRedisConnection();

// Create Queue
export const enrollmentMetricsQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5 seconds delay
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      count: 50, // Keep last 50 failed jobs
    },
  },
});

/**
 * Calculate attendance percentage for a student in a batch
 */
async function calculateAttendancePercent(
  studentUserId: string,
  batchId: string
): Promise<number> {
  try {
    // Count attendance records where status is 'Present' or 'Late'
    const attendedCount = await Attendance.countDocuments({
      studentUserId,
      batchId,
      status: { $in: ['Present', 'Late'] },
    });

    // Count total attendance records (represents total classes held)
    const totalClassesHeld = await Attendance.countDocuments({
      batchId,
    }).distinct('attendanceDate'); // Get unique dates

    const totalClasses = totalClassesHeld.length || 1; // Avoid division by zero

    const percentage = (attendedCount / totalClasses) * 100;
    return Math.round(percentage * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    logger.error('Error calculating attendance percent:', error);
    return 0;
  }
}

/**
 * Calculate average rubric score from progress notes
 */
async function calculateAvgRubricScore(
  studentUserId: string,
  batchId: string
): Promise<number> {
  try {
    const progressNotes = await ProgressNote.find({
      studentUserId,
      batchId,
    }).select('rubricScore');

    if (progressNotes.length === 0) {
      return 0;
    }

    const totalScore = progressNotes.reduce((sum, note) => sum + note.rubricScore, 0);
    const average = totalScore / progressNotes.length;

    return Math.round(average * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    logger.error('Error calculating average rubric score:', error);
    return 0;
  }
}

/**
 * Process a single enrollment and update metrics
 */
async function processEnrollment(enrollmentId: string): Promise<void> {
  try {
    const enrollment = await Enrollment.findById(enrollmentId);

    if (!enrollment) {
      logger.warn(`Enrollment ${enrollmentId} not found`);
      return;
    }

    // Calculate metrics
    const attendancePercent = await calculateAttendancePercent(
      enrollment.studentUserId.toString(),
      enrollment.batchId.toString()
    );

    const avgRubricScore = await calculateAvgRubricScore(
      enrollment.studentUserId.toString(),
      enrollment.batchId.toString()
    );

    // Update enrollment (idempotent - can be run multiple times)
    enrollment.attendancePercent = attendancePercent;
    enrollment.avgRubricScore = avgRubricScore;
    await enrollment.save();

    logger.info(
      `Updated metrics for enrollment ${enrollmentId}: attendance=${attendancePercent}%, score=${avgRubricScore}`
    );
  } catch (error) {
    logger.error(`Error processing enrollment ${enrollmentId}:`, error);
    throw error; // Re-throw to trigger retry
  }
}

/**
 * Main job processor - processes all active enrollments
 */
async function processAllEnrollments(): Promise<void> {
  const startTime = Date.now();
  logger.info('Starting nightly enrollment metrics recomputation job');

  try {
    // Find all active enrollments (Confirmed status means actively learning)
    const activeEnrollments = await Enrollment.find({
      status: EnrollmentStatus.CONFIRMED,
    }).select('_id studentUserId batchId');

    logger.info(`Found ${activeEnrollments.length} active enrollments to process`);

    let successCount = 0;
    let errorCount = 0;

    // Process each enrollment
    for (const enrollment of activeEnrollments) {
      try {
        await processEnrollment(enrollment._id.toString());
        successCount++;
      } catch (error) {
        errorCount++;
        logger.error(`Failed to process enrollment ${enrollment._id}:`, error);
        // Continue processing other enrollments even if one fails
      }
    }

    const duration = Date.now() - startTime;
    logger.info(
      `Completed enrollment metrics job in ${duration}ms: ${successCount} successful, ${errorCount} errors`
    );
  } catch (error) {
    logger.error('Fatal error in enrollment metrics job:', error);
    throw error;
  }
}

// Create Worker to process jobs
export const enrollmentMetricsWorker = new Worker(
  QUEUE_NAME,
  async (job) => {
    logger.info(`Processing job ${job.id} - ${job.name}`);
    await processAllEnrollments();
  },
  {
    connection: redisConnection,
    concurrency: 1, // Process one job at a time
  }
);

// Worker event handlers
enrollmentMetricsWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

enrollmentMetricsWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed:`, err);
});

enrollmentMetricsWorker.on('error', (err) => {
  logger.error('Worker error:', err);
});

/**
 * Schedule the nightly job at 02:00 IST
 * IST is UTC+5:30, so 02:00 IST = 20:30 UTC (previous day)
 * Cron: 30 20 * * * (every day at 20:30 UTC)
 */
export async function scheduleNightlyJob(): Promise<void> {
  try {
    // Add repeatable job - runs at 02:00 IST daily
    await enrollmentMetricsQueue.add(
      'nightly-metrics-recomputation',
      {}, // No job data needed
      {
        repeat: {
          pattern: '30 20 * * *', // 20:30 UTC = 02:00 IST
          tz: 'UTC', // Use UTC timezone for consistency
        },
      }
    );

    logger.info('Scheduled nightly enrollment metrics job at 02:00 IST (20:30 UTC)');
  } catch (error) {
    logger.error('Error scheduling nightly job:', error);
    throw error;
  }
}

/**
 * Manually trigger the job (useful for testing)
 */
export async function triggerManualJob(): Promise<void> {
  try {
    await enrollmentMetricsQueue.add('manual-metrics-recomputation', {});
    logger.info('Manually triggered enrollment metrics job');
  } catch (error) {
    logger.error('Error triggering manual job:', error);
    throw error;
  }
}

// Graceful shutdown
export async function shutdownJobQueue(): Promise<void> {
  logger.info('Shutting down enrollment metrics job queue...');
  await enrollmentMetricsWorker.close();
  await enrollmentMetricsQueue.close();
  logger.info('Job queue shutdown complete');
}
