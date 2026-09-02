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

    const meetLink = 'https://meet.google.com/abc-defg-hij';
    const scheduleMsg = `[MEET_SCHEDULED] Date: 2026-08-15 | Time: 04:00 PM | Link: ${meetLink} | Topic: Advanced React & State Management`;

    console.log('Sending schedule message from mentor to student...');
    const sentMsg = await chatService.sendMessage(
      mentorUser._id.toString(),
      studentUser._id.toString(),
      scheduleMsg
    );

    console.log('Verifying sent message...');
    if (sentMsg.message.includes(meetLink)) {
      console.log('🎉 SUCCESS: Chat message sent with Google Meet link!');
    } else {
      console.error('❌ FAILURE: Chat message mismatch:', sentMsg);
    }

    console.log('Checking if MentorSession was automatically created in database...');
    const sessions = await MentorSession.find({
      studentUserId: studentUser._id,
      mentorUserId: mentorUser._id
    });

    console.log(`Found ${sessions.length} sessions in DB.`);
    if (sessions.length === 1) {
      const s = sessions[0];
      if (
        s.topic === 'Advanced React & State Management' &&
        s.meetingLink === meetLink &&
        s.timeSlot === '04:00 PM' &&
        s.status === 'scheduled'
      ) {
        console.log('🎉 SUCCESS: MentorSession record auto-created perfectly in database!');
      } else {
        console.error('❌ FAILURE: MentorSession properties mismatch:', s);
      }
    } else {
      console.error('❌ FAILURE: MentorSession was not created.');
    }

    console.log('Cleaning up test data...');
    await User.deleteMany({ email: /test-student|test-mentor/ });
    await ChatMessage.deleteMany({});
    await MentorSession.deleteMany({});
    console.log('Done.');

  } catch (error) {
    console.error('Error during test execution:', error);
  } finally {
    await mongoose.connection.close();
  }
}

runTest();
