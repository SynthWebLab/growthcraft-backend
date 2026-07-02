import 'tsconfig-paths/register';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { JobPosting } from '../src/database/models/JobPosting.model';
import { User } from '../src/database/models/User.model';
import { EmployerProfile } from '../src/database/models/EmployerProfile.model';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function check() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI is not defined in env');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const users = await User.find({ role: 'employer' }).exec();
  console.log(`Found ${users.length} employer users:`);
  for (const user of users) {
    console.log(`- ID: ${user._id}, Name: ${user.fullName}, Email: ${user.email}`);
  }

  const jobs = await JobPosting.find({}).exec();
  console.log(`\nFound ${jobs.length} total job postings:`);
  for (const job of jobs) {
    console.log(`- ID: ${job._id}, Title: ${job.title}, Status: ${job.status}, Hiring Partner ID: ${job.hiringPartnerId}`);
  }

  const profiles = await EmployerProfile.find({}).exec();
  console.log(`\nFound ${profiles.length} employer profiles:`);
  for (const profile of profiles) {
    console.log(`- Profile ID: ${profile._id}, Company: ${profile.companyName}, User ID: ${profile.userId}, Jobs Posted:`, profile.jobsPosted);
  }

  await mongoose.disconnect();
}

check().catch(console.error);
