import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { UserRole } from '@/common/constants/user.constants';
import { User } from '@/database/models/User.model';
import { ChatMessage } from '@/database/models/ChatMessage.model';
import { MentorSession } from '@/database/models/MentorSession.model';
import { MentorProfile } from '@/database/models/MentorProfile.model';
import { Batch } from '@/database/models/Batch.model';
import { Enrollment } from '@/database/models/Enrollment.model';
import { Course } from '@/database/models/Course.model';
import { CourseEnrollment } from '@/database/models/CourseEnrollment.model';
import { ValidationError } from '@/common/errors/ValidationError';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { AuthorizationError } from '@/common/errors/AuthorizationError';
import { logger } from '@/common/utils/logger.util';

/**
 * Middleware to verify that the requesting user is authorized to participate
 * in a chat conversation with receiverId.
 */
export const authorizeChatParticipant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const senderId = req.user?.userId;
    const senderRole = req.user?.role as UserRole;

    if (!senderId || !senderRole) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'NOT_AUTHENTICATED',
        },
      });
      return;
    }

    // Extract receiverId from path param or request body
    const rawReceiverId = req.params.receiverId || req.body?.receiverId;
    const receiverId = typeof rawReceiverId === 'string' ? rawReceiverId.trim() : '';

    if (!receiverId) {
      throw new ValidationError('Receiver ID is required');
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      throw new ValidationError('Invalid receiver ID format');
    }

    if (senderId === receiverId) {
      throw new ValidationError('Cannot start or view a conversation with yourself');
    }

    // Super Admin can access conversations for administrative oversight
    if (senderRole === UserRole.SUPER_ADMIN) {
      return next();
    }

    // Verify receiver exists in database and is active
    const receiver = await User.findById(receiverId).select('_id role isActive').exec();
    if (!receiver) {
      throw new NotFoundError('Receiver user not found');
    }

    if (receiver.isActive === false) {
      throw new AuthorizationError('Receiver user account is deactivated', 'ACCOUNT_DEACTIVATED');
    }

    // Role-based peer validation:
    // Students can only communicate with Mentors (or Admins).
    // Mentors can only communicate with Students (or Admins).
    if (
      senderRole === UserRole.STUDENT &&
      receiver.role !== UserRole.MENTOR &&
      receiver.role !== UserRole.SUPER_ADMIN
    ) {
      throw new AuthorizationError(
        'Students can only communicate with mentors',
        'FORBIDDEN_PEER_ROLE'
      );
    }

    if (
      senderRole === UserRole.MENTOR &&
      receiver.role !== UserRole.STUDENT &&
      receiver.role !== UserRole.SUPER_ADMIN
    ) {
      throw new AuthorizationError(
        'Mentors can only communicate with students',
        'FORBIDDEN_PEER_ROLE'
      );
    }

    const sObjectId = new mongoose.Types.ObjectId(senderId);
    const rObjectId = new mongoose.Types.ObjectId(receiverId);

    // 1. Check if an active conversation history already exists
    const hasExistingMessages = await ChatMessage.exists({
      $or: [
        { senderId: sObjectId, receiverId: rObjectId },
        { senderId: rObjectId, receiverId: sObjectId },
      ],
    });
    if (hasExistingMessages) {
      return next();
    }

    // 2. Check if a mentor session exists between student and mentor
    const hasSession = await MentorSession.exists({
      $or: [
        { studentUserId: sObjectId, mentorUserId: rObjectId },
        { studentUserId: rObjectId, mentorUserId: sObjectId },
      ],
    });
    if (hasSession) {
      return next();
    }

    // 3. Check if student is enrolled in a batch or course assigned to this mentor
    const studentUserId = senderRole === UserRole.STUDENT ? sObjectId : rObjectId;
    const mentorUserId = senderRole === UserRole.MENTOR ? sObjectId : rObjectId;

    const mentorProfile = await MentorProfile.findOne({ userId: mentorUserId }).select('_id');
    if (mentorProfile) {
      // Check batch assignments
      const batches = await Batch.find({
        $or: [{ assignedMentorId: mentorProfile._id }, { assignedMentorIds: mentorProfile._id }],
      }).select('_id');

      if (batches.length > 0) {
        const batchIds = batches.map((b) => b._id);
        const hasBatchEnrollment = await Enrollment.exists({
          studentUserId,
          batchId: { $in: batchIds },
        });
        if (hasBatchEnrollment) {
          return next();
        }
      }

      // Check course assignments
      const courses = await Course.find({
        $or: [
          { 'mentors.userId': mentorUserId },
          { 'mentors.mentorProfileId': mentorProfile._id },
          { instructorId: mentorUserId },
        ],
      }).select('_id');

      if (courses.length > 0) {
        const courseIds = courses.map((c) => c._id);
        const hasCourseEnrollment = await CourseEnrollment.exists({
          $or: [{ userId: studentUserId }, { studentUserId: studentUserId }],
          courseId: { $in: courseIds },
        });
        if (hasCourseEnrollment) {
          return next();
        }
      }
    }

    // If none of the above pass, user is not an authorized conversation participant
    logger.warn(
      `Unauthorized conversation access attempt between user ${senderId} and ${receiverId}`
    );
    throw new AuthorizationError(
      'You are not authorized to participate in or view this conversation. You must have an active session, enrollment, or existing conversation.',
      'CONVERSATION_ACCESS_DENIED'
    );
  } catch (error) {
    next(error);
  }
};
