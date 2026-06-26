/// <reference path="./common/types/express.d.ts" />

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { logger } from './common/utils/logger.util';
import { NotFoundError } from './common/errors/NotFoundError';
import { errorHandler } from './common/middleware/error-handler.middleware';
import { apiLimiter } from './common/middleware/rate-limiter.middleware';
import routes from './routes/v1';
import { swaggerSpec } from './config/swagger.config';
import swaggerOutputAuto from './config/swagger-output.json';

// Create Express app
const app: Application = express();

// Trust proxy for correct IP identification behind reverse proxies (Vercel, Railway, Nginx, etc.)
app.set('trust proxy', true);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true, // CRITICAL: Allow cookies to be sent
  })
);

// Rate limiting middleware
app.use('/api/', apiLimiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(config.COOKIE_SECRET));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Optional: Auto-refresh middleware for seamless token rotation
// Uncomment to enable automatic token refresh when access token is about to expire
// import { autoRefreshToken } from './common/middleware/auto-refresh.middleware';
// app.use(autoRefreshToken);

// Swagger documentation (conditional based on config)
if (config.SWAGGER_ENABLED) {
  // Manual detailed documentation
  app.use(
    config.SWAGGER_PATH,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'GrowthCraft API Docs',
    })
  );

  // Auto-generated documentation
  app.use(
    config.SWAGGER_AUTO_PATH,
    swaggerUi.serve,
    swaggerUi.setup(swaggerOutputAuto, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'GrowthCraft API Docs (Auto)',
    })
  );

  // Swagger JSON endpoint
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  logger.info(`Swagger docs enabled at ${config.SWAGGER_PATH} and ${config.SWAGGER_AUTO_PATH}`);
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/v1', routes);

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(NotFoundError.route());
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
