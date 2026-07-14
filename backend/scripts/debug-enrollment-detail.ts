import 'tsconfig-paths/register';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Enrollment } from '@/database/models';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const doc = await Enrollment.findById('6a55c14c45dca9e4f168f6c7').lean().exec();
  console.log('Raw Enrollment Document:', JSON.stringify(doc, null, 2));
  await mongoose.disconnect();
}

run();
