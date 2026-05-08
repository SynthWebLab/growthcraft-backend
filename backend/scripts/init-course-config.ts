import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import CourseConfig model directly
import { CourseConfig } from '../src/database/models/CourseConfig.model';

// Simple logger for script
const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  error: (msg: string, error?: any) => console.error(`[ERROR] ${msg}`, error || ''),
};

async function initializeCourseConfig() {
  try {
    // Get MongoDB URI from environment
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/growthcraft';
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Initialize default configurations
    // ADMIN: Modify these values as needed, then run: npm run init:config
    const defaults = [
      { 
        key: 'categories', 
        values: ['MERN', 'UI/UX', 'DataScience', 'DevOps', 'Other'], 
        isActive: true 
      },
      { 
        key: 'difficultyLevels', 
        values: ['Beginner', 'Intermediate', 'Advanced'], 
        isActive: true 
      },
      { 
        key: 'courseTypes', 
        values: ['Course', 'Bootcamp'], 
        isActive: true 
      },
    ];

    for (const config of defaults) {
      const exists = await CourseConfig.findOne({ key: config.key }).exec();
      if (!exists) {
        await CourseConfig.create(config);
        logger.info(`Initialized default config for: ${config.key}`);
      } else {
        // Update existing config with new values
        await CourseConfig.findOneAndUpdate(
          { key: config.key },
          { values: config.values, isActive: config.isActive },
          { new: true }
        ).exec();
        logger.info(`Updated config for: ${config.key}`);
      }
    }

    logger.info('Course configurations initialized successfully');

    // Display current configurations
    const allConfigs = await CourseConfig.find({ isActive: true }).exec();
    
    console.log('\n=== Course Configurations ===');
    
    for (const config of allConfigs) {
      console.log(`\n${config.key}:`);
      config.values.forEach((val: string) => console.log(`  - ${val}`));
    }
    
    console.log('\n=============================\n');

    process.exit(0);
  } catch (error) {
    logger.error('Error initializing course config:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeCourseConfig();
