import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Simple logger for seed script
const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  error: (msg: string, error?: any) => console.error(`[ERROR] ${msg}`, error || ''),
};

// User schema for seeding
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  isEmailVerified: Boolean,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

/**
 * Seed OPS user for batch management
 * Creates only OPS role user (SUPER_ADMIN handled in separate branch)
 */

const opsUser = {
  firstName: 'Operations',
  lastName: 'Manager',
  email: 'ops@growthcraft.com',
  password: 'Ops@123456',
  role: 'ops',
};

async function seedOpsUser() {
  try {
    // Connect to database
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/growthcraft';
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Check if OPS user already exists
    const existingUser = await User.findOne({ email: opsUser.email });

    if (existingUser) {
      logger.info(`✓ OPS user already exists: ${opsUser.email}`);
      logger.info(`  Role: ${existingUser.role}`);
      logger.info('\nNo changes made.');
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(opsUser.password, 10);

      // Create OPS user
      const user = await User.create({
        firstName: opsUser.firstName,
        lastName: opsUser.lastName,
        email: opsUser.email,
        password: hashedPassword,
        role: opsUser.role,
        isEmailVerified: true, // Auto-verify for admin user
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      logger.info(`✓ Successfully created OPS user: ${opsUser.email}`);
      logger.info(`  User ID: ${user._id}`);
      logger.info(`  Password: ${opsUser.password}`);
    }

    logger.info('\n=== OPS User Seeding Complete ===');
    logger.info('\nUse these credentials to test batch management endpoints:');
    logger.info(`  Email: ${opsUser.email}`);
    logger.info(`  Password: ${opsUser.password}`);
    logger.info('\nLogin endpoint:');
    logger.info(`  POST /api/v1/auth/login`);
    logger.info('\nBatch management endpoints:');
    logger.info(`  POST /api/v1/admin/batches`);
    logger.info(`  GET  /api/v1/admin/batches`);
    logger.info(`  PATCH /api/v1/admin/batches/:id`);

  } catch (error) {
    logger.error('Error seeding OPS user:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('\nDisconnected from MongoDB');
  }
}

// Run the seed script
seedOpsUser()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Seeding failed:', error);
    process.exit(1);
  });
