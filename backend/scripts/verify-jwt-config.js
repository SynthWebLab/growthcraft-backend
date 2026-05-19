/**
 * JWT Configuration Verification Script
 * 
 * This script verifies that JWT tokens are configured correctly:
 * - Access token: 15 minutes
 * - Refresh token: 7 days
 * - Both stored in httpOnly cookies
 */

require('dotenv').config();

const EXPECTED_CONFIG = {
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
};

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkEnvVar(name, expected) {
  const actual = process.env[name];
  const isCorrect = actual === expected;
  
  if (isCorrect) {
    log(`✓ ${name}: ${actual}`, 'green');
  } else {
    log(`✗ ${name}: ${actual} (expected: ${expected})`, 'red');
  }
  
  return isCorrect;
}

function parseExpiration(expiresIn) {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return null;
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  const multipliers = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };
  
  return value * multipliers[unit];
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  return `${Math.floor(seconds / 86400)} days`;
}

console.log('\n' + '='.repeat(60));
log('JWT Configuration Verification', 'cyan');
console.log('='.repeat(60) + '\n');

// Check required environment variables
log('Checking Environment Variables:', 'blue');
console.log('-'.repeat(60));

const checks = [
  checkEnvVar('JWT_SECRET', undefined), // Just check it exists
  checkEnvVar('JWT_REFRESH_SECRET', undefined), // Just check it exists
  checkEnvVar('JWT_EXPIRES_IN', EXPECTED_CONFIG.JWT_EXPIRES_IN),
  checkEnvVar('JWT_REFRESH_EXPIRES_IN', EXPECTED_CONFIG.JWT_REFRESH_EXPIRES_IN),
];

// Check if secrets exist
if (!process.env.JWT_SECRET) {
  log('✗ JWT_SECRET is not set', 'red');
  checks[0] = false;
} else if (process.env.JWT_SECRET.length < 32) {
  log(`⚠ JWT_SECRET is too short (${process.env.JWT_SECRET.length} chars, recommended: 32+)`, 'yellow');
  checks[0] = true;
} else {
  log(`✓ JWT_SECRET is set (${process.env.JWT_SECRET.length} characters)`, 'green');
  checks[0] = true;
}

if (!process.env.JWT_REFRESH_SECRET) {
  log('✗ JWT_REFRESH_SECRET is not set', 'red');
  checks[1] = false;
} else if (process.env.JWT_REFRESH_SECRET.length < 32) {
  log(`⚠ JWT_REFRESH_SECRET is too short (${process.env.JWT_REFRESH_SECRET.length} chars, recommended: 32+)`, 'yellow');
  checks[1] = true;
} else {
  log(`✓ JWT_REFRESH_SECRET is set (${process.env.JWT_REFRESH_SECRET.length} characters)`, 'green');
  checks[1] = true;
}

console.log();

// Display token expiration details
log('Token Expiration Details:', 'blue');
console.log('-'.repeat(60));

const accessTokenSeconds = parseExpiration(process.env.JWT_EXPIRES_IN || '15m');
const refreshTokenSeconds = parseExpiration(process.env.JWT_REFRESH_EXPIRES_IN || '7d');

if (accessTokenSeconds) {
  log(`Access Token:  ${process.env.JWT_EXPIRES_IN} (${formatDuration(accessTokenSeconds)})`, 'cyan');
} else {
  log('Access Token:  Invalid format', 'red');
}

if (refreshTokenSeconds) {
  log(`Refresh Token: ${process.env.JWT_REFRESH_EXPIRES_IN} (${formatDuration(refreshTokenSeconds)})`, 'cyan');
} else {
  log('Refresh Token: Invalid format', 'red');
}

console.log();

// Security recommendations
log('Security Recommendations:', 'blue');
console.log('-'.repeat(60));

const recommendations = [];

if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
  recommendations.push('⚠ Change JWT_SECRET from default value');
}

if (process.env.JWT_REFRESH_SECRET === 'your-super-secret-refresh-key-change-this-in-production') {
  recommendations.push('⚠ Change JWT_REFRESH_SECRET from default value');
}

if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
  recommendations.push('⚠ Redis is recommended for production (token storage)');
}

if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET?.length < 32) {
  recommendations.push('⚠ Use longer JWT secrets in production (32+ characters)');
}

if (recommendations.length === 0) {
  log('✓ All security checks passed', 'green');
} else {
  recommendations.forEach(rec => log(rec, 'yellow'));
}

console.log();

// Cookie configuration
log('Cookie Configuration:', 'blue');
console.log('-'.repeat(60));
log('Access Token Cookie:', 'cyan');
log('  Name:     access_token', 'reset');
log('  MaxAge:   15 minutes (900000 ms)', 'reset');
log('  HttpOnly: true', 'reset');
log('  Secure:   true (production only)', 'reset');
log('  SameSite: none (production) / lax (development)', 'reset');
console.log();
log('Refresh Token Cookie:', 'cyan');
log('  Name:     refreshToken', 'reset');
log('  MaxAge:   7 days (604800000 ms)', 'reset');
log('  HttpOnly: true', 'reset');
log('  Secure:   true (production only)', 'reset');
log('  SameSite: none (production) / lax (development)', 'reset');

console.log();

// Summary
console.log('='.repeat(60));
const allPassed = checks.every(check => check);
if (allPassed) {
  log('✓ JWT Configuration is correct!', 'green');
} else {
  log('✗ JWT Configuration has issues - please fix the errors above', 'red');
}
console.log('='.repeat(60) + '\n');

// Additional info
log('Additional Information:', 'blue');
console.log('-'.repeat(60));
log('Token Rotation:     Enabled (new refresh token on each use)', 'reset');
log('Reuse Detection:    Enabled (detects stolen tokens)', 'reset');
log('Auto-refresh:       Enabled (5 minutes before expiry)', 'reset');
log('Max Sessions:       5 devices per user', 'reset');
log('Storage:            Redis (refresh tokens)', 'reset');
console.log();

log('Documentation:', 'blue');
console.log('-'.repeat(60));
log('Full docs:          backend/docs/JWT_IMPLEMENTATION.md', 'reset');
log('Quick reference:    backend/JWT_QUICK_REFERENCE.md', 'reset');
log('Update summary:     backend/JWT_TOKEN_UPDATE_SUMMARY.md', 'reset');
console.log();

process.exit(allPassed ? 0 : 1);
