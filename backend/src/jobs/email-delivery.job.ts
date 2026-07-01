import { Queue, Worker, ConnectionOptions } from 'bullmq';
import { emailService } from '@/common/services/email.service';
import logger from '@/common/utils/logger.util';
import { config } from '@/config';

// Queue name
const QUEUE_NAME = 'email-delivery';

// Redis connection configuration for BullMQ
let isRedisAvailable = false;
let redisConnection: ConnectionOptions | undefined;

if (config.REDIS_URL) {
  try {
    const redisUrl = config.REDIS_URL;
    if (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')) {
      const url = new URL(redisUrl);
      redisConnection = {
        host: url.hostname,
        port: parseInt(url.port || '6379', 10),
        password: url.password || config.REDIS_PASSWORD || undefined,
        tls: redisUrl.startsWith('rediss://') ? {} : undefined,
      };
    } else {
      const [host, port] = redisUrl.split(':');
      redisConnection = {
        host: host || 'localhost',
        port: parseInt(port || '6379', 10),
        password: config.REDIS_PASSWORD || undefined,
      };
    }
    isRedisAvailable = true;
  } catch (error) {
    logger.error('Failed to parse REDIS_URL for email Queue, running in fallback mode:', error);
  }
}

// Interface for invite job data
export interface InviteEmailJobData {
  to: string;
  inviteLink: string;
  senderName: string;
  programName?: string;
}

// Raw instances
let rawQueue: Queue | null = null;
let rawWorker: Worker | null = null;

if (isRedisAvailable && redisConnection) {
  rawQueue = new Queue(QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        count: 50,
      },
      removeOnFail: {
        count: 100,
      },
    },
  });

  rawWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { to, inviteLink, senderName, programName } = job.data as InviteEmailJobData;
      logger.info(`Processing background email job ${job.id} for recipient: ${to}`);
      await emailService.sendInviteEmail(to, inviteLink, senderName, programName);
    },
    {
      connection: redisConnection,
      concurrency: 2, // process up to 2 emails concurrently
    }
  );

  rawWorker.on('completed', (job) => {
    logger.info(`Job ${job.id} (email-delivery) completed successfully.`);
  });

  rawWorker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} (email-delivery) failed:`, err);
  });
}

/**
 * Enqueue an invite email to the BullMQ background queue.
 * Fallbacks gracefully to fire-and-forget inline sending if Redis is missing.
 */
export async function queueInviteEmail(data: InviteEmailJobData): Promise<void> {
  if (rawQueue) {
    try {
      await rawQueue.add('send-invite', data);
      logger.info(`Successfully queued invite email job in Redis for: ${data.to}`);
    } catch (err) {
      logger.error('Failed to queue invite job in Redis, falling back to inline delivery:', err);
      void runInlineDelivery(data);
    }
  } else {
    logger.warn(`Redis is not configured. Running invite email delivery inline for: ${data.to}`);
    void runInlineDelivery(data);
  }
}

/**
 * Handle fire-and-forget inline sending without locking the main Express request thread
 */
function runInlineDelivery(data: InviteEmailJobData): void {
  emailService.sendInviteEmail(data.to, data.inviteLink, data.senderName, data.programName)
    .catch((err) => {
      logger.error(`Failed inline delivery of invite email to ${data.to}:`, err);
    });
}

/**
 * Close queue and worker on application shutdown
 */
export async function shutdownEmailQueue(): Promise<void> {
  if (rawWorker) {
    await rawWorker.close();
  }
  if (rawQueue) {
    await rawQueue.close();
  }
}
