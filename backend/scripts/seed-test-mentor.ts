import 'tsconfig-paths/register';
import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '@/database/models/User.model';
import { MentorProfile } from '@/database/models/MentorProfile.model';
import { UserRole } from '@/common/constants/user.constants';

dotenv.config();

// Mirror database.config.ts: on Windows the system resolver can fall back to
// 127.0.0.1 (nothing on :53), breaking mongodb+srv:// SRV lookups. Use public DNS.
const dnsServers = dns.getServers();
if (dnsServers.length === 0 || dnsServers.every((s) => s === '127.0.0.1' || s === '::1')) {
  const fallback = ['8.8.8.8', '1.1.1.1'];
  dns.setServers(fallback);
  dns.promises.setServers(fallback);
}

const MENTOR = {
  fullName: 'Test Mentor',
  email: 'mentor@growthcraft.com',
  phone: '+1234500001',
  password: 'Mentor@123456',
};

const seedTestMentor = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI is not defined in environment variables');

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // 1) Mentor user (create if missing)
    let user = await User.findOne({ email: MENTOR.email });
    if (!user) {
      user = await User.create({
        fullName: MENTOR.fullName,
        email: MENTOR.email,
        phone: MENTOR.phone,
        password: MENTOR.password,
        role: UserRole.MENTOR,
        isEmailVerified: true,
        isActive: true,
      });
      console.log('✅ Created mentor user:', MENTOR.email);
    } else {
      user.password = MENTOR.password;
      await user.save();
      console.log('ℹ️  Mentor user password updated:', MENTOR.email);
    }

    // 2) Mentor profile (upsert) with availability so booking slots appear
    const profile = await MentorProfile.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          experienceYears: 8,
          areaOfExpertise: 'Web Development',
          currentOrganization: 'GrowthCraft Labs',
          bio: 'Senior full-stack engineer mentoring students on React, Node, and system design.',
          rating: 4.8,
          isVerified: true,
          availability: [
            {
              day: 'Monday',
              slots: [
                { startTime: '10:00 AM', endTime: '10:45 AM' },
                { startTime: '2:00 PM', endTime: '2:45 PM' },
              ],
            },
            {
              day: 'Wednesday',
              slots: [{ startTime: '4:00 PM', endTime: '4:45 PM' }],
            },
          ],
        },
        $setOnInsert: { userId: user._id },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log('\n✅ Test mentor ready!');
    console.log('   Mentor user id :', user._id.toString());
    console.log('   Profile id     :', profile._id.toString());
    console.log('   Expertise      :', profile.areaOfExpertise);
    console.log('   Slots          : 10:00 AM, 2:00 PM, 4:00 PM');
    console.log('\n   The mentor now appears in GET /students/mentors and is bookable.');
  } catch (error: any) {
    console.error('❌ Error seeding test mentor:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

seedTestMentor();
