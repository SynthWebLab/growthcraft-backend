/**
 * Test Redis Operations - See Redis in Action!
 * Run with: node scripts/test-redis-operations.js
 */

require('dotenv').config();
const { createClient } = require('redis');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testRedisOperations() {
  log('\n🔴 Redis Operations Demo\n', colors.blue);

  const client = createClient({
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD || undefined,
  });

  await client.connect();
  log('✅ Connected to Redis\n', colors.green);

  // 1. Set a simple value
  log('1️⃣  Setting a value...', colors.yellow);
  await client.set('user:1:name', 'John Doe');
  log('   SET user:1:name = "John Doe"', colors.green);

  // 2. Get the value
  log('\n2️⃣  Getting the value...', colors.yellow);
  const name = await client.get('user:1:name');
  log(`   GET user:1:name = "${name}"`, colors.green);

  // 3. Set with expiration (like session tokens)
  log('\n3️⃣  Setting value with 60 second expiration...', colors.yellow);
  await client.setEx('session:abc123', 60, 'user_session_data');
  log('   SET session:abc123 = "user_session_data" (expires in 60s)', colors.green);

  // 4. Check time to live
  const ttl = await client.ttl('session:abc123');
  log(`   TTL session:abc123 = ${ttl} seconds remaining`, colors.green);

  // 5. Increment counter (for rate limiting)
  log('\n4️⃣  Simulating rate limiting counter...', colors.yellow);
  await client.set('ratelimit:user:1', 0);
  for (let i = 1; i <= 5; i++) {
    const count = await client.incr('ratelimit:user:1');
    log(`   Request ${i}: Counter = ${count}`, colors.green);
  }

  // 6. Store JSON data
  log('\n5️⃣  Storing JSON data...', colors.yellow);
  const userData = {
    id: 1,
    email: 'user@example.com',
    role: 'admin',
    loginTime: new Date().toISOString(),
  };
  await client.set('user:1:session', JSON.stringify(userData));
  log('   Stored user session data', colors.green);

  const retrievedData = await client.get('user:1:session');
  log(`   Retrieved: ${retrievedData}`, colors.green);

  // 7. List all keys
  log('\n6️⃣  All keys in Redis:', colors.yellow);
  const keys = await client.keys('*');
  keys.forEach((key) => log(`   - ${key}`, colors.green));

  // 8. Clean up
  log('\n7️⃣  Cleaning up test data...', colors.yellow);
  await client.del('user:1:name');
  await client.del('user:1:session');
  await client.del('ratelimit:user:1');
  log('   Deleted test keys', colors.green);

  await client.quit();
  log('\n✅ Disconnected from Redis\n', colors.green);

  log('💡 Now check your Upstash dashboard:', colors.blue);
  log('   - COMMANDS count increased', colors.blue);
  log('   - Click "Data Browser" to see remaining keys', colors.blue);
  log('   - Click "Monitor" to watch real-time operations\n', colors.blue);
}

testRedisOperations().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
