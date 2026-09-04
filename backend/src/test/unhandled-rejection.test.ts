import {
  handleUnhandledRejection,
  isCriticalError,
} from '../common/middleware/error-handler.middleware';
import { AppError } from '../common/errors/AppError';
import { logger } from '../common/utils/logger.util';

describe('Unhandled Rejection Handler', () => {
  let exitSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    loggerErrorSpy.mockRestore();
  });

  describe('isCriticalError', () => {
    it('should return false for undefined or null reason', () => {
      expect(isCriticalError(null)).toBe(false);
      expect(isCriticalError(undefined)).toBe(false);
    });

    it('should return false for operational AppError', () => {
      const error = new AppError('Operational error', 400, 'BAD_REQUEST', true);
      expect(isCriticalError(error)).toBe(false);
    });

    it('should return true for non-operational AppError', () => {
      const error = new AppError('Fatal error', 500, 'FATAL', false);
      expect(isCriticalError(error)).toBe(true);
    });

    it('should return true for custom object with isOperational: false', () => {
      expect(isCriticalError({ isOperational: false })).toBe(true);
    });

    it('should return true for custom object with isFatal: true', () => {
      expect(isCriticalError({ isFatal: true })).toBe(true);
    });

    it('should return false for standard Error without fatal flags', () => {
      const error = new Error('Standard non-fatal error');
      expect(isCriticalError(error)).toBe(false);
    });
  });

  describe('handleUnhandledRejection', () => {
    it('should log non-critical rejection and NOT exit process', () => {
      const nonCriticalError = new Error('Email send failed');
      handleUnhandledRejection(nonCriticalError);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unhandled Rejection (non-critical'),
        expect.anything()
      );
      expect(exitSpy).not.toHaveBeenCalled();
    });

    it('should log operational AppError and NOT exit process', () => {
      const operationalError = new AppError('Service unavailable', 503, 'SERVICE_UNAVAILABLE', true);
      handleUnhandledRejection(operationalError);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unhandled Rejection (non-critical'),
        expect.anything()
      );
      expect(exitSpy).not.toHaveBeenCalled();
    });

    it('should log critical rejection and exit process with code 1', () => {
      const fatalError = new AppError('Critical DB crash', 500, 'DB_CRASH', false);
      handleUnhandledRejection(fatalError);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Critical Unhandled Rejection'),
        expect.anything()
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});
