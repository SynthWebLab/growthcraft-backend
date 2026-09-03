import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '../.env') });

async function fixIndex() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not defined in .env');

    await mongoose.connect(uri);
    
    const db = mongoose.connection.db;
    if (!db) throw new Error('Failed to get db instance');
    
    const collection = db.collection('users');
    
    console.log('Indexes before dropping:');
    const beforeIndexes = await collection.indexes();
    console.log(beforeIndexes.map(i => i.name));
    
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
    
    console.log('Indexes after dropping:');
    const afterIndexes = await collection.indexes();
    console.log(afterIndexes.map(i => i.name));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixIndex();
