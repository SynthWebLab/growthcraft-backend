import path from 'path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '@/config';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Human-readable, colorized format for the console.
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

// Structured (JSON) format for files/aggregation. No ANSI colors so the
// files stay machine-parseable, and full stack traces are captured.
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports: winston.transport[] = [
  // Console transport (always on)
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// File-based transports with daily rotation. Enabled in production by default,
// or whenever LOG_TO_FILE is set. Without these, logs are lost if the container
// restarts and stdout isn't captured by an external collector.
if (config.LOG_TO_FILE) {
  const logDir = path.isAbsolute(config.LOG_DIR)
    ? config.LOG_DIR
    : path.resolve(process.cwd(), config.LOG_DIR);

  const rotateDefaults = {
    dirname: logDir,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: config.LOG_ZIP_ARCHIVE,
    maxSize: config.LOG_MAX_SIZE,
    maxFiles: config.LOG_MAX_FILES,
    format: fileFormat,
  };

  // All logs at the configured level and above.
  transports.push(
    new DailyRotateFile({
      ...rotateDefaults,
      filename: 'application-%DATE%.log',
      level: config.LOG_LEVEL,
    })
  );

  // Dedicated error log for quick incident triage.
  transports.push(
    new DailyRotateFile({
      ...rotateDefaults,
      filename: 'error-%DATE%.log',
      level: 'error',
    })
  );
}

// Handle uncaught exceptions/rejections in files too when file logging is on.
const exceptionHandlers: winston.transport[] = [];
const rejectionHandlers: winston.transport[] = [];

if (config.LOG_TO_FILE) {
  const logDir = path.isAbsolute(config.LOG_DIR)
    ? config.LOG_DIR
    : path.resolve(process.cwd(), config.LOG_DIR);

  const rotateDefaults = {
    dirname: logDir,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: config.LOG_ZIP_ARCHIVE,
    maxSize: config.LOG_MAX_SIZE,
    maxFiles: config.LOG_MAX_FILES,
    format: fileFormat,
  };

  exceptionHandlers.push(
    new DailyRotateFile({ ...rotateDefaults, filename: 'exceptions-%DATE%.log' })
  );
  rejectionHandlers.push(
    new DailyRotateFile({ ...rotateDefaults, filename: 'rejections-%DATE%.log' })
  );
}

// Create logger
export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  levels,
  // Per-transport formats take precedence; this is a sensible default.
  format: fileFormat,
  transports,
  exceptionHandlers: exceptionHandlers.length ? exceptionHandlers : undefined,
  rejectionHandlers: rejectionHandlers.length ? rejectionHandlers : undefined,
  exitOnError: false,
});

export default logger;
