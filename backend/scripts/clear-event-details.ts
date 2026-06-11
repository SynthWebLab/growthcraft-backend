import mongoose from 'mongoose';
import { EventDetails } from '../src/database/models/EventDetails.model';
import { config } from '../src/config';
import { logger } from '../src/common/utils/logger.util';

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

const clearEventDetails = async () => {
  try {
    const result = await EventDetails.deleteMany({});
    logger.info(`✓ Deleted ${result.deletedCount} event details`);
  } catch (error) {
    logger.error('Clear failed:', error);
    throw error;
  }
};

const run = async () => {
  try {
    await connectDB();
    await clearEventDetails();
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Script failed:', error);
    process.exit(1);
  }
};

run();
