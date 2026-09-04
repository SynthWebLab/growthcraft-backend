import mongoose from 'mongoose';
import { authService } from '@/modules/auth/services/auth.service';
import { User } from '@/database/models/User.model';
import { hashToken } from '@/common/utils/token.util';

describe('Password Reset Flow Tests', () => {
  const resetEmail = 'pwd.reset.test@growthcraft.com';
  let userId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({ email: resetEmail });
      const user = await User.create({
        fullName: 'Password Reset Test User',
        email: resetEmail,
        password: 'OldPassword123!',
        role: 'student',
        isEmailVerified: true,
        isActive: true,
      });
      userId = user._id.toString();
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({ email: resetEmail });
    }
  });

  it('should generate reset token and set expiry when requesting password reset', async () => {
    if (mongoose.connection.readyState !== 1) return;

    await authService.requestPasswordReset(resetEmail);

    const user = await User.findOne({ email: resetEmail }).select(
      '+passwordResetToken +passwordResetExpires'
    );

    expect(user).toBeDefined();
    expect(user?.passwordResetToken).toBeDefined();
    expect(user?.passwordResetExpires).toBeDefined();
    expect(user!.passwordResetExpires!.getTime()).toBeGreaterThan(Date.now());
  });

  it('should throw error for invalid/non-existent user email', async () => {
    if (mongoose.connection.readyState !== 1) return;

    await expect(
      authService.requestPasswordReset('nonexistent.user@growthcraft.com')
    ).rejects.toThrow('No account found with this email address');
  });

  it('should reset password successfully with valid OTP', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const otp = '123456';
    const hashedOTP = hashToken(otp);

    await User.updateOne(
      { email: resetEmail },
      {
        passwordResetToken: hashedOTP,
        passwordResetExpires: new Date(Date.now() + 15 * 60 * 1000),
      }
    );

    const newPassword = 'NewSecurePassword123!';
    await authService.resetPassword(resetEmail, otp, newPassword);

    const updatedUser = await User.findOne({ email: resetEmail }).select('+password +passwordResetToken');
    expect(updatedUser?.passwordResetToken).toBeUndefined();

    // Verify user can authenticate with the new password
    const isMatch = await updatedUser?.comparePassword(newPassword);
    expect(isMatch).toBe(true);
  });

  it('should fail reset if OTP is invalid or expired', async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Set expired token
    const otp = '654321';
    const hashedOTP = hashToken(otp);
    await User.updateOne(
      { email: resetEmail },
      {
        passwordResetToken: hashedOTP,
        passwordResetExpires: new Date(Date.now() - 1000), // Expired
      }
    );

    await expect(
      authService.resetPassword(resetEmail, otp, 'AnotherPassword123!')
    ).rejects.toThrow('Invalid or expired verification code');
  });
});
