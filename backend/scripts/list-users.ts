import 'tsconfig-paths/register';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '@/database/models/User.model';

dotenv.config();

async function listUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri!);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find().select('fullName email role isActive isEmailVerified').exec();
    
    console.log(`Found ${users.length} users:\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Email Verified: ${user.isEmailVerified}`);
      console.log('');
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

listUsers();
