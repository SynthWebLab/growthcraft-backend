import express from 'express';
import {
  triggerMetricsJob,
  getMetricsJobStatus,
  getMetricsJobHistory,
} from '../controllers/metrics-job.controller';
import { authenticate } from '@/common/middleware/authenticate.middleware';
import { authorize } from '@/common/middleware/authorize.middleware';
import { UserRole } from '@/common/constants/user.constants';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize([UserRole.SUPER_ADMIN, UserRole.OPS]));

/**
 * @swagger
 * /api/admin/jobs/trigger-metrics:
 *   post:
 *     summary: Manually trigger enrollment metrics job
 *     tags: [Admin - Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job triggered successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/trigger-metrics', triggerMetricsJob);

/**
 * @swagger
 * /api/admin/jobs/metrics-status:
 *   get:
 *     summary: Get current status of metrics job queue
 *     tags: [Admin - Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job status retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/metrics-status', getMetricsJobStatus);

/**
 * @swagger
 * /api/admin/jobs/metrics-history:
 *   get:
 *     summary: Get execution history of metrics jobs
 *     tags: [Admin - Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of history records to retrieve
 *     responses:
 *       200:
 *         description: Job history retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/metrics-history', getMetricsJobHistory);

export default router;
