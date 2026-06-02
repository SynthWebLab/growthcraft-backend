import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '@/common/middleware';
import { UserRole } from '@/common/constants/user.constants';
import { batchController } from '../controllers/batch.controller';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize([UserRole.ADMIN]));

router.post('/batches', (req: Request, res: Response, next: NextFunction) => {
  void batchController.createBatch(req, res, next);
});

router.patch('/batches/:id', (req: Request, res: Response, next: NextFunction) => {
  void batchController.updateBatch(req, res, next);
});

router.patch('/batches/:id/mentor', (req: Request, res: Response, next: NextFunction) => {
  void batchController.assignMentor(req, res, next);
});

export default router;
