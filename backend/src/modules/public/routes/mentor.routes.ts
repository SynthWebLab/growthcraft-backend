import { Router, Request, Response, NextFunction } from 'express';
import { publicMentorController } from '../controllers/mentor.controller';

const router = Router();

/**
 * @swagger
 * /mentors:
 *   get:
 *     summary: Get public mentors list
 *     tags: [Public Catalogue]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: areaOfExpertise
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [rating, sessions, experience, createdAt]
 *     responses:
 *       200:
 *         description: Mentors retrieved successfully
 */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  void publicMentorController.getMentors(req, res, next);
});

/**
 * @swagger
 * /mentors/{id}:
 *   get:
 *     summary: Get single mentor profile by ID
 *     tags: [Public Catalogue]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mentor retrieved successfully
 */
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  void publicMentorController.getMentorById(req, res, next);
});

export default router;
