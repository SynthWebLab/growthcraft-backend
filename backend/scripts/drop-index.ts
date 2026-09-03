import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';

// Load from backend root .env
config({ path: path.resolve(__dirname, '../.env') });

async function dropIndex() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not defined in .env');

    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) throw new Error('Failed to get db instance');
    
    const collection = db.collection('users');
    
    console.log('Dropping email_1 index...');
    try {
      await collection.dropIndex('email_1');
      console.log('Successfully dropped email_1 index.');
    } catch (e: any) {
      if (e.code === 27) {
        console.log('Index email_1 not found, nothing to do.');
      } else {
        throw e;
      }
    }
    
    console.log('Syncing all indexes...');
    const { User } = require('../src/database/models/User.model');
    await User.syncIndexes();
    console.log('Successfully synced indexes.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

dropIndex();
