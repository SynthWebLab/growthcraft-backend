import { Request, Response, NextFunction } from 'express';

/**
 * Sanitizes a string value by:
 * 1. Removing null bytes (\0) to prevent null-byte injection attacks
 * 2. Stripping dangerous script and executable HTML tags (XSS mitigation)
 * 3. Stripping inline event handlers (e.g., onload=, onerror=) and javascript: URLs
 * 4. Trimming leading and trailing whitespace
 */
export function sanitizeString(value: string): string {
  if (typeof value !== 'string') return value;

  let sanitized = value.replace(/\0/g, '');

  // Strip <script>...</script> tags and content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Strip dangerous HTML tags
  sanitized = sanitized.replace(/<\/?(iframe|object|embed|applet|meta|link|style)[^>]*>/gi, '');

  // Strip javascript: and vbscript: URIs
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  sanitized = sanitized.replace(/vbscript\s*:/gi, '');

  // Strip inline event handlers (e.g. onerror=, onclick=, onload=)
  sanitized = sanitized.replace(/\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

  return sanitized.trim();
}

/**
 * Recursively sanitizes data (strings, objects, arrays)
 * Prevents prototype pollution by skipping __proto__, constructor, and prototype keys.
 */
export function sanitizeValue<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return sanitizeString(data) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeValue(item)) as unknown as T;
  }

  if (
    typeof data === 'object' &&
    !(data instanceof Date) &&
    !(data instanceof RegExp) &&
    !Buffer.isBuffer(data)
  ) {
    const sanitizedObj: Record<string, any> = {};

    for (const key of Object.keys(data)) {
      // Guard against prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      sanitizedObj[key] = sanitizeValue((data as Record<string, any>)[key]);
    }

    return sanitizedObj as T;
  }

  return data;
}

/**
 * Express middleware to sanitize req.body, req.query, and req.params
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeValue(req.body);
    }

    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeValue(req.query);
    }

    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeValue(req.params);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default sanitizeInput;
