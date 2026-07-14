import mongoose from 'mongoose';
import { logger } from './logger.util';

/**
 * Automatically links a student's enrollment in a course/program/bootcamp to an operational Batch.
 * If no batch exists, one is auto-created.
 */
export async function autoLinkBatchEnrollment(
  userId: mongoose.Types.ObjectId | string | undefined,
  email: string,
  parentId: mongoose.Types.ObjectId | string,
  parentType: 'Course' | 'TrainingProgram' | 'Bootcamp',
  feeQuotedValue: number = 0
) {
  try {
    let studentUserId = userId;
    if (!studentUserId) {
      const User = mongoose.model('User');
      const userObj = await User.findOne({ email: email.toLowerCase().trim() }).exec();
      if (userObj) {
        studentUserId = userObj._id;
      }
    }

    if (!studentUserId) {
      logger.info(`Guest user enrollment for ${email} - cannot auto-link to batch yet`);
      return;
    }

    const Batch = mongoose.model('Batch');
    const Enrollment = mongoose.model('Enrollment');

    const parentIdObj = new mongoose.Types.ObjectId(parentId.toString());
    const studentUserIdObj = new mongoose.Types.ObjectId(studentUserId.toString());

    // Build parent filter field
    const parentField = parentType === 'Course'
      ? { courseId: parentIdObj }
      : parentType === 'TrainingProgram'
      ? { trainingProgramId: parentIdObj }
      : { bootcampId: parentIdObj };

    // Try to find an open or active batch first
    let batch = await Batch.findOne({
      ...parentField,
      status: { $in: ['Open', 'Filling', 'InProgress'] }
    }).exec();

    // Look for any batch if none active
    if (!batch) {
      batch = await Batch.findOne(parentField).exec();
    }

    // Auto-create a default batch if none exists
    if (!batch) {
      const parentModelName = parentType === 'Course'
        ? 'Course'
        : parentType === 'TrainingProgram'
        ? 'TrainingProgram'
        : 'Bootcamp';
      
      const ParentModel = mongoose.model(parentModelName);
      const parent = await ParentModel.findById(parentIdObj).exec();
      const parentTitle = parent?.get('title') || parentModelName;
      
      const codePrefix = parentTitle
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .slice(0, 4)
        .toUpperCase();
      
      const batchCode = `${codePrefix}-AUTO-${new Date().getFullYear()}`;
      
      // Ensure batch code is unique
      const existingBatch = await Batch.findOne({ code: batchCode }).exec();
      const finalCode = existingBatch ? `${batchCode}-${Date.now().toString().slice(-4)}` : batchCode;

      batch = await Batch.create({
        batchType: parentType,
        ...parentField,
        code: finalCode,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days duration default
        capacity: 100,
        fee: mongoose.Types.Decimal128.fromString(feeQuotedValue.toString()),
        mode: 'Offline',
        status: 'Open',
        enrolledCount: 0,
      });
      logger.info(`Auto-created batch ${batch.code} for ${parentModelName} ${parentIdObj}`);
    }

    // Check if the operational Enrollment record already exists
    const existingOpEnrollment = await Enrollment.findOne({
      studentUserId: studentUserIdObj,
      batchId: batch._id,
    }).exec();

    if (!existingOpEnrollment) {
      await Enrollment.create({
        studentUserId: studentUserIdObj,
        batchId: batch._id,
        status: 'Confirmed',
        feeQuoted: mongoose.Types.Decimal128.fromString(feeQuotedValue.toString()),
        feeCollected: mongoose.Types.Decimal128.fromString(feeQuotedValue.toString()),
        attendancePercent: 0,
        avgRubricScore: 0,
        enrolledAt: new Date(),
      });

      // Increment batch enrolledCount atomically
      await Batch.findByIdAndUpdate(batch._id, { $inc: { enrolledCount: 1 } }).exec();
      logger.info(`Successfully linked student ${studentUserIdObj} to batch ${batch.code}`);
    }
  } catch (error) {
    logger.error('Error in autoLinkBatchEnrollment:', error);
  }
}
