import mongoose from 'mongoose';
import { User, IUser } from '@/database/models/User.model';
import { CollegeProfile } from '@/database/models/CollegeProfile.model';
import { EmployerProfile } from '@/database/models/EmployerProfile.model';
import { MentorProfile } from '@/database/models/MentorProfile.model';
import { StudentProfile } from '@/database/models/StudentProfile.model';
import { Referral } from '@/database/models/Referral.model';
import { RegisterDto, RegisterResponseDto, LoginResponseDto } from '../dto/register.dto';
import { RefreshTokenResponseDto } from '../dto/refresh-token.dto';
import { logger } from '@/common/utils/logger.util';
import { tokenService } from './token.service';
import { redisTokenService } from './redis-token.service';
import { emailService } from '@/common/services/email.service';
import { generateVerificationToken, generateOTP, hashToken } from '@/common/utils/token.util';
import { jwtConfig } from '@/config/jwt.config';
import { config } from '@/config';

export class AuthService {
  private static instance: AuthService;

  private constructor() { }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: registerDto.email });
      if (existingUser) {
        if (existingUser.role === 'student' && !existingUser.isEmailVerified) {
          existingUser.fullName = registerDto.fullName;
          existingUser.phone = registerDto.phone;
          existingUser.password = registerDto.password;

          const otp = generateOTP();
          const hashedOTP = hashToken(otp);
          existingUser.emailVerificationOTP = hashedOTP;
          existingUser.emailVerificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
          existingUser.emailVerificationOTPAttempts = 0;

          await existingUser.save();

          let studentProfile = await StudentProfile.findOne({ userId: existingUser._id });
          if (!studentProfile) {
            await StudentProfile.create({
              userId: existingUser._id,
              skills: [],
              interests: [],
            });
          }

          try {
            await emailService.sendVerificationOTP(existingUser.email, otp, existingUser.fullName);
          } catch (emailError) {
            logger.error('Failed to send verification OTP:', emailError);
          }

          return {
            user: {
              id: existingUser._id.toString(),
              fullName: existingUser.fullName,
              email: existingUser.email,
              phone: existingUser.phone,
              role: existingUser.role,
              isEmailVerified: existingUser.isEmailVerified,
            },
          };
        } else {
          throw new Error('User with this email already exists');
        }
      }

      // Generate OTP
      const otp = generateOTP();
      const hashedOTP = hashToken(otp);

      // Create new user
      const user = new User({
        fullName: registerDto.fullName,
        email: registerDto.email,
        phone: registerDto.phone,
        password: registerDto.password,
        role: registerDto.role,
        emailVerificationOTP: hashedOTP,
        emailVerificationOTPExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        emailVerificationOTPAttempts: 0,
      });

      await user.save();

      // Check if student was referred
      if (user.role === 'student') {
        let referral = await Referral.findOne({ referredEmail: user.email.toLowerCase(), status: 'sent' }).exec();
        if (!referral && registerDto.referralCode) {
          const ambassadorProfile = await StudentProfile.findOne({ referralCode: registerDto.referralCode }).exec();
          if (ambassadorProfile) {
            referral = new Referral({
              ambassadorUserId: ambassadorProfile.userId,
              referralCode: registerDto.referralCode,
              referredEmail: user.email.toLowerCase(),
              status: 'sent',
            });
          }
        }
        if (referral) {
          referral.referredUserId = user._id as mongoose.Types.ObjectId;
          referral.status = 'registered';
          await referral.save();

          // Increment totalReferrals count on the ambassador profile
          await StudentProfile.updateOne(
            { userId: referral.ambassadorUserId },
            { $inc: { totalReferrals: 1 } }
          ).exec();

          logger.info(`Referral linked for user ${user.email} from ambassador ${referral.ambassadorUserId}`);
        }
      }

      // Create college profile if role is college
      let collegeProfile = null;
      if (registerDto.role === 'college' && registerDto.collegeData) {
        try {
          collegeProfile = new CollegeProfile({
            userId: user._id,
            collegeName: registerDto.collegeData.institutionName,
            address: {
              city: registerDto.collegeData.city,
              state: registerDto.collegeData.state,
              country: 'India', // Default country, can be made dynamic
            },
            contactPerson: {
              name: registerDto.collegeData.contactPerson,
              designation: registerDto.collegeData.designation,
              email: registerDto.collegeData.officialEmail,
              phone: registerDto.collegeData.phone,
            },
            website: registerDto.collegeData.website || undefined,
            isVerified: false,
            // TESTING PHASE: auto-activate a Silver subscription on registration.
            partnershipTier: 'Silver',
            partnershipActive: true,
            partnershipStartDate: new Date(),
          });

          await collegeProfile.save();
          logger.info(`College profile created for user: ${user.email}`);
        } catch (profileError) {
          // If college profile creation fails, delete the user to maintain consistency
          await User.findByIdAndDelete(user._id);
          logger.error(
            'Failed to create college profile, rolling back user creation:',
            profileError
          );
          throw new Error('Failed to create college profile. Please try again.');
        }
      }

      // Create employer profile if role is employer
      let employerProfile = null;
      if (registerDto.role === 'employer' && registerDto.employerData) {
        try {
          employerProfile = new EmployerProfile({
            userId: user._id,
            companyName: registerDto.employerData.companyName,
            contactPerson: {
              name: registerDto.employerData.contactPerson,
              email: registerDto.employerData.officialEmail,
              phone: registerDto.employerData.phone,
            },
            industry: registerDto.employerData.industry,
            companySize: registerDto.employerData.companySize,
            website: registerDto.employerData.website || undefined,
            hiringNeeds: registerDto.employerData.hiringNeeds || undefined,
            isVerified: false,
          });

          await employerProfile.save();
          logger.info(`Employer profile created for user: ${user.email}`);
        } catch (profileError) {
          // If employer profile creation fails, delete the user to maintain consistency
          await User.findByIdAndDelete(user._id);
          logger.error(
            'Failed to create employer profile, rolling back user creation:',
            profileError
          );
          throw new Error('Failed to create employer profile. Please try again.');
        }
      }

      // Create mentor profile if role is mentor
      let mentorProfile = null;
      if (registerDto.role === 'mentor' && registerDto.mentorData) {
        try {
          mentorProfile = new MentorProfile({
            userId: user._id,
            experienceYears: registerDto.mentorData.experienceYears,
            areaOfExpertise: registerDto.mentorData.areaOfExpertise,
            currentOrganization: registerDto.mentorData.currentOrganization,
            bio: registerDto.mentorData.bio,
            isVerified: false,
          });

          await mentorProfile.save();
          logger.info(`Mentor profile created for user: ${user.email}`);
        } catch (profileError) {
          // If mentor profile creation fails, delete the user to maintain consistency
          await User.findByIdAndDelete(user._id);
          logger.error(
            'Failed to create mentor profile, rolling back user creation:',
            profileError
          );
          throw new Error('Failed to create mentor profile. Please try again.');
        }
      }

      // Send verification OTP (non-blocking - don't fail registration if email fails)
      try {
        await emailService.sendVerificationOTP(user.email, otp, user.fullName);
      } catch (emailError) {
        logger.error('Failed to send verification OTP:', emailError);
        // Continue with registration even if email fails
      }

      logger.info(`User registered successfully: ${user.email}`);

      const response: RegisterResponseDto = {
        user: {
          id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
      };

      // Add college profile data to response if created
      if (collegeProfile) {
        response.collegeProfile = {
          id: collegeProfile._id.toString(),
          collegeName: collegeProfile.collegeName,
          city: collegeProfile.address.city,
          state: collegeProfile.address.state,
        };
      }

      // Add employer profile data to response if created
      if (employerProfile) {
        response.employerProfile = {
          id: employerProfile._id.toString(),
          companyName: employerProfile.companyName,
          industry: employerProfile.industry,
          companySize: employerProfile.companySize,
        };
      }

      // Add mentor profile data to response if created
      if (mentorProfile) {
        response.mentorProfile = {
          id: mentorProfile._id.toString(),
          experienceYears: mentorProfile.experienceYears,
          areaOfExpertise: mentorProfile.areaOfExpertise,
          currentOrganization: mentorProfile.currentOrganization,
        };
      }

      return response;
    } catch (error: any) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  public async login(email: string, password: string): Promise<LoginResponseDto> {
    try {
      // Find user with password field
      const user = await User.findOne({ email }).select('+password +refreshTokens');

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        throw new Error('Email not verified. Please verify your email before logging in.');
      }

      // Generate new tokens (JWT access + crypto refresh)
      const tokens = tokenService.generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      // Store refresh token in Redis (fallback to MongoDB if Redis unavailable)
      try {
        if (redisTokenService.isAvailable()) {
          await redisTokenService.storeRefreshToken(user._id.toString(), tokens.refreshToken);
        } else {
          await tokenService.storeRefreshToken(user._id.toString(), tokens.refreshToken);
        }
      } catch (error) {
        logger.warn('Failed to store token in Redis, falling back to MongoDB');
        await tokenService.storeRefreshToken(user._id.toString(), tokens.refreshToken);
      }

      logger.info(`User logged in successfully: ${user.email}`);

      let isAmbassador = false;
      if (user.role === 'student') {
        const studentProfile = await StudentProfile.findOne({ userId: user._id });
        if (studentProfile) {
          isAmbassador = studentProfile.isAmbassador || false;
        }
      }

      return {
        user: {
          id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isAmbassador,
        },
        tokens,
      };
    } catch (error: any) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  public async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  public async refreshToken(
    userId: string,
    refreshToken: string,
    deviceInfo?: string
  ): Promise<RefreshTokenResponseDto> {
    try {
      // Find user
      const user = await User.findById(userId).select('+refreshTokens');

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      let tokens: RefreshTokenResponseDto;

      // Try Redis first, fallback to MongoDB if the token is not present there.
      if (redisTokenService.isAvailable()) {
        // Validate token from Redis
        const metadata = await redisTokenService.validateRefreshToken(refreshToken);

        if (metadata?.userId === userId) {
          // Remove old token
          await redisTokenService.removeRefreshToken(userId, refreshToken);

          // Generate new token pair
          tokens = tokenService.generateTokenPair({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
          });

          // Store new token in Redis
          await redisTokenService.storeRefreshToken(userId, tokens.refreshToken, deviceInfo);
        } else {
          logger.warn(
            `Refresh token not found in Redis for user ${userId}; trying MongoDB fallback`
          );
          tokens = await tokenService.rotateRefreshToken(
            userId,
            refreshToken,
            {
              userId: user._id.toString(),
              email: user.email,
              role: user.role,
            },
            {
              deviceInfo,
              detectReuse: true,
            }
          );
        }
      } else {
        // Fallback to MongoDB token rotation
        tokens = await tokenService.rotateRefreshToken(
          userId,
          refreshToken,
          {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
          },
          {
            deviceInfo,
            detectReuse: true,
          }
        );
      }

      logger.info(`Token refreshed for user: ${user.email}`);

      return tokens;
    } catch (error: any) {
      logger.error('Refresh token error:', error);
      throw new Error('Invalid or expired refresh token');
    }
  }

  public async logout(
    userId: string,
    refreshToken: string,
    accessToken?: string,
  ): Promise<void> {
    try {
      // Immediately blacklist the access token so it cannot be reused within its 15-min window
      if (accessToken) {
        const decoded = jwtConfig.decodeToken(accessToken);
        await redisTokenService.blacklistAccessToken(accessToken, decoded?.exp);
      }

      // Remove refresh token — Redis first, fallback to MongoDB
      if (redisTokenService.isAvailable()) {
        try {
          await redisTokenService.removeRefreshToken(userId, refreshToken);
        } catch (redisError) {
          logger.warn('Redis logout failed, falling back to MongoDB:', redisError);
          await tokenService.removeRefreshToken(userId, refreshToken);
        }
      } else {
        await tokenService.removeRefreshToken(userId, refreshToken);
      }
      logger.info(`User logged out: ${userId}`);
    } catch (error: any) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  public async logoutAll(userId: string, accessToken?: string): Promise<void> {
    try {
      // Blacklist the current session's access token immediately
      if (accessToken) {
        const decoded = jwtConfig.decodeToken(accessToken);
        await redisTokenService.blacklistAccessToken(accessToken, decoded?.exp);
      }

      // Remove all refresh tokens — Redis first, fallback to MongoDB
      if (redisTokenService.isAvailable()) {
        try {
          await redisTokenService.removeAllRefreshTokens(userId);
        } catch (redisError) {
          logger.warn('Redis logoutAll failed, falling back to MongoDB:', redisError);
          await tokenService.removeAllRefreshTokens(userId);
        }
      } else {
        await tokenService.removeAllRefreshTokens(userId);
      }
      logger.info(`User logged out from all devices: ${userId}`);
    } catch (error: any) {
      logger.error('Logout all error:', error);
      throw error;
    }
  }

  public async verifyEmail(
    email: string,
    otp: string
  ): Promise<{ user: { email: string; fullName: string; role: string } }> {
    try {
      const hashedOTP = hashToken(otp);

      const user = await User.findOne({ email }).select(
        '+emailVerificationOTP +emailVerificationOTPExpires +emailVerificationOTPAttempts'
      );

      if (!user) {
        throw new Error('User not found');
      }

      // Check if already verified
      if (user.isEmailVerified) {
        logger.info(`Email already verified for user: ${user.email}`);
        return {
          user: {
            email: user.email,
            fullName: user.fullName,
            role: user.role,
          },
        };
      }

      // Check if OTP exists
      if (!user.emailVerificationOTP || !user.emailVerificationOTPExpires) {
        throw new Error('No verification OTP found. Please request a new one.');
      }

      // Check if OTP has expired
      if (user.emailVerificationOTPExpires.getTime() < Date.now()) {
        throw new Error('OTP has expired. Please request a new one.');
      }

      // Check attempts limit (max 5 attempts)
      if (user.emailVerificationOTPAttempts && user.emailVerificationOTPAttempts >= 5) {
        // Clear the OTP to force user to request a new one
        user.emailVerificationOTP = undefined;
        user.emailVerificationOTPExpires = undefined;
        user.emailVerificationOTPAttempts = 0;
        await user.save();
        throw new Error('Maximum verification attempts exceeded. Please request a new OTP.');
      }

      // Verify OTP
      if (user.emailVerificationOTP !== hashedOTP) {
        // Increment attempts
        user.emailVerificationOTPAttempts = (user.emailVerificationOTPAttempts || 0) + 1;
        await user.save();

        const remainingAttempts = 5 - user.emailVerificationOTPAttempts;
        throw new Error(
          `Invalid OTP. You have ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`
        );
      }

      // OTP is valid - verify email
      user.isEmailVerified = true;
      user.emailVerificationOTP = undefined;
      user.emailVerificationOTPExpires = undefined;
      user.emailVerificationOTPAttempts = 0;
      await user.save();

      logger.info(`Email verified successfully for user: ${user.email}`);

      // Send welcome email after successful verification
      try {
        await emailService.sendWelcomeEmail(user.email, user.fullName);
      } catch (emailError) {
        logger.error('Failed to send welcome email:', emailError);
        // Don't fail verification if welcome email fails
      }

      return {
        user: {
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      };
    } catch (error: any) {
      logger.error('Email verification error:', error);
      throw error;
    }
  }

  public async resendVerificationOTP(email: string): Promise<void> {
    try {
      const user = await User.findOne({ email }).select(
        '+emailVerificationOTP +emailVerificationOTPExpires +emailVerificationOTPAttempts'
      );

      if (!user) {
        throw new Error('User not found');
      }

      if (user.isEmailVerified) {
        throw new Error('Email is already verified');
      }

      // Rate limiting: Check if last OTP was sent recently (30 seconds)
      if (user.emailVerificationOTPExpires) {
        const otpAge = Date.now() - (user.emailVerificationOTPExpires.getTime() - 10 * 60 * 1000);
        const rateLimitDuration = 30 * 1000;

        if (otpAge < rateLimitDuration) {
          const waitTime = Math.ceil((rateLimitDuration - otpAge) / 1000);
          throw new Error(`Please wait ${waitTime} seconds before requesting another OTP`);
        }
      }

      // Generate new OTP
      const otp = generateOTP();
      const hashedOTP = hashToken(otp);

      user.emailVerificationOTP = hashedOTP;
      user.emailVerificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      user.emailVerificationOTPAttempts = 0; // Reset attempts
      await user.save();

      // Send verification OTP
      try {
        await emailService.sendVerificationOTP(user.email, otp, user.fullName);
      } catch (emailError) {
        if (config.NODE_ENV === 'development') {
          logger.warn(`[DEVELOPMENT ONLY] Failed to send verification OTP email: ${(emailError as any).message}`);
        } else {
          throw emailError;
        }
      }

      logger.info(`Verification OTP resent to: ${user.email}`);
    } catch (error: any) {
      logger.error('Resend verification OTP error:', error);
      throw error;
    }
  }

  public async requestPasswordReset(email: string): Promise<void> {
    try {
      const user = await User.findOne({ email }).select(
        '+passwordResetToken +passwordResetExpires'
      );

      if (!user) {
        // Don't reveal if user exists or not for security
        logger.info(`Password reset requested for non-existent email: ${email}`);
        return;
      }

      // Generate 6-digit OTP
      const otp = generateOTP();
      const hashedToken = hashToken(otp);

      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await user.save();

      // Send password reset email
      try {
        await emailService.sendPasswordResetEmail(user.email, otp, user.fullName);
      } catch (emailError) {
        if (config.NODE_ENV === 'development') {
          logger.warn(`[DEVELOPMENT ONLY] Failed to send password reset email: ${(emailError as any).message}`);
        } else {
          throw emailError;
        }
      }

      logger.info(`Password reset OTP email sent to: ${user.email}`);
    } catch (error: any) {
      logger.error('Password reset request error:', error);
      throw error;
    }
  }

  public async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    console.log('RESET PASSWORD CALLED', { email, newPassword: '***' });
    try {
      const hashedToken = hashToken(otp);

      const user = await User.findOne({
        email: email.toLowerCase().trim(),
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      }).select('+passwordResetToken +passwordResetExpires +password');

      if (!user) {
        throw new Error('Invalid or expired verification code');
      }

      // Check if new password is same as current password
      console.log('Comparing passwords', { hasPassword: !!user.password });
      const isSamePassword = await user.comparePassword(newPassword);
      console.log('isSamePassword result:', isSamePassword);
      if (isSamePassword) {
        console.log('SAME PASSWORD DETECTED');
        throw new Error('New password must be different from your previous password');
      }

      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      logger.info(`Password reset successfully for user: ${user.email}`);
    } catch (error: any) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }

  public async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Find user with password field
      const user = await User.findById(userId).select('+password');

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Check if new password is same as current password
      if (user.password) {
        const isSamePassword = await user.comparePassword(newPassword);
        if (isSamePassword) {
          throw new Error('New password must be different from current password');
        }
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Optional: Invalidate all refresh tokens to force re-login on all devices
      // await tokenService.removeAllRefreshTokens(userId);

      logger.info(`Password changed successfully for user: ${user.email}`);
    } catch (error: any) {
      logger.error('Change password error:', error);
      throw error;
    }
  }
}

export const authService = AuthService.getInstance();
