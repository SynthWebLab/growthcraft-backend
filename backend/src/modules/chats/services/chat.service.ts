import { ChatMessage, IChatMessage } from '@/database/models/ChatMessage.model';
import { socketService } from '@/modules/notifications/services/socket.service';
import { logger } from '@/common/utils/logger.util';
import mongoose from 'mongoose';

export class ChatService {
  private static instance: ChatService;

  private constructor() {}

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  public async getChatHistory(userId1: string, userId2: string): Promise<IChatMessage[]> {
    try {
      const u1 = new mongoose.Types.ObjectId(userId1);
      const u2 = new mongoose.Types.ObjectId(userId2);

      // Automatically mark incoming unread messages as read
      const result = await ChatMessage.updateMany(
        { senderId: u2, receiverId: u1, isRead: false },
        { $set: { isRead: true } }
      ).exec();

      if (result.modifiedCount > 0) {
        // Notify the sender that their messages have been read
        socketService.emitToUser(userId2.toString(), 'chat.read', { readerId: userId1 });
      }

      return await ChatMessage.find({
        $or: [
          { senderId: u1, receiverId: u2 },
          { senderId: u2, receiverId: u1 },
        ],
      })
        .sort({ createdAt: 1 })
        .exec();
    } catch (error: any) {
      logger.error('Error fetching chat history:', error);
      throw error;
    }
  }

  public async sendMessage(senderId: string, receiverId: string, messageText: string): Promise<IChatMessage> {
    try {
      const sId = new mongoose.Types.ObjectId(senderId);
      const rId = new mongoose.Types.ObjectId(receiverId);

      // Intercept scheduled meeting messages to auto-create database records
      if (messageText.startsWith('[MEET_SCHEDULED]')) {
        const dateMatch = messageText.match(/Date:\s*([^\s|]+)/);
        const timeMatch = messageText.match(/Time:\s*([^|]+)/);
        const linkMatch = messageText.match(/Link:\s*([^\s|]+)/);
        const topicMatch = messageText.match(/Topic:\s*(.+)$/);

        const dateStr = dateMatch ? dateMatch[1].trim() : new Date().toISOString().split('T')[0];
        const timeStr = timeMatch ? timeMatch[1].trim() : '11:00 AM';
        const linkStr = linkMatch ? linkMatch[1].trim() : '';
        const topicStr = topicMatch ? topicMatch[1].trim() : 'Doubt Session';

        // Fetch emails for student and mentor
        const { User } = await import('@/database/models/User.model');
        const [senderUser, receiverUser] = await Promise.all([
          User.findById(sId).select('email').exec(),
          User.findById(rId).select('email').exec(),
        ]);

        const studentEmail = receiverUser?.email || 'student@growthcraft.com';
        const mentorEmail = senderUser?.email || 'mentor@growthcraft.com';

        // Generate real Google Meet link via API (throws on failure)
        const { googleCalendarService } = await import('@/common/services/google-calendar.service');
        const googleMeetLink = await googleCalendarService.createGoogleMeetLink(
          studentEmail,
          mentorEmail,
          topicStr,
          dateStr,
          timeStr
        );

        // Update messageText to include the real Google Meet link
        if (linkStr) {
          messageText = messageText.replace(linkStr, googleMeetLink);
        } else {
          messageText = messageText.replace('Link: ', `Link: ${googleMeetLink} `);
        }

        // Create session record in database
        try {
          const { MentorSession } = await import('@/database/models/MentorSession.model');
          const { MentorProfile } = await import('@/database/models/MentorProfile.model');

          const session = await MentorSession.create({
            studentUserId: rId,
            mentorUserId: sId,
            topic: topicStr,
            scheduledDate: new Date(dateStr),
            timeSlot: timeStr,
            meetingLink: googleMeetLink,
            status: 'scheduled',
          });

          await MentorProfile.updateOne({ userId: sId }, { $inc: { totalSessions: 1 } });
          logger.info(`Auto-created MentorSession ${session._id} with Google Meet link ${googleMeetLink}`);
        } catch (dbErr: any) {
          // Duplicate key is ok (session already exists for this slot), log but don't fail
          if (dbErr.code === 11000) {
            logger.warn('MentorSession already exists for this time slot, skipping duplicate creation');
          } else {
            logger.error('Failed to auto-create MentorSession:', dbErr);
          }
        }
      }

      const chatMessage = await ChatMessage.create({
        senderId: sId,
        receiverId: rId,
        message: messageText,
      });

      logger.info(`Saved chat message ${chatMessage._id} from ${senderId} to ${receiverId}`);

      // Realtime emission to both parties
      const msgJson = chatMessage.toJSON();
      socketService.emitToUser(receiverId.toString(), 'chat.message', msgJson);
      socketService.emitToUser(senderId.toString(), 'chat.message', msgJson);

      return chatMessage;
    } catch (error: any) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }
}

export const chatService = ChatService.getInstance();
