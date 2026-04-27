/**
 * Test script for JWT authentication middleware
 * 
 * This script tests the authentication flow:
 * 1. Register a test user
 * 2. Login to get tokens
 * 3. Access protected route with cookie
 * 4. Access protected route with Bearer token
 * 5. Test invalid token
 * 6. Test expired token scenario
 * 7. Logout
 * 
 * Usage: node scripts/test-auth-middleware.js
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api/v1`;

// Test user credentials
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  fullName: 'Test User',
  role: 'student'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Store cookies and tokens
let cookies = [];
let accessToken = '';
let refreshToken = '';

// Helper to extract cookies from response
function extractCookies(response) {
  const setCookieHeader = response.headers['set-cookie'];
  if (setCookieHeader) {
    return setCookieHeader.map(cookie => cookie.split(';')[0]);
  }
  return [];
}

// Helper to extract token from cookie
function extractTokenFromCookie(cookies, tokenName) {
  const cookie = cookies.find(c => c.startsWith(`${tokenName}=`));
  if (cookie) {
    return cookie.split('=')[1];
  }
  return null;
}

// Test 1: Register user
async function testRegister() {
  try {
    logInfo('Test 1: Registering test user...');
    
    const response = await axios.post(`${API_BASE}/auth/register`, testUser);
    
    if (response.status === 201) {
      logSuccess('User registered successfully');
      
      // Extract cookies
      cookies = extractCookies(response);
      accessToken = extractTokenFromCookie(cookies, 'access_token');
      refreshToken = extractTokenFromCookie(cookies, 'refresh_token');
      
      if (accessToken && refreshToken) {
        logSuccess('Tokens received in cookies');
      } else {
        logWarning('Tokens not found in cookies');
      }
      
      return true;
    }
  } catch (error) {
    if (error.response?.status === 409) {
      logWarning('User already exists, trying to login instead...');
      return await testLogin();
    }
    logError(`Registration failed: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// Test 2: Login
async function testLogin() {
  try {
    logInfo('Test 2: Logging in...');
    
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    if (response.status === 200) {
      logSuccess('Login successful');
      
      // Extract cookies
      cookies = extractCookies(response);
      accessToken = extractTokenFromCookie(cookies, 'access_token');
      refreshToken = extractTokenFromCookie(cookies, 'refresh_token');
      
      if (accessToken && refreshToken) {
        logSuccess('Tokens received in cookies');
      }
      
      return true;
    }
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// Test 3: Access protected route with cookie
async function testProtectedRouteWithCookie() {
  try {
    logInfo('Test 3: Accessing protected route with cookie...');
    
    const response = await axios.get(`${API_BASE}/auth/profile`, {
      headers: {
        Cookie: cookies.join('; ')
      }
    });
    
    if (response.status === 200 && response.data.data.user) {
      logSuccess('Protected route accessed successfully with cookie');
      logInfo(`User: ${response.data.data.user.email} (${response.data.data.user.role})`);
      return true;
    }
  } catch (error) {
    logError(`Cookie auth failed: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// Test 4: Access protected route with Bearer token
async function testProtectedRouteWithBearer() {
  try {
    logInfo('Test 4: Accessing protected route with Bearer token...');
    
    const response = await axios.get(`${API_BASE}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (response.status === 200 && response.data.data.user) {
      logSuccess('Protected route accessed successfully with Bearer token');
      return true;
    }
  } catch (error) {
    logError(`Bearer auth failed: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// Test 5: Access protected route without token
async function testProtectedRouteWithoutToken() {
  try {
    logInfo('Test 5: Accessing protected route without token (should fail)...');
    
    await axios.get(`${API_BASE}/auth/profile`);
    
    logError('Protected route should have rejected request without token');
    return false;
  } catch (error) {
    if (error.response?.status === 401 && error.response?.data?.error?.code === 'NO_TOKEN') {
      logSuccess('Protected route correctly rejected request without token');
      return true;
    }
    logError(`Unexpected error: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// Test 6: Access protected route with invalid token
async function testProtectedRouteWithInvalidToken() {
  try {
    logInfo('Test 6: Accessing protected route with invalid token (should fail)...');
    
    await axios.get(`${API_BASE}/auth/profile`, {
      headers: {
        Authorization: 'Bearer invalid.token.here'
      }
    });
    
    logError('Protected route should have rejected invalid token');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      logSuccess('Protected route correctly rejected invalid token');
      logInfo(`Error code: ${error.response?.data?.error?.code}`);
      return true;
    }
    logError(`Unexpected error: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// Test 7: Test custom header authentication
async function testProtectedRouteWithCustomHeader() {
  try {
    logInfo('Test 7: Accessing protected route with custom header...');
    
    const response = await axios.get(`${API_BASE}/auth/profile`, {
      headers: {
        'x-access-token': accessToken
      }
    });
    
    if (response.status === 200 && response.data.data.user) {
      logSuccess('Protected route accessed successfully with custom header');
      return true;
    }
  } catch (error) {
    logError(`Custom header auth failed: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// Test 8: Logout
async function testLogout() {
  try {
    logInfo('Test 8: Logging out...');
    
    const response = await axios.post(`${API_BASE}/auth/logout`, {}, {
      headers: {
        Cookie: cookies.join('; ')
      }
    });
    
    if (response.status === 200) {
      logSuccess('Logout successful');
      return true;
    }
  } catch (error) {
    logError(`Logout failed: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// Test 9: Access protected route after logout (should fail)
async function testProtectedRouteAfterLogout() {
  try {
    logInfo('Test 9: Accessing protected route after logout (should fail)...');
    
    await axios.get(`${API_BASE}/auth/profile`, {
      headers: {
        Cookie: cookies.join('; ')
      }
    });
    
    logError('Protected route should have rejected request after logout');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      logSuccess('Protected route correctly rejected request after logout');
      return true;
    }
    logError(`Unexpected error: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n========================================', 'blue');
  log('JWT Authentication Middleware Tests', 'blue');
  log('========================================\n', 'blue');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  const tests = [
    { name: 'Register/Login', fn: testRegister },
    { name: 'Cookie Authentication', fn: testProtectedRouteWithCookie },
    { name: 'Bearer Token Authentication', fn: testProtectedRouteWithBearer },
    { name: 'Custom Header Authentication', fn: testProtectedRouteWithCustomHeader },
    { name: 'No Token Rejection', fn: testProtectedRouteWithoutToken },
    { name: 'Invalid Token Rejection', fn: testProtectedRouteWithInvalidToken },
    { name: 'Logout', fn: testLogout },
    { name: 'Post-Logout Rejection', fn: testProtectedRouteAfterLogout }
  ];
  
  for (const test of tests) {
    results.total++;
    const passed = await test.fn();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    console.log(''); // Empty line between tests
  }
  
  // Print summary
  log('\n========================================', 'blue');
  log('Test Summary', 'blue');
  log('========================================', 'blue');
  log(`Total Tests: ${results.total}`, 'cyan');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, 
      results.failed === 0 ? 'green' : 'yellow');
  log('========================================\n', 'blue');
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`);
    logSuccess(`Server is running at ${BASE_URL}`);
    return true;
  } catch (error) {
    logError(`Server is not running at ${BASE_URL}`);
    logInfo('Please start the server with: npm run dev');
    return false;
  }
}

// Run tests
(async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  } else {
    process.exit(1);
  }
})();
