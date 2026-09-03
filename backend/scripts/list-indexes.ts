import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '../.env') });

async function listIndexes() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not defined in .env');

    await mongoose.connect(uri);
    
    const db = mongoose.connection.db;
    if (!db) throw new Error('Failed to get db instance');
    
    const collection = db.collection('users');
    const indexes = await collection.indexes();
    
    console.log('Current indexes on users collection:');
    console.log(JSON.stringify(indexes, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

listIndexes();
