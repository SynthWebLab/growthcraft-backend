import { User, IUser } from '@/database/models/User.model';
import { RegisterDto, RegisterResponseDto } from '../dto/register.dto';
import { RefreshTokenResponseDto } from '../dto/refresh-token.dto';
import { jwtConfig } from '@/config/jwt.config';
import { logger } from '@/common/utils/logger.util';

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

      // Generate tokens
      const tokens = jwtConfig.generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      // Save refresh token to user
      user.refreshTokens = [tokens.refreshToken];
      await user.save();

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

      // Generate new tokens
      const tokens = jwtConfig.generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      // Add refresh token to user's tokens
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

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

  public async refreshToken(refreshToken: string): Promise<RefreshTokenResponseDto> {
    try {
      // Verify refresh token
      const decoded = jwtConfig.verifyRefreshToken(refreshToken);

      // Find user and check if refresh token exists
      const user = await User.findById(decoded.userId).select('+refreshTokens');

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Check if refresh token is in user's token list
      if (!user.refreshTokens.includes(refreshToken)) {
        throw new Error('Invalid refresh token');
      }

      // Generate new token pair
      const tokens = jwtConfig.generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      // Replace old refresh token with new one
      user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      logger.info(`Token refreshed for user: ${user.email}`);

      return tokens;
    } catch (error: any) {
      logger.error('Refresh token error:', error);
      throw new Error('Invalid or expired refresh token');
    }
  }

  public async logout(userId: string, refreshToken: string): Promise<void> {
    try {
      const user = await User.findById(userId).select('+refreshTokens');

      if (!user) {
        throw new Error('User not found');
      }

      // Remove the specific refresh token
      user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
      await user.save();

      logger.info(`User logged out: ${user.email}`);
    } catch (error: any) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  public async logoutAll(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId).select('+refreshTokens');

      if (!user) {
        throw new Error('User not found');
      }

      // Remove all refresh tokens
      user.refreshTokens = [];
      await user.save();

      logger.info(`User logged out from all devices: ${user.email}`);
    } catch (error: any) {
      logger.error('Logout all error:', error);
      throw error;
    }
  }
}

export const authService = AuthService.getInstance();
