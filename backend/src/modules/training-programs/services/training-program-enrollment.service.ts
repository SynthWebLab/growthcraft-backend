import {
  TrainingProgram,
  TrainingProgramEnrollment,
  TrainingProgramCallbackRequest,
  ITrainingProgramEnrollment,
  ITrainingProgramCallbackRequest,
} from '@/database/models';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { ConflictError } from '@/common/errors/ConflictError';
import { logger } from '@/common/utils/logger.util';

interface EnrollmentData {
  userId?: string;
  programId: string;
  fullName: string;
  email: string;
  phone: string;
}

export class TrainingProgramEnrollmentService {
  private static instance: TrainingProgramEnrollmentService;

  private constructor() {}

  public static getInstance(): TrainingProgramEnrollmentService {
    if (!TrainingProgramEnrollmentService.instance) {
      TrainingProgramEnrollmentService.instance = new TrainingProgramEnrollmentService();
    }
    return TrainingProgramEnrollmentService.instance;
  }

  /**
   * Enroll in a training program
   */
  public async enrollInProgram(data: EnrollmentData): Promise<ITrainingProgramEnrollment> {
    try {
      const { userId, programId, fullName, email, phone } = data;

      // Check if training program exists
      const program = await TrainingProgram.findOne({
        _id: programId,
        isPublished: true,
        deletedAt: null,
      });

      if (!program) {
        throw new NotFoundError('Training program not found');
      }

      // Check if user is already enrolled
      const existingEnrollment = await TrainingProgramEnrollment.findOne({
        $or: [
          { userId, programId },
          { email, programId },
        ],
      });

      if (existingEnrollment) {
        // Allow retry if payment was never completed
        if (
          existingEnrollment.paymentStatus === 'pending' ||
          existingEnrollment.status === 'pending'
        ) {
          return existingEnrollment;
        }
        throw new ConflictError('You are already enrolled in this training program');
      }


      // Create enrollment
      const enrollment = await TrainingProgramEnrollment.create({
        userId,
        programId,
        fullName,
        email,
        phone,
        title: program.title,
        status: 'pending',
        paymentStatus: 'pending',
      });

      // Increment enrollment count
      await TrainingProgram.findByIdAndUpdate(programId, {
        $inc: { enrollmentCount: 1, enrolledCount: 1 },
      });

      return enrollment;
    } catch (error: any) {
      logger.error('Enroll in training program service error:', error);
      throw error;
    }
  }

  /**
   * Request callback for a training program
   */
  public async requestCallback(data: EnrollmentData): Promise<ITrainingProgramCallbackRequest> {
    try {
      const { userId, programId, fullName, email, phone } = data;

      // Check if training program exists
      const program = await TrainingProgram.findOne({
        _id: programId,
        isPublished: true,
        deletedAt: null,
      });

      if (!program) {
        throw new NotFoundError('Training program not found');
      }

      // Check if user already has a pending callback request
      const existingRequest = await TrainingProgramCallbackRequest.findOne({
        $or: [
          { userId, programId, status: 'pending' },
          { email, programId, status: 'pending' },
        ],
      });

      if (existingRequest) {
        throw new ConflictError('You already have a pending callback request for this program');
      }

      // Create callback request
      const callbackRequest = await TrainingProgramCallbackRequest.create({
        userId,
        programId,
        fullName,
        email,
        phone,
        title: program.title,
        status: 'pending',
      });

      return callbackRequest;
    } catch (error: any) {
      logger.error('Request callback for training program service error:', error);
      throw error;
    }
  }

  /**
   * Get user's training program enrollments
   */
  public async getUserEnrollments(userId: string): Promise<ITrainingProgramEnrollment[]> {
    try {
      const enrollments = await TrainingProgramEnrollment.find({ userId })
        .populate('programId', 'title slug thumbnail price domain level durationDays')
        .sort({ createdAt: -1 })
        .lean();

      return enrollments as unknown as ITrainingProgramEnrollment[];
    } catch (error: any) {
      logger.error('Get user training program enrollments service error:', error);
      throw error;
    }
  }

  /**
   * Get user's callback requests
   */
  public async getUserCallbackRequests(
    userId: string
  ): Promise<ITrainingProgramCallbackRequest[]> {
    try {
      const requests = await TrainingProgramCallbackRequest.find({ userId })
        .populate('programId', 'title slug thumbnail price domain level durationDays')
        .sort({ createdAt: -1 })
        .lean();

      return requests as unknown as ITrainingProgramCallbackRequest[];
    } catch (error: any) {
      logger.error('Get user training program callback requests service error:', error);
      throw error;
    }
  }

  /**
   * Check if user is enrolled or has pending callback request
   */
  public async getEnrollmentStatus(
    userId: string,
    programId: string
  ): Promise<{ isEnrolled: boolean; hasCallbackRequest: boolean }> {
    try {
      const [enrollment, callbackRequest] = await Promise.all([
        TrainingProgramEnrollment.findOne({ userId, programId, status: 'confirmed' }),
        TrainingProgramCallbackRequest.findOne({ userId, programId, status: 'pending' }),
      ]);

      return {
        isEnrolled: !!enrollment,
        hasCallbackRequest: !!callbackRequest,
      };
    } catch (error: any) {
      logger.error('Check training program enrollment status service error:', error);
      throw error;
    }
  }
}

export const trainingProgramEnrollmentService = TrainingProgramEnrollmentService.getInstance();
