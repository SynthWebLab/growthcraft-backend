/**
 * Create indexes for Training Programs collection
 * This enables text search functionality
 */

import mongoose from 'mongoose';
import { TrainingProgram } from '../src/database/models/TrainingProgram.model';
import { config } from '../src/config';
import { logger } from '../src/common/utils/logger.util';

const createIndexes = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Database connected successfully');

    logger.info('Creating indexes for TrainingProgram collection...');

    // Drop existing text indexes (MongoDB only allows one text index per collection)
    try {
      const indexes = await TrainingProgram.collection.indexes();
      for (const index of indexes) {
        if (index.name && index.name.includes('text')) {
          await TrainingProgram.collection.dropIndex(index.name);
          logger.info(`Dropped existing text index: ${index.name}`);
        }
      }
    } catch (err) {
      logger.warn('Could not drop indexes:', err);
    }

    // Create text index for search
    await TrainingProgram.collection.createIndex(
      { title: 'text', description: 'text' },
      { weights: { title: 10, description: 5 }, name: 'training_program_search' }
    );
    logger.info('✓ Created text index for title and description');

    // Create other indexes
    await TrainingProgram.collection.createIndex({ isPublished: 1, status: 1 });
    logger.info('✓ Created compound index on isPublished and status');

    await TrainingProgram.collection.createIndex({ domain: 1, level: 1, status: 1 });
    logger.info('✓ Created compound index on domain, level, and status');

    await TrainingProgram.collection.createIndex({ rating: -1, enrollmentCount: -1 });
    logger.info('✓ Created compound index on rating and enrollmentCount');

    // List all indexes
    const indexes = await TrainingProgram.collection.indexes();
    logger.info('\nAll indexes on TrainingProgram collection:');
    indexes.forEach((index: any) => {
      logger.info(`  - ${JSON.stringify(index.key)}`);
    });

    logger.info('\n✅ All indexes created successfully!');
    
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to create indexes:', error);
    process.exit(1);
  }
};

createIndexes();
