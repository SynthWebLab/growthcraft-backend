// Jest setup file
// This file runs before all tests

// Set test environment
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI =
  process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/growthcraft_test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';

// Increase timeout for database operations
jest.setTimeout(10000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
  error: console.error,
};
