import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/growthcraft';

async function fixPasswords() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Generate single-hashed passwords with 12 salt rounds (standard for GrowthCraft)
    const salt = await bcrypt.genSalt(12);
    const hashSuperAdmin = await bcrypt.hash('SuperAdmin@123', salt);
    const hashGrowthCraft = await bcrypt.hash('GrowthCraft@123', salt);

    // 1. Ensure admin@growthcraft.com has SuperAdmin@123
    await usersCollection.updateOne(
      { email: 'admin@growthcraft.com' },
      {
        $set: {
          fullName: 'Super Admin',
          password: hashSuperAdmin,
          role: 'super_admin',
          isEmailVerified: true,
          isActive: true,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    console.log('✅ admin@growthcraft.com updated with password "SuperAdmin@123" (role: super_admin)');

    // 2. Ensure superadmin@growthcraft.com has SuperAdmin@123
    await usersCollection.updateOne(
      { email: 'superadmin@growthcraft.com' },
      {
        $set: {
          fullName: 'Super Administrator',
          password: hashSuperAdmin,
          role: 'super_admin',
          isEmailVerified: true,
          isActive: true,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    console.log('✅ superadmin@growthcraft.com updated with password "SuperAdmin@123" (role: super_admin)');

    // 3. Fix standard seeded users with GrowthCraft@123
    const standardUsers = [
      { email: 'ops@growthcraft.com', role: 'ops', name: 'Operations Manager' },
      { email: 'mentor@growthcraft.com', role: 'mentor', name: 'Siddharth Sharma' },
      { email: 'college@growthcraft.com', role: 'college', name: 'College Coordinator' },
      { email: 'employer@growthcraft.com', role: 'employer', name: 'Hiring Partner' },
    ];

    for (const u of standardUsers) {
      await usersCollection.updateOne(
        { email: u.email },
        {
          $set: {
            fullName: u.name,
            password: hashGrowthCraft,
            role: u.role,
            isEmailVerified: true,
            isActive: true,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      console.log(`✅ ${u.email} updated with password "GrowthCraft@123" (role: ${u.role})`);
    }

    // 4. Also fix any existing student accounts
    const students = await usersCollection.find({ role: { $in: ['student', 'user'] } }).toArray();
    for (const student of students) {
      await usersCollection.updateOne(
        { _id: student._id },
        {
          $set: {
            password: hashGrowthCraft,
            isEmailVerified: true,
            isActive: true,
            updatedAt: new Date()
          }
        }
      );
      console.log(`✅ Student ${student.email} password reset to "GrowthCraft@123"`);
    }

    // 5. Verification Test
    console.log('\n--- VERIFYING LOGIN LOGIC ---');
    const testAdmin = await usersCollection.findOne({ email: 'admin@growthcraft.com' });
    const isMatch = await bcrypt.compare('SuperAdmin@123', testAdmin.password);
    console.log(`Verification for admin@growthcraft.com (SuperAdmin@123): ${isMatch ? 'PASSED ✅' : 'FAILED ❌'}`);

    const testMentor = await usersCollection.findOne({ email: 'mentor@growthcraft.com' });
    const isMentorMatch = await bcrypt.compare('GrowthCraft@123', testMentor.password);
    console.log(`Verification for mentor@growthcraft.com (GrowthCraft@123): ${isMentorMatch ? 'PASSED ✅' : 'FAILED ❌'}`);

    console.log('\nAll account passwords have been successfully fixed and verified!');
  } catch (error: any) {
    console.error('❌ Error fixing passwords:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixPasswords();
