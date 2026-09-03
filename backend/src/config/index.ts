import dotenv from 'dotenv';
import { envUtil } from '@/common/utils/env.util';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'COOKIE_SECRET',
  'FRONTEND_URL',
];

envUtil.validateEnvVars(requiredEnvVars);

export const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),

  // Database
  MONGODB_URI: process.env.MONGODB_URI!,
  MONGODB_TEST_URI: process.env.MONGODB_TEST_URI || process.env.MONGODB_URI!,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Redis
  REDIS_URL: process.env.REDIS_URL,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_MAX_RETRIES: parseInt(process.env.REDIS_MAX_RETRIES || '5', 10),

  // Email
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,

  // Frontend & CORS
  FRONTEND_URL: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000'),
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000'))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  // Rate Limiting
  RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED !== 'false',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
  AUTH_RATE_LIMIT_WINDOW_MS: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10),
  AUTH_RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '10', 10),
  PASSWORD_RESET_RATE_LIMIT_WINDOW_MS: parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW_MS || '3600000', 10),
  PASSWORD_RESET_RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_MAX_REQUESTS || '10', 10),

  // Security
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  COOKIE_SECRET: process.env.COOKIE_SECRET!,

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  // Enable writing logs to rotating files. Defaults to on in production.
  LOG_TO_FILE: process.env.LOG_TO_FILE
    ? process.env.LOG_TO_FILE === 'true'
    : process.env.NODE_ENV === 'production',
  // Directory where log files are written (relative paths resolve from cwd).
  LOG_DIR: process.env.LOG_DIR || 'logs',
  // Max size of a single log file before rotation (e.g. '20m', '100k').
  LOG_MAX_SIZE: process.env.LOG_MAX_SIZE || '20m',
  // How long to retain rotated files (e.g. '14d', '30d') or a file count.
  LOG_MAX_FILES: process.env.LOG_MAX_FILES || '14d',
  // Gzip rotated log files to save disk space.
  LOG_ZIP_ARCHIVE: process.env.LOG_ZIP_ARCHIVE
    ? process.env.LOG_ZIP_ARCHIVE === 'true'
    : true,

  // Swagger
  SWAGGER_ENABLED: process.env.SWAGGER_ENABLED === 'true',
  SWAGGER_PATH: process.env.SWAGGER_PATH || '/api-docs',
  SWAGGER_AUTO_PATH: process.env.SWAGGER_AUTO_PATH || '/api-docs-auto',
  SWAGGER_USER: process.env.SWAGGER_USER || 'admin',
  SWAGGER_PASSWORD: process.env.SWAGGER_PASSWORD || '',
  SWAGGER_REQUIRE_AUTH:
    process.env.SWAGGER_REQUIRE_AUTH === 'true' ||
    (process.env.SWAGGER_REQUIRE_AUTH !== 'false' && process.env.NODE_ENV === 'production'),

  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
};


export default config;
