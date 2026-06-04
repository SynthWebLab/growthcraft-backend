import dotenv from 'dotenv';
import Redis from 'ioredis';

dotenv.config();

async function testRedis() {
  console.log('\n🔍 Testing Redis Connection...\n');
  console.log('Redis URL:', process.env.REDIS_URL?.substring(0, 50) + '...');
  console.log('Redis Password:', process.env.REDIS_PASSWORD ? 'Set' : 'Empty');

  try {
    const redis = new Redis(process.env.REDIS_URL!, {
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      },
    });

    redis.on('connect', () => {
      console.log('✅ Redis connecting...');
    });

    redis.on('ready', () => {
      console.log('✅ Redis ready!');
    });

    redis.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
    });

    // Test basic operations
    console.log('\n📝 Testing SET operation...');
    await redis.set('test:key', 'test-value', 'EX', 10);
    console.log('✅ SET successful');

    console.log('\n📖 Testing GET operation...');
    const value = await redis.get('test:key');
    console.log('✅ GET successful, value:', value);

    console.log('\n🗑️  Cleaning up...');
    await redis.del('test:key');
    console.log('✅ DEL successful');

    console.log('\n🎉 Redis connection is working perfectly!\n');

    await redis.quit();
  } catch (error: any) {
    console.error('\n❌ Redis connection failed:', error.message);
    console.error('\nPossible issues:');
    console.error('1. Redis URL is incorrect');
    console.error('2. Redis password is incorrect');
    console.error('3. Network/firewall blocking connection');
    console.error('4. Redis server is down');
    console.error('\nCheck your .env file and Redis provider status.\n');
  }
}

testRedis();
