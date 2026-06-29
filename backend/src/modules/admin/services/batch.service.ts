import mongoose from 'mongoose';
import {
  Batch,
  BatchMode,
  BatchStatus,
  BatchType,
  Bootcamp,
  Course,
  MentorProfile,
  Notification,
  TrainingProgram,
  IBatch,
  User,
} from '@/database/models';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { ValidationError } from '@/common/errors/ValidationError';
import { generateBatchCode } from '../utils/generate-batch-code.util';
import { logger } from '@/common/utils/logger.util';
import { redisConfig } from '@/config/redis.config';

export interface CreateBatchInput {
  batchType: BatchType;
  parentId: string;
  startDate: Date;
  endDate: Date;
  capacity: number;
  fee: number;
  venue?: string;
  mode: BatchMode;
  code?: string;
}

export interface UpdateBatchInput {
  venue?: string;
  capacity?: number;
  status?: BatchStatus;
}

export interface ListBatchesQuery {
  page?: number;
  limit?: number;
  status?: BatchStatus;
  batchType?: BatchType;
  courseId?: string;
  trainingProgramId?: string;
  bootcampId?: string;
  mentorId?: string;
  parentType?: 'Course' | 'TrainingProgram' | 'Bootcamp';
  startDate?: string;
  endDate?: string;
}

export interface PublicBatchesQuery {
  courseId?: string;
  trainingProgramId?: string;
  bootcampId?: string;
  mentorId?: string;
  parentType?: 'Course' | 'TrainingProgram' | 'Bootcamp';
  page?: number;
  limit?: number;
}

interface BatchParent extends mongoose.Document {
  slug?: string;
  title?: string;
}

const allowedStatusTransitions: Record<BatchStatus, BatchStatus[]> = {
  [BatchStatus.DRAFT]: [BatchStatus.OPEN, BatchStatus.CANCELLED],
  [BatchStatus.OPEN]: [BatchStatus.FILLING, BatchStatus.CANCELLED],
  [BatchStatus.FILLING]: [BatchStatus.FULL, BatchStatus.CANCELLED],
  [BatchStatus.FULL]: [BatchStatus.IN_PROGRESS, BatchStatus.CANCELLED],
  [BatchStatus.IN_PROGRESS]: [BatchStatus.COMPLETED, BatchStatus.CANCELLED],
  [BatchStatus.COMPLETED]: [BatchStatus.CANCELLED],
  [BatchStatus.CANCELLED]: [],
};

export class BatchService {
  private static instance: BatchService;

  private constructor() {}

  public static getInstance(): BatchService {
    if (!BatchService.instance) {
      BatchService.instance = new BatchService();
    }
    return BatchService.instance;
  }

  private async findParent(batchType: BatchType, parentId: string): Promise<BatchParent> {
    const query = { _id: parentId, deletedAt: null };

    switch (batchType) {
      case BatchType.COURSE: {
        const course = await Course.findOne(query).exec();
        if (!course) {
          throw NotFoundError.course();
        }
        return course;
      }

      case BatchType.TRAINING_PROGRAM: {
        const trainingProgram = await TrainingProgram.findOne(query).exec();
        if (!trainingProgram) {
          throw NotFoundError.resource('Training program');
        }
        return trainingProgram;
      }

      case BatchType.BOOTCAMP: {
        const bootcamp = await Bootcamp.findOne(query).exec();
        if (!bootcamp) {
          throw NotFoundError.resource('Bootcamp');
        }
        return bootcamp;
      }
    }
  }

  private getParentReference(batchType: BatchType, parentId: string): Record<string, string> {
    switch (batchType) {
      case BatchType.COURSE:
        return { courseId: parentId };
      case BatchType.TRAINING_PROGRAM:
        return { trainingProgramId: parentId };
      case BatchType.BOOTCAMP:
        return { bootcampId: parentId };
    }
  }

  /**
   * Create a new batch
   */
  public async createBatch(input: CreateBatchInput) {
    const parent = await this.findParent(input.batchType, input.parentId);
    
    // Use provided code or generate one
    let code = input.code;
    if (!code) {
      code = generateBatchCode(parent, input.startDate);
    } else {
      code = code.toUpperCase().trim();
      
      // Check if code already exists
      const existingBatch = await Batch.findOne({ code }).exec();
      if (existingBatch) {
        throw ValidationError.forField('code', `Batch code '${code}' is already in use`);
      }
    }

    const batch = await Batch.create({
      batchType: input.batchType,
      ...this.getParentReference(input.batchType, input.parentId),
      code,
      startDate: input.startDate,
      endDate: input.endDate,
      capacity: input.capacity,
      fee: input.fee,
      venue: input.venue,
      mode: input.mode,
      status: BatchStatus.DRAFT,
    });

    logger.info(`Batch created: ${batch.code} (${batch._id})`);
    return batch;
  }

  /**
   * Get batch by ID
   */
  public async getBatchById(batchId: string) {
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      throw ValidationError.forField('batchId', 'Invalid batch ID format');
    }

    const batch = await Batch.findById(batchId)
      .populate('courseId', 'title slug')
      .populate('trainingProgramId', 'title slug')
      .populate('bootcampId', 'title slug')
      .populate('assignedMentorId', 'firstName lastName email')
      .exec();

    if (!batch) {
      throw NotFoundError.resource('Batch');
    }

    return batch;
  }

  /**
   * List batches with filters (Admin)
   */
  public async listBatches(query: ListBatchesQuery) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.batchType) {
      filter.batchType = query.batchType;
    }

    // Parent-specific filters
    if (query.courseId) {
      if (!mongoose.Types.ObjectId.isValid(query.courseId)) {
        throw ValidationError.forField('courseId', 'Invalid course ID format');
      }
      filter.courseId = query.courseId;
    }

    if (query.trainingProgramId) {
      if (!mongoose.Types.ObjectId.isValid(query.trainingProgramId)) {
        throw ValidationError.forField('trainingProgramId', 'Invalid training program ID format');
      }
      filter.trainingProgramId = query.trainingProgramId;
    }

    if (query.bootcampId) {
      if (!mongoose.Types.ObjectId.isValid(query.bootcampId)) {
        throw ValidationError.forField('bootcampId', 'Invalid bootcamp ID format');
      }
      filter.bootcampId = query.bootcampId;
    }

    // Mentor filter
    if (query.mentorId) {
      if (!mongoose.Types.ObjectId.isValid(query.mentorId)) {
        throw ValidationError.forField('mentorId', 'Invalid mentor ID format');
      }
      filter.assignedMentorId = query.mentorId;
    }

    // Parent type filter (Course, TrainingProgram, Bootcamp)
    if (query.parentType) {
      switch (query.parentType) {
        case 'Course':
          filter.courseId = { $exists: true, $ne: null };
          break;
        case 'TrainingProgram':
          filter.trainingProgramId = { $exists: true, $ne: null };
          break;
        case 'Bootcamp':
          filter.bootcampId = { $exists: true, $ne: null };
          break;
      }
    }

    // Date range filters
    if (query.startDate || query.endDate) {
      filter.startDate = {};
      
      if (query.startDate) {
        const startDate = new Date(query.startDate);
        if (isNaN(startDate.getTime())) {
          throw ValidationError.forField('startDate', 'Invalid start date format');
        }
        filter.startDate.$gte = startDate;
      }

      if (query.endDate) {
        const endDate = new Date(query.endDate);
        if (isNaN(endDate.getTime())) {
          throw ValidationError.forField('endDate', 'Invalid end date format');
        }
        filter.startDate.$lte = endDate;
      }
    }

    const [batches, total] = await Promise.all([
      Batch.find(filter)
        .sort({ startDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('courseId', 'title slug')
        .populate('trainingProgramId', 'title slug')
        .populate('bootcampId', 'title slug')
        .populate('assignedMentorId', 'firstName lastName email')
        .exec(),
      Batch.countDocuments(filter).exec(),
    ]);

    return {
      batches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * List public batches (only Open/Filling with future start dates)
   */
  public async listPublicBatches(query: PublicBatchesQuery) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    // Generate cache key based on query parameters
    const cacheKey = `batches:public:${JSON.stringify({
      page,
      limit,
      courseId: query.courseId,
      trainingProgramId: query.trainingProgramId,
      bootcampId: query.bootcampId,
      mentorId: query.mentorId,
      parentType: query.parentType,
    })}`;

    // Try to get from cache
    try {
      const cached = await redisConfig.get(cacheKey);
      if (cached) {
        logger.info(`Cache hit for public batches: ${cacheKey}`);
        return JSON.parse(cached);
      }
    } catch (error: any) {
      logger.warn('Redis get error (non-critical):', error.message);
    }

    // Build filter
    const filter: any = {
      status: { $in: [BatchStatus.OPEN, BatchStatus.FILLING] },
      startDate: { $gte: new Date() },
    };

    if (query.courseId) {
      if (!mongoose.Types.ObjectId.isValid(query.courseId)) {
        throw ValidationError.forField('courseId', 'Invalid course ID format');
      }
      filter.courseId = query.courseId;
    }

    if (query.trainingProgramId) {
      if (!mongoose.Types.ObjectId.isValid(query.trainingProgramId)) {
        throw ValidationError.forField('trainingProgramId', 'Invalid training program ID format');
      }
      filter.trainingProgramId = query.trainingProgramId;
    }

    if (query.bootcampId) {
      if (!mongoose.Types.ObjectId.isValid(query.bootcampId)) {
        throw ValidationError.forField('bootcampId', 'Invalid bootcamp ID format');
      }
      filter.bootcampId = query.bootcampId;
    }

    // Mentor filter
    if (query.mentorId) {
      if (!mongoose.Types.ObjectId.isValid(query.mentorId)) {
        throw ValidationError.forField('mentorId', 'Invalid mentor ID format');
      }
      filter.assignedMentorId = query.mentorId;
    }

    // Parent type filter
    if (query.parentType) {
      switch (query.parentType) {
        case 'Course':
          filter.courseId = { $exists: true, $ne: null };
          break;
        case 'TrainingProgram':
          filter.trainingProgramId = { $exists: true, $ne: null };
          break;
        case 'Bootcamp':
          filter.bootcampId = { $exists: true, $ne: null };
          break;
      }
    }

    const [batches, total] = await Promise.all([
      Batch.find(filter)
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limit)
        .populate('courseId', 'title slug banner')
        .populate('trainingProgramId', 'title slug banner')
        .populate('bootcampId', 'title slug banner')
        .populate('assignedMentorId', 'firstName lastName email')
        .exec(),
      Batch.countDocuments(filter).exec(),
    ]);

    const result = {
      batches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache the result for 60 seconds
    try {
      await redisConfig.set(cacheKey, JSON.stringify(result), 60);
      logger.info(`Cached public batches with key: ${cacheKey} (TTL: 60s)`);
    } catch (error: any) {
      logger.warn('Redis set error (non-critical):', error.message);
    }

    return result;
  }

  /**
   * Update batch details (Generic PATCH)
   * Allows updating venue, capacity, and status with enforced transitions
   */
  public async updateBatch(id: string, input: UpdateBatchInput) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ValidationError.forField('batchId', 'Invalid batch ID format');
    }

    const batch = await Batch.findById(id).exec();

    if (!batch) {
      throw NotFoundError.resource('Batch');
    }

    // Validate capacity if updating
    if (input.capacity !== undefined && input.capacity < batch.enrolledCount) {
      throw ValidationError.forField(
        'capacity',
        `Capacity cannot be less than enrolled count (${batch.enrolledCount})`,
        input.capacity
      );
    }

    // Validate and enforce status transitions
    if (input.status !== undefined && input.status !== batch.status) {
      const allowedStatuses = allowedStatusTransitions[batch.status];

      if (!allowedStatuses.includes(input.status)) {
        throw ValidationError.forField(
          'status',
          `Invalid status transition from ${batch.status} to ${input.status}`,
          input.status
        );
      }

      batch.status = input.status;
    }

    // Update venue if provided
    if (input.venue !== undefined) {
      batch.venue = input.venue;
    }

    // Update capacity if provided
    if (input.capacity !== undefined) {
      batch.capacity = input.capacity;
    }

    await batch.save();
    logger.info(`Batch updated: ${batch.code} (${batch._id})`);

    return batch;
  }

  /**
   * Assign mentor to batch (Mentor PATCH)
   * Validates mentor exists and creates notification
   */
  public async assignMentor(id: string, mentorId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ValidationError.forField('batchId', 'Invalid batch ID format');
    }

    if (!mongoose.Types.ObjectId.isValid(mentorId)) {
      throw ValidationError.forField('mentorId', 'Invalid mentor ID format');
    }

    const [batch, mentor] = await Promise.all([
      Batch.findById(id).exec(),
      MentorProfile.findById(mentorId).exec(),
    ]);

    if (!batch) {
      throw NotFoundError.resource('Batch');
    }

    if (!mentor) {
      throw NotFoundError.resource('Mentor');
    }

    // Assign mentor to batch
    batch.assignedMentorId = mentor._id as mongoose.Types.ObjectId;
    batch.assignedMentorIds = [mentor._id as mongoose.Types.ObjectId];
    await batch.save();

    // Create notification for mentor
    await Notification.create({
      type: 'batch.assigned',
      userId: mentorId,
      data: {
        batchId: batch._id,
        batchCode: batch.code,
        startDate: batch.startDate,
        endDate: batch.endDate,
        batchType: batch.batchType,
      },
    });

    logger.info(`Mentor ${mentorId} assigned to batch ${batch.code} (${batch._id})`);

    return batch;
  }

  public async assignMentors(id: string, mentorIds: string[]): Promise<IBatch> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ValidationError.forField('batchId', 'Invalid batch ID format');
    }

    const batch = await Batch.findById(id).exec();
    if (!batch) {
      throw NotFoundError.resource('Batch');
    }

    const profiles = [];
    for (const mentorId of mentorIds) {
      if (!mongoose.Types.ObjectId.isValid(mentorId)) {
        throw ValidationError.forField('mentorIds', `Invalid mentor ID format: ${mentorId}`);
      }

      const user = await User.findById(mentorId).exec();
      if (!user || user.role !== 'mentor') {
        throw ValidationError.forField('mentorIds', `User ${mentorId} is not a valid mentor`);
      }

      const mentor = await MentorProfile.findOne({ userId: mentorId }).exec();
      if (!mentor) {
        throw ValidationError.forField('mentorIds', `Mentor profile not found for user ${mentorId}`);
      }
      profiles.push(mentor);
    }

    batch.assignedMentorIds = profiles.map((p) => p._id as mongoose.Types.ObjectId);
    batch.assignedMentorId = profiles[0] ? (profiles[0]._id as mongoose.Types.ObjectId) : undefined;
    await batch.save();

    for (const mentor of profiles) {
      await Notification.create({
        type: 'batch.assigned',
        userId: mentor.userId.toString(),
        data: {
          batchId: batch._id,
          batchCode: batch.code,
          startDate: batch.startDate,
          endDate: batch.endDate,
          batchType: batch.batchType,
        },
      });
    }

    logger.info(`Mentors [${mentorIds.join(', ')}] assigned to batch ${batch.code} (${batch._id})`);
    return batch;
  }
}

export const batchService = BatchService.getInstance();
