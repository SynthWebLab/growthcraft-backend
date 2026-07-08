import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { SuccessResponseHelper } from '@/common/responses/success.response';
import { ValidationError } from '@/common/errors/ValidationError';
import { logger } from '@/common/utils/logger.util';

// Configure Cloudinary if credentials exist
const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  logger.info('Cloudinary configured successfully for image uploads.');
} else {
  logger.warn('Cloudinary credentials missing in env. Local uploads fallback will be used.');
}

export class UploadController {
  private static instance: UploadController;

  private constructor() {}

  public static getInstance(): UploadController {
    if (!UploadController.instance) {
      UploadController.instance = new UploadController();
    }
    return UploadController.instance;
  }

  /**
   * POST /api/v1/admin/upload
   * Upload image to Cloudinary (or local fallback)
   */
  public async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new ValidationError('No image file provided');
      }

      // Check if file is an image
      const allowedTypes = /jpeg|jpg|png|webp|gif/;
      const mimeType = allowedTypes.test(req.file.mimetype);
      const extName = allowedTypes.test(path.extname(req.file.originalname).toLowerCase());

      if (!mimeType || !extName) {
        throw new ValidationError('Only image files are allowed (jpeg, jpg, png, webp, gif)');
      }

      let fileUrl = '';

      if (isCloudinaryConfigured) {
        try {
          // Upload to Cloudinary using buffer stream
          const result = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: 'growthcraft/images',
                resource_type: 'image',
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            uploadStream.end(req.file!.buffer);
          });
          fileUrl = result.secure_url;
          logger.info(`Image uploaded to Cloudinary: ${fileUrl}`);
        } catch (err: any) {
          logger.error('Cloudinary upload failed, switching to local upload fallback:', err);
        }
      }

      // Local fallback if Cloudinary is not configured or failed
      if (!fileUrl) {
        const uploadDir = path.join(__dirname, '../../../../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = `${Date.now()}-${slugifyFilename(req.file.originalname)}`;
        const filePath = path.join(uploadDir, fileName);

        fs.writeFileSync(filePath, req.file.buffer);
        fileUrl = `/uploads/${fileName}`;
        logger.info(`Image saved locally: ${fileUrl}`);
      }

      SuccessResponseHelper.ok(res, { url: fileUrl }, 'Image uploaded successfully');
    } catch (error) {
      logger.error('Error uploading image:', error);
      next(error);
    }
  }
}

// Simple slugify for filename
const slugifyFilename = (name: string): string => {
  const ext = path.extname(name);
  const base = path.basename(name, ext);
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-');
  return `${slug}${ext}`;
};

export const uploadController = UploadController.getInstance();
