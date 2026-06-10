import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Enrollment, Attendance, ProgressNote, Batch, User } from '../src/database/models';
import { logger } from '../src/common/utils/logger.util';

dotenv.config();

/**
 * Seed test data for attendance and progress notes
 * This helps test the metrics job
 */
async function seedTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    logger.info('Connected to MongoDB');

    // Find an active enrollment to work with
    const enrollment = await Enrollment.findOne({ status: 'Confirmed' });
    
    if (!enrollment) {
      logger.warn('No active enrollments found. Please create enrollments first.');
      return;
    }

    logger.info(`Found enrollment: ${enrollment._id}`);
    logger.info(`Student: ${enrollment.studentUserId}, Batch: ${enrollment.batchId}`);

    // Find a user to act as mentor
    const mentor = await User.findOne({ role: 'Admin' });
    if (!mentor) {
      logger.error('No mentor/admin user found');
      return;
    }

    // Create 10 attendance records (8 present, 2 absent)
    const attendanceRecords = [];
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (10 - i)); // Past 10 days

      attendanceRecords.push({
        studentUserId: enrollment.studentUserId,
        batchId: enrollment.batchId,
        attendanceDate: date,
        status: i < 8 ? 'Present' : 'Absent', // 8 present, 2 absent = 80%
        markedBy: mentor._id,
      });
    }

    // Clear existing attendance for this student
    await Attendance.deleteMany({
      studentUserId: enrollment.studentUserId,
      batchId: enrollment.batchId,
    });

    await Attendance.insertMany(attendanceRecords);
    logger.info(`Created ${attendanceRecords.length} attendance records (8 present, 2 absent)`);

    // Create 5 progress notes with scores
    const progressNotes = [
      { score: 85, feedback: 'Good progress on JavaScript fundamentals' },
      { score: 90, feedback: 'Excellent understanding of React concepts' },
      { score: 78, feedback: 'Need to improve on async programming' },
      { score: 92, feedback: 'Outstanding work on the final project' },
      { score: 88, feedback: 'Solid grasp of API integration' },
    ];

    // Clear existing progress notes
    await ProgressNote.deleteMany({
      studentUserId: enrollment.studentUserId,
      batchId: enrollment.batchId,
    });

    for (const note of progressNotes) {
      const date = new Date();
      date.setDate(date.getDate() - progressNotes.indexOf(note) * 3); // Spread over time

      await ProgressNote.create({
        studentUserId: enrollment.studentUserId,
        batchId: enrollment.batchId,
        mentorId: mentor._id,
        noteDate: date,
        rubricScore: note.score,
        feedback: note.feedback,
        strengths: 'Quick learner, good problem solving',
        areasForImprovement: 'Time management, code documentation',
      });
    }

    const avgScore = progressNotes.reduce((sum, n) => sum + n.score, 0) / progressNotes.length;
    logger.info(`Created ${progressNotes.length} progress notes (average: ${avgScore})`);

    logger.info('\n✓ Test data seeded successfully!');
    logger.info('Expected metrics after job runs:');
    logger.info('  - Attendance: 80% (8 out of 10 classes)');
    logger.info(`  - Average Score: ${avgScore.toFixed(2)}`);
    logger.info('\nRun: npm run trigger-metrics to compute these values');

  } catch (error) {
    logger.error('Error seeding test data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedTestData();
