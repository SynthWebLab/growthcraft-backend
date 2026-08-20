import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { TrainingProgram } from '../src/database/models/TrainingProgram.model';
import { TrainingProgramDetails } from '../src/database/models/TrainingProgramDetails.model';
import { TrainingProgramEnrollment } from '../src/database/models/TrainingProgramEnrollment.model';
import { TrainingProgramCallbackRequest } from '../src/database/models/TrainingProgramCallbackRequest.model';
import { Batch } from '../src/database/models/Batch.model';
import { Enrollment } from '../src/database/models/Enrollment.model';

dotenv.config({ path: path.join(__dirname, '../.env') });

const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] ${msg}`),
  error: (msg: string, err?: any) => console.error(`[ERROR] ${msg}`, err || ''),
};

async function clearTrainingProgramData() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/growthcraft';
    logger.info(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB successfully');

    // Count before deletion
    const tpCount = await TrainingProgram.countDocuments();
    const tpdCount = await TrainingProgramDetails.countDocuments();
    const tpeCount = await TrainingProgramEnrollment.countDocuments();
    const tpcbCount = await TrainingProgramCallbackRequest.countDocuments();

    logger.info(`Found before deletion:`);
    logger.info(`  - Training Programs: ${tpCount}`);
    logger.info(`  - Training Program Details: ${tpdCount}`);
    logger.info(`  - Training Program Enrollments: ${tpeCount}`);
    logger.info(`  - Training Program Callback Requests: ${tpcbCount}`);

    // Find any batches associated with training programs
    const trainingProgramBatches = await Batch.find({
      $or: [
        { type: 'Internship' },
        { trainingProgramId: { $exists: true, $ne: null } }
      ]
    });
    logger.info(`  - Associated Batches: ${trainingProgramBatches.length}`);

    // Perform deletions
    const delTP = await TrainingProgram.deleteMany({});
    const delTPD = await TrainingProgramDetails.deleteMany({});
    const delTPE = await TrainingProgramEnrollment.deleteMany({});
    const delTPCB = await TrainingProgramCallbackRequest.deleteMany({});
    
    let delBatchesCount = 0;
    if (trainingProgramBatches.length > 0) {
      const batchIds = trainingProgramBatches.map(b => b._id);
      const delBatches = await Batch.deleteMany({ _id: { $in: batchIds } });
      delBatchesCount = delBatches.deletedCount || 0;
      await Enrollment.deleteMany({ batchId: { $in: batchIds } });
    }

    logger.info('\n=== Deletion Summary ===');
    logger.info(`✓ Deleted Training Programs: ${delTP.deletedCount}`);
    logger.info(`✓ Deleted Training Program Details: ${delTPD.deletedCount}`);
    logger.info(`✓ Deleted Training Program Enrollments: ${delTPE.deletedCount}`);
    logger.info(`✓ Deleted Training Program Callback Requests: ${delTPCB.deletedCount}`);
    logger.info(`✓ Deleted Training Program Batches: ${delBatchesCount}`);
    logger.info('=========================\n');

    await mongoose.disconnect();
    logger.info('Database connection closed.');
  } catch (error) {
    logger.error('Error while deleting Training Program data:', error);
    process.exit(1);
  }
}

clearTrainingProgramData();
