import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.util';

/**
 * Exact paths that should be excluded from request logging
 * to prevent high-frequency log pollution and unnecessary I/O overhead.
 */
const IGNORED_PATHS = new Set([
  '/health',
  '/healthz',
  '/ping',
  '/favicon.ico',
  '/robots.txt',
]);

/**
 * Path prefixes that should be excluded from request logging (e.g. static assets, swagger docs).
 */
const IGNORED_PREFIXES = [
  '/uploads',
  '/api-docs',
  '/api-docs-auto',
];

/**
 * Determines whether a request should be excluded from request logging.
 *
 * @param reqOrPath - Express Request object or request path string
 * @returns true if logging should be skipped, false otherwise
 */
export const shouldSkipRequestLogging = (reqOrPath: Request | string): boolean => {
  const rawPath = typeof reqOrPath === 'string'
    ? reqOrPath
    : (reqOrPath.path || reqOrPath.originalUrl || '');

  if (!rawPath) return false;

  // Strip query parameters
  const pathWithoutQuery = rawPath.split('?')[0];

  // Normalize trailing slash (e.g. '/health/' -> '/health')
  const cleanPath = pathWithoutQuery.length > 1 && pathWithoutQuery.endsWith('/')
    ? pathWithoutQuery.slice(0, -1)
    : pathWithoutQuery;

  if (IGNORED_PATHS.has(cleanPath)) {
    return true;
  }

  return IGNORED_PREFIXES.some((prefix) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`));
};

/**
 * Request logging middleware.
 *
 * - Skips high-frequency/non-critical endpoints (health checks, static uploads, doc assets).
 * - Logs completed requests at Winston 'http' level (suppressed in production where LOG_LEVEL=info).
 * - Records HTTP method, route/URL, status code, and execution time in ms upon response completion.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  if (shouldSkipRequestLogging(req)) {
    return next();
  }

  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const method = req.method;
    const url = req.originalUrl || req.url || req.path;
    const statusCode = res.statusCode;

    logger.http(`${method} ${url} ${statusCode} - ${duration}ms`);
  });

  next();
};

export default requestLogger;
