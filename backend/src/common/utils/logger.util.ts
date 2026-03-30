import winston from 'winston';
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

// Define format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  }),

  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  }),

  // File transport for all logs
  new winston.transports.File({
    filename: config.LOG_FILE,
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  }),
];

// Create logger
export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create logs directory if it doesn't exist
import fs from 'fs';
import path from 'path';

const logsDir = path.dirname(config.LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// If we're not in production, log to the console with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (config.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

export default logger;
