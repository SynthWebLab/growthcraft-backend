import { createClient } from 'redis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function clearCache() {
  const client = createClient({ url: process.env.REDIS_URL });
  try {
    await client.connect();
    await client.flushAll();
    console.log('✅ Cache cleared!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.quit();
  }
}

clearCache();
