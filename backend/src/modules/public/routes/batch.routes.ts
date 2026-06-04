import { Router, Request, Response, NextFunction } from 'express';
import { publicBatchController } from '../controllers/batch.controller';

const router = Router();

/**
 * @swagger
 * /batches:
 *   get:
 *     summary: Get public batches (Open/Filling with future start dates)
 *     tags: [Public Batches]
 *     description: |
 *       Returns batches with status Open or Filling and startDate >= today.
 *       No authentication required.
 *       Useful for displaying available batches to students.
 *       Results are cached in Redis for 60 seconds.
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by course ID
 *       - in: query
 *         name: trainingProgramId
 *         schema:
 *           type: string
 *         description: Filter by training program ID
 *       - in: query
 *         name: bootcampId
 *         schema:
 *           type: string
 *         description: Filter by bootcamp ID
 *       - in: query
 *         name: mentorId
 *         schema:
 *           type: string
 *         description: Filter by assigned mentor ID
 *       - in: query
 *         name: parentType
 *         schema:
 *           type: string
 *           enum: [Course, TrainingProgram, Bootcamp]
 *         description: Filter by parent type (Course, TrainingProgram, or Bootcamp)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Batches retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Batches retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Batch'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 */
router.get('/batches', (req: Request, res: Response, next: NextFunction) => {
  void publicBatchController.listPublicBatches(req, res, next);
});

export default router;
