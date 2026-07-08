import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { ValidationError } from '@/common/errors/ValidationError';
import mongoose from 'mongoose';

export class NotificationController {
  private static instance: NotificationController;

  private constructor() {}

  public static getInstance(): NotificationController {
    if (!NotificationController.instance) {
      NotificationController.instance = new NotificationController();
    }
    return NotificationController.instance;
  }

  /**
   * GET /api/v1/notifications
   */
  public async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

      const data = await notificationService.getNotifications(userId, page, limit);
      SuccessResponseHelper.paginated(
        res,
        data.notifications,
        data.pagination,
        'Notifications list retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/notifications/unread-count
   */
  public async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const count = await notificationService.getUnreadCount(userId);
      SuccessResponseHelper.ok(res, { count }, 'Unread count retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   */
  public async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid notification ID format');
      }

      const notification = await notificationService.markAsRead(userId, id);
      if (!notification) {
        throw new ValidationError('Notification not found or not owned by user');
      }

      SuccessResponseHelper.ok(res, { notification }, 'Notification marked as read successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/notifications/read-all
   */
  public async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      await notificationService.markAllAsRead(userId);
      SuccessResponseHelper.ok(res, null, 'All notifications marked as read successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = NotificationController.getInstance();
