import { Request, Response, NextFunction } from 'express';
import { EventEmitter } from 'events';
import { requestLogger, shouldSkipRequestLogging } from '../common/middleware/request-logger.middleware';
import { logger } from '../common/utils/logger.util';

describe('Request Logger Middleware Unit Tests', () => {
  describe('shouldSkipRequestLogging', () => {
    it('should skip health check paths', () => {
      expect(shouldSkipRequestLogging('/health')).toBe(true);
      expect(shouldSkipRequestLogging('/health/')).toBe(true);
      expect(shouldSkipRequestLogging('/health?service=redis')).toBe(true);
      expect(shouldSkipRequestLogging('/healthz')).toBe(true);
      expect(shouldSkipRequestLogging('/ping')).toBe(true);
    });

    it('should skip static uploads and browser assets', () => {
      expect(shouldSkipRequestLogging('/favicon.ico')).toBe(true);
      expect(shouldSkipRequestLogging('/robots.txt')).toBe(true);
      expect(shouldSkipRequestLogging('/uploads/avatars/user-1.jpg')).toBe(true);
      expect(shouldSkipRequestLogging('/uploads/documents/certificate.pdf')).toBe(true);
    });

    it('should skip swagger documentation asset paths', () => {
      expect(shouldSkipRequestLogging('/api-docs')).toBe(true);
      expect(shouldSkipRequestLogging('/api-docs/')).toBe(true);
      expect(shouldSkipRequestLogging('/api-docs/swagger-ui.css')).toBe(true);
      expect(shouldSkipRequestLogging('/api-docs-auto')).toBe(true);
      expect(shouldSkipRequestLogging('/api-docs-auto/index.html')).toBe(true);
    });

    it('should NOT skip valid business/API routes', () => {
      expect(shouldSkipRequestLogging('/api/v1/auth/login')).toBe(false);
      expect(shouldSkipRequestLogging('/api/v1/courses')).toBe(false);
      expect(shouldSkipRequestLogging('/api/v1/bootcamps?category=tech')).toBe(false);
      expect(shouldSkipRequestLogging('/api/v1/students/me')).toBe(false);
    });

    it('should accept an Express Request object', () => {
      const mockReqHealth = { path: '/health', originalUrl: '/health' } as Request;
      const mockReqApi = { path: '/api/v1/leads', originalUrl: '/api/v1/leads?source=web' } as Request;

      expect(shouldSkipRequestLogging(mockReqHealth)).toBe(true);
      expect(shouldSkipRequestLogging(mockReqApi)).toBe(false);
    });

    it('should handle empty or undefined path gracefully', () => {
      expect(shouldSkipRequestLogging('')).toBe(false);
      expect(shouldSkipRequestLogging({} as Request)).toBe(false);
    });
  });

  describe('requestLogger middleware execution', () => {
    let mockReq: Partial<Request>;
    let mockRes: EventEmitter & { statusCode: number };
    let next: NextFunction;
    let loggerHttpSpy: jest.SpyInstance;
    let loggerInfoSpy: jest.SpyInstance;

    beforeEach(() => {
      mockRes = Object.assign(new EventEmitter(), {
        statusCode: 200,
      });
      next = jest.fn();
      loggerHttpSpy = jest.spyOn(logger, 'http').mockImplementation(() => logger);
      loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation(() => logger);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call next() without logging for skipped paths like /health', () => {
      mockReq = {
        method: 'GET',
        path: '/health',
        originalUrl: '/health',
      };

      requestLogger(mockReq as Request, mockRes as unknown as Response, next);

      expect(next).toHaveBeenCalledTimes(1);

      // Simulate response finish
      mockRes.emit('finish');

      expect(loggerHttpSpy).not.toHaveBeenCalled();
      expect(loggerInfoSpy).not.toHaveBeenCalled();
    });

    it('should call next() without logging for static uploads', () => {
      mockReq = {
        method: 'GET',
        path: '/uploads/sample.png',
        originalUrl: '/uploads/sample.png',
      };

      requestLogger(mockReq as Request, mockRes as unknown as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      mockRes.emit('finish');

      expect(loggerHttpSpy).not.toHaveBeenCalled();
      expect(loggerInfoSpy).not.toHaveBeenCalled();
    });

    it('should log via logger.http on finish for standard API requests (not logger.info)', () => {
      mockReq = {
        method: 'POST',
        path: '/api/v1/auth/login',
        originalUrl: '/api/v1/auth/login',
      };
      mockRes.statusCode = 200;

      requestLogger(mockReq as Request, mockRes as unknown as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      // Not logged yet before finish
      expect(loggerHttpSpy).not.toHaveBeenCalled();

      // Trigger finish
      mockRes.emit('finish');

      expect(loggerHttpSpy).toHaveBeenCalledTimes(1);
      expect(loggerInfoSpy).not.toHaveBeenCalled();

      const logMessage = loggerHttpSpy.mock.calls[0][0];
      expect(logMessage).toContain('POST /api/v1/auth/login 200 - ');
      expect(logMessage).toMatch(/\d+ms$/);
    });

    it('should log with originalUrl if query params are present', () => {
      mockReq = {
        method: 'GET',
        path: '/api/v1/courses',
        originalUrl: '/api/v1/courses?page=1&limit=10',
      };
      mockRes.statusCode = 404;

      requestLogger(mockReq as Request, mockRes as unknown as Response, next);
      mockRes.emit('finish');

      expect(loggerHttpSpy).toHaveBeenCalledTimes(1);
      expect(loggerHttpSpy.mock.calls[0][0]).toContain('GET /api/v1/courses?page=1&limit=10 404 - ');
    });
  });
});
