import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { tokenService } from '@/modules/auth/services/token.service';
import { User } from '@/database/models/User.model';

describe('TokenService - Batching Sequential save() Calls', () => {
  let mockUser: any;
  let saveMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    saveMock = jest.fn().mockResolvedValue(true);

    mockUser = {
      _id: new mongoose.Types.ObjectId(),
      isActive: true,
      refreshTokens: [],
      save: saveMock,
    };

    jest.spyOn(User, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('validateRefreshToken', () => {
    it('batches expired token cleanup and lastUsedAt update into exactly ONE save() call', async () => {
      const validToken = 'valid-refresh-token';
      const hashedValidToken = await bcrypt.hash(validToken, 10);

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

      mockUser.refreshTokens = [
        {
          token: 'expired-token-hash',
          expiresAt: pastDate,
          createdAt: new Date(),
        },
        {
          token: hashedValidToken,
          expiresAt: futureDate,
          createdAt: new Date(),
        },
      ];

      const result = await tokenService.validateRefreshToken(mockUser._id.toString(), validToken);

      expect(result).toBe(true);
      // Pruned expired token
      expect(mockUser.refreshTokens).toHaveLength(1);
      // Updated lastUsedAt
      expect(mockUser.refreshTokens[0].lastUsedAt).toBeDefined();
      // CRITICAL: Exactly ONE save call, not two sequential save calls!
      expect(saveMock).toHaveBeenCalledTimes(1);
      expect(saveMock).toHaveBeenCalledWith({ validateModifiedOnly: true });
    });

    it('calls save() exactly once when valid token is found and no expired tokens exist', async () => {
      const validToken = 'valid-refresh-token';
      const hashedValidToken = await bcrypt.hash(validToken, 10);
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      mockUser.refreshTokens = [
        {
          token: hashedValidToken,
          expiresAt: futureDate,
          createdAt: new Date(),
        },
      ];

      const result = await tokenService.validateRefreshToken(mockUser._id.toString(), validToken);

      expect(result).toBe(true);
      expect(saveMock).toHaveBeenCalledTimes(1);
      expect(mockUser.refreshTokens[0].lastUsedAt).toBeDefined();
    });

    it('calls save() exactly once when token is invalid but expired tokens had to be pruned', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

      mockUser.refreshTokens = [
        {
          token: 'expired-token-hash',
          expiresAt: pastDate,
          createdAt: new Date(),
        },
      ];

      const result = await tokenService.validateRefreshToken(mockUser._id.toString(), 'wrong-token');

      expect(result).toBe(false);
      expect(mockUser.refreshTokens).toHaveLength(0);
      expect(saveMock).toHaveBeenCalledTimes(1);
    });

    it('does NOT call save() at all if token is invalid and no expired tokens exist', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      mockUser.refreshTokens = [
        {
          token: await bcrypt.hash('other-token', 10),
          expiresAt: futureDate,
          createdAt: new Date(),
        },
      ];

      const result = await tokenService.validateRefreshToken(mockUser._id.toString(), 'wrong-token');

      expect(result).toBe(false);
      // Zero DB writes when nothing was modified!
      expect(saveMock).toHaveBeenCalledTimes(0);
    });

    it('returns false without saving if user is inactive', async () => {
      mockUser.isActive = false;

      const result = await tokenService.validateRefreshToken(mockUser._id.toString(), 'any-token');

      expect(result).toBe(false);
      expect(saveMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('rotateRefreshToken', () => {
    it('rotates refresh token with exactly ONE save() call instead of separate delete & store saves', async () => {
      const oldToken = 'old-refresh-token';
      const hashedOldToken = await bcrypt.hash(oldToken, 10);
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      mockUser.refreshTokens = [
        {
          token: hashedOldToken,
          expiresAt: futureDate,
          createdAt: new Date(),
        },
      ];

      const payload = {
        userId: mockUser._id.toString(),
        email: 'student@test.com',
        role: 'student',
      };

      const result = await tokenService.rotateRefreshToken(
        mockUser._id.toString(),
        oldToken,
        payload,
        { deviceInfo: 'Firefox on Linux' }
      );

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe(oldToken);

      // Verify that save() was called exactly ONCE (batched)
      expect(saveMock).toHaveBeenCalledTimes(1);

      // Verify user document was queried only ONCE
      expect(User.findById).toHaveBeenCalledTimes(1);

      // Verify token list contains the new token and old token was removed
      expect(mockUser.refreshTokens).toHaveLength(1);
      const isOldMatch = await bcrypt.compare(oldToken, mockUser.refreshTokens[0].token);
      expect(isOldMatch).toBe(false);
      const isNewMatch = await bcrypt.compare(result.refreshToken, mockUser.refreshTokens[0].token);
      expect(isNewMatch).toBe(true);
      expect(mockUser.refreshTokens[0].deviceInfo).toBe('Firefox on Linux');
    });

    it('throws error if old refresh token is invalid and does not save', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      mockUser.refreshTokens = [
        {
          token: await bcrypt.hash('different-token', 10),
          expiresAt: futureDate,
          createdAt: new Date(),
        },
      ];

      await expect(
        tokenService.rotateRefreshToken(
          mockUser._id.toString(),
          'unmatched-token',
          { userId: mockUser._id.toString(), email: 'test@test.com', role: 'student' }
        )
      ).rejects.toThrow('Invalid refresh token');

      expect(saveMock).not.toHaveBeenCalled();
    });
  });
});
