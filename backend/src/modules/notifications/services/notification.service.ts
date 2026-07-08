import { Notification } from '@/database/models';
import { socketService } from './socket.service';
import mongoose from 'mongoose';

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Create notification, save in DB and push via Socket.io
   */
  public async createNotification(
    userId: string | mongoose.Types.ObjectId,
    type: string,
    data?: any
  ) {
    const notification = await Notification.create({
      userId: typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId,
      type,
      data: data || {},
    });

    // Emit live to the user room
    socketService.emitToUser(userId.toString(), 'notification', notification);
    return notification;
  }

  /**
   * List notifications for a user (paginated)
   */
  public async getNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Notification.countDocuments({ userId }).exec(),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Fetch unread notification count
   */
  public async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ userId, readAt: null }).exec();
  }

  /**
   * Mark single notification as read
   */
  public async markAsRead(userId: string, notificationId: string) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { readAt: new Date() },
      { new: true }
    ).exec();
    return notification;
  }

  /**
   * Mark all user notifications as read
   */
  public async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { userId, readAt: null },
      { readAt: new Date() }
    ).exec();
  }
}

export const notificationService = NotificationService.getInstance();
