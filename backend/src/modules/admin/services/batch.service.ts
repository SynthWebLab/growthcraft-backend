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

export interface CreateBatchInput {
  batchType: BatchType;
  parentId: string;
  startDate: Date;
  endDate: Date;
  capacity: number;
  fee: number;
  venue?: string;
  mode: BatchMode;
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

  public async createBatch(input: CreateBatchInput) {
    const parent = await this.findParent(input.batchType, input.parentId);
    const code = generateBatchCode(parent, input.startDate);

    return Batch.create({
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
