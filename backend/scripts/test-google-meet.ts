import 'tsconfig-paths/register';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('MONGODB_URI not found in environment');
  process.exit(1);
}

async function runTest() {
  console.log('Connecting to database:', mongoUri);
  await mongoose.connect(mongoUri);

  try {
    const { googleCalendarService } = await import('@/common/services/google-calendar.service');
    const { User } = await import('@/database/models/User.model');
    const { ChatMessage } = await import('@/database/models/ChatMessage.model');
    const { MentorSession } = await import('@/database/models/MentorSession.model');
    const { chatService } = await import('@/modules/chats/services/chat.service');

    console.log('Cleaning up old test users, messages & sessions...');
    await User.deleteMany({ email: /test-student|test-mentor/ });
    await ChatMessage.deleteMany({});
    await MentorSession.deleteMany({});

    console.log('Creating test student...');
    const studentUser = await User.create({
      firstName: 'Test',
      lastName: 'Student',
      fullName: 'Test Student',
      email: 'test-student@growthcraft.com',
      password: 'Password@123',
      phone: '1234567890',
      role: 'student',
      isEmailVerified: true
    });

    console.log('Creating test mentor...');
    const mentorUser = await User.create({
      firstName: 'Test',
      lastName: 'Mentor',
      fullName: 'Test Mentor',
      email: 'test-mentor@growthcraft.com',
      password: 'Password@123',
      phone: '1234567891',
      role: 'mentor',
      isEmailVerified: true
    });

    console.log('Testing googleCalendarService directly...');
    const directLink = await googleCalendarService.createGoogleMeetLink(
      studentUser.email,
      mentorUser.email,
      'Direct Calendar Integration Test',
      '2026-08-16',
      '03:00 PM'
    );
    console.log('Generated Direct Meet Link:', directLink);

    if (directLink.startsWith('https://meet.google.com/')) {
      console.log('🎉 SUCCESS: Direct Google Meet Link format matches!');
    } else {
      console.error('❌ FAILURE: Link format incorrect:', directLink);
    }

    console.log('\nTesting chat scheduling message interception...');
    const scheduleMsg = `[MEET_SCHEDULED] Date: 2026-08-16 | Time: 03:00 PM | Link: https://meet.google.com/gcraft-mentor-session | Topic: Chat Interceptor Test`;

    const chatResponse = await chatService.sendMessage(
      mentorUser._id.toString(),
      studentUser._id.toString(),
      scheduleMsg
    );

    console.log('Intercepted Message in DB:', chatResponse.message);
    
    // Fetch meeting session
    const sessions = await MentorSession.find({
      studentUserId: studentUser._id,
      mentorUserId: mentorUser._id
    });

    console.log(`Found ${sessions.length} sessions in DB.`);
    if (sessions.length === 1) {
      const s = sessions[0];
      console.log('Meeting Link in Session document:', s.meetingLink);
      if (
        chatResponse.message.includes(s.meetingLink!) &&
        s.meetingLink!.startsWith('https://meet.google.com/')
      ) {
        console.log('🎉 SUCCESS: Auto-generated Google Meet URL matches the database session document perfectly!');
      } else {
        console.error('❌ FAILURE: Mismatch between chat message link and DB session link');
      }
    } else {
      console.error('❌ FAILURE: Meeting session document was not created');
    }

    console.log('Cleaning up test data...');
    await User.deleteMany({ email: /test-student|test-mentor/ });
    await ChatMessage.deleteMany({});
    await MentorSession.deleteMany({});
    console.log('Done.');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await mongoose.connection.close();
  }
}

runTest();
