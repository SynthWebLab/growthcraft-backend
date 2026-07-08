import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/growthcraft';

async function resetAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const hashedPassword = await bcrypt.hash('SuperAdmin@123', 10);

    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: 'admin@growthcraft.com' },
      {
        $set: {
          fullName: 'System Admin',
          password: hashedPassword,
          role: 'super_admin',
          isEmailVerified: true,
          isActive: true,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    console.log('✅ Super Admin password reset successfully to "SuperAdmin@123"');
    console.log('📧 Email: admin@growthcraft.com');
    console.log('🔑 Password: SuperAdmin@123');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

resetAdmin();
