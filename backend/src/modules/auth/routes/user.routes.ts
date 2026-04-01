import { Router, Request, Response, NextFunction } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '@/common/middleware/authenticate.middleware';
import {
  authorize,
  authorizeMinRole,
  authorizeOwnership,
} from '@/common/middleware/authorize.middleware';
import { UserRole } from '@/common/constants/user.constants';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all users - Admin and Super Admin only
router.get(
  '/',
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  (req: Request, res: Response, next: NextFunction) => {
    void userController.getAllUsers(req, res, next);
  }
);

// Get user by ID - Admin or own profile
router.get(
  '/:userId',
  authorizeOwnership('userId'),
  (req: Request, res: Response, next: NextFunction) => {
    void userController.getUserById(req, res, next);
  }
);

// Update user - Admin or own profile
router.patch(
  '/:userId',
  authorizeOwnership('userId'),
  (req: Request, res: Response, next: NextFunction) => {
    void userController.updateUser(req, res, next);
  }
);

// Delete user - Admin only (cannot delete self)
router.delete(
  '/:userId',
  authorizeMinRole(UserRole.ADMIN),
  (req: Request, res: Response, next: NextFunction) => {
    void userController.deleteUser(req, res, next);
  }
);

export default router;
