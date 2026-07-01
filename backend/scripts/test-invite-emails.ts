import 'tsconfig-paths/register';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { StudentProfile, Course, User } from '@/database/models';
import { studentDashboardService } from '@/modules/students/services/student-dashboard.service';

dotenv.config();

async function runTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    // 1. Find a student profile who is an ambassador
    let profile = await StudentProfile.findOne({ isAmbassador: true }).exec();
    if (!profile) {
      console.log('⚠️ No active ambassador found. Finding any student to activate...');
      profile = await StudentProfile.findOne().exec();
      if (!profile) {
        throw new Error('No student profile found in database. Seed students first.');
      }
      profile.isAmbassador = true;
      await profile.save();
      console.log(`Activated student ${profile.userId} as ambassador.`);
    }

    // 2. Ensure the user associated has a name
    const userObj = await User.findById(profile.userId).exec();
    if (userObj) {
      if (!userObj.fullName) {
        userObj.fullName = 'Test Ambassador';
        await userObj.save();
      }
      console.log(`Using ambassador: "${userObj.fullName}" (ID: ${profile.userId})`);
    }

    // 3. Find a course to recommend
    const course = await Course.findOne().exec();
    if (!course) {
      throw new Error('No course found in database. Seed courses first.');
    }
    console.log(`Using recommended course: "${course.title}" (ID: ${course._id})`);

    // 4. Trigger invite
    const recipientEmail = `new_student_invite_${Date.now()}@example.com`;
    await mongoose.model('Referral').deleteMany({ referredEmail: recipientEmail });
    console.log(`🧹 Cleared existing referrals for ${recipientEmail} for fresh test.`);
    console.log(`\n📨 Triggering inviteFriends for recipient: ${recipientEmail}...`);
    
    const result = await studentDashboardService.inviteFriends(
      profile.userId.toString(),
      {
        emails: [recipientEmail],
        programType: 'Course',
        programId: course._id.toString(),
      }
    );

    console.log('\n✅ Invitation created successfully! Response result:');
    console.log('\n⌛ Waiting 3 seconds for BullMQ worker to pick up and process the queue...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 5. Test existing user guard
    console.log(`\n🧪 Testing existing user guard with email: sandipangoswami28@gmail.com...`);
    try {
      await studentDashboardService.inviteFriends(
        profile.userId.toString(),
        {
          emails: ['sandipangoswami28@gmail.com'],
          programType: 'Course',
          programId: course._id.toString(),
        }
      );
      console.error('❌ Existing user guard FAILED: Invitation went through for an existing user!');
    } catch (err: any) {
      console.log('✅ Existing user guard PASSED! Error message:', err.message);
    }

  } catch (error: any) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

runTest();
