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
    const { chatService } = await import('@/modules/chats/services/chat.service');
    const { socketService } = await import('@/modules/notifications/services/socket.service');

    console.log('Cleaning up old test users & messages...');
    await User.deleteMany({ email: /test-student|test-mentor/ });
    await ChatMessage.deleteMany({});

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

    // Spy on socketService.emitToUser
    const emittedEvents: Array<{ userId: string; event: string; data: any }> = [];
    socketService.emitToUser = (userId: string, eventName: string, data: any) => {
      console.log(`[SPY] Socket emitToUser: userId=${userId}, event=${eventName}`);
      emittedEvents.push({ userId, event: eventName, data });
    };

    console.log('Sending message from student to mentor...');
    const sentMsg = await chatService.sendMessage(
      studentUser._id.toString(),
      mentorUser._id.toString(),
      'Hello mentor, I need help with database indexing.'
    );

    console.log('Verifying sent message fields...');
    if (
      sentMsg.senderId.toString() === studentUser._id.toString() &&
      sentMsg.receiverId.toString() === mentorUser._id.toString() &&
      sentMsg.message === 'Hello mentor, I need help with database indexing.'
    ) {
      console.log('🎉 SUCCESS: Message sent and saved correctly in DB!');
    } else {
      console.error('❌ FAILURE: Message fields mismatch:', sentMsg);
    }

    console.log('Verifying Socket.io real-time emissions...');
    const hasStudentEmit = emittedEvents.some(
      (e) => e.userId === studentUser._id.toString() && e.event === 'chat.message'
    );
    const hasMentorEmit = emittedEvents.some(
      (e) => e.userId === mentorUser._id.toString() && e.event === 'chat.message'
    );

    if (hasStudentEmit && hasMentorEmit) {
      console.log('🎉 SUCCESS: Socket emissions correctly triggered for both student and mentor!');
    } else {
      console.error('❌ FAILURE: Socket emissions missing.', emittedEvents);
    }

    console.log('Fetching chat history between student and mentor...');
    const history = await chatService.getChatHistory(
      studentUser._id.toString(),
      mentorUser._id.toString()
    );

    console.log('Retrieved chat history length:', history.length);
    if (history.length === 1 && history[0].message === 'Hello mentor, I need help with database indexing.') {
      console.log('🎉 SUCCESS: Chat history retrieved correctly!');
    } else {
      console.error('❌ FAILURE: Incorrect chat history returned:', history);
    }

    // Clean up
    console.log('Cleaning up test data...');
    await User.deleteMany({ email: /test-student|test-mentor/ });
    await ChatMessage.deleteMany({});
    console.log('Done.');

  } catch (error) {
    console.error('Error during test execution:', error);
  } finally {
    await mongoose.connection.close();
  }
}

runTest();
