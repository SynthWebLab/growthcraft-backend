import mongoose from 'mongoose';
import { User, IUser } from '@/database/models/User.model';
import { CollegeProfile } from '@/database/models/CollegeProfile.model';
import { EmployerProfile } from '@/database/models/EmployerProfile.model';
import { MentorProfile } from '@/database/models/MentorProfile.model';
import { StudentProfile } from '@/database/models/StudentProfile.model';
import { Referral } from '@/database/models/Referral.model';
import { RegisterDto, RegisterResponseDto } from '../dto/register.dto';
import { LoginResponseDto } from '../dto/login.dto';
import { RefreshTokenResponseDto } from '../dto/refresh-token.dto';
import { logger } from '@/common/utils/logger.util';
import { tokenService as defaultTokenService, TokenService } from './token.service';
import { redisTokenService as defaultRedisTokenService, RedisTokenService } from './redis-token.service';
import { emailService } from '@/common/services/email.service';
import { generateVerificationToken, generateOTP, hashToken } from '@/common/utils/token.util';
import { jwtConfig } from '@/config/jwt.config';
import { config } from '@/config';
import { AppError } from '@/common/errors/AppError';

export interface AuthServiceDependencies {
  tokenService?: TokenService;
  redisTokenService?: RedisTokenService;
}

export class AuthService {
  private static instance: AuthService | null = null;
  private readonly tokenService: TokenService;
  private readonly redisTokenService: RedisTokenService;

  public constructor(deps?: AuthServiceDependencies) {
    this.tokenService = deps?.tokenService ?? defaultTokenService;
    this.redisTokenService = deps?.redisTokenService ?? defaultRedisTokenService;
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public static setInstance(instance: AuthService | null): void {
    AuthService.instance = instance;
  }

  public static resetInstance(): void {
    AuthService.instance = null;
  }

  public async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const session = await mongoose.startSession();
    session.startTransaction();

    let otpToSend: { email: string; otp: string; fullName: string } | null = null;
    let registeredUser: IUser | null = null;
    let collegeProfile: any = null;
    let employerProfile: any = null;
    let mentorProfile: any = null;

    try {
      // Check if user already exists with the SAME role
      const existingUser = await User.findOne({ email: registerDto.email, role: registerDto.role }).session(session);
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

          await existingUser.save({ session });

          const studentProfile = await StudentProfile.findOne({ userId: existingUser._id }).session(session);
          if (!studentProfile) {
            await StudentProfile.create(
              [
                {
                  userId: existingUser._id,
                  skills: [],
                  interests: [],
                },
              ],
              { session }
            );
          }

          await session.commitTransaction();

          otpToSend = {
            email: existingUser.email,
            otp,
            fullName: existingUser.fullName,
          };

          registeredUser = existingUser;

          // Send verification OTP (non-blocking)
          try {
            await emailService.sendVerificationOTP(otpToSend.email, otpToSend.otp, otpToSend.fullName);
          } catch (emailError) {
            logger.error('Failed to send verification OTP:', emailError);
          }

          let isAmbassador = false;
          if (existingUser.role === 'student') {
            const sp = await StudentProfile.findOne({ userId: existingUser._id });
            if (sp) isAmbassador = sp.isAmbassador || false;
          }

          const tokens = this.tokenService.generateTokenPair({
            userId: existingUser._id.toString(),
            email: existingUser.email,
            role: existingUser.role,
            isEmailVerified: existingUser.isEmailVerified,
            isActive: existingUser.isActive,
            isAmbassador,
          });

          try {
            if (this.redisTokenService.isAvailable()) {
              await this.redisTokenService.storeRefreshToken(existingUser._id.toString(), tokens.refreshToken);
            } else {
              await this.tokenService.storeRefreshToken(existingUser._id.toString(), tokens.refreshToken);
            }
          } catch (error) {
            logger.warn('Failed to store token in Redis, falling back to MongoDB');
            await this.tokenService.storeRefreshToken(existingUser._id.toString(), tokens.refreshToken);
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
          const roleDisplay = registerDto.role ? registerDto.role.charAt(0).toUpperCase() + registerDto.role.slice(1) : 'this';
          throw new AppError(
            `An account with this email already exists for the ${roleDisplay} role. You can log in directly.`,
            409,
            'USER_EXISTS'
          );
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

      await user.save({ session });
      registeredUser = user;

      // Check if student was referred
      if (user.role === 'student') {
        let referral = await Referral.findOne({ referredEmail: user.email.toLowerCase(), status: 'sent' })
          .session(session)
          .exec();
        if (!referral && registerDto.referralCode) {
          const ambassadorProfile = await StudentProfile.findOne({ referralCode: registerDto.referralCode })
            .session(session)
            .exec();
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
          await referral.save({ session });

          // Increment totalReferrals count on the ambassador profile
          await StudentProfile.updateOne(
            { userId: referral.ambassadorUserId },
            { $inc: { totalReferrals: 1 } },
            { session }
          ).exec();

          logger.info(`Referral linked for user ${user.email} from ambassador ${referral.ambassadorUserId}`);
        }
      }

      // Create college profile if role is college
      if (registerDto.role === 'college' && registerDto.collegeData) {
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

        await collegeProfile.save({ session });
        logger.info(`College profile created for user: ${user.email}`);
      }

      // Create employer profile if role is employer
      if (registerDto.role === 'employer' && registerDto.employerData) {
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

        await employerProfile.save({ session });
        logger.info(`Employer profile created for user: ${user.email}`);
      }

      // Create mentor profile if role is mentor
      if (registerDto.role === 'mentor' && registerDto.mentorData) {
        mentorProfile = new MentorProfile({
          userId: user._id,
          experienceYears: registerDto.mentorData.experienceYears,
          areaOfExpertise: registerDto.mentorData.areaOfExpertise,
          currentOrganization: registerDto.mentorData.currentOrganization,
          bio: registerDto.mentorData.bio,
          isVerified: false,
        });

        await mentorProfile.save({ session });
        logger.info(`Mentor profile created for user: ${user.email}`);
      }

      // Commit transaction
      await session.commitTransaction();

      otpToSend = {
        email: user.email,
        otp,
        fullName: user.fullName,
      };
    } catch (error: any) {
      await session.abortTransaction();
      logger.error('Registration failed, transaction aborted:', error);
      throw error;
    } finally {
      await session.endSession();
    }

    // Send verification OTP (non-blocking - don't fail registration if email fails)
    if (otpToSend) {
      try {
        await emailService.sendVerificationOTP(otpToSend.email, otpToSend.otp, otpToSend.fullName);
      } catch (emailError) {
        logger.error('Failed to send verification OTP:', emailError);
        // Continue with registration even if email fails
      }
    }

    if (!registeredUser) {
      throw new Error('Registration failed unexpectedly');
    }

    logger.info(`User registered successfully: ${registeredUser.email}`);

    const response: RegisterResponseDto = {
      user: {
        id: registeredUser._id.toString(),
        fullName: registeredUser.fullName,
        email: registeredUser.email,
        phone: registeredUser.phone,
        role: registeredUser.role,
        isEmailVerified: registeredUser.isEmailVerified,
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
  }

  public async login(email: string, password: string, role?: string): Promise<LoginResponseDto> {
    try {
      let user: IUser | null = null;
      
      if (role) {
        user = await User.findOne({ email, role }).select('+password +refreshTokens');
        if (!user) {
          // Check if the user exists with another role to provide a helpful error message
          const otherUsers = await User.find({ email }).select('+password');
          for (const other of otherUsers) {
            if (await other.comparePassword(password)) {
              const formattedRole = other.role.charAt(0).toUpperCase() + other.role.slice(1);
              throw new Error(`This email is registered as a ${formattedRole} account. Please sign in at the ${formattedRole} portal: /login/${other.role.toLowerCase()}`);
            }
          }
        }
      } else {
        const users = await User.find({ email }).select('+password +refreshTokens');
        if (users.length === 0) {
          throw new Error('Invalid email or password');
        }
        
        // Check which user accounts match the password
        const validUsers = [];
        for (const u of users) {
          if (await u.comparePassword(password)) {
            validUsers.push(u);
          }
        }
        
        if (validUsers.length === 0) {
          throw new Error('Invalid email or password');
        } else if (validUsers.length === 1) {
          user = validUsers[0];
        } else {
          // Multiple accounts exist with valid password. Require role selection.
          return {
            requiresRoleSelection: true,
            availableRoles: validUsers.map(u => u.role)
          } as any;
        }
      }

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      if (role) {
        // If role was explicitly provided, we still need to verify the password here
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        throw new Error('Email not verified. Please verify your email before logging in.');
      }

      let isAmbassador = false;
      if (user.role === 'student') {
        const studentProfile = await StudentProfile.findOne({ userId: user._id });
        if (studentProfile) {
          isAmbassador = studentProfile.isAmbassador || false;
        }
      }

      // Generate new tokens (JWT access + crypto refresh)
      const tokens = this.tokenService.generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        isAmbassador,
      });

      // Store refresh token in Redis (fallback to MongoDB if Redis unavailable)
      try {
        if (this.redisTokenService.isAvailable()) {
          await this.redisTokenService.storeRefreshToken(user._id.toString(), tokens.refreshToken);
        } else {
          await this.tokenService.storeRefreshToken(user._id.toString(), tokens.refreshToken);
        }
      } catch (error) {
        logger.warn('Failed to store token in Redis, falling back to MongoDB');
        await this.tokenService.storeRefreshToken(user._id.toString(), tokens.refreshToken);
      }

      logger.info(`User logged in successfully: ${user.email}`);

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

      let isAmbassador = false;
      if (user.role === 'student') {
        const studentProfile = await StudentProfile.findOne({ userId: user._id });
        if (studentProfile) {
          isAmbassador = studentProfile.isAmbassador || false;
        }
      }

      let tokens: RefreshTokenResponseDto;

      // Try Redis first, fallback to MongoDB if the token is not present there.
      if (this.redisTokenService.isAvailable()) {
        // Validate token from Redis
        const metadata = await this.redisTokenService.validateRefreshToken(refreshToken);

        if (metadata?.userId === userId) {
          // Remove old token
          await this.redisTokenService.removeRefreshToken(userId, refreshToken);

          // Generate new token pair
          tokens = this.tokenService.generateTokenPair({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            isActive: user.isActive,
            isAmbassador,
          });

          // Store new token in Redis
          await this.redisTokenService.storeRefreshToken(userId, tokens.refreshToken, deviceInfo);
        } else {
          logger.warn(
            `Refresh token not found in Redis for user ${userId}; trying MongoDB fallback`
          );
          tokens = await this.tokenService.rotateRefreshToken(
            userId,
            refreshToken,
            {
              userId: user._id.toString(),
              email: user.email,
              role: user.role,
              isEmailVerified: user.isEmailVerified,
              isActive: user.isActive,
              isAmbassador,
            },
            {
              deviceInfo,
              detectReuse: true,
            }
          );
        }
      } else {
        // Fallback to MongoDB token rotation
        tokens = await this.tokenService.rotateRefreshToken(
          userId,
          refreshToken,
          {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            isActive: user.isActive,
            isAmbassador,
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
        await this.redisTokenService.blacklistAccessToken(accessToken, decoded?.exp);
      }

      // Remove refresh token — Redis first, fallback to MongoDB
      if (this.redisTokenService.isAvailable()) {
        try {
          await this.redisTokenService.removeRefreshToken(userId, refreshToken);
        } catch (redisError) {
          logger.warn('Redis logout failed, falling back to MongoDB:', redisError);
          await this.tokenService.removeRefreshToken(userId, refreshToken);
        }
      } else {
        await this.tokenService.removeRefreshToken(userId, refreshToken);
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
        await this.redisTokenService.blacklistAccessToken(accessToken, decoded?.exp);
      }

      // Remove all refresh tokens — Redis first, fallback to MongoDB
      if (this.redisTokenService.isAvailable()) {
        try {
          await this.redisTokenService.removeAllRefreshTokens(userId);
        } catch (redisError) {
          logger.warn('Redis logoutAll failed, falling back to MongoDB:', redisError);
          await this.tokenService.removeAllRefreshTokens(userId);
        }
      } else {
        await this.tokenService.removeAllRefreshTokens(userId);
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

      const users = await User.find({ email }).select(
        '+emailVerificationOTP +emailVerificationOTPExpires +emailVerificationOTPAttempts'
      );

      if (users.length === 0) {
        throw new Error('User not found');
      }

      // First, try to find the exact unverified account matching the OTP
      let user = users.find(u => !u.isEmailVerified && u.emailVerificationOTP === hashedOTP);

      if (!user) {
        const unverifiedUsers = users.filter(u => !u.isEmailVerified);
        if (unverifiedUsers.length === 0) {
          // All accounts are verified
          logger.info(`Email already verified for user: ${email}`);
          return {
            user: {
              email: users[0].email,
              fullName: users[0].fullName,
              role: users[0].role,
            },
          };
        }
        // Use the first unverified account to handle invalid/expired attempts
        user = unverifiedUsers[0];
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
        await user.save({ validateModifiedOnly: true });
        throw new Error('Maximum verification attempts exceeded. Please request a new OTP.');
      }

      // Verify OTP
      if (user.emailVerificationOTP !== hashedOTP) {
        // Increment attempts
        user.emailVerificationOTPAttempts = (user.emailVerificationOTPAttempts || 0) + 1;
        await user.save({ validateModifiedOnly: true });

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
      await user.save({ validateModifiedOnly: true });

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
      const users = await User.find({ email }).select(
        '+emailVerificationOTP +emailVerificationOTPExpires +emailVerificationOTPAttempts'
      );

      if (users.length === 0) {
        throw new Error('User not found');
      }

      const unverifiedUsers = users.filter(u => !u.isEmailVerified);
      if (unverifiedUsers.length === 0) {
        throw new Error('Email is already verified');
      }

      const user = unverifiedUsers[0];

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
      await user.save({ validateModifiedOnly: true });

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
      const normalizedEmail = email.toLowerCase().trim();
      const users = await User.find({ email: normalizedEmail }).select(
        '+passwordResetToken +passwordResetExpires'
      );

      if (users.length === 0) {
        throw new Error('No account found with this email address');
      }

      const activeUsers = users.filter(u => u.isActive);

      if (activeUsers.length === 0) {
        throw new Error('Account is deactivated. Please contact support.');
      }

      // Generate 6-digit OTP
      const otp = generateOTP();
      const hashedToken = hashToken(otp);

      for (const user of activeUsers) {
        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await user.save({ validateModifiedOnly: true });
      }
      
      const userForEmail = activeUsers[0];

      // Send password reset email
      try {
        await emailService.sendPasswordResetEmail(userForEmail.email, otp, userForEmail.fullName);
      } catch (emailError) {
        if (config.NODE_ENV === 'development') {
          logger.warn(`[DEVELOPMENT ONLY] Failed to send password reset email: ${(emailError as any).message}`);
        } else {
          throw emailError;
        }
      }

      logger.info(`Password reset OTP email sent to: ${email}`);
    } catch (error: any) {
      logger.error('Password reset request error:', error);
      throw error;
    }
  }

  public async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    logger.debug('RESET PASSWORD CALLED', { email, newPassword: '***' });
    try {
      const hashedToken = hashToken(otp);

      const users = await User.find({
        email: email.toLowerCase().trim(),
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      }).select('+passwordResetToken +passwordResetExpires +password');

      if (users.length === 0) {
        throw new Error('Invalid or expired verification code');
      }

      // Check if new password is same as current password for ANY of the accounts
      for (const user of users) {
        const isSamePassword = await user.comparePassword(newPassword);
        if (isSamePassword) {
          throw new Error('New password must be different from your previous password');
        }
      }

      for (const user of users) {
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateModifiedOnly: true });
      }

      logger.info(`Password reset successfully for user: ${email}`);
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
      await user.save({ validateModifiedOnly: true });

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
