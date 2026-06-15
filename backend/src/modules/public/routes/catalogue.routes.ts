import { Router, Request, Response, NextFunction } from 'express';
import { catalogueController } from '../controllers/catalogue.controller';
import { optionalAuthenticate } from '@/common/middleware/authenticate.middleware';

const router = Router();

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Get all published courses (Public SSG endpoint)
 *     tags: [Public Catalogue]
 *     description: |
 *       Returns published courses in unified catalogue format for SSG.
 *       Uses cursor-based pagination and Redis caching (TTL: 300s).
 *       No authentication required.
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination (base64 encoded)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *         description: Filter by difficulty level (alias for difficultyLevel)
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *         description: Minimum rating (0-5)
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, price, rating, createdAt]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CatalogueItem'
 *                 nextCursor:
 *                   type: string
 *                   nullable: true
 *                   description: Cursor for next page (null if no more items)
 */
router.get('/courses', optionalAuthenticate, (req: Request, res: Response, next: NextFunction) => {
  void catalogueController.getCourses(req, res, next);
});

/**
 * @swagger
 * /bootcamps:
 *   get:
 *     summary: Get all published bootcamps (Public SSG endpoint)
 *     tags: [Public Catalogue]
 *     description: |
 *       Returns published bootcamps in unified catalogue format for SSG.
 *       Uses cursor-based pagination and Redis caching (TTL: 300s).
 *       No authentication required.
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination (base64 encoded)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [Online, Offline, Hybrid]
 *         description: Filter by mode
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Open, Closed, Completed]
 *         description: Filter by status
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *         description: Minimum rating (0-5)
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, price, rating, createdAt, startDate]
 *           default: startDate
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Bootcamps retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CatalogueItem'
 *                 nextCursor:
 *                   type: string
 *                   nullable: true
 *                   description: Cursor for next page (null if no more items)
 */
router.get('/bootcamps', optionalAuthenticate, (req: Request, res: Response, next: NextFunction) => {
  void catalogueController.getBootcamps(req, res, next);
});

/**
 * @swagger
 * /workshops:
 *   get:
 *     summary: Get workshops only (Public endpoint)
 *     tags: [Public Catalogue]
 *     description: Returns only workshop events with filtering and pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (Open, Closed, Completed)
 *     responses:
 *       200:
 *         description: Workshops retrieved successfully
 */
router.get('/workshops', optionalAuthenticate, (req: Request, res: Response, next: NextFunction) => {
  void catalogueController.getWorkshops(req, res, next);
});

/**
 * @swagger
 * /hackathons:
 *   get:
 *     summary: Get hackathons only (Public endpoint)
 *     tags: [Public Catalogue]
 *     description: Returns only hackathon events with filtering and pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (Open, Closed, Completed)
 *     responses:
 *       200:
 *         description: Hackathons retrieved successfully
 */
router.get('/hackathons', optionalAuthenticate, (req: Request, res: Response, next: NextFunction) => {
  void catalogueController.getHackathons(req, res, next);
});

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get ALL events (Bootcamps + Workshops + Hackathons) (Public endpoint)
 *     tags: [Public Catalogue]
 *     description: |
 *       Returns all event types (bootcamps, workshops, hackathons) in a single response.
 *       Supports filtering, pagination, search, and sorting.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page (max: 50)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (Open, Closed, Completed)
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *         description: Filter by mode (Online, Offline, Hybrid)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *     responses:
 *       200:
 *         description: All events retrieved successfully
 */
router.get('/events', optionalAuthenticate, (req: Request, res: Response, next: NextFunction) => {
  void catalogueController.getAllEvents(req, res, next);
});

/**
 * @swagger
 * /bootcamps/id/{id}:
 *   get:
 *     summary: Get bootcamp by ID (Public endpoint)
 *     tags: [Public Catalogue]
 *     description: |
 *       Returns a single bootcamp by its MongoDB ID.
 *       Uses Redis caching (TTL: 600s).
 *       No authentication required.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bootcamp MongoDB ID
 *     responses:
 *       200:
 *         description: Bootcamp retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bootcamp:
 *                   $ref: '#/components/schemas/Bootcamp'
 *       404:
 *         description: Bootcamp not found
 */
router.get('/bootcamps/id/:id', optionalAuthenticate, (req: Request, res: Response, next: NextFunction) => {
  void catalogueController.getBootcampById(req, res, next);
});

/**
 * @swagger
 * /bootcamps/{slug}:
 *   get:
 *     summary: Get bootcamp by slug (Public endpoint)
 *     tags: [Public Catalogue]
 *     description: |
 *       Returns a single bootcamp by its URL-friendly slug.
 *       Uses Redis caching (TTL: 600s).
 *       No authentication required.
 *       Perfect for SSG/SSR bootcamp detail pages.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Bootcamp slug (e.g., "mern-bootcamp-batch-7")
 *     responses:
 *       200:
 *         description: Bootcamp retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bootcamp:
 *                   $ref: '#/components/schemas/Bootcamp'
 *       404:
 *         description: Bootcamp not found
 */
router.get('/bootcamps/:slug', optionalAuthenticate, (req: Request, res: Response, next: NextFunction) => {
  void catalogueController.getBootcampBySlug(req, res, next);
});

export default router;
