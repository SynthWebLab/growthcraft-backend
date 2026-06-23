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
 * Handle unhandled promise rejections
 */
export const handleUnhandledRejection = (reason: Error, promise: Promise<any>): void => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtException = (error: Error): void => {
  logger.error('Uncaught Exception:', error);
  // Perform cleanup and exit
  process.exit(1);
};
