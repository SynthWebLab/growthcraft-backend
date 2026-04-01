import { Router, Request, Response, NextFunction } from 'express';
import { authController } from '../controllers/auth.controller';
import { AuthValidator } from '../validators/auth.validator';
import { authenticate } from '@/common/middleware/authenticate.middleware';

const router = Router();

// Public routes
router.post(
  '/register',
  AuthValidator.register(),
  (req: Request, res: Response, next: NextFunction) => {
    void authController.register(req, res, next);
  }
);
router.post('/login', AuthValidator.login(), (req: Request, res: Response, next: NextFunction) => {
  void authController.login(req, res, next);
});
router.post('/refresh-token', (req: Request, res: Response, next: NextFunction) => {
  void authController.refreshToken(req, res, next);
});

// Protected routes
router.get('/profile', authenticate, (req: Request, res: Response, next: NextFunction) => {
  void authController.getProfile(req, res, next);
});
router.post('/logout', authenticate, (req: Request, res: Response, next: NextFunction) => {
  void authController.logout(req, res, next);
});
router.post('/logout-all', authenticate, (req: Request, res: Response, next: NextFunction) => {
  void authController.logoutAll(req, res, next);
});

export default router;
