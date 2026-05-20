import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  error: (msg: string, error?: any) => console.error(`[ERROR] ${msg}`, error || ''),
  success: (msg: string) => console.log(`[SUCCESS] ${msg}`),
};

// Define Course schema inline
const courseSchema = new mongoose.Schema({
  title: String,
  slug: String,
  description: String,
  shortDescription: String,
  category: String,
  difficultyLevel: String,
  level: String,
  duration: Number,
  totalHours: Number,
  lessonsCount: Number,
  price: Number,
  originalPrice: Number,
  rating: Number,
  instructor: {
    name: String,
    avatar: String,
  },
  instructorId: String,
  tags: [String],
  enrollmentCount: Number,
  isActive: Boolean,
  isDraft: Boolean,
  isPublished: Boolean,
  publishedAt: Date,
  type: String,
  bootcampDetails: {
    totalSeats: Number,
    availableSeats: Number,
    startDate: Date,
    endDate: Date,
    registrationDeadline: Date,
  },
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);

async function fixCourseEnrollment() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    logger.info('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    logger.success('Connected to MongoDB');

    // Find active regular courses that should be enrollable but are still draft/unpublished.
    const courses = await Course.find({
      isActive: true,
      type: { $ne: 'Bootcamp' },
      $or: [
        { isDraft: true },
        { isPublished: { $exists: false } },
        { isPublished: null },
        { isPublished: false },
        { publishedAt: { $gt: new Date() } },
      ],
    });

    logger.info(`Found ${courses.length} courses to update`);

    if (courses.length === 0) {
      logger.info('No courses need updating');
      await mongoose.disconnect();
      return;
    }

    // Update each course
    let updated = 0;
    for (const course of courses) {
      try {
        // Publish active regular courses so they can be enrolled in.
        await Course.updateOne(
          { _id: course._id },
          { 
            $set: { 
              isDraft: false,
              isPublished: true,
              publishedAt:
                (course as any).publishedAt && (course as any).publishedAt <= new Date()
                  ? (course as any).publishedAt
                  : new Date(),
              // Also ensure these fields exist for GC-S401-T1
              level: (course as any).level || (course as any).difficultyLevel || 'Beginner',
              totalHours: (course as any).totalHours || (course as any).duration || 0,
              shortDescription: (course as any).shortDescription || (course as any).description?.substring(0, 200) || '',
              instructorId: (course as any).instructorId || (course as any).instructor?.name || 'Unknown'
            }
          }
        );
        updated++;
        logger.info(`Updated course: ${(course as any).title}`);
      } catch (err) {
        logger.error(`Failed to update course ${(course as any)._id}:`, err);
      }
    }

    logger.success(`Successfully updated ${updated} courses`);
    logger.info('Courses are now available for enrollment!');

    await mongoose.disconnect();
    logger.success('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Fix course enrollment error:', error);
    process.exit(1);
  }
}

// Run the fix
fixCourseEnrollment();
