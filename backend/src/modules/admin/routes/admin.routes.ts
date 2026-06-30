import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '@/common/middleware/authenticate.middleware';
import { authorize } from '@/common/middleware/authorize.middleware';
import { UserRole } from '@/common/constants/user.constants';
import { batchController } from '../controllers/batch.controller';
import { enrollmentController } from '../controllers/enrollment.controller';
import { userController } from '../controllers/user.controller';
import { ambassadorController } from '../controllers/ambassador.controller';
import metricsJobRoutes from './metrics-job.routes';

const router = Router();

// All admin routes require authentication and SuperAdmin or Ops role
router.use(authenticate);
router.use(authorize([UserRole.SUPER_ADMIN, UserRole.OPS]));

/**
 * @route   POST /api/v1/admin/batches
 * @desc    Create a new batch
 * @access  SuperAdmin, Ops
 */
router.post('/batches', (req: Request, res: Response, next: NextFunction) => {
  void batchController.createBatch(req, res, next);
});

/**
 * @route   GET /api/v1/admin/batches
 * @desc    List all batches with filters
 * @access  SuperAdmin, Ops
 */
router.get('/batches', (req: Request, res: Response, next: NextFunction) => {
  void batchController.listBatches(req, res, next);
});

/**
 * @route   GET /api/v1/admin/batches/:id
 * @desc    Get batch by ID
 * @access  SuperAdmin, Ops
 */
router.get('/batches/:id', (req: Request, res: Response, next: NextFunction) => {
  void batchController.getBatchById(req, res, next);
});

/**
 * @route   PATCH /api/v1/admin/batches/:id
 * @desc    Update batch details
 * @access  SuperAdmin, Ops
 */
router.patch('/batches/:id', (req: Request, res: Response, next: NextFunction) => {
  void batchController.updateBatch(req, res, next);
});

/**
 * @route   PATCH /api/v1/admin/batches/:id/mentor
 * @desc    Assign mentor to batch
 * @access  SuperAdmin, Ops
 */
router.patch('/batches/:id/mentor', (req: Request, res: Response, next: NextFunction) => {
  void batchController.assignMentor(req, res, next);
});

/**
 * @route   PATCH /api/v1/admin/batches/:id/mentors
 * @desc    Assign multiple mentors to batch
 * @access  SuperAdmin, Ops
 */
router.patch('/batches/:id/mentors', (req: Request, res: Response, next: NextFunction) => {
  void batchController.assignMentors(req, res, next);
});

/**
 * @route   POST /api/v1/admin/enrollments
 * @desc    Create a new enrollment
 * @access  SuperAdmin, Ops
 */
router.post('/enrollments', (req: Request, res: Response, next: NextFunction) => {
  void enrollmentController.createEnrollment(req, res, next);
});

/**
 * @route   GET /api/v1/admin/users
 * @desc    List all users with filters
 * @access  SuperAdmin, Ops
 */
router.get('/users', (req: Request, res: Response, next: NextFunction) => {
  void userController.listUsers(req, res, next);
});

/**
 * @route   GET /api/v1/admin/users/:id
 * @desc    Get user by ID
 * @access  SuperAdmin, Ops
 */
router.get('/users/:id', (req: Request, res: Response, next: NextFunction) => {
  void userController.getUserById(req, res, next);
});

/**
 * Job management routes
 */
router.use('/jobs', metricsJobRoutes);

/**
 * @route   GET /api/v1/admin/ambassadors
 * @desc    List all ambassadors with statistics
 * @access  SuperAdmin, Ops
 */
router.get('/ambassadors', (req: Request, res: Response, next: NextFunction) => {
  void ambassadorController.listAmbassadors(req, res, next);
});

/**
 * @route   PATCH /api/v1/admin/ambassadors/:userId/payout
 * @desc    Record payout for ambassador
 * @access  SuperAdmin, Ops
 */
router.patch('/ambassadors/:userId/payout', (req: Request, res: Response, next: NextFunction) => {
  void ambassadorController.confirmPayout(req, res, next);
});

/**
 * @route   PATCH /api/v1/admin/ambassadors/:userId/activate
 * @desc    Admin promotes/demotes student ambassador status
 * @access  SuperAdmin, Ops
 */
router.patch('/ambassadors/:userId/activate', (req: Request, res: Response, next: NextFunction) => {
  void ambassadorController.toggleActivation(req, res, next);
});

export default router;
