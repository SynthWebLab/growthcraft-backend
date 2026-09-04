import mongoose from 'mongoose';
import { tokenService } from '@/modules/auth/services/token.service';
import { authService } from '@/modules/auth/services/auth.service';
import { User } from '@/database/models/User.model';

describe('Token Refresh and Rotation Tests', () => {
  let userId: string;
  const userEmail = 'token.test@growthcraft.com';

  beforeAll(async () => {
    // Create test user in DB if DB is available, or use mock user
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({ email: userEmail });
      const user = await User.create({
        fullName: 'Token Test User',
        email: userEmail,
        password: 'Password123!',
        role: 'student',
        isEmailVerified: true,
        isActive: true,
      });
      userId = user._id.toString();
    } else {
      userId = new mongoose.Types.ObjectId().toString();
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({ email: userEmail });
    }
  });

  describe('TokenService Unit Tests', () => {
    it('should generate valid JWT access token and refresh token pair', () => {
      const payload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: 'student',
      };
      const tokenPair = tokenService.generateTokenPair(payload);

      expect(tokenPair).toBeDefined();
      expect(tokenPair.accessToken).toBeDefined();
      expect(typeof tokenPair.accessToken).toBe('string');
      expect(tokenPair.refreshToken).toBeDefined();
      expect(typeof tokenPair.refreshToken).toBe('string');
    });

    it('should store and validate hashed refresh token in database', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const tokenPair = tokenService.generateTokenPair({
        userId,
        email: userEmail,
        role: 'student',
      });

      await tokenService.storeRefreshToken(userId, tokenPair.refreshToken, 'Test Device');

      const isValid = await tokenService.validateRefreshToken(userId, tokenPair.refreshToken);
      expect(isValid).toBe(true);

      const isInvalid = await tokenService.validateRefreshToken(userId, 'invalid-token-string');
      expect(isInvalid).toBe(false);
    });

    it('should rotate refresh token correctly', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const initialTokens = tokenService.generateTokenPair({
        userId,
        email: userEmail,
        role: 'student',
      });

      await tokenService.storeRefreshToken(userId, initialTokens.refreshToken);

      const rotatedTokens = await tokenService.rotateRefreshToken(
        userId,
        initialTokens.refreshToken,
        { userId, email: userEmail, role: 'student' }
      );

      expect(rotatedTokens.accessToken).toBeDefined();
      expect(rotatedTokens.refreshToken).toBeDefined();
      expect(rotatedTokens.refreshToken).not.toEqual(initialTokens.refreshToken);

      // Old refresh token should no longer be valid
      const isOldValid = await tokenService.validateRefreshToken(userId, initialTokens.refreshToken);
      expect(isOldValid).toBe(false);

      // New refresh token should be valid
      const isNewValid = await tokenService.validateRefreshToken(userId, rotatedTokens.refreshToken);
      expect(isNewValid).toBe(true);
    });

    it('should detect token reuse and invalidate all sessions', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const initialTokens = tokenService.generateTokenPair({
        userId,
        email: userEmail,
        role: 'student',
      });

      await tokenService.storeRefreshToken(userId, initialTokens.refreshToken);

      // Rotate once
      await tokenService.rotateRefreshToken(
        userId,
        initialTokens.refreshToken,
        { userId, email: userEmail, role: 'student' },
        { detectReuse: true }
      );

      // Attempt to reuse old token
      await expect(
        tokenService.rotateRefreshToken(
          userId,
          initialTokens.refreshToken,
          { userId, email: userEmail, role: 'student' },
          { detectReuse: true }
        )
      ).rejects.toThrow('Token reuse detected - all sessions invalidated');

      const user = await User.findById(userId).select('+refreshTokens');
      expect(user?.refreshTokens.length).toBe(0);
    });
  });

  describe('AuthService Integration Tests', () => {
    it('should handle full refreshToken flow', async () => {
      if (mongoose.connection.readyState !== 1) return;

      // Ensure user has at least one active refresh token
      const tokens = tokenService.generateTokenPair({
        userId,
        email: userEmail,
        role: 'student',
      });
      await tokenService.storeRefreshToken(userId, tokens.refreshToken);

      const refreshed = await authService.refreshToken(userId, tokens.refreshToken);
      expect(refreshed.accessToken).toBeDefined();
      expect(refreshed.refreshToken).toBeDefined();
    });
  });
});
