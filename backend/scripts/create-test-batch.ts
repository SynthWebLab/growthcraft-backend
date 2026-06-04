import 'tsconfig-paths/register';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Batch, Course, BatchStatus } from '@/database/models';

dotenv.config();

async function createTestBatch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    // Find a course
    const course = await Course.findOne().exec();
    if (!course) {
      console.log('❌ No courses found. Please create a course first.');
      return;
    }

    console.log(`📚 Found course: ${course.title}`);

    // Create batch with FUTURE date and Open status
    const today = new Date();
    const futureStartDate = new Date(today);
    futureStartDate.setDate(today.getDate() + 30); // 30 days from now
    
    const futureEndDate = new Date(futureStartDate);
    futureEndDate.setDate(futureStartDate.getDate() + 60); // 60 days after start
    
    const batch = await Batch.create({
      batchType: 'Course',
      courseId: course._id,
      code: `TEST-OPEN-${Date.now()}`,
      startDate: futureStartDate,  // Future date!
      endDate: futureEndDate,
      capacity: 50,
      fee: 50000,
      venue: 'Online - Zoom Platform',
      mode: 'Online',
      status: BatchStatus.OPEN,  // Open status!
    });

    console.log('\n✅ Created test batch:');
    console.log(`   Code: ${batch.code}`);
    console.log(`   Status: ${batch.status}`);
    console.log(`   Start Date: ${batch.startDate.toISOString().split('T')[0]}`);
    console.log(`   Batch ID: ${batch._id}`);
    console.log('\n🌐 This batch is now visible on:');
    console.log(`   GET /api/v1/batches (public)`);
    console.log(`   GET /api/v1/admin/batches (admin)`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

createTestBatch();
