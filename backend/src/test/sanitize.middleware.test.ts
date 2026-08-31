import { Request, Response, NextFunction } from 'express';
import {
  sanitizeString,
  sanitizeValue,
  sanitizeInput,
} from '../common/middleware/sanitize.middleware';

describe('Sanitize Middleware Unit Tests', () => {
  describe('sanitizeString', () => {
    it('should trim whitespace from strings', () => {
      expect(sanitizeString('   hello world   ')).toBe('hello world');
    });

    it('should strip null bytes to prevent null byte poisoning', () => {
      expect(sanitizeString('user\0_input\0.txt')).toBe('user_input.txt');
    });

    it('should strip <script> tags and embedded script blocks', () => {
      const malicious = 'Hello <script>alert("XSS")</script>World';
      expect(sanitizeString(malicious)).toBe('Hello World');
    });

    it('should strip dangerous tags like iframe, object, embed', () => {
      const malicious = '<iframe src="evil.com"></iframe>Welcome';
      expect(sanitizeString(malicious)).toBe('Welcome');
    });

    it('should strip inline javascript: and vbscript: URIs', () => {
      const malicious = 'javascript:alert(1)';
      expect(sanitizeString(malicious)).toBe('alert(1)');
    });

    it('should strip inline event handlers', () => {
      const malicious = '<img src="avatar.png" onerror="stealCookies()">';
      expect(sanitizeString(malicious)).toBe('<img src="avatar.png">');
    });

    it('should preserve safe strings unaffected', () => {
      const safe = 'John Doe - Software Engineer (B.Tech)';
      expect(sanitizeString(safe)).toBe(safe);
    });
  });

  describe('sanitizeValue', () => {
    it('should handle primitives without error', () => {
      expect(sanitizeValue(null)).toBeNull();
      expect(sanitizeValue(undefined)).toBeUndefined();
      expect(sanitizeValue(12345)).toBe(12345);
      expect(sanitizeValue(true)).toBe(true);
    });

    it('should recursively sanitize nested objects', () => {
      const input = {
        name: '  Alice  ',
        bio: 'Hello <script>danger()</script>',
        profile: {
          website: '  https://growthcraft.in  ',
          phone: '+919999999999',
        },
      };

      const expected = {
        name: 'Alice',
        bio: 'Hello',
        profile: {
          website: 'https://growthcraft.in',
          phone: '+919999999999',
        },
      };

      expect(sanitizeValue(input)).toEqual(expected);
    });

    it('should sanitize arrays', () => {
      const input = ['  tag1  ', '<script>alert(1)</script>tag2', 42];
      expect(sanitizeValue(input)).toEqual(['tag1', 'tag2', 42]);
    });

    it('should protect against prototype pollution keys', () => {
      const pollutedPayload = JSON.parse('{"__proto__": {"isAdmin": true}, "safeField": "  ok  "}');
      const result = sanitizeValue(pollutedPayload);

      expect(result).toEqual({ safeField: 'ok' });
      expect(({} as any).isAdmin).toBeUndefined();
    });
  });

  describe('sanitizeInput middleware', () => {
    it('should sanitize req.body, req.query, and req.params', () => {
      const req: Partial<Request> = {
        body: {
          email: '  test@example.com  ',
          comment: '<script>hack()</script>Great course!',
        },
        query: {
          search: '  offline bootcamps  ',
        } as any,
        params: {
          id: '123\0',
        },
      };

      const res: Partial<Response> = {};
      const next: NextFunction = jest.fn();

      sanitizeInput(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.body).toEqual({
        email: 'test@example.com',
        comment: 'Great course!',
      });
      expect(req.query).toEqual({
        search: 'offline bootcamps',
      });
      expect(req.params).toEqual({
        id: '123',
      });
    });

    it('should gracefully handle empty or undefined body, query, and params', () => {
      const req: Partial<Request> = {};
      const res: Partial<Response> = {};
      const next: NextFunction = jest.fn();

      sanitizeInput(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
