import 'tsconfig-paths/register';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '@/database/models/User.model';

dotenv.config();

async function fixAdminRole() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri!);
    console.log('✅ Connected to MongoDB\n');

    // Find all users with old 'admin' role
    const adminUsers = await User.find({ role: 'admin' }).exec();
    
    if (adminUsers.length === 0) {
      console.log('✅ No users with deprecated "admin" role found.');
      return;
    }

    console.log(`Found ${adminUsers.length} user(s) with deprecated "admin" role:\n`);
    
    for (const user of adminUsers) {
      console.log(`📧 ${user.email} (${user.fullName || 'No name'})`);
      console.log(`   Current role: ${user.role}`);
      
      // Update to super_admin role
      user.role = 'super_admin';
      await user.save();
      
      console.log(`   ✅ Updated to: super_admin\n`);
    }

    console.log('🎉 All admin users updated to super_admin role!');
    console.log('\nThey can now access batch management endpoints.');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixAdminRole();
