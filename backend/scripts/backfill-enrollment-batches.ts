import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { autoLinkBatchEnrollment } from '../src/common/utils/auto-enroll.util';
import '../src/database/models'; // Register all models

dotenv.config({ path: path.join(__dirname, '../.env') });

const logger = {
  info: (msg: string, ...args: any[]) => console.log(`[INFO] ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args),
  success: (msg: string, ...args: any[]) => console.log(`[SUCCESS] ${msg}`, ...args),
};

/**
 * Standalone, idempotent migration script to link existing student enrollments to operational batches.
 * Does NOT delete any existing batches or enrollments.
 * Does NOT fall back to arbitrary bootcamps if an event is missing.
 */
async function runBackfill() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    logger.error('MONGODB_URI not found in environment variables.');
    process.exit(1);
  }

  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    logger.success('Connected to MongoDB');

    const User = mongoose.model('User');
    const Bootcamp = mongoose.model('Bootcamp');
    const EventEnrollment = mongoose.model('EventEnrollment');

    // 1. Backfill EventEnrollments
    const eventEnrollments = await EventEnrollment.find({}).exec();
    logger.info(`Scanning ${eventEnrollments.length} event enrollments...`);

    let eventLinkedCount = 0;
    let eventSkippedCount = 0;

    for (const ee of eventEnrollments) {
      try {
        let eventId = ee.eventId;
        let eventTitle = ee.title;

        let bootcampExists = false;
        if (eventId) {
          const exists = await Bootcamp.findById(eventId).exec();
          if (exists) {
            bootcampExists = true;
          }
        }

        // If eventId is missing or points to a non-existent bootcamp, try to match by title
        if (!eventId || !bootcampExists) {
          if (eventTitle) {
            const cleanTitle = eventTitle.split(/[—\-\–]/)[0].trim();
            const matchingBootcamp = await Bootcamp.findOne({
              title: { $regex: new RegExp(`^${cleanTitle}`, 'i') },
            }).exec();

            if (matchingBootcamp) {
              eventId = matchingBootcamp._id;
              ee.eventId = matchingBootcamp._id;
              await ee.save();
              logger.info(`Matched eventId for enrollment ${ee._id} with title: "${matchingBootcamp.title}"`);
            }
          }
        }

        if (!eventId) {
          logger.warn(`Skipping event enrollment ${ee._id} (${ee.email}): No valid Bootcamp found.`);
          eventSkippedCount++;
          continue;
        }

        // Resolve userId from email if missing
        let studentUserId = ee.userId;
        if (!studentUserId && ee.email) {
          const userObj = await User.findOne({ email: ee.email.toLowerCase().trim() }).exec();
          if (userObj) {
            studentUserId = userObj._id;
            ee.userId = userObj._id;
            await ee.save();
          }
        }

        if (studentUserId) {
          await autoLinkBatchEnrollment(studentUserId, ee.email, eventId, 'Bootcamp', 0);
          eventLinkedCount++;
        } else {
          logger.warn(`Skipping event enrollment ${ee._id}: User record not found for email ${ee.email}`);
          eventSkippedCount++;
        }
      } catch (err: any) {
        logger.error(`Error processing event enrollment ${ee._id}:`, err.message);
      }
    }

    logger.success(`Event enrollments processed: ${eventLinkedCount} linked, ${eventSkippedCount} skipped.`);

    await mongoose.disconnect();
    logger.success('Disconnected from MongoDB. Backfill complete.');
  } catch (error) {
    logger.error('Backfill script error:', error);
    process.exit(1);
  }
}

runBackfill();
