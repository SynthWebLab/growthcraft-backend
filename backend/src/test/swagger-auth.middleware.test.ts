import { Request, Response, NextFunction } from 'express';
import {
  swaggerAuth,
  swaggerAuthGuard,
  isSwaggerAuthRequired,
  safeCompare,
} from '../common/middleware/swagger-auth.middleware';
import { config } from '../config';
import { jwtConfig } from '../config/jwt.config';
import { UserRole } from '../common/constants/user.constants';
import { redisTokenService } from '../modules/auth/services/redis-token.service';
import { logger } from '../common/utils/logger.util';

describe('Swagger Authentication Middleware (GC-293 / GC-318)', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalSwaggerAuth = config.SWAGGER_REQUIRE_AUTH;
  const originalSwaggerUser = config.SWAGGER_USER;
  const originalSwaggerPass = config.SWAGGER_PASSWORD;

  beforeEach(() => {
    jest.clearAllMocks();
    config.NODE_ENV = 'development';
    config.SWAGGER_REQUIRE_AUTH = false;
    config.SWAGGER_USER = 'admin';
    config.SWAGGER_PASSWORD = '';
  });

  afterAll(() => {
    config.NODE_ENV = originalEnv || 'test';
    config.SWAGGER_REQUIRE_AUTH = originalSwaggerAuth;
    config.SWAGGER_USER = originalSwaggerUser;
    config.SWAGGER_PASSWORD = originalSwaggerPass;
  });

  describe('safeCompare utility', () => {
    it('should return true for identical strings', () => {
      expect(safeCompare('secret_pass_123', 'secret_pass_123')).toBe(true);
    });

    it('should return false for different strings of same length', () => {
      expect(safeCompare('secret_pass_123', 'secret_pass_456')).toBe(false);
    });

    it('should return false for different strings of different length', () => {
      expect(safeCompare('short', 'much_longer_string')).toBe(false);
    });

    it('should safely handle non-string inputs', () => {
      expect(safeCompare(null as any, 'string')).toBe(false);
      expect(safeCompare('string', undefined as any)).toBe(false);
    });
  });

  describe('isSwaggerAuthRequired policy', () => {
    it('must ALWAYS require authentication in production', () => {
      config.NODE_ENV = 'production';
      config.SWAGGER_REQUIRE_AUTH = false;
      config.SWAGGER_PASSWORD = '';

      expect(isSwaggerAuthRequired()).toBe(true);
    });

    it('should not require auth in non-production when no auth or password is set', () => {
      config.NODE_ENV = 'development';
      config.SWAGGER_REQUIRE_AUTH = false;
      config.SWAGGER_PASSWORD = '';

      expect(isSwaggerAuthRequired()).toBe(false);
    });

    it('should require auth in development if SWAGGER_REQUIRE_AUTH is true', () => {
      config.NODE_ENV = 'development';
      config.SWAGGER_REQUIRE_AUTH = true;
      config.SWAGGER_PASSWORD = '';

      expect(isSwaggerAuthRequired()).toBe(true);
    });

    it('should require auth in development if SWAGGER_PASSWORD is configured', () => {
      config.NODE_ENV = 'development';
      config.SWAGGER_REQUIRE_AUTH = false;
      config.SWAGGER_PASSWORD = 'super-secret-password';

      expect(isSwaggerAuthRequired()).toBe(true);
    });
  });

  describe('swaggerAuth middleware execution', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let next: NextFunction;
    let setHeaderMock: jest.Mock;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
      setHeaderMock = jest.fn().mockReturnThis();
      jsonMock = jest.fn().mockReturnThis();
      statusMock = jest.fn().mockReturnValue({ json: jsonMock });

      mockRes = {
        set: setHeaderMock,
        status: statusMock,
      };

      mockReq = {
        headers: {},
        cookies: {},
      };

      next = jest.fn();
    });

    it('should allow access immediately when auth is not required', async () => {
      config.NODE_ENV = 'development';
      config.SWAGGER_REQUIRE_AUTH = false;
      config.SWAGGER_PASSWORD = '';

      await swaggerAuth(mockReq as Request, mockRes as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should challenge with 401 and WWW-Authenticate when unauthenticated', async () => {
      config.NODE_ENV = 'production'; // Auth mandatory
      config.SWAGGER_PASSWORD = 'prod-password-123';

      await swaggerAuth(mockReq as Request, mockRes as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(setHeaderMock).toHaveBeenCalledWith(
        'WWW-Authenticate',
        'Basic realm="GrowthCraft API Documentation", charset="UTF-8"'
      );
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'SWAGGER_AUTH_REQUIRED',
          }),
        })
      );
    });

    it('should log security alert when accessed in production without SWAGGER_PASSWORD configured', async () => {
      config.NODE_ENV = 'production';
      config.SWAGGER_PASSWORD = '';
      const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => logger);

      await swaggerAuth(mockReq as Request, mockRes as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY ALERT] Swagger documentation was requested in production')
      );

      warnSpy.mockRestore();
    });

    describe('HTTP Basic Authentication', () => {
      beforeEach(() => {
        config.NODE_ENV = 'production';
        config.SWAGGER_USER = 'docs_admin';
        config.SWAGGER_PASSWORD = 'ValidPassword!123';
      });

      it('should allow access with valid Basic Auth credentials', async () => {
        const credentials = Buffer.from('docs_admin:ValidPassword!123').toString('base64');
        mockReq.headers = {
          authorization: `Basic ${credentials}`,
        };

        await swaggerAuth(mockReq as Request, mockRes as Response, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(statusMock).not.toHaveBeenCalled();
      });

      it('should reject Basic Auth with wrong username', async () => {
        const credentials = Buffer.from('wrong_user:ValidPassword!123').toString('base64');
        mockReq.headers = {
          authorization: `Basic ${credentials}`,
        };

        await swaggerAuth(mockReq as Request, mockRes as Response, next);

        expect(next).not.toHaveBeenCalled();
        expect(statusMock).toHaveBeenCalledWith(401);
      });

      it('should reject Basic Auth with wrong password', async () => {
        const credentials = Buffer.from('docs_admin:WrongPassword').toString('base64');
        mockReq.headers = {
          authorization: `Basic ${credentials}`,
        };

        await swaggerAuth(mockReq as Request, mockRes as Response, next);

        expect(next).not.toHaveBeenCalled();
        expect(statusMock).toHaveBeenCalledWith(401);
      });

      it('should reject Basic Auth if password contains a colon but value is incorrect', async () => {
        const credentials = Buffer.from('docs_admin:colon:in:pass').toString('base64');
        mockReq.headers = {
          authorization: `Basic ${credentials}`,
        };

        await swaggerAuth(mockReq as Request, mockRes as Response, next);

        expect(next).not.toHaveBeenCalled();
        expect(statusMock).toHaveBeenCalledWith(401);
      });

      it('should allow Basic Auth if password itself contains colons and matches', async () => {
        config.SWAGGER_PASSWORD = 'pass:with:multiple:colons';
        const credentials = Buffer.from('docs_admin:pass:with:multiple:colons').toString('base64');
        mockReq.headers = {
          authorization: `Basic ${credentials}`,
        };

        await swaggerAuth(mockReq as Request, mockRes as Response, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(statusMock).not.toHaveBeenCalled();
      });

      it('should reject malformed Basic Auth header without colon', async () => {
        const credentials = Buffer.from('onlyusername').toString('base64');
        mockReq.headers = {
          authorization: `Basic ${credentials}`,
        };

        await swaggerAuth(mockReq as Request, mockRes as Response, next);

        expect(next).not.toHaveBeenCalled();
        expect(statusMock).toHaveBeenCalledWith(401);
      });
    });

    describe('Admin / Ops JWT Authentication', () => {
      beforeEach(() => {
        config.NODE_ENV = 'production';
        config.SWAGGER_PASSWORD = 'some-other-pass';
      });

      it('should allow access for SUPER_ADMIN with cookie access_token', async () => {
        const fakeToken = 'valid.jwt.token';
        mockReq.cookies = { access_token: fakeToken };

        jest.spyOn(jwtConfig, 'verifyAccessToken').mockReturnValue({
          userId: 'admin-123',
          email: 'admin@growthcraft.com',
          role: UserRole.SUPER_ADMIN,
        } as any);

        jest.spyOn(redisTokenService, 'isAccessTokenBlacklisted').mockResolvedValue(false);

        await swaggerAuth(mockReq as Request, mockRes as Response, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(mockReq.user).toEqual({
          userId: 'admin-123',
          email: 'admin@growthcraft.com',
          role: UserRole.SUPER_ADMIN,
        });
        expect(statusMock).not.toHaveBeenCalled();
      });

      it('should allow access for OPS user with Bearer token', async () => {
        const fakeToken = 'ops.jwt.token';
        mockReq.headers = { authorization: `Bearer ${fakeToken}` };

        jest.spyOn(jwtConfig, 'verifyAccessToken').mockReturnValue({
          userId: 'ops-456',
          email: 'ops@growthcraft.com',
          role: UserRole.OPS,
        } as any);

        jest.spyOn(redisTokenService, 'isAccessTokenBlacklisted').mockResolvedValue(false);

        await swaggerAuth(mockReq as Request, mockRes as Response, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(mockReq.user?.role).toBe(UserRole.OPS);
        expect(statusMock).not.toHaveBeenCalled();
      });

      it('should reject non-admin roles (e.g. STUDENT) and return 401 challenge', async () => {
        const fakeToken = 'student.jwt.token';
        mockReq.cookies = { access_token: fakeToken };

        jest.spyOn(jwtConfig, 'verifyAccessToken').mockReturnValue({
          userId: 'student-789',
          email: 'student@growthcraft.com',
          role: UserRole.STUDENT,
        } as any);

        await swaggerAuth(mockReq as Request, mockRes as Response, next);

        expect(next).not.toHaveBeenCalled();
        expect(statusMock).toHaveBeenCalledWith(401);
      });

      it('should reject blacklisted admin token', async () => {
        const fakeToken = 'revoked.jwt.token';
        mockReq.cookies = { access_token: fakeToken };

        jest.spyOn(jwtConfig, 'verifyAccessToken').mockReturnValue({
          userId: 'admin-123',
          email: 'admin@growthcraft.com',
          role: UserRole.SUPER_ADMIN,
        } as any);

        jest.spyOn(redisTokenService, 'isAccessTokenBlacklisted').mockResolvedValue(true);

        await swaggerAuth(mockReq as Request, mockRes as Response, next);

        expect(next).not.toHaveBeenCalled();
        expect(statusMock).toHaveBeenCalledWith(401);
      });
    });

    describe('Express Route End-to-End Integration', () => {
      let testApp: any;

      beforeEach(async () => {
        config.NODE_ENV = 'production';
        config.SWAGGER_USER = 'docs_user';
        config.SWAGGER_PASSWORD = 'SecuredPassword!999';

        const express = (await import('express')).default;
        const cookieParser = (await import('cookie-parser')).default;

        testApp = express();
        testApp.use(express.json());
        testApp.use(cookieParser());

        testApp.get('/api-docs', swaggerAuthGuard, (_req: any, res: any) => res.status(200).send('<html>Swagger UI</html>'));
        testApp.get('/api-docs-auto', swaggerAuthGuard, (_req: any, res: any) => res.status(200).send('<html>Swagger Auto UI</html>'));
        testApp.get('/api-docs.json', swaggerAuthGuard, (_req: any, res: any) => res.status(200).json({ openapi: '3.0.0' }));
      });

      it('should block unauthenticated GET /api-docs with 401', async () => {
        const request = (await import('supertest')).default;
        const res = await request(testApp).get('/api-docs');
        expect(res.status).toBe(401);
        expect(res.headers['www-authenticate']).toContain('Basic realm="GrowthCraft API Documentation"');
      });

      it('should block unauthenticated GET /api-docs-auto with 401', async () => {
        const request = (await import('supertest')).default;
        const res = await request(testApp).get('/api-docs-auto');
        expect(res.status).toBe(401);
      });

      it('should block unauthenticated GET /api-docs.json with 401', async () => {
        const request = (await import('supertest')).default;
        const res = await request(testApp).get('/api-docs.json');
        expect(res.status).toBe(401);
      });

      it('should allow GET /api-docs with valid Basic Auth', async () => {
        const request = (await import('supertest')).default;
        const res = await request(testApp)
          .get('/api-docs')
          .auth('docs_user', 'SecuredPassword!999');
        expect(res.status).toBe(200);
        expect(res.text).toBe('<html>Swagger UI</html>');
      });

      it('should allow GET /api-docs.json with valid Basic Auth', async () => {
        const request = (await import('supertest')).default;
        const res = await request(testApp)
          .get('/api-docs.json')
          .auth('docs_user', 'SecuredPassword!999');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ openapi: '3.0.0' });
      });
    });
  });
});

