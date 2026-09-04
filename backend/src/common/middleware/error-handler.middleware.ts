import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger.util';
import { config } from '../../config';

/**
 * Global error handling middleware
 * Catches all errors and formats them consistently
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let isOperational = false;
  let details: unknown;

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    isOperational = err.isOperational;
    // Some operational errors (e.g. cohort limit) carry structured details the
    // client needs; surface them on the response when present.
    if ('details' in err && (err as { details?: unknown }).details !== undefined) {
      details = (err as { details?: unknown }).details;
    }
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = err.message;
    isOperational = true;
  }

  // Handle Mongoose duplicate key errors
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_ERROR';
    const field = Object.keys((err as any).keyPattern)[0];
    message = `${field} already exists`;
    isOperational = true;
  }

  // Handle Mongoose cast errors
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
    isOperational = true;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid token';
    isOperational = true;
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token has expired';
    isOperational = true;
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError' || (err as any).code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    code = (err as any).code || 'FILE_UPLOAD_ERROR';
    message =
      (err as any).code === 'LIMIT_FILE_SIZE'
        ? 'File size exceeds the allowed limit (max 5MB)'
        : err.message || 'File upload failed';
    isOperational = true;
  }

  // Log error
  const logMessage = `[${code}] ${message} - ${req.method} ${req.path}`;

  if (isOperational) {
    logger.warn(logMessage, {
      statusCode,
      code,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.error(logMessage, {
      statusCode,
      code,
      path: req.path,
      method: req.method,
      ip: req.ip,
      stack: err.stack,
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      ...(details !== undefined && { details }),
      ...(config.NODE_ENV === 'development' && {
        stack: err.stack,
      }),
    },
  });
};

/**
 * Checks whether an error/rejection is critical (fatal to system operations).
 * Operational errors (e.g. AppError with isOperational=true) or standard non-critical errors are non-fatal.
 */
export const isCriticalError = (reason: unknown): boolean => {
  if (!reason) return false;

  // AppError with explicit operational flag
  if (reason instanceof AppError) {
    return !reason.isOperational;
  }

  // Any custom object with isOperational=false or isFatal=true
  if (typeof reason === 'object' && reason !== null) {
    const err = reason as Record<string, unknown>;
    if (err.isOperational === false || err.isFatal === true) {
      return true;
    }
  }

  return false;
};

/**
 * Handle unhandled promise rejections.
 * Distinguishes between critical (fatal) vs non-critical rejections.
 * Non-critical rejections are logged without exiting the process.
 * Critical rejections log a critical error and exit the process.
 */
export const handleUnhandledRejection = (reason: unknown, promise?: Promise<unknown>): void => {
  if (isCriticalError(reason)) {
    logger.error('Critical Unhandled Rejection - terminating process:', { reason, promise });
    process.exit(1);
  } else {
    logger.error('Unhandled Rejection (non-critical, continuing process execution):', {
      reason: reason instanceof Error ? { message: reason.message, stack: reason.stack } : reason,
      promise,
    });
  }
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtException = (error: Error): void => {
  logger.error('Uncaught Exception:', error);
  // Perform cleanup and exit
  process.exit(1);
};
