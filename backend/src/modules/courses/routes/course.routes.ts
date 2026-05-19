import { Router, Request, Response, NextFunction } from 'express';
import { courseController } from '../controllers/course.controller';
import { courseConfigController } from '../controllers/course-config.controller';
import { enrollmentController } from '../controllers/enrollment.controller';
import { courseDetailsController } from '../controllers/course-details.controller';
import { CourseValidator } from '../validators/course.validator';
import { EnrollmentValidator } from '../validators/enrollment.validator';
import { authenticate } from '@/common/middleware/authenticate.middleware';

const router = Router();

// ============================================
// CONFIGURATION ROUTES (Dynamic Data)
// ============================================

/**
 * @swagger
 * /courses/config:
 *   get:
 *     summary: Get all course configurations (categories, difficulty levels, course types)
 *     tags: [Course Config]
 *     description: Returns all dynamic configuration values from database
 *     responses:
 *       200:
 *         description: Configurations retrieved successfully
 */
router.get('/config', (req: Request, res: Response, next: NextFunction) => {
  void courseConfigController.getAllConfigs(req, res, next);
});

/**
 * @swagger
 * /courses/config/categories:
 *   get:
 *     summary: Get all course categories
 *     tags: [Course Config]
 *     description: Returns dynamic list of course categories from database
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get('/config/categories', (req: Request, res: Response, next: NextFunction) => {
  void courseConfigController.getCategories(req, res, next);
});

/**
 * @swagger
 * /courses/config/difficulty-levels:
 *   get:
 *     summary: Get all difficulty levels
 *     tags: [Course Config]
 *     description: Returns dynamic list of difficulty levels from database
 *     responses:
 *       200:
 *         description: Difficulty levels retrieved successfully
 */
router.get('/config/difficulty-levels', (req: Request, res: Response, next: NextFunction) => {
  void courseConfigController.getDifficultyLevels(req, res, next);
});

/**
 * @swagger
 * /courses/config/course-types:
 *   get:
 *     summary: Get all course types
 *     tags: [Course Config]
 *     description: Returns dynamic list of course types from database
 *     responses:
 *       200:
 *         description: Course types retrieved successfully
 */
router.get('/config/course-types', (req: Request, res: Response, next: NextFunction) => {
  void courseConfigController.getCourseTypes(req, res, next);
});

/**
 * @swagger
 * /courses/config/{key}:
 *   put:
 *     summary: Update configuration (Admin only)
 *     tags: [Course Config]
 *     description: Update dynamic configuration values
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *           enum: [categories, difficultyLevels, courseTypes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               values:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 */
router.put('/config/:key', (req: Request, res: Response, next: NextFunction) => {
  void courseConfigController.updateConfig(req, res, next);
});

/**
 * @swagger
 * /courses/config/clear-cache:
 *   post:
 *     summary: Clear configuration cache (Admin only)
 *     tags: [Course Config]
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 */
router.post('/config/clear-cache', (req: Request, res: Response, next: NextFunction) => {
  void courseConfigController.clearCache(req, res, next);
});

// ============================================
// FILTER OPTIONS ROUTE
// ============================================

/**
 * @swagger
 * /courses/filters/options:
 *   get:
 *     summary: Get available filter options
 *     tags: [Courses]
 *     description: Returns available categories, difficulty levels, price range, and tags for filtering courses
 *     responses:
 *       200:
 *         description: Filter options retrieved successfully
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
 *                   example: Filter options retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["MERN", "UI/UX", "DataScience", "DevOps", "Other"]
 *                     difficultyLevels:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Beginner", "Intermediate", "Advanced"]
 *                     courseTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Course", "Bootcamp"]
 *                     priceRange:
 *                       type: object
 *                       properties:
 *                         min:
 *                           type: number
 *                           example: 0
 *                         max:
 *                           type: number
 *                           example: 15000
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["JavaScript", "React", "Node.js"]
 */
router.get('/filters/options', (req: Request, res: Response, next: NextFunction) => {
  void courseController.getFilterOptions(req, res, next);
});

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Get all courses with filtering, search, and pagination
 *     tags: [Courses]
 *     description: |
 *       Supports both offset-based pagination (page/limit) and cursor-based pagination (cursor/useCursor).
 *       Cursor-based pagination is recommended for SSG and better performance.
 *       Results are cached in Redis for 5 minutes.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for offset-based pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for cursor-based pagination (base64 encoded)
 *       - in: query
 *         name: useCursor
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Enable cursor-based pagination (automatically enabled if cursor is provided)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [MERN, UI/UX, DataScience, DevOps, Other]
 *         description: Filter by course category
 *       - in: query
 *         name: difficultyLevel
 *         schema:
 *           type: string
 *           enum: [Beginner, Intermediate, Advanced]
 *         description: Filter by difficulty level
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum price filter
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *         description: Minimum rating filter
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated)
 *         example: JavaScript,React
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search query for title and description (recommended - shorter parameter name)
 *         example: javascript react
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search query for title and description (alternative to 'q' for backward compatibility)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, price, rating, enrollmentCount, createdAt, duration]
 *           default: createdAt
 *         description: Field to sort by
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
 *               oneOf:
 *                 - type: object
 *                   description: Offset-based pagination response
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: Courses retrieved successfully
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Course'
 *                     meta:
 *                       type: object
 *                       properties:
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page:
 *                               type: integer
 *                               example: 1
 *                             limit:
 *                               type: integer
 *                               example: 10
 *                             total:
 *                               type: integer
 *                               example: 50
 *                             totalPages:
 *                               type: integer
 *                               example: 5
 *                 - type: object
 *                   description: Cursor-based pagination response
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: Courses retrieved successfully
 *                     data:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Course'
 *                         nextCursor:
 *                           type: string
 *                           nullable: true
 *                           example: eyJpZCI6IjYwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsInNvcnRGaWVsZCI6ImNyZWF0ZWRBdCIsInNvcnRWYWx1ZSI6IjIwMjQtMDEtMTVUMTA6MzA6MDAuMDAwWiJ9
 *                         hasMore:
 *                           type: boolean
 *                           example: true
 *                     meta:
 *                       type: object
 *                       properties:
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', CourseValidator.getCourses(), (req: Request, res: Response, next: NextFunction) => {
  void courseController.getCourses(req, res, next);
});

/**
 * @swagger
 * /courses/slug/{slug}:
 *   get:
 *     summary: Get course by slug
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Course slug (URL-friendly identifier)
 *         example: javascript-zero-to-hero
 *     responses:
 *       200:
 *         description: Course retrieved successfully
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
 *                   example: Course retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/slug/:slug', (req: Request, res: Response, next: NextFunction) => {
  void courseController.getCourseBySlug(req, res, next);
});

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course retrieved successfully
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
 *                   example: Course retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  void courseController.getCourseById(req, res, next);
});

// ============================================
// ENROLLMENT ROUTES
// ============================================

/**
 * @swagger
 * /courses/{courseId}/enroll:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Course Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - phone
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Sandipan Goswami
 *               email:
 *                 type: string
 *                 format: email
 *                 example: sandipan.goswami@syntheticweb.in
 *               phone:
 *                 type: string
 *                 example: "5000100424"
 *               enrollmentNumber:
 *                 type: string
 *                 example: "2021CS001"
 *               collegeName:
 *                 type: string
 *                 example: "Data Science & A.I-Bootcamp"
 *     responses:
 *       201:
 *         description: Successfully enrolled in the course
 *       400:
 *         description: Validation error or course not available
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Already enrolled in this course
 */
router.post(
  '/:courseId/enroll',
  authenticate,
  EnrollmentValidator.enrollCourse(),
  (req: Request, res: Response, next: NextFunction) => {
    void enrollmentController.enrollInCourse(req, res, next);
  }
);

/**
 * @swagger
 * /courses/{courseId}/request-callback:
 *   post:
 *     summary: Request callback for a course
 *     tags: [Course Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - phone
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Sandipan Goswami
 *               email:
 *                 type: string
 *                 format: email
 *                 example: sandipan.goswami@syntheticweb.in
 *               phone:
 *                 type: string
 *                 example: "5000100424"
 *     responses:
 *       201:
 *         description: Callback request created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Already have a pending callback request
 */
router.post(
  '/:courseId/request-callback',
  authenticate,
  EnrollmentValidator.requestCallback(),
  (req: Request, res: Response, next: NextFunction) => {
    void enrollmentController.requestCallback(req, res, next);
  }
);

/**
 * @swagger
 * /courses/enrollments/my-enrollments:
 *   get:
 *     summary: Get user's course enrollments
 *     tags: [Course Enrollment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enrollments retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/enrollments/my-enrollments', authenticate, (req: Request, res: Response, next: NextFunction) => {
  void enrollmentController.getMyEnrollments(req, res, next);
});

/**
 * @swagger
 * /courses/callbacks/my-requests:
 *   get:
 *     summary: Get user's callback requests
 *     tags: [Course Enrollment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Callback requests retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/callbacks/my-requests', authenticate, (req: Request, res: Response, next: NextFunction) => {
  void enrollmentController.getMyCallbackRequests(req, res, next);
});

/**
 * @swagger
 * /courses/{courseId}/enrollment-status:
 *   get:
 *     summary: Check if user is enrolled in a course
 *     tags: [Course Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Enrollment status retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/:courseId/enrollment-status', authenticate, (req: Request, res: Response, next: NextFunction) => {
  void enrollmentController.checkEnrollmentStatus(req, res, next);
});

// ============================================
// COURSE DETAILS ROUTES (Overview, Curriculum, Instructor, FAQs)
// ============================================

/**
 * @swagger
 * /courses/slug/{slug}/details:
 *   get:
 *     summary: Get all course details (overview, curriculum, instructor, FAQs)
 *     tags: [Course Details]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Course slug
 *         example: javascript-zero-to-hero
 *     responses:
 *       200:
 *         description: Course details retrieved successfully
 *       404:
 *         description: Course details not found
 */
router.get('/slug/:slug/details', (req: Request, res: Response, next: NextFunction) => {
  void courseDetailsController.getAllDetails(req, res, next);
});

/**
 * @swagger
 * /courses/slug/{slug}/overview:
 *   get:
 *     summary: Get course overview
 *     tags: [Course Details]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Course slug
 *     responses:
 *       200:
 *         description: Course overview retrieved successfully
 *       404:
 *         description: Course not found
 */
router.get('/slug/:slug/overview', (req: Request, res: Response, next: NextFunction) => {
  void courseDetailsController.getOverview(req, res, next);
});

/**
 * @swagger
 * /courses/slug/{slug}/curriculum:
 *   get:
 *     summary: Get course curriculum
 *     tags: [Course Details]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Course slug
 *     responses:
 *       200:
 *         description: Course curriculum retrieved successfully
 *       404:
 *         description: Course not found
 */
router.get('/slug/:slug/curriculum', (req: Request, res: Response, next: NextFunction) => {
  void courseDetailsController.getCurriculum(req, res, next);
});

/**
 * @swagger
 * /courses/slug/{slug}/instructor:
 *   get:
 *     summary: Get course instructor details
 *     tags: [Course Details]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Course slug
 *     responses:
 *       200:
 *         description: Course instructor retrieved successfully
 *       404:
 *         description: Course not found
 */
router.get('/slug/:slug/instructor', (req: Request, res: Response, next: NextFunction) => {
  void courseDetailsController.getInstructor(req, res, next);
});

/**
 * @swagger
 * /courses/slug/{slug}/faqs:
 *   get:
 *     summary: Get course FAQs
 *     tags: [Course Details]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Course slug
 *     responses:
 *       200:
 *         description: Course FAQs retrieved successfully
 *       404:
 *         description: Course not found
 */
router.get('/slug/:slug/faqs', (req: Request, res: Response, next: NextFunction) => {
  void courseDetailsController.getFAQs(req, res, next);
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         title:
 *           type: string
 *           example: JavaScript Zero to Hero
 *         description:
 *           type: string
 *           example: The only JS course you need. Closures, async, DOM, ES6+, and 30+ hands-on projects
 *         category:
 *           type: string
 *           enum: [MERN, UI/UX, DataScience, DevOps, Other]
 *           example: MERN
 *         difficultyLevel:
 *           type: string
 *           enum: [Beginner, Intermediate, Advanced]
 *           example: Beginner
 *         duration:
 *           type: number
 *           description: Duration in hours
 *           example: 70
 *         lessonsCount:
 *           type: number
 *           example: 52
 *         price:
 *           type: number
 *           example: 4499
 *         originalPrice:
 *           type: number
 *           example: 7999
 *         rating:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *           example: 4.9
 *         instructor:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: Ananya Iyer
 *             avatar:
 *               type: string
 *               example: https://example.com/avatar.jpg
 *         thumbnail:
 *           type: string
 *           example: https://example.com/course-thumbnail.jpg
 *         isActive:
 *           type: boolean
 *           example: true
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["JavaScript", "ES6", "DOM"]
 *         enrollmentCount:
 *           type: number
 *           example: 1250
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export default router;
