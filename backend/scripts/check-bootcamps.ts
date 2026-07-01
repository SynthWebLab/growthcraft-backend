import 'tsconfig-paths/register';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Bootcamp } from '@/database/models';

dotenv.config();

async function checkBootcamps() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    const total = await Bootcamp.countDocuments();
    console.log(`📊 Total bootcamps/events in database: ${total}\n`);

    const items = await Bootcamp.find().exec();
    items.forEach((item, index) => {
      console.log(`${index + 1}. Title: "${item.title}"`);
      console.log(`   Type: "${item.type}"`);
      console.log(`   IsActive: ${item.isActive}`);
      console.log(`   Status: "${item.status}"`);
      console.log('');
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkBootcamps();
