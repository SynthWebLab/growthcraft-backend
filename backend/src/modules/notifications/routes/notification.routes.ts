import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '@/common/middleware/authenticate.middleware';
import { notificationController } from '../controllers/notification.controller';

const router = Router();

// Protect all notification routes
router.use(authenticate);

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  void notificationController.getNotifications(req, res, next);
});

router.get('/unread-count', (req: Request, res: Response, next: NextFunction) => {
  void notificationController.getUnreadCount(req, res, next);
});

router.patch('/:id/read', (req: Request, res: Response, next: NextFunction) => {
  void notificationController.markAsRead(req, res, next);
});

router.patch('/read-all', (req: Request, res: Response, next: NextFunction) => {
  void notificationController.markAllAsRead(req, res, next);
});

export default router;
