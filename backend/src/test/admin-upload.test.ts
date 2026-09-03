import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { upload, ADMIN_UPLOAD_MAX_FILE_SIZE } from '@/modules/admin/routes/admin.routes';
import { errorHandler } from '@/common/middleware/error-handler.middleware';

describe('Admin File Upload Security & Size Limit Tests', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();

    // Setup a test endpoint using the admin upload middleware
    app.post(
      '/api/v1/admin/test-upload',
      upload.single('file'),
      (req: Request, res: Response) => {
        res.status(200).json({
          success: true,
          file: {
            originalname: req.file?.originalname,
            mimetype: req.file?.mimetype,
            size: req.file?.size,
          },
        });
      }
    );

    // Global error handler
    app.use(errorHandler);
  });

  describe('Configuration', () => {
    it('should have ADMIN_UPLOAD_MAX_FILE_SIZE configured to 5MB', () => {
      expect(ADMIN_UPLOAD_MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
    });
  });

  describe('File Size Limit Enforcement', () => {
    it('should accept an image within the 5MB limit', async () => {
      // 500 KB dummy PNG
      const smallBuffer = Buffer.alloc(500 * 1024, 'a');

      const response = await request(app)
        .post('/api/v1/admin/test-upload')
        .attach('file', smallBuffer, {
          filename: 'valid-image.png',
          contentType: 'image/png',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.file.originalname).toBe('valid-image.png');
      expect(response.body.file.size).toBe(500 * 1024);
    });

    it('should reject a file exceeding the 5MB size limit with 400 Bad Request', async () => {
      // 6 MB buffer (exceeds 5MB limit)
      const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024, 'a');

      const response = await request(app)
        .post('/api/v1/admin/test-upload')
        .attach('file', oversizedBuffer, {
          filename: 'oversized-image.png',
          contentType: 'image/png',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('LIMIT_FILE_SIZE');
      expect(response.body.error.message).toMatch(/limit/i);
    });
  });

  describe('MIME Type / File Extension Filtering', () => {
    it('should reject non-image file extensions (e.g. .pdf) with 400 Bad Request', async () => {
      const pdfBuffer = Buffer.alloc(10 * 1024, 'dummy pdf content');

      const response = await request(app)
        .post('/api/v1/admin/test-upload')
        .attach('file', pdfBuffer, {
          filename: 'document.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toMatch(/Only image files are allowed/);
    });

    it('should reject executable or script files (e.g. .exe)', async () => {
      const exeBuffer = Buffer.alloc(10 * 1024, 'dummy exe');

      const response = await request(app)
        .post('/api/v1/admin/test-upload')
        .attach('file', exeBuffer, {
          filename: 'malicious.exe',
          contentType: 'application/x-msdownload',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should accept valid image types (jpeg, webp, gif)', async () => {
      const imgBuffer = Buffer.alloc(50 * 1024, 'img');

      // Test JPEG
      const resJpg = await request(app)
        .post('/api/v1/admin/test-upload')
        .attach('file', imgBuffer, {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        });
      expect(resJpg.status).toBe(200);

      // Test WebP
      const resWebp = await request(app)
        .post('/api/v1/admin/test-upload')
        .attach('file', imgBuffer, {
          filename: 'graphic.webp',
          contentType: 'image/webp',
        });
      expect(resWebp.status).toBe(200);

      // Test GIF
      const resGif = await request(app)
        .post('/api/v1/admin/test-upload')
        .attach('file', imgBuffer, {
          filename: 'animation.gif',
          contentType: 'image/gif',
        });
      expect(resGif.status).toBe(200);
    });
  });
});
