import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authenticate } from '@/common/middleware/authenticate.middleware';

const router = Router();

// Protect all chat routes
router.use(authenticate);

router.get('/messages/:receiverId', (req, res, next) => {
  void chatController.getChatHistory(req, res, next);
});

router.post('/messages', (req, res, next) => {
  void chatController.sendMessage(req, res, next);
});

export default router;
