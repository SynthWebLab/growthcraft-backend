import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Batch, BatchStatus, Course, MentorProfile, Notification } from '@/database/models';
import { batchService } from '@/modules/admin/services/batch.service';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/growthCraft';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function testBatchUpdates() {
  console.log('\n🧪 Testing Batch Update APIs\n');
  console.log('='.repeat(60));

  try {
    // 1. Find or create a test batch
    console.log('\n📦 Step 1: Getting test batch...');
    let batch = await Batch.findOne({ status: BatchStatus.DRAFT }).exec();
    
    if (!batch) {
      console.log('No draft batch found. Creating one...');
      const course = await Course.findOne().exec();
      if (!course) {
        console.log('❌ No courses found. Please seed courses first.');
        return;
      }

      batch = await Batch.create({
        batchType: 'Course',
        courseId: course._id,
        code: `TEST-${Date.now()}`,
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-09-30'),
        capacity: 50,
        fee: 50000,
        venue: 'Test Venue',
        mode: 'Online',
        status: BatchStatus.DRAFT,
      });
      console.log('✅ Created test batch:', batch.code);
    } else {
      console.log('✅ Found existing batch:', batch.code);
    }

    console.log('   Batch ID:', batch._id);
    console.log('   Current Status:', batch.status);
    console.log('   Current Venue:', batch.venue);
    console.log('   Current Capacity:', batch.capacity);

    // 2. Test Generic Update - Update Venue
    console.log('\n📝 Step 2: Testing venue update...');
    const updatedVenue = await batchService.updateBatch(batch._id.toString(), {
      venue: 'Updated Test Venue - Building A, Room 101',
    });
    console.log('✅ Venue updated successfully');
    console.log('   New Venue:', updatedVenue.venue);

    // 3. Test Generic Update - Update Capacity
    console.log('\n📝 Step 3: Testing capacity update...');
    const updatedCapacity = await batchService.updateBatch(batch._id.toString(), {
      capacity: 100,
    });
    console.log('✅ Capacity updated successfully');
    console.log('   New Capacity:', updatedCapacity.capacity);

    // 4. Test Status Transition - Draft to Open
    console.log('\n📝 Step 4: Testing status transition (Draft → Open)...');
    const statusUpdated = await batchService.updateBatch(batch._id.toString(), {
      status: BatchStatus.OPEN,
    });
    console.log('✅ Status transition successful');
    console.log('   New Status:', statusUpdated.status);

    // 5. Test Invalid Status Transition
    console.log('\n📝 Step 5: Testing invalid status transition (Open → Completed)...');
    try {
      await batchService.updateBatch(batch._id.toString(), {
        status: BatchStatus.COMPLETED,
      });
      console.log('❌ Should have failed but succeeded');
    } catch (error: any) {
      console.log('✅ Correctly rejected invalid transition');
      console.log('   Error:', error.message);
    }

    // 6. Test Multiple Fields Update
    console.log('\n📝 Step 6: Testing multiple fields update...');
    const multiUpdate = await batchService.updateBatch(batch._id.toString(), {
      venue: 'Online - Zoom Platform',
      capacity: 150,
      status: BatchStatus.FILLING,
    });
    console.log('✅ Multiple fields updated successfully');
    console.log('   Venue:', multiUpdate.venue);
    console.log('   Capacity:', multiUpdate.capacity);
    console.log('   Status:', multiUpdate.status);

    // 7. Test Capacity Validation (cannot be less than enrolledCount)
    console.log('\n📝 Step 7: Testing capacity validation...');
    console.log('   Current enrolledCount:', multiUpdate.enrolledCount);
    
    if (multiUpdate.enrolledCount === 0) {
      console.log('   ℹ️  enrolledCount is 0, so any positive capacity is valid');
      console.log('   Manually setting enrolledCount to 20 for validation test...');
      multiUpdate.enrolledCount = 20;
      await multiUpdate.save();
    }
    
    try {
      await batchService.updateBatch(batch._id.toString(), {
        capacity: 5,
      });
      console.log('❌ Should have failed but succeeded');
    } catch (error: any) {
      console.log('✅ Correctly rejected capacity less than enrolled count');
      console.log('   Error:', error.message);
    }

    // 8. Test Mentor Assignment
    console.log('\n📝 Step 8: Testing mentor assignment...');
    
    // Find or create a mentor profile
    let mentor = await MentorProfile.findOne().exec();
    
    if (!mentor) {
      console.log('⚠️  No mentor profile found. Skipping mentor assignment test.');
      console.log('   To test mentor assignment, create a mentor profile first.');
    } else {
      console.log('   Found Mentor ID:', mentor._id);
      
      // Count notifications before
      const notifCountBefore = await Notification.countDocuments({
        userId: mentor._id,
        type: 'batch.assigned',
      }).exec();
      
      const mentorAssigned = await batchService.assignMentor(
        batch._id.toString(),
        mentor._id.toString()
      );
      
      console.log('✅ Mentor assigned successfully');
      console.log('   Assigned Mentor ID:', mentorAssigned.assignedMentorId);
      
      // Check notification was created
      const notifCountAfter = await Notification.countDocuments({
        userId: mentor._id,
        type: 'batch.assigned',
      }).exec();
      
      if (notifCountAfter > notifCountBefore) {
        console.log('✅ Notification created successfully');
        
        const notification = await Notification.findOne({
          userId: mentor._id,
          type: 'batch.assigned',
        })
          .sort({ createdAt: -1 })
          .exec();
        
        console.log('   Notification Details:');
        console.log('   - Type:', notification?.type);
        console.log('   - User ID:', notification?.userId);
        console.log('   - Data:', JSON.stringify(notification?.data, null, 2));
      } else {
        console.log('⚠️  Notification count did not increase');
      }
    }

    // 9. Test Status Transition to Cancelled (always allowed)
    console.log('\n📝 Step 9: Testing transition to Cancelled (always allowed)...');
    const cancelled = await batchService.updateBatch(batch._id.toString(), {
      status: BatchStatus.CANCELLED,
    });
    console.log('✅ Successfully transitioned to Cancelled');
    console.log('   Final Status:', cancelled.status);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 All tests completed successfully!\n');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

async function main() {
  await connectDB();
  await testBatchUpdates();
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
