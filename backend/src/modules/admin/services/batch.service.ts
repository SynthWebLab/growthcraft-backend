import mongoose from 'mongoose';
import {
  Batch,
  BatchMode,
  BatchStatus,
  BatchType,
  Bootcamp,
  Course,
  TrainingProgram,
} from '@/database/models';
import { NotFoundError } from '@/common/errors/NotFoundError';
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

interface BatchParent extends mongoose.Document {
  slug?: string;
  title?: string;
}

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
}

export const batchService = BatchService.getInstance();
