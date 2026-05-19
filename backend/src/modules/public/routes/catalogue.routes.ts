import { Router, Request, Response, NextFunction } from 'express';
import { catalogueController } from '../controllers/catalogue.controller';

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
router.get('/courses', (req: Request, res: Response, next: NextFunction) => {
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
router.get('/bootcamps', (req: Request, res: Response, next: NextFunction) => {
  void catalogueController.getBootcamps(req, res, next);
});

/**
 * @swagger
 * /courses/{slug}:
 *   get:
 *     summary: Get detailed course by slug (Public endpoint)
 *     tags: [Public Catalogue]
 *     description: |
 *       Returns a single course by its URL-friendly slug with full details including:
 *       - Course information
 *       - Eager-loaded modules (curriculum)
 *       - Instructor details
 *       - FAQ section
 *       - Next 3 upcoming batches (startDate >= today, status in [Open, Filling])
 *       Uses Redis caching (TTL: 600s).
 *       No authentication required.
 *       Returns 404 if course is not published.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Course slug (e.g., "javascript-masterclass")
 *     responses:
 *       200:
 *         description: Course retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 course:
 *                   $ref: '#/components/schemas/Course'
 *                 modules:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CourseModule'
 *                 faqs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CourseFAQ'
 *                 upcomingBatches:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CourseBatch'
 *       404:
 *         description: Course not found or not published
 */
router.get('/courses/:slug', (req: Request, res: Response, next: NextFunction) => {
  void catalogueController.getCourseDetailBySlug(req, res, next);
});

/**
 * @swagger
 * /courses/id/{id}:
 *   get:
 *     summary: Get detailed course by ID (Public endpoint)
 *     tags: [Public Catalogue]
 *     description: |
 *       Returns a single course by its MongoDB ID with full details including:
 *       - Course information
 *       - Eager-loaded modules (curriculum)
 *       - Instructor details
 *       - FAQ section
 *       - Next 3 upcoming batches (startDate >= today, status in [Open, Filling])
 *       Uses Redis caching (TTL: 600s).
 *       No authentication required.
 *       Returns 404 if course is not published.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course MongoDB ID
 *     responses:
 *       200:
 *         description: Course retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 course:
 *                   $ref: '#/components/schemas/Course'
 *                 modules:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CourseModule'
 *                 faqs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CourseFAQ'
 *                 upcomingBatches:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CourseBatch'
 *       404:
 *         description: Course not found or not published
 */
router.get('/courses/id/:id', (req: Request, res: Response, next: NextFunction) => {
  void catalogueController.getCourseDetailById(req, res, next);
});

/**
 * @swagger
 * /bootcamps/id/{id}:
 *   get:
 *     summary: Get detailed bootcamp by ID (Public endpoint)
 *     tags: [Public Catalogue]
 *     description: |
 *       Returns a single bootcamp by its MongoDB ID with full details.
 *       Uses Redis caching (TTL: 600s).
 *       No authentication required.
 *       Returns 404 if bootcamp is not published.
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
 *         description: Bootcamp not found or not published
 */
router.get('/bootcamps/id/:id', (req: Request, res: Response, next: NextFunction) => {
  void catalogueController.getBootcampDetailById(req, res, next);
});

/**
 * @swagger
 * /bootcamps/{slug}:
 *   get:
 *     summary: Get detailed bootcamp by slug (Public endpoint)
 *     tags: [Public Catalogue]
 *     description: |
 *       Returns a single bootcamp by its URL-friendly slug with full details.
 *       Uses Redis caching (TTL: 600s).
 *       No authentication required.
 *       Perfect for SSG/SSR bootcamp detail pages.
 *       Returns 404 if bootcamp is not published.
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
 *         description: Bootcamp not found or not published
 */
router.get('/bootcamps/:slug', (req: Request, res: Response, next: NextFunction) => {
  void catalogueController.getBootcampDetailBySlug(req, res, next);
});

/**
 * @swagger
 * /training-programs:
 *   get:
 *     summary: Get all published training programs (Public SSG endpoint)
 *     tags: [Public Catalogue]
 *     description: |
 *       Returns published training programs (40-day internships) in unified catalogue format.
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
 *         description: Filter by category/domain
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *         description: Filter by level
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
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Training programs retrieved successfully
 */
router.get('/training-programs', (req: Request, res: Response, next: NextFunction) => {
  void catalogueController.getTrainingPrograms(req, res, next);
});

/**
 * @swagger
 * /training-programs/{slug}:
 *   get:
 *     summary: Get detailed training program by slug (Public endpoint)
 *     tags: [Public Catalogue]
 *     description: |
 *       Returns a single training program by its URL-friendly slug with full details.
 *       Uses Redis caching (TTL: 600s).
 *       No authentication required.
 *       Returns 404 if training program is not published.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Training program slug
 *     responses:
 *       200:
 *         description: Training program retrieved successfully
 *       404:
 *         description: Training program not found or not published
 */
router.get('/training-programs/:slug', (req: Request, res: Response, next: NextFunction) => {
  void catalogueController.getTrainingProgramDetailBySlug(req, res, next);
});

/**
 * @swagger
 * /training-programs/id/{id}:
 *   get:
 *     summary: Get detailed training program by ID (Public endpoint)
 *     tags: [Public Catalogue]
 *     description: |
 *       Returns a single training program by its MongoDB ID with full details.
 *       Uses Redis caching (TTL: 600s).
 *       No authentication required.
 *       Returns 404 if training program is not published.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Training program MongoDB ID
 *     responses:
 *       200:
 *         description: Training program retrieved successfully
 *       404:
 *         description: Training program not found or not published
 */
router.get('/training-programs/id/:id', (req: Request, res: Response, next: NextFunction) => {
  void catalogueController.getTrainingProgramDetailById(req, res, next);
});

export default router;
