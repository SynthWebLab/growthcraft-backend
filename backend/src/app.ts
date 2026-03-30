import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { logger } from './common/utils/logger.util';
import { NotFoundError } from './common/errors/NotFoundError';

// Create Express app
const app: Application = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(config.COOKIE_SECRET));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API routes will be added here
// app.use('/api/v1', routes);

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(NotFoundError.route());
});

// Global error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Error: ${err.message}`);

  const statusCode = (err as any).statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: (err as any).code || 'INTERNAL_ERROR',
      ...(config.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

export default app;
