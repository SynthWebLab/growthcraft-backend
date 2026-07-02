import 'tsconfig-paths/register';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import bcrypt from 'bcryptjs';
import { User } from '@/database/models/User.model';
import { StudentProfile } from '@/database/models/StudentProfile.model';

dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 5002;
const BASE_URL = `http://127.0.0.1:${PORT}/api/v1`;

async function runTests() {
  console.log('🚀 Connecting to MongoDB to prepare test student...');
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not set');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  const studentEmail = 'student-upload-test@growthcraft.com';
  await User.deleteOne({ email: studentEmail });
  
  const hashedPassword = await bcrypt.hash('Password123!', 12);
  const studentUser = new User({
    fullName: 'Student Uploader',
    email: studentEmail,
    password: 'Password123!',
    phone: '7766554433',
    role: 'student',
    isEmailVerified: true,
    isActive: true,
  });
  await studentUser.save();
  console.log('Test student user created.');
  await mongoose.disconnect();
  console.log('Disconnected from Mongoose.');

  // Create Axios client
  const client = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
  });

  // Login as student
  const loginRes = await client.post('/auth/login', {
    email: studentEmail,
    password: 'Password123!',
  });
  const cookie = loginRes.headers['set-cookie']?.join('; ') || '';
  console.log('✅ Student logged in successfully');

  // Create a dummy resume PDF file
  const dummyFilePath = path.join(__dirname, 'dummy-resume.pdf');
  fs.writeFileSync(dummyFilePath, '%PDF-1.4 ... Dummy PDF Content for Testing Uploads ...');
  console.log(`Created dummy file at ${dummyFilePath}`);

  // Prepare FormData
  const form = new FormData();
  form.append('resume', fs.createReadStream(dummyFilePath));

  console.log('📤 Sending POST /students/resume/upload request...');
  try {
    const uploadRes = await client.post('/students/resume/upload', form, {
      headers: {
        ...form.getHeaders(),
        Cookie: cookie,
      },
    });

    const data = uploadRes.data;
    console.log('Response status:', uploadRes.status);
    console.log('Response body:', JSON.stringify(data, null, 2));

    const resumeUrl = data.data.resumeUrl;
    if (resumeUrl && resumeUrl.startsWith('http')) {
      console.log('✅ SUCCESS: Resume uploaded successfully. URL:', resumeUrl);

      // Verify that the static file is served successfully
      console.log(`🔍 Verification: Fetching the static asset from ${resumeUrl}...`);
      const getRes = await axios.get(resumeUrl);
      if (getRes.status === 200 && getRes.data.includes('Dummy PDF Content')) {
        console.log('✅ SUCCESS: Statically served resume matches uploaded content!');
      } else {
        console.error('❌ FAILED: Served static asset content mismatch');
      }
    } else {
      console.error('❌ FAILED: Invalid resumeUrl returned');
    }
  } catch (error: any) {
    console.error('❌ FAILED: Upload request failed', error.response?.data || error.message);
  } finally {
    // Cleanup dummy file
    if (fs.existsSync(dummyFilePath)) {
      fs.unlinkSync(dummyFilePath);
    }
    
    // Cleanup Database User
    await mongoose.connect(mongoUri);
    await User.deleteOne({ email: studentEmail });
    await mongoose.disconnect();
    console.log('🧹 DB cleaned up.');
  }
}

runTests().catch(err => {
  console.error('Unhandled script error:', err);
  process.exit(1);
});
