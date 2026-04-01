import { User, IUser } from '@/database/models/User.model';
import { RegisterDto, RegisterResponseDto } from '../dto/register.dto';
import { RefreshTokenResponseDto } from '../dto/refresh-token.dto';
import { logger } from '@/common/utils/logger.util';
import { tokenService } from './token.service';

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

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
        throw new Error('User with this email already exists');
      }

      // Create new user
      const user = new User({
        fullName: registerDto.fullName,
        email: registerDto.email,
        phone: registerDto.phone,
        password: registerDto.password,
        role: registerDto.role, // Role is now required
      });

      await user.save();

      // Generate tokens (JWT access + crypto refresh)
      const tokens = tokenService.generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      // Store hashed refresh token
      await tokenService.storeRefreshToken(user._id.toString(), tokens.refreshToken);

      logger.info(`User registered successfully: ${user.email}`);

      return {
        user: {
          id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
        tokens,
      };
    } catch (error: any) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  public async login(email: string, password: string): Promise<RegisterResponseDto> {
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

      // Generate new tokens (JWT access + crypto refresh)
      const tokens = tokenService.generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      // Store hashed refresh token
      await tokenService.storeRefreshToken(user._id.toString(), tokens.refreshToken);

      logger.info(`User logged in successfully: ${user.email}`);

      return {
        user: {
          id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
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
    refreshToken: string
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

      // Rotate refresh token (validates, removes old, generates new)
      const tokens = await tokenService.rotateRefreshToken(userId, refreshToken, {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      logger.info(`Token refreshed for user: ${user.email}`);

      return tokens;
    } catch (error: any) {
      logger.error('Refresh token error:', error);
      throw new Error('Invalid or expired refresh token');
    }
  }

  public async logout(userId: string, refreshToken: string): Promise<void> {
    try {
      await tokenService.removeRefreshToken(userId, refreshToken);
      logger.info(`User logged out: ${userId}`);
    } catch (error: any) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  public async logoutAll(userId: string): Promise<void> {
    try {
      await tokenService.removeAllRefreshTokens(userId);
      logger.info(`User logged out from all devices: ${userId}`);
    } catch (error: any) {
      logger.error('Logout all error:', error);
      throw error;
    }
  }
}

export const authService = AuthService.getInstance();
