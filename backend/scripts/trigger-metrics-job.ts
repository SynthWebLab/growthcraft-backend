import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { triggerManualJob } from '../src/jobs';
import { logger } from '../src/common/utils/logger.util';

// Load environment variables
dotenv.config();

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    logger.info('Connected to MongoDB');

    // Trigger the job manually
    logger.info('Triggering enrollment metrics job manually...');
    await triggerManualJob();
    logger.info('Job triggered successfully');

    // Keep script running to see job completion
    logger.info('Waiting for job to complete (this may take a few minutes)...');
    
    // Wait 2 minutes then exit
    setTimeout(async () => {
      logger.info('Disconnecting...');
      await mongoose.disconnect();
      process.exit(0);
    }, 120000);
  } catch (error) {
    logger.error('Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();
