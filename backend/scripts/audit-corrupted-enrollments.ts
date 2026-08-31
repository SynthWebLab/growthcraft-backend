import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import '../src/database/models';

dotenv.config({ path: path.join(__dirname, '../.env') });

const logger = {
  info: (msg: string, ...args: any[]) => console.log(`[INFO] ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args),
  success: (msg: string, ...args: any[]) => console.log(`[SUCCESS] ${msg}`, ...args),
};

/**
 * Audit script to detect and optionally clean up corrupted EventEnrollment records
 * caused by legacy fallback bootcamp assignment (`Bootcamp.findOne({})`).
 *
 * Usage:
 *   Audit only (dry-run): ts-node scripts/audit-corrupted-enrollments.ts
 *   Audit & reset invalid eventId: ts-node scripts/audit-corrupted-enrollments.ts --fix
 */
async function auditEnrollments() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    logger.error('MONGODB_URI not found in environment variables.');
    process.exit(1);
  }

  const shouldFix = process.argv.includes('--fix');

  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    logger.success('Connected to MongoDB');

    const Bootcamp = mongoose.model('Bootcamp');
    const EventEnrollment = mongoose.model('EventEnrollment');

    const enrollments = await EventEnrollment.find({}).lean().exec();
    logger.info(`Scanning ${enrollments.length} total event enrollments...`);

    const corrupted: Array<{
      enrollmentId: any;
      email: string;
      enrollmentTitle: string;
      assignedBootcampId: any;
      assignedBootcampTitle?: string;
      reason: string;
    }> = [];

    for (const ee of enrollments) {
      if (!ee.eventId) {
        continue;
      }

      const bootcamp = await Bootcamp.findById(ee.eventId).lean().exec() as any;
      if (!bootcamp) {
        corrupted.push({
          enrollmentId: ee._id,
          email: ee.email,
          enrollmentTitle: ee.title || '(none)',
          assignedBootcampId: ee.eventId,
          reason: 'Dangling reference (Bootcamp does not exist)',
        });
        continue;
      }

      // Check title concordance if enrollment has a title
      if (ee.title && bootcamp.title) {
        const cleanEnrollmentTitle = ee.title.split(/[—\-\–]/)[0].trim().toLowerCase();
        const cleanBootcampTitle = bootcamp.title.split(/[—\-\–]/)[0].trim().toLowerCase();

        // Check if neither title contains or starts with the other
        const matches =
          cleanBootcampTitle.startsWith(cleanEnrollmentTitle) ||
          cleanEnrollmentTitle.startsWith(cleanBootcampTitle) ||
          cleanBootcampTitle.includes(cleanEnrollmentTitle) ||
          cleanEnrollmentTitle.includes(cleanBootcampTitle);

        if (!matches) {
          corrupted.push({
            enrollmentId: ee._id,
            email: ee.email,
            enrollmentTitle: ee.title,
            assignedBootcampId: ee.eventId,
            assignedBootcampTitle: bootcamp.title,
            reason: 'Title mismatch (arbitrary fallback assignment detected)',
          });
        }
      }
    }

    logger.info('==========================================');
    logger.info(`AUDIT SUMMARY: Found ${corrupted.length} corrupted/mismatched event enrollments.`);
    logger.info('==========================================');

    if (corrupted.length > 0) {
      console.table(corrupted);

      if (shouldFix) {
        logger.info('Resetting invalid eventId references on corrupted enrollments...');
        for (const item of corrupted) {
          await EventEnrollment.findByIdAndUpdate(item.enrollmentId, {
            $unset: { eventId: 1 },
          }).exec();
        }
        logger.success(`Reset eventId on ${corrupted.length} corrupted enrollments.`);
      } else {
        logger.warn('Dry run mode: No changes written. Run with `--fix` to detach mismatched bootcamps.');
      }
    } else {
      logger.success('No corrupted bootcamp assignments detected!');
    }

    await mongoose.disconnect();
    logger.success('Database disconnected.');
  } catch (error) {
    logger.error('Audit failed:', error);
    process.exit(1);
  }
}

auditEnrollments();
