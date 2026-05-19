import { CourseEnrollment, ICourseEnrollment } from '@/database/models/CourseEnrollment.model';
import {
  CourseCallbackRequest,
  ICourseCallbackRequest,
} from '@/database/models/CourseCallbackRequest.model';
import { Course } from '@/database/models/Course.model';
import { logger } from '@/common/utils/logger.util';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { ConflictError } from '@/common/errors/ConflictError';
import { ValidationError } from '@/common/errors/ValidationError';
import mongoose from 'mongoose';

export interface EnrollmentData {
  userId: string;
  courseId: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface CallbackRequestData {
  userId: string;
  courseId: string;
  fullName: string;
  email: string;
  phone: string;
}

export class EnrollmentService {
  private static instance: EnrollmentService;

  private constructor() {}

  public static getInstance(): EnrollmentService {
    if (!EnrollmentService.instance) {
      EnrollmentService.instance = new EnrollmentService();
    }
    return EnrollmentService.instance;
  }

  /**
   * Enroll user in a course
   */
  public async enrollInCourse(data: EnrollmentData): Promise<ICourseEnrollment> {
    try {
      // Check if course exists
      const course = await Course.findById(data.courseId);
      if (!course) {
        throw NotFoundError.course();
      }

      // Check if course is active
      if (!course.isActive) {
        throw new ValidationError('This course is not available for enrollment');
      }

      // Check if user can enroll (based on course status and availability)
      if (!course.canEnroll()) {
        throw new ValidationError('This course is not available for enrollment at this time');
      }

      // For bootcamps, check seat availability
      if (course.type === 'Bootcamp' && course.bootcampDetails) {
        if (course.bootcampDetails.availableSeats <= 0) {
          throw new ValidationError('No seats available for this bootcamp');
        }

        // Check if registration deadline has passed
        if (
          course.bootcampDetails.registrationDeadline &&
          new Date() > new Date(course.bootcampDetails.registrationDeadline)
        ) {
          throw new ValidationError('Registration deadline has passed for this bootcamp');
        }
      }

      // Check if user is already enrolled
      const existingEnrollment = await CourseEnrollment.findOne({
        userId: data.userId,
        courseId: data.courseId,
      });

      if (existingEnrollment) {
        throw new ConflictError('You are already enrolled in this course');
      }

      // Create enrollment
      const enrollment = await CourseEnrollment.create({
        userId: data.userId,
        courseId: data.courseId,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        title: course.title, // Save course title
        enrollmentDate: new Date(),
        status: 'pending',
        paymentStatus: 'pending',
      });

      // Update course enrollment count
      await Course.findByIdAndUpdate(data.courseId, {
        $inc: { enrollmentCount: 1 },
      });

      // For bootcamps, decrease available seats
      if (course.type === 'Bootcamp' && course.bootcampDetails) {
        await Course.findByIdAndUpdate(data.courseId, {
          $inc: { 'bootcampDetails.availableSeats': -1 },
        });
      }

      logger.info(`User ${data.userId} enrolled in course ${data.courseId}`);

      return enrollment;
    } catch (error: any) {
      logger.error('Enroll in course error:', error);
      throw error;
    }
  }

  /**
   * Request callback for a course
   */
  public async requestCallback(data: CallbackRequestData): Promise<ICourseCallbackRequest> {
    try {
      // Check if course exists
      const course = await Course.findById(data.courseId);
      if (!course) {
        throw NotFoundError.course();
      }

      // Check if there's already a pending callback request
      const existingRequest = await CourseCallbackRequest.findOne({
        userId: data.userId,
        courseId: data.courseId,
        status: 'pending',
      });

      if (existingRequest) {
        throw new ConflictError(
          'You already have a pending callback request for this course. We will get back to you soon.'
        );
      }

      // Create callback request
      const callbackRequest = await CourseCallbackRequest.create({
        userId: data.userId,
        courseId: data.courseId,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        requestDate: new Date(),
        status: 'pending',
      });

      logger.info(`Callback request created for user ${data.userId} and course ${data.courseId}`);

      return callbackRequest;
    } catch (error: any) {
      logger.error('Request callback error:', error);
      throw error;
    }
  }

  /**
   * Get user's enrollments
   */
  public async getUserEnrollments(userId: string): Promise<ICourseEnrollment[]> {
    try {
      const enrollments = await CourseEnrollment.find({ userId })
        .populate('courseId')
        .sort({ createdAt: -1 })
        .exec();

      return enrollments;
    } catch (error: any) {
      logger.error('Get user enrollments error:', error);
      throw error;
    }
  }

  /**
   * Get user's callback requests
   */
  public async getUserCallbackRequests(userId: string): Promise<ICourseCallbackRequest[]> {
    try {
      const requests = await CourseCallbackRequest.find({ userId })
        .populate('courseId')
        .sort({ createdAt: -1 })
        .exec();

      return requests;
    } catch (error: any) {
      logger.error('Get user callback requests error:', error);
      throw error;
    }
  }

  /**
   * Check if user is enrolled in a course
   */
  public async isUserEnrolled(userId: string, courseId: string): Promise<boolean> {
    try {
      const enrollment = await CourseEnrollment.findOne({
        userId,
        courseId,
        status: { $in: ['pending', 'confirmed'] },
      });

      return !!enrollment;
    } catch (error: any) {
      logger.error('Check user enrollment error:', error);
      throw error;
    }
  }

  /**
   * Get enrollment by ID
   */
  public async getEnrollmentById(enrollmentId: string): Promise<ICourseEnrollment | null> {
    try {
      const enrollment = await CourseEnrollment.findById(enrollmentId).populate('courseId').exec();

      return enrollment;
    } catch (error: any) {
      logger.error('Get enrollment by ID error:', error);
      throw error;
    }
  }
}

export const enrollmentService = EnrollmentService.getInstance();
