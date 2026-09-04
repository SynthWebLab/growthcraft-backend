import mongoose from 'mongoose';
import { Enrollment, EnrollmentStatus } from '@/database/models/Enrollment.model';
import { Referral } from '@/database/models/Referral.model';
import { StudentProfile } from '@/database/models/StudentProfile.model';
import { User } from '@/database/models/User.model';
import { Batch } from '@/database/models/Batch.model';

describe('Referral Commission Calculation & Enrollment Hook Tests', () => {
  const ambassadorEmail = 'ambassador.test@growthcraft.com';
  const studentEmail = 'referred.student@growthcraft.com';
  let ambassadorUserId: mongoose.Types.ObjectId;
  let studentUserId: mongoose.Types.ObjectId;
  let batchId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 1) {
      // Clean up previous test entries
      await User.deleteMany({ email: { $in: [ambassadorEmail, studentEmail] } });

      const ambassador = await User.create({
        fullName: 'Ambassador User',
        email: ambassadorEmail,
        password: 'Password123!',
        role: 'student',
        isEmailVerified: true,
      });
      ambassadorUserId = ambassador._id as mongoose.Types.ObjectId;

      await StudentProfile.create({
        userId: ambassadorUserId,
        isAmbassador: true,
        referralCode: 'AMB123',
        totalReferrals: 1,
        totalConversions: 0,
        referralEarnings: 0,
        pendingReferralPayout: 0,
      });

      const referredStudent = await User.create({
        fullName: 'Referred Student User',
        email: studentEmail,
        password: 'Password123!',
        role: 'student',
        isEmailVerified: true,
      });
      studentUserId = referredStudent._id as mongoose.Types.ObjectId;

      const batch = await Batch.create({
        batchName: 'Referral Test Batch',
        batchCode: 'REF-BATCH-001',
        courseId: new mongoose.Types.ObjectId(),
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        capacity: 30,
        status: 'Active',
      });
      batchId = batch._id as mongoose.Types.ObjectId;

      await Referral.create({
        ambassadorUserId,
        referralCode: 'AMB123',
        referredEmail: studentEmail,
        referredUserId: studentUserId,
        status: 'registered',
      });
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({ email: { $in: [ambassadorEmail, studentEmail] } });
      await StudentProfile.deleteMany({ userId: ambassadorUserId });
      await Referral.deleteMany({ ambassadorUserId });
      if (batchId) await Batch.deleteOne({ _id: batchId });
      if (studentUserId && batchId) await Enrollment.deleteMany({ studentUserId, batchId });
    }
  });

  it('should automatically calculate 5% referral commission and update ambassador metrics on enrollment confirmation', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const feeQuoted = mongoose.Types.Decimal128.fromString('10000.00');
    const feeCollected = mongoose.Types.Decimal128.fromString('10000.00');

    // Create pending enrollment
    const enrollment = new Enrollment({
      studentUserId,
      batchId,
      status: EnrollmentStatus.PENDING,
      feeQuoted,
      feeCollected,
    });
    await enrollment.save();

    expect(enrollment.status).toBe(EnrollmentStatus.PENDING);

    // Confirm enrollment to trigger referral hook
    enrollment.status = EnrollmentStatus.CONFIRMED;
    await enrollment.save();

    // Check referral document
    const updatedReferral = await Referral.findOne({ referredUserId: studentUserId });
    expect(updatedReferral).toBeDefined();
    expect(updatedReferral?.status).toBe('enrolled');
    expect(updatedReferral?.commissionAmount).toBe(500); // 5% of 10000 = 500

    // Check referring ambassador profile metrics
    const updatedAmbassadorProfile = await StudentProfile.findOne({ userId: ambassadorUserId });
    expect(updatedAmbassadorProfile).toBeDefined();
    expect(updatedAmbassadorProfile?.totalConversions).toBe(1);
    expect(updatedAmbassadorProfile?.referralEarnings).toBe(500);
    expect(updatedAmbassadorProfile?.pendingReferralPayout).toBe(500);
  });
});
