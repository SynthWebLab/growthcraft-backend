/**
 * Test MongoDB Atlas and Redis (Upstash) Connections
 * Run with: node scripts/test-connections.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { createClient } = require('redis');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testMongoDB() {
  log('\n📦 Testing MongoDB Connection...', colors.blue);

  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      log('❌ MONGODB_URI not found in .env file', colors.red);
      return false;
    }

    log(`Connecting to: ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`, colors.yellow);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    log('✅ MongoDB connected successfully!', colors.green);

    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    log(`📊 Found ${collections.length} collections`, colors.green);

    await mongoose.disconnect();
    log('✅ MongoDB disconnected', colors.green);

    return true;
  } catch (error) {
    log(`❌ MongoDB connection failed: ${error.message}`, colors.red);
    return false;
  }
}

async function testRedis() {
  log('\n🔴 Testing Redis Connection...', colors.blue);

  try {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      log('⚠️  REDIS_URL not found in .env file (Redis is optional)', colors.yellow);
      return true; // Redis is optional, so this is not a failure
    }

    log(`Connecting to: ${redisUrl.replace(/:([^@]+)@/, ':****@')}`, colors.yellow);

    const client = createClient({
      url: redisUrl,
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        connectTimeout: 5000,
      },
    });

    await client.connect();
    log('✅ Redis connected successfully!', colors.green);

    // Test a simple operation
    await client.set('test:connection', 'success', { EX: 10 });
    const value = await client.get('test:connection');

    if (value === 'success') {
      log('✅ Redis read/write test passed', colors.green);
    }

    await client.del('test:connection');
    await client.quit();
    log('✅ Redis disconnected', colors.green);

    return true;
  } catch (error) {
    log(`❌ Redis connection failed: ${error.message}`, colors.red);
    log('⚠️  App will continue without Redis', colors.yellow);
    return true; // Redis is optional
  }
}

async function main() {
  log('='.repeat(60), colors.blue);
  log('🧪 Connection Test Script', colors.blue);
  log('='.repeat(60), colors.blue);

  const mongoSuccess = await testMongoDB();
  const redisSuccess = await testRedis();

  log('\n' + '='.repeat(60), colors.blue);
  log('📊 Test Results:', colors.blue);
  log('='.repeat(60), colors.blue);

  log(`MongoDB: ${mongoSuccess ? '✅ PASS' : '❌ FAIL'}`, mongoSuccess ? colors.green : colors.red);
  log(
    `Redis:   ${redisSuccess ? '✅ PASS' : '⚠️  OPTIONAL'}`,
    redisSuccess ? colors.green : colors.yellow
  );

  if (mongoSuccess) {
    log('\n🎉 All required connections successful!', colors.green);
    log('You can now run: npm run dev', colors.green);
  } else {
    log('\n❌ Some connections failed. Please check your configuration.', colors.red);
    log('See MONGODB_REDIS_SETUP.md for help', colors.yellow);
  }

  log('='.repeat(60) + '\n', colors.blue);

  process.exit(mongoSuccess ? 0 : 1);
}

main().catch((error) => {
  log(`\n❌ Unexpected error: ${error.message}`, colors.red);
  process.exit(1);
});
