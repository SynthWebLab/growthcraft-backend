import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function createSuperAdmin() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Check if super_admin exists
    const existingSuperAdmin = await mongoose.connection.db.collection('users').findOne({ 
      role: 'super_admin' 
    });

    if (existingSuperAdmin) {
      console.log('✅ Super Admin already exists:');
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log(`   Name: ${existingSuperAdmin.fullName}`);
      console.log('\n💡 Login Credentials:');
      console.log('   Email: superadmin@growthcraft.com');
      console.log('   Password: SuperAdmin@123');
      return;
    }

    // Import bcrypt for password hashing
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('SuperAdmin@123', 12);

    // Create super_admin user
    const result = await mongoose.connection.db.collection('users').insertOne({
      fullName: 'Super Administrator',
      email: 'superadmin@growthcraft.com',
      phone: '+911234567890',
      password: hashedPassword,
      role: 'super_admin',
      isEmailVerified: true,
      isActive: true,
      refreshTokens: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Super Admin created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('   Email: superadmin@growthcraft.com');
    console.log('   Password: SuperAdmin@123');
    console.log('   Role: super_admin');
    console.log('\n🔐 Use these credentials in your tests');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.log('\n💡 Super admin might already exist with this email');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

createSuperAdmin();
