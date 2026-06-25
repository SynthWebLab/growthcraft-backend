const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('redis');

async function checkRedis() {
  console.log('Connecting to Redis using URL:', process.env.REDIS_URL ? (process.env.REDIS_URL.substring(0, 30) + '...') : 'undefined');
  
  const client = createClient({
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD || undefined,
  });

  client.on('error', (err) => console.error('Redis Client Error:', err));

  await client.connect();
  console.log('Connected successfully!');

  // Run INFO command
  const info = await client.info();
  console.log('\n--- REDIS INFO ---');
  console.log(info);

  // Run DBSIZE command
  const dbSize = await client.dbSize();
  console.log('\n--- DB SIZE ---');
  console.log(`Total Keys: ${dbSize}`);

  // Fetch memory stats if available
  try {
    const memoryStats = await client.sendCommand(['MEMORY', 'STATS']);
    console.log('\n--- MEMORY STATS ---');
    console.log(memoryStats);
  } catch (err) {
    console.log('\n--- MEMORY STATS ---');
    console.log('MEMORY STATS not supported or error:', err.message);
  }

  await client.quit();

  // Check Upstash REST API rate limits
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (restUrl && restToken) {
    console.log('\n--- UPSTASH REST RATE LIMIT INFO ---');
    try {
      const response = await fetch(`${restUrl}/dbsize`, {
        headers: {
          Authorization: `Bearer ${restToken}`
        }
      });
      console.log('Status:', response.status);
      console.log('Headers:');
      for (const [key, value] of response.headers.entries()) {
        console.log(`  ${key}: ${value}`);
      }
    } catch (err) {
      console.error('Error fetching Upstash REST rate limits:', err.message);
    }
  }
}

checkRedis().catch(console.error);
