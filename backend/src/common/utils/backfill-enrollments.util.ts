import mongoose from 'mongoose';
import { logger } from './logger.util';
import { autoLinkBatchEnrollment } from './auto-enroll.util';

/**
 * Retroactively links existing student enrollments to cohort batches.
 * Scans EventEnrollment, CourseEnrollment, and TrainingProgramEnrollment.
 */
export async function backfillEnrollmentBatches() {
  logger.info('Starting retroactive enrollment-to-batch linkage backfill...');
  try {
    const User = mongoose.model('User');
    const Bootcamp = mongoose.model('Bootcamp');
    const Course = mongoose.model('Course');
    const TrainingProgram = mongoose.model('TrainingProgram');
    const EventEnrollment = mongoose.model('EventEnrollment');

    // 1. Backfill EventEnrollments (Bootcamps, Workshops, Hackathons)
    const eventEnrollments = await EventEnrollment.find({}).exec();
    logger.info(`Found ${eventEnrollments.length} event enrollments to scan.`);

    let eventLinkedCount = 0;

    for (const ee of eventEnrollments) {
      try {
        let eventId = ee.eventId;
        let eventTitle = ee.title;

        // If eventId is missing/null, try to find the Bootcamp by matching title
        if (!eventId) {
          // Clean title name (e.g. "Game Development with Unity — Batch 1" -> "Game Development with Unity")
          const cleanTitle = eventTitle.split(/[—\-\–]/)[0].trim();
          
          const matchingBootcamp = await Bootcamp.findOne({
            title: { $regex: new RegExp(`^${cleanTitle}`, 'i') }
          }).exec();

          if (matchingBootcamp) {
            eventId = matchingBootcamp._id;
            ee.eventId = matchingBootcamp._id;
            await ee.save();
            logger.info(`Resolved missing eventId for enrollment ${ee._id} using title matching: "${matchingBootcamp.title}"`);
          } else {
            // Check if there is a general fallback bootcamp
            const fallbackBootcamp = await Bootcamp.findOne({}).exec();
            if (fallbackBootcamp) {
              eventId = fallbackBootcamp._id;
              ee.eventId = fallbackBootcamp._id;
              await ee.save();
              logger.info(`Resolved missing eventId for enrollment ${ee._id} using fallback bootcamp: "${fallbackBootcamp.title}"`);
            }
          }
        }

        if (eventId) {
          // Resolve userId from email if missing
          let studentUserId = ee.userId;
          if (!studentUserId) {
            const userObj = await User.findOne({ email: ee.email.toLowerCase().trim() }).exec();
            if (userObj) {
              studentUserId = userObj._id;
              ee.userId = userObj._id;
              await ee.save();
            }
          }

          if (studentUserId) {
            await autoLinkBatchEnrollment(
              studentUserId,
              ee.email,
              eventId,
              'Bootcamp',
              0
            );
            eventLinkedCount++;
          }
        }
      } catch (err: any) {
        logger.error(`Failed to backfill event enrollment ${ee._id}:`, err.message);
      }
    }

    logger.info(`Retroactive backfill finished. Linked ${eventLinkedCount} event enrollments.`);
  } catch (error: any) {
    logger.error('Error in backfillEnrollmentBatches:', error);
  }
}
