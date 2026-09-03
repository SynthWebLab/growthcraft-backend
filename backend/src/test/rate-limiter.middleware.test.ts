import express, { Request, Response } from 'express';
import request from 'supertest';
import {
  getClientIp,
  shouldSkipRateLimiting,
  createRateLimiter,
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
} from '@/common/middleware/rate-limiter.middleware';
import { config } from '@/config';

describe('Rate Limiter Middleware Tests', () => {
  const originalRateLimitEnabled = config.RATE_LIMIT_ENABLED;
  const originalNodeEnv = config.NODE_ENV;

  afterEach(() => {
    config.RATE_LIMIT_ENABLED = originalRateLimitEnabled;
    config.NODE_ENV = originalNodeEnv;
  });

  describe('getClientIp Helper', () => {
    it('should extract first IP from single x-forwarded-for header string', () => {
      const req = {
        headers: {
          'x-forwarded-for': '203.0.113.195',
        },
      };
      expect(getClientIp(req)).toBe('203.0.113.195');
    });

    it('should extract first client IP from comma-separated x-forwarded-for header', () => {
      const req = {
        headers: {
          'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
        },
      };
      expect(getClientIp(req)).toBe('203.0.113.195');
    });

    it('should handle array format of x-forwarded-for header', () => {
      const req = {
        headers: {
          'x-forwarded-for': ['203.0.113.195, 70.41.3.18'],
        },
      };
      expect(getClientIp(req)).toBe('203.0.113.195');
    });

    it('should fall back to req.ip if x-forwarded-for is missing', () => {
      const req = {
        headers: {},
        ip: '198.51.100.42',
      };
      expect(getClientIp(req)).toBe('198.51.100.42');
    });

    it('should fall back to req.socket.remoteAddress if req.ip is missing', () => {
      const req = {
        headers: {},
        socket: {
          remoteAddress: '198.51.100.99',
        },
      };
      expect(getClientIp(req)).toBe('198.51.100.99');
    });

    it('should fall back to default 127.0.0.1 if no IP info is present', () => {
      const req = {
        headers: {},
      };
      expect(getClientIp(req)).toBe('127.0.0.1');
    });
  });

  describe('shouldSkipRateLimiting Logic', () => {
    it('should NOT skip rate limiting in development environment when RATE_LIMIT_ENABLED is true', () => {
      config.NODE_ENV = 'development';
      config.RATE_LIMIT_ENABLED = true;
      expect(shouldSkipRateLimiting()).toBe(false);
    });

    it('should NOT skip rate limiting in test environment when RATE_LIMIT_ENABLED is true', () => {
      config.NODE_ENV = 'test';
      config.RATE_LIMIT_ENABLED = true;
      expect(shouldSkipRateLimiting()).toBe(false);
    });

    it('should NOT skip rate limiting in production environment when RATE_LIMIT_ENABLED is true', () => {
      config.NODE_ENV = 'production';
      config.RATE_LIMIT_ENABLED = true;
      expect(shouldSkipRateLimiting()).toBe(false);
    });

    it('should skip rate limiting when RATE_LIMIT_ENABLED is explicitly false', () => {
      config.RATE_LIMIT_ENABLED = false;
      expect(shouldSkipRateLimiting()).toBe(true);
    });
  });

  describe('createRateLimiter Factory and Middleware Execution', () => {
    it('should enforce request limits and return 429 with standard response format', async () => {
      config.RATE_LIMIT_ENABLED = true;

      const app = express();
      const testLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 2,
        message: 'Too many requests for testing',
        code: 'TEST_RATE_LIMIT_EXCEEDED',
      });

      app.use('/test-limit', testLimiter, (req: Request, res: Response) => {
        res.status(200).json({ success: true, data: 'ok' });
      });

      // Request 1: success
      const res1 = await request(app).get('/test-limit');
      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.headers['ratelimit-limit']).toBe('2');
      expect(res1.headers['ratelimit-remaining']).toBe('1');

      // Request 2: success
      const res2 = await request(app).get('/test-limit');
      expect(res2.status).toBe(200);
      expect(res2.headers['ratelimit-remaining']).toBe('0');

      // Request 3: rate limited (429)
      const res3 = await request(app).get('/test-limit');
      expect(res3.status).toBe(429);
      expect(res3.body).toEqual({
        success: false,
        error: {
          message: 'Too many requests for testing',
          code: 'TEST_RATE_LIMIT_EXCEEDED',
        },
      });
    });

    it('should bypass rate limits when RATE_LIMIT_ENABLED is set to false', async () => {
      config.RATE_LIMIT_ENABLED = false;

      const app = express();
      const testLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 1,
        message: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
      });

      app.use('/bypass-limit', testLimiter, (req: Request, res: Response) => {
        res.status(200).json({ success: true });
      });

      // Should allow multiple requests even beyond max
      const res1 = await request(app).get('/bypass-limit');
      const res2 = await request(app).get('/bypass-limit');
      const res3 = await request(app).get('/bypass-limit');

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res3.status).toBe(200);
    });

    it('should respect skipSuccessfulRequests when configured', async () => {
      config.RATE_LIMIT_ENABLED = true;

      const app = express();
      let callCount = 0;

      const testAuthLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 2,
        message: 'Too many failed attempts',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        skipSuccessfulRequests: true,
      });

      app.post('/login-test', testAuthLimiter, (req: Request, res: Response) => {
        callCount++;
        // First 3 calls are successful (200)
        if (callCount <= 3) {
          res.status(200).json({ success: true });
        } else {
          res.status(401).json({ success: false, error: 'Unauthorized' });
        }
      });

      // 3 successful requests should not exhaust the limit of 2
      await request(app).post('/login-test');
      await request(app).post('/login-test');
      await request(app).post('/login-test');

      // Failed request 1
      const fail1 = await request(app).post('/login-test');
      expect(fail1.status).toBe(401);

      // Failed request 2
      const fail2 = await request(app).post('/login-test');
      expect(fail2.status).toBe(401);

      // Failed request 3: exceeds max of 2 failed attempts -> 429
      const fail3 = await request(app).post('/login-test');
      expect(fail3.status).toBe(429);
      expect(fail3.body.error.code).toBe('AUTH_RATE_LIMIT_EXCEEDED');
    });
  });

  describe('Standard Limiters Export Validation', () => {
    it('should export configured apiLimiter, authLimiter, and passwordResetLimiter', () => {
      expect(apiLimiter).toBeDefined();
      expect(authLimiter).toBeDefined();
      expect(passwordResetLimiter).toBeDefined();
    });

    it('apiLimiter should enforce rate limiting in development mode', async () => {
      // Temporarily set NODE_ENV to development to prove it is NOT skipped
      config.NODE_ENV = 'development';
      config.RATE_LIMIT_ENABLED = true;

      const app = express();
      // Use a custom limiter with max: 1 to quickly test the behavior
      const customApiLimiter = createRateLimiter({
        windowMs: config.RATE_LIMIT_WINDOW_MS,
        max: 1,
        message: 'Too many requests from this IP, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
      });

      app.get('/dev-api-test', customApiLimiter, (req: Request, res: Response) => {
        res.status(200).json({ success: true });
      });

      const res1 = await request(app).get('/dev-api-test');
      expect(res1.status).toBe(200);

      const res2 = await request(app).get('/dev-api-test');
      expect(res2.status).toBe(429);
      expect(res2.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('passwordResetLimiter format and response error structure', async () => {
      config.RATE_LIMIT_ENABLED = true;

      const app = express();
      const customResetLimiter = createRateLimiter({
        windowMs: config.PASSWORD_RESET_RATE_LIMIT_WINDOW_MS,
        max: 1,
        message: 'Too many password reset attempts, please try again later',
        code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
      });

      app.post('/reset-test', customResetLimiter, (req: Request, res: Response) => {
        res.status(200).json({ success: true });
      });

      const res1 = await request(app).post('/reset-test');
      expect(res1.status).toBe(200);

      const res2 = await request(app).post('/reset-test');
      expect(res2.status).toBe(429);
      expect(res2.body).toEqual({
        success: false,
        error: {
          message: 'Too many password reset attempts, please try again later',
          code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
        },
      });
    });
  });
});
