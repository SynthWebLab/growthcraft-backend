import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '../.env') });

async function verifySync() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not defined in .env');

    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    const { User } = require('../src/database/models/User.model');
    await User.syncIndexes();
    console.log('Successfully synced indexes.');
    
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    const indexes = await collection.indexes();
    
    console.log('Indexes after sync:');
    console.log(indexes.map(i => i.name));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

verifySync();
