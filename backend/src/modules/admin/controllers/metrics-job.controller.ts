import { Request, Response, NextFunction } from 'express';
import { triggerManualJob, enrollmentMetricsQueue } from '@/jobs/enrollment-metrics.job';
import { logger } from '@/common/utils/logger.util';
import { SuccessResponseHelper } from '@/common/responses/success.response';

/**
 * @route   POST /api/admin/jobs/trigger-metrics
 * @desc    Manually trigger the enrollment metrics job
 * @access  Admin
 */
export const triggerMetricsJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    logger.info(`Admin ${userId} manually triggered metrics job`);

    await triggerManualJob();

    SuccessResponseHelper.send(res, {
      message: 'Enrollment metrics job triggered successfully',
      data: {
        triggeredAt: new Date(),
        triggeredBy: userId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/jobs/metrics-status
 * @desc    Get status of the last few metrics jobs
 * @access  Admin
 */
export const getMetricsJobStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get completed jobs
    const completed = await enrollmentMetricsQueue.getCompleted(0, 4); // Last 5
    const failed = await enrollmentMetricsQueue.getFailed(0, 4); // Last 5
    const active = await enrollmentMetricsQueue.getActive();
    const waiting = await enrollmentMetricsQueue.getWaiting();
    const delayed = await enrollmentMetricsQueue.getDelayed();

    // Get repeat jobs (scheduled jobs)
    const repeatableJobs = await enrollmentMetricsQueue.getRepeatableJobs();

    SuccessResponseHelper.send(res, {
      message: 'Metrics job status retrieved successfully',
      data: {
        queue: {
          name: 'enrollment-metrics',
          counts: {
            active: active.length,
            waiting: waiting.length,
            delayed: delayed.length,
            completed: completed.length,
            failed: failed.length,
          },
        },
        scheduled: repeatableJobs.map((job) => ({
          name: job.name,
          pattern: job.pattern,
          next: job.next,
        })),
        recentCompleted: completed.map((job) => ({
          id: job.id,
          name: job.name,
          completedAt: job.finishedOn,
          processedOn: job.processedOn,
        })),
        recentFailed: failed.map((job) => ({
          id: job.id,
          name: job.name,
          failedAt: job.finishedOn,
          error: job.failedReason,
        })),
      },
    });
  } catch (error) {
    logger.error('Error fetching metrics job status:', error);
    next(error);
  }
};

/**
 * @route   GET /api/admin/jobs/metrics-history
 * @desc    Get detailed history of a specific job
 * @access  Admin
 */
export const getMetricsJobHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const completed = await enrollmentMetricsQueue.getCompleted(0, limitNum - 1);
    const failed = await enrollmentMetricsQueue.getFailed(0, limitNum - 1);

    const history = [
      ...completed.map((job) => ({
        id: job.id,
        name: job.name,
        status: 'completed' as const,
        startedAt: job.processedOn ? new Date(job.processedOn) : null,
        completedAt: job.finishedOn ? new Date(job.finishedOn) : null,
        duration: job.processedOn && job.finishedOn ? job.finishedOn - job.processedOn : null,
      })),
      ...failed.map((job) => ({
        id: job.id,
        name: job.name,
        status: 'failed' as const,
        startedAt: job.processedOn ? new Date(job.processedOn) : null,
        failedAt: job.finishedOn ? new Date(job.finishedOn) : null,
        error: job.failedReason,
        attempts: job.attemptsMade,
      })),
    ].sort((a, b) => {
      const aTime =
        ('completedAt' in a ? a.completedAt : null) ||
        ('failedAt' in a ? a.failedAt : null) ||
        a.startedAt ||
        new Date(0);
      const bTime =
        ('completedAt' in b ? b.completedAt : null) ||
        ('failedAt' in b ? b.failedAt : null) ||
        b.startedAt ||
        new Date(0);
      return bTime.getTime() - aTime.getTime();
    });

    SuccessResponseHelper.send(res, {
      message: 'Metrics job history retrieved successfully',
      data: {
        history: history.slice(0, limitNum),
        total: history.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching metrics job history:', error);
    next(error);
  }
};
