import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authenticate } from '@/common/middleware/authenticate.middleware';
import { authorize } from '@/common/middleware/authorize.middleware';
import { UserRole } from '@/common/constants/user.constants';
import { authorizeChatParticipant } from '../middleware/chat-auth.middleware';

const router = Router();

// Protect all chat routes with authentication & role-based access control
router.use(authenticate);
router.use(authorize([UserRole.STUDENT, UserRole.MENTOR, UserRole.SUPER_ADMIN]));

/**
 * @swagger
 * /chats/messages/{receiverId}:
 *   get:
 *     summary: Get chat history with an authorized participant
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: receiverId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 *       400:
 *         description: Invalid receiver ID format or self-chat attempt
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not an authorized participant
 *       404:
 *         description: Receiver not found
 */
router.get('/messages/:receiverId', authorizeChatParticipant, (req, res, next) => {
  void chatController.getChatHistory(req, res, next);
});

/**
 * @swagger
 * /chats/messages:
 *   post:
 *     summary: Send message to an authorized participant
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [receiverId, message]
 *             properties:
 *               receiverId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Validation error or invalid receiver ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not an authorized participant
 *       404:
 *         description: Receiver not found
 */
router.post('/messages', authorizeChatParticipant, (req, res, next) => {
  void chatController.sendMessage(req, res, next);
});

export default router;
