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
} from '@/database/models';
import { NotFoundError } from '@/common/errors/NotFoundError';
import { ValidationError } from '@/common/errors/ValidationError';
import { generateBatchCode } from '../utils/generate-batch-code.util';
import { logger } from '@/common/utils/logger.util';

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
  status?: BatchStatus;
  startDate?: Date;
  endDate?: Date;
  capacity?: number;
  fee?: number;
  venue?: string;
  mode?: BatchMode;
}

export interface ListBatchesQuery {
  page?: number;
  limit?: number;
  status?: BatchStatus;
  batchType?: BatchType;
  courseId?: string;
  trainingProgramId?: string;
  bootcampId?: string;
}

export interface PublicBatchesQuery {
  courseId?: string;
  trainingProgramId?: string;
  bootcampId?: string;
  page?: number;
  limit?: number;
}

export interface UpdateBatchInput {
  venue?: string;
  capacity?: number;
  status?: BatchStatus;
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

    const [batches, total] = await Promise.all([
      Batch.find(filter)
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limit)
        .populate('courseId', 'title slug banner')
        .populate('trainingProgramId', 'title slug banner')
        .populate('bootcampId', 'title slug banner')
        .select('-assignedMentorId')
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
   * Update batch details
   */
  public async updateBatch(batchId: string, input: UpdateBatchInput) {
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      throw ValidationError.forField('batchId', 'Invalid batch ID format');
    }

    const batch = await Batch.findById(batchId).exec();
    if (!batch) {
      throw NotFoundError.resource('Batch');
    }

    // Validate date consistency if updating dates
    if (input.startDate || input.endDate) {
      const newStartDate = input.startDate || batch.startDate;
      const newEndDate = input.endDate || batch.endDate;

      if (newEndDate < newStartDate) {
        throw ValidationError.forField('endDate', 'End date must be on or after start date');
      }
    }

    // Validate capacity if updating
    if (input.capacity !== undefined && input.capacity < batch.enrolledCount) {
      throw ValidationError.forField(
        'capacity',
        `Capacity cannot be less than current enrolled count (${batch.enrolledCount})`
      );
    }

    Object.assign(batch, input);
    await batch.save();

    logger.info(`Batch updated: ${batch.code} (${batch._id})`);
    return batch;
  }

  /**
   * Assign mentor to batch
   */
  public async assignMentor(batchId: string, mentorId: string) {
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      throw ValidationError.forField('batchId', 'Invalid batch ID format');
    }

    if (!mongoose.Types.ObjectId.isValid(mentorId)) {
      throw ValidationError.forField('mentorId', 'Invalid mentor ID format');
    }

    const batch = await Batch.findById(batchId).exec();
    if (!batch) {
      throw NotFoundError.resource('Batch');
    }

    // TODO: Verify mentor exists and has proper profile
    // const mentor = await MentorProfile.findById(mentorId).exec();
    // if (!mentor) {
    //   throw NotFoundError.resource('Mentor');
    // }

    batch.assignedMentorId = new mongoose.Types.ObjectId(mentorId);
    await batch.save();

    logger.info(`Mentor ${mentorId} assigned to batch ${batch.code}`);

    // TODO: Send notification to mentor (Epic 14)
    // await notificationService.notifyMentorAssignment(mentorId, batch);

    return batch;
  }

  public async updateBatch(id: string, input: UpdateBatchInput) {
    const batch = await Batch.findById(id).exec();

    if (!batch) {
      throw NotFoundError.resource('Batch');
    }

    if (input.capacity !== undefined && input.capacity < batch.enrolledCount) {
      throw ValidationError.forField(
        'capacity',
        'Capacity cannot be less than enrolled count',
        input.capacity
      );
    }

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

    if (input.venue !== undefined) {
      batch.venue = input.venue;
    }

    if (input.capacity !== undefined) {
      batch.capacity = input.capacity;
    }

    return batch.save();
  }

  public async assignMentor(id: string, mentorId: string) {
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

    batch.assignedMentorId = mentor._id as mongoose.Types.ObjectId;
    await batch.save();

    await Notification.create({
      type: 'batch.assigned',
      userId: mentorId,
      data: {
        batchId: batch._id,
        batchCode: batch.code,
      },
    });

    return batch;
  }
}

export const batchService = BatchService.getInstance();
