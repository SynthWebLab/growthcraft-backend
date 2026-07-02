import 'tsconfig-paths/register';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import { User } from '@/database/models/User.model';
import { EmployerProfile } from '@/database/models/EmployerProfile.model';
import { StudentProfile } from '@/database/models/StudentProfile.model';
import { Course } from '@/database/models/Course.model';

dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 5002}`;

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  error?: any;
}

const results: TestResult[] = [];

function logResult(res: TestResult) {
  results.push(res);
  const icon = res.success ? '✅' : '❌';
  console.log(`${icon} [${res.name}] - ${res.message}`);
  if (res.error) {
    console.error(`   Error details:`, res.error.response?.data || res.error.message || res.error);
  }
}

async function runTests() {
  console.log('🚀 Connecting to MongoDB to prepare test employer user...');
  const mongoUri = process.env.MONGODB_URI;
  await mongoose.connect(mongoUri!);
  console.log('✅ Connected to MongoDB');

  const email = 'employer-test@growthcraft.com';
  const password = 'Password@123';

  // Cleanup old test user
  await User.deleteOne({ email });
  const oldUser = await User.findOne({ email });
  if (oldUser) {
    await EmployerProfile.deleteOne({ userId: oldUser._id });
  }

  // Create test employer
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);
  const testUser = new User({
    fullName: 'Test Employer Partner',
    email,
    phone: '+91 99999 88888',
    password,
    role: 'employer',
    isEmailVerified: true,
    isActive: true,
  });

  await testUser.save();
  console.log(`Created test employer: ${email}`);

  // Seed a sample completed student so /talent pool isn't empty
  const studentEmail = 'student-graduate@growthcraft.com';
  let sampleStudentUser = await User.findOne({ email: studentEmail });
  if (!sampleStudentUser) {
    sampleStudentUser = new User({
      fullName: 'Graduate Student',
      email: studentEmail,
      phone: '+91 77777 66666',
      password: hashedPassword,
      role: 'student',
      isEmailVerified: true,
      isActive: true,
    });
    await sampleStudentUser.save();
  }

  let sampleCourse = await Course.findOne();
  if (!sampleCourse) {
    sampleCourse = new Course({
      title: 'Full Stack Web Development',
      slug: 'full-stack-web-dev',
      description: 'Learn MERN stack',
      category: 'Web Development',
      difficultyLevel: 'Beginner',
      duration: 120,
      tags: ['React', 'Node.js'],
      isPublished: true,
    });
    await sampleCourse.save();
  }

  let studentProfile = await StudentProfile.findOne({ userId: sampleStudentUser._id });
  if (!studentProfile) {
    studentProfile = new StudentProfile({
      userId: sampleStudentUser._id,
      collegeName: 'IIT Guwahati',
      degree: 'B.Tech',
      branch: 'Computer Science',
      yearOfStudy: 4,
      skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
      interests: ['Web Apps'],
      completedCourses: [sampleCourse._id],
    });
    await studentProfile.save();
    console.log('Seeded sample completed student graduate profile');
  } else {
    studentProfile.completedCourses = [sampleCourse._id];
    studentProfile.skills = ['React', 'Node.js', 'MongoDB', 'TypeScript'];
    await studentProfile.save();
  }

  await mongoose.disconnect();
  console.log('🔌 Disconnected Mongoose to test via Express server endpoints');

  let cookieHeader = '';
  // Step 1: Login
  try {
    const res = await axios.post(`${BASE_URL}/api/v1/auth/login`, { email, password });
    const cookies = res.headers['set-cookie'];
    if (cookies) {
      cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
      logResult({ name: 'Auth Login', success: true, message: 'LoggedIn successfully as employer' });
    } else {
      throw new Error('No cookie returned');
    }
  } catch (error: any) {
    logResult({ name: 'Auth Login', success: false, message: 'Login failed', error });
    process.exit(1);
  }

  const client = axios.create({
    baseURL: `${BASE_URL}/api/v1`,
    headers: { Cookie: cookieHeader },
  });

  // Step 2: Dashboard
  try {
    const res = await client.get('/employers/dashboard');
    logResult({ name: 'Get Dashboard', success: res.data.success, message: `Status code ${res.status}` });
  } catch (error: any) {
    logResult({ name: 'Get Dashboard', success: false, message: 'Failed', error });
  }

  // Step 3: Profile GET
  try {
    const res = await client.get('/employers/profile');
    logResult({ name: 'Get Profile', success: res.data.success, message: `Company: ${res.data.data.companyName}` });
  } catch (error: any) {
    logResult({ name: 'Get Profile', success: false, message: 'Failed', error });
  }

  // Step 4: Profile PATCH
  try {
    const res = await client.patch('/employers/profile', {
      companyName: 'GrowthCraft Solutions',
      industry: 'EdTech',
      companySize: '51-200',
      website: 'https://growthcraft.com',
      hiringNeeds: 'React Developers',
    });
    logResult({ name: 'Update Profile', success: res.data.success, message: `Updated companyName to: ${res.data.data.companyName}` });
  } catch (error: any) {
    logResult({ name: 'Update Profile', success: false, message: 'Failed', error });
  }

  // Step 5: Talent Pool GET
  try {
    const res = await client.get('/talent');
    logResult({ name: 'Get Talent Pool', success: res.data.success, message: `Found ${res.data.data.length} candidates` });
  } catch (error: any) {
    logResult({ name: 'Get Talent Pool', success: false, message: 'Failed', error });
  }

  // Step 6: Create Job Posting (Draft)
  let createdJobId = '';
  try {
    const res = await client.post('/employers/jobs', {
      title: 'Senior Frontend Architect',
      description: 'Design and build top-tier responsive React applications.',
      location: 'Remote',
      locationType: 'Remote',
      jobType: 'Full-time',
      skillsRequired: ['React', 'TypeScript', 'Next.js'],
      salaryRange: { min: 12, max: 18 },
      status: 'Draft',
    });
    createdJobId = res.data.data._id;
    logResult({ name: 'Create Job (Draft)', success: res.data.success, message: `Created Job ID: ${createdJobId}` });
  } catch (error: any) {
    logResult({ name: 'Create Job (Draft)', success: false, message: 'Failed', error });
  }

  // Step 7: Get Jobs
  try {
    const res = await client.get('/employers/jobs');
    logResult({ name: 'Get Jobs List', success: res.data.success, message: `Returned ${res.data.data.length} jobs` });
  } catch (error: any) {
    logResult({ name: 'Get Jobs List', success: false, message: 'Failed', error });
  }

  // Step 8: Update Job
  try {
    const res = await client.put(`/employers/jobs/${createdJobId}`, {
      title: 'Principal Frontend Architect',
    });
    logResult({ name: 'Update Job Details', success: res.data.success, message: `Updated title to: ${res.data.data.title}` });
  } catch (error: any) {
    logResult({ name: 'Update Job Details', success: false, message: 'Failed', error });
  }

  // Step 9: Patch Job Status (Active)
  try {
    const res = await client.patch(`/employers/jobs/${createdJobId}/status`, {
      status: 'Active',
    });
    logResult({ name: 'Activate Job Status', success: res.data.success, message: `Updated status to: ${res.data.data.status}` });
  } catch (error: any) {
    logResult({ name: 'Activate Job Status', success: false, message: 'Failed', error });
  }

  // Step 10: Get Public Jobs
  try {
    const res = await axios.get(`${BASE_URL}/api/v1/public/jobs`);
    logResult({ name: 'Get Public Jobs', success: res.data.success, message: `Returned ${res.data.data.length} active jobs publicly` });
  } catch (error: any) {
    logResult({ name: 'Get Public Jobs', success: false, message: 'Failed', error });
  }

  // Step 11: Delete Job
  try {
    const res = await client.delete(`/employers/jobs/${createdJobId}`);
    logResult({ name: 'Delete Job Posting', success: res.data.success, message: 'Successfully deleted the job posting' });
  } catch (error: any) {
    logResult({ name: 'Delete Job Posting', success: false, message: 'Failed', error });
  }

  console.log('\n📊 Summary:');
  const allPassed = results.every(r => r.success);
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
  } else {
    console.log('❌ SOME TESTS FAILED. CHECK LOGS.');
  }
}

runTests().catch(console.error);
