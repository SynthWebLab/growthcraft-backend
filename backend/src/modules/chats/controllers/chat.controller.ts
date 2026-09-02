import { Request, Response, NextFunction } from 'express';
import { chatService } from '../services/chat.service';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { ValidationError } from '@/common/errors/ValidationError';
import { logger } from '@/common/utils/logger.util';

export class ChatController {
  private static instance: ChatController;

  private constructor() {}

  public static getInstance(): ChatController {
    if (!ChatController.instance) {
      ChatController.instance = new ChatController();
    }
    return ChatController.instance;
  }

  private getUserId(req: Request): string {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ValidationError('User authentication required');
    }
    return userId;
  }

  /**
   * Get chat history between current user and receiverId
   * GET /api/v1/chats/messages/:receiverId
   */
  public async getChatHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const senderId = this.getUserId(req);
      const { receiverId } = req.params;

      if (!receiverId) {
        throw new ValidationError('Receiver ID is required');
      }

      const messages = await chatService.getChatHistory(senderId, receiverId);
      SuccessResponseHelper.ok(res, { messages }, 'Chat history retrieved successfully');
    } catch (error: any) {
      logger.error('Get chat history controller error:', error);
      next(error);
    }
  }

  /**
   * Send message to receiverId
   * POST /api/v1/chats/messages
   */
  public async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const senderId = this.getUserId(req);
      const { receiverId, message } = req.body;

      if (!receiverId) {
        throw new ValidationError('Receiver ID is required');
      }
      if (!message || typeof message !== 'string' || !message.trim()) {
        throw new ValidationError('Message content is required');
      }

      const savedMessage = await chatService.sendMessage(senderId, receiverId, message);
      SuccessResponseHelper.created(res, { message: savedMessage }, 'Message sent successfully');
    } catch (error: any) {
      logger.error('Send message controller error:', error);
      next(error);
    }
  }
}

export const chatController = ChatController.getInstance();
