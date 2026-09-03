/// <reference path="./common/types/express.d.ts" />

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { logger } from './common/utils/logger.util';
import { NotFoundError } from './common/errors/NotFoundError';
import { errorHandler } from './common/middleware/error-handler.middleware';
import { apiLimiter, sanitizeInput, requestLogger, swaggerAuthGuard } from './common/middleware';
import routes from './routes/v1';
import { swaggerSpec } from './config/swagger.config';
import swaggerOutputAuto from './config/swagger-output.json';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';
import { redisConfig } from './config/redis.config';

// Create Express app
const app: Application = express();

// Trust proxy for correct IP identification behind reverse proxies (Vercel, Railway, Nginx, etc.)
app.set('trust proxy', true);

const allowedOrigins = config.ALLOWED_ORIGINS.length > 0 ? config.ALLOWED_ORIGINS : [config.FRONTEND_URL];

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`Origin '${origin}' not allowed by CORS`));
    },
    credentials: true, // CRITICAL: Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie'],
  })
);

// Body parsing middleware (must precede body-dependent sanitizers)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(config.COOKIE_SECRET));

// Prevent NoSQL query injection on parsed body, query, and params
app.use(mongoSanitize());

// Input sanitization (XSS mitigation, null-byte removal, string trimming, prototype pollution defense)
app.use(sanitizeInput);

// Rate limiting middleware
app.use('/api/', apiLimiter);

// Request logging middleware (filtered; logs at http level)
app.use(requestLogger);

// Optional: Auto-refresh middleware for seamless token rotation
// Uncomment to enable automatic token refresh when access token is about to expire
// import { autoRefreshToken } from './common/middleware/auto-refresh.middleware';
// app.use(autoRefreshToken);

// Swagger documentation (conditional based on config)
if (config.SWAGGER_ENABLED) {
  // Manual detailed documentation
  app.use(
    config.SWAGGER_PATH,
    swaggerAuthGuard,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'GrowthCraft API Docs',
    })
  );

  // Auto-generated documentation
  app.use(
    config.SWAGGER_AUTO_PATH,
    swaggerAuthGuard,
    swaggerUi.serve,
    swaggerUi.setup(swaggerOutputAuto, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'GrowthCraft API Docs (Auto)',
    })
  );

  // Swagger JSON endpoint
  app.get('/api-docs.json', swaggerAuthGuard, (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  logger.info(
    `Swagger docs enabled at ${config.SWAGGER_PATH} and ${config.SWAGGER_AUTO_PATH} (auth required: ${config.SWAGGER_REQUIRE_AUTH || config.NODE_ENV === 'production'})`
  );
}

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const dbConnected = mongoose.connection.readyState === 1;
  const redisConnected = redisConfig.getConnectionStatus();

  // If REDIS_URL is not set, we bypass redis connection check
  const isHealthy = dbConnected && (!process.env.REDIS_URL || redisConnected);
  const status = isHealthy ? 200 : 500;

  res.status(status).json({
    success: isHealthy,
    message: isHealthy ? 'Server is healthy' : 'Server is unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbConnected ? 'connected' : 'disconnected',
      redis: redisConnected ? 'connected' : 'disconnected',
    },
  });
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/v1', routes);

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(NotFoundError.route());
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
