import { Router } from 'express';
import { trainingProgramController } from '../controllers/training-program.controller';
import { trainingProgramDetailsController } from '../controllers/training-program-details.controller';
import { trainingProgramEnrollmentController } from '../controllers/training-program-enrollment.controller';
import { trainingProgramEnrollmentValidator } from '../validators/training-program-enrollment.validator';
import { authenticate } from '@/common/middleware/authenticate.middleware';

const router = Router();

// ============================================
// PUBLIC ROUTES - Training Programs Listing & Details
// ============================================

/**
 * @route   GET /api/v1/training-programs
 * @desc    Get all training programs with filtering and pagination
 * @access  Public
 * @query   domain, level, status, search, page, limit, sortBy, sortOrder
 */
router.get('/', trainingProgramController.getAllPrograms.bind(trainingProgramController));

/**
 * @route   GET /api/v1/training-programs/filters/domains
 * @desc    Get all unique domains for filtering
 * @access  Public
 */
router.get(
  '/filters/domains',
  trainingProgramController.getAllDomains.bind(trainingProgramController)
);

/**
 * @route   GET /api/v1/training-programs/popular
 * @desc    Get popular training programs
 * @access  Public
 * @query   limit (default: 6)
 */
router.get(
  '/popular',
  trainingProgramController.getPopularPrograms.bind(trainingProgramController)
);

/**
 * @route   GET /api/v1/training-programs/:slug
 * @desc    Get training program by slug
 * @access  Public
 */
router.get(
  '/:slug',
  trainingProgramController.getProgramBySlug.bind(trainingProgramController)
);

/**
 * @route   GET /api/v1/training-programs/:slug/similar
 * @desc    Get similar training programs
 * @access  Public
 * @query   limit (default: 4)
 */
router.get(
  '/:slug/similar',
  trainingProgramController.getSimilarPrograms.bind(trainingProgramController)
);

// ============================================
// PUBLIC ROUTES - Training Program Details
// ============================================

/**
 * @route   GET /api/v1/training-programs/:slug/details
 * @desc    Get all training program details (overview, syllabus, mentors, FAQs)
 * @access  Public
 */
router.get(
  '/:slug/details',
  trainingProgramDetailsController.getAllDetails.bind(trainingProgramDetailsController)
);

/**
 * @route   GET /api/v1/training-programs/:slug/overview
 * @desc    Get training program overview
 * @access  Public
 */
router.get(
  '/:slug/overview',
  trainingProgramDetailsController.getOverview.bind(trainingProgramDetailsController)
);

/**
 * @route   GET /api/v1/training-programs/:slug/syllabus
 * @desc    Get training program syllabus
 * @access  Public
 */
router.get(
  '/:slug/syllabus',
  trainingProgramDetailsController.getSyllabus.bind(trainingProgramDetailsController)
);

/**
 * @route   GET /api/v1/training-programs/:slug/mentors
 * @desc    Get training program mentors
 * @access  Public
 */
router.get(
  '/:slug/mentors',
  trainingProgramDetailsController.getMentors.bind(trainingProgramDetailsController)
);

/**
 * @route   GET /api/v1/training-programs/:slug/faqs
 * @desc    Get training program FAQs
 * @access  Public
 */
router.get(
  '/:slug/faqs',
  trainingProgramDetailsController.getFAQs.bind(trainingProgramDetailsController)
);

// ============================================
// PROTECTED ROUTES - Enrollment & Callback
// ============================================

/**
 * @route   POST /api/v1/training-programs/:programId/enroll
 * @desc    Enroll in a training program
 * @access  Protected (requires authentication)
 */
router.post(
  '/:programId/enroll',
  authenticate,
  trainingProgramEnrollmentValidator.enroll,
  trainingProgramEnrollmentController.enrollInProgram.bind(trainingProgramEnrollmentController)
);

/**
 * @route   POST /api/v1/training-programs/:programId/request-callback
 * @desc    Request callback for a training program
 * @access  Protected (requires authentication)
 */
router.post(
  '/:programId/request-callback',
  authenticate,
  trainingProgramEnrollmentValidator.requestCallback,
  trainingProgramEnrollmentController.requestCallback.bind(trainingProgramEnrollmentController)
);

/**
 * @route   GET /api/v1/training-programs/enrollments/my-enrollments
 * @desc    Get user's training program enrollments
 * @access  Protected (requires authentication)
 */
router.get(
  '/enrollments/my-enrollments',
  authenticate,
  trainingProgramEnrollmentController.getMyEnrollments.bind(trainingProgramEnrollmentController)
);

/**
 * @route   GET /api/v1/training-programs/callbacks/my-requests
 * @desc    Get user's callback requests
 * @access  Protected (requires authentication)
 */
router.get(
  '/callbacks/my-requests',
  authenticate,
  trainingProgramEnrollmentController.getMyCallbackRequests.bind(
    trainingProgramEnrollmentController
  )
);

/**
 * @route   GET /api/v1/training-programs/:programId/enrollment-status
 * @desc    Check if user is enrolled in a program and has pending callback request
 * @access  Protected (requires authentication)
 */
router.get(
  '/:programId/enrollment-status',
  authenticate,
  trainingProgramEnrollmentValidator.checkStatus,
  trainingProgramEnrollmentController.checkEnrollmentStatus.bind(
    trainingProgramEnrollmentController
  )
);

export default router;
