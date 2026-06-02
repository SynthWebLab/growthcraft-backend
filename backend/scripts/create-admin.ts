import 'tsconfig-paths/register';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '@/database/models/User.model';
import { UserRole } from '@/common/constants/user.constants';

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: UserRole.ADMIN });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:');
      console.log('   Email:', existingAdmin.email);
      console.log('   Name:', existingAdmin.fullName);
      console.log('\n💡 If you want to create a new admin, delete the existing one first.');
      return;
    }

    // Create admin user
    const adminData = {
      fullName: 'System Administrator',
      email: 'admin@growthcraft.com',
      phone: '+1234567890',
      password: 'Admin@123456', // Change this in production!
      role: UserRole.ADMIN,
      isEmailVerified: true,
      isActive: true,
    };

    const admin = await User.create(adminData);

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('   Email:', adminData.email);
    console.log('   Password:', adminData.password);
    console.log('   Role:', adminData.role);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n🔐 Use these credentials to login at:');
    console.log('   POST http://localhost:5002/api/v1/auth/login');
    console.log('\n📝 Example curl command:');
    console.log(`
curl -X POST http://localhost:5002/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "${adminData.email}",
    "password": "${adminData.password}"
  }'
    `);
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 11000) {
      console.error('   Email already exists in database');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

// Run the script
createAdminUser();
