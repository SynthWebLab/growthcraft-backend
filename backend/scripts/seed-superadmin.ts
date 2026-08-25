import 'tsconfig-paths/register';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../src/database/models/User.model';
import { UserRole } from '../src/common/constants/user.constants';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPERADMIN_DATA = {
  fullName: 'Synthweb Super Admin',
  email: 'info@synthweb.in',
  phone: '+919876543210',
  password: 'Synthweb@26',
  role: UserRole.SUPER_ADMIN,
  isEmailVerified: true,
  isActive: true,
};

async function seedSuperAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/growthcraft';
    await mongoose.connect(mongoUri);
    console.log(' Connected to MongoDB');

    const existingUser = await User.findOne({ email: SUPERADMIN_DATA.email.toLowerCase() }).select('+password');

    if (existingUser) {
      console.log(`ℹ️ User ${SUPERADMIN_DATA.email} already exists. Updating credentials and super_admin role...`);
      
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(SUPERADMIN_DATA.password, salt);

      existingUser.fullName = SUPERADMIN_DATA.fullName;
      existingUser.phone = SUPERADMIN_DATA.phone;
      existingUser.password = hashedPassword;
      existingUser.role = SUPERADMIN_DATA.role;
      existingUser.isEmailVerified = SUPERADMIN_DATA.isEmailVerified;
      existingUser.isActive = SUPERADMIN_DATA.isActive;

      await User.updateOne(
        { _id: existingUser._id },
        {
          $set: {
            fullName: existingUser.fullName,
            phone: existingUser.phone,
            password: hashedPassword,
            role: existingUser.role,
            isEmailVerified: existingUser.isEmailVerified,
            isActive: existingUser.isActive,
            updatedAt: new Date(),
          },
        }
      );

      console.log('✅ Super Admin updated successfully!');
    } else {
      console.log(` Creating new Super Admin: ${SUPERADMIN_DATA.email}...`);
      await User.create(SUPERADMIN_DATA);
      console.log('✅ Super Admin created successfully!');
    }

    console.log('\n========================================');
    console.log('👑 SUPER ADMIN CREDENTIALS');
    console.log('========================================');
    console.log(`📧 Email:    ${SUPERADMIN_DATA.email}`);
    console.log(`🔑 Password: ${SUPERADMIN_DATA.password}`);
    console.log(`🎭 Role:     ${SUPERADMIN_DATA.role}`);
    console.log(` Verified: ${SUPERADMIN_DATA.isEmailVerified}`);
    console.log(` Active:   ${SUPERADMIN_DATA.isActive}`);
    console.log('========================================\n');

  } catch (error: any) {
    console.error('❌ Error seeding Super Admin:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log(' Connected/Disconnected cleanly from MongoDB');
  }
}

seedSuperAdmin()
  .then(() => {
    console.log('✨ Superadmin seed script completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Superadmin seed script failed:', err);
    process.exit(1);
  });
