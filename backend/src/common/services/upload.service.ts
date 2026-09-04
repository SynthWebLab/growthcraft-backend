import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { logger } from '@/common/utils/logger.util';
import { ValidationError } from '@/common/errors/ValidationError';
import { config } from '@/config';

// Configure Cloudinary if credentials exist
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  logger.info('Cloudinary configured successfully in upload service.');
} else {
  logger.warn('Cloudinary credentials missing in env. Local uploads fallback will be used.');
}

const slugifyFilename = (name: string): string => {
  const ext = path.extname(name);
  const base = path.basename(name, ext);
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'file'}${ext.toLowerCase()}`;
};

export class UploadService {
  private static instance: UploadService;

  private constructor() {}

  public static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService();
    }
    return UploadService.instance;
  }

  /**
   * Upload an image buffer to Cloudinary (with local disk fallback)
   */
  public async uploadImage(
    buffer: Buffer,
    originalname: string,
    folder: string = 'growthcraft/avatars'
  ): Promise<string> {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const ext = path.extname(originalname).toLowerCase().replace('.', '');

    if (!allowedTypes.test(ext)) {
      throw new ValidationError('Only image files are allowed (jpeg, jpg, png, webp, gif)');
    }

    let fileUrl = '';

    // 1. Try Cloudinary if configured
    if (isCloudinaryConfigured) {
      try {
        const result = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: 'image',
            },
            (error, res) => {
              if (error) reject(error);
              else resolve(res);
            }
          );
          uploadStream.end(buffer);
        });

        fileUrl = result.secure_url;
        logger.info(`Image uploaded to Cloudinary: ${fileUrl}`);
        return fileUrl;
      } catch (err: any) {
        logger.error('Cloudinary upload failed, switching to local upload fallback:', err);
      }
    }

    // 2. Local fallback
    const uploadDir = path.join(__dirname, '../../../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${slugifyFilename(originalname)}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const backendUrl = process.env.BACKEND_URL || `http://localhost:${config.PORT || 5002}`;
    fileUrl = `${backendUrl}/uploads/${fileName}`;
    logger.info(`Image saved locally: ${fileUrl}`);

    return fileUrl;
  }
}

export const uploadService = UploadService.getInstance();
