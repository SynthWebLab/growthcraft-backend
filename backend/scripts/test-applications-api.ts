import 'tsconfig-paths/register';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import { User } from '@/database/models/User.model';
import { EmployerProfile } from '@/database/models/EmployerProfile.model';
import { StudentProfile } from '@/database/models/StudentProfile.model';
import { JobPosting } from '@/database/models/JobPosting.model';
import { JobApplication } from '@/database/models/JobApplication.model';

dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 5002;
const BASE_URL = `http://127.0.0.1:${PORT}/api/v1`;

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
  console.log('🚀 Connecting to MongoDB to prepare test users...');
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not set in environmental variables');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  // Clean old test objects if any
  const employerEmail = 'employer-app-test@growthcraft.com';
  const studentEmail = 'student-app-test@growthcraft.com';

  await User.deleteMany({ email: { $in: [employerEmail, studentEmail] } });
  await JobApplication.deleteMany({});
  
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // 1. Create test Employer
  const employerUser = new User({
    fullName: 'Employer TestApp',
    email: employerEmail,
    password: 'Password123!',
    phone: '9988776655',
    role: 'employer',
    isEmailVerified: true,
    isActive: true,
  });
  await employerUser.save();

  const employerProfile = new EmployerProfile({
    userId: employerUser._id,
    companyName: 'App Testing Corp',
    website: 'https://apptestcorp.com',
    industry: 'IT/Software',
    companySize: '51-200',
    contactPerson: {
      name: 'Employer Tester',
      email: employerEmail,
      phone: '9988776655',
    },
  });
  await employerProfile.save();
  console.log('Employer user and profile created successfully.');

  // 2. Create test Student
  const studentUser = new User({
    fullName: 'Student TestApp',
    email: studentEmail,
    password: 'Password123!',
    phone: '8877665544',
    role: 'student',
    isEmailVerified: true,
    isActive: true,
  });
  await studentUser.save();


  const studentProfile = new StudentProfile({
    userId: studentUser._id,
    collegeName: 'Test University',
    degree: 'B.Tech',
    branch: 'Computer Science',
    yearOfStudy: 4,
    skills: ['Node.js', 'React', 'MongoDB'],
  });
  await studentProfile.save();
  console.log('Student user and profile created successfully.');

  console.log('🔌 Disconnecting Mongoose to test via Express server endpoints');
  await mongoose.disconnect();

  // Create Axios client with cookie support
  const client = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
  });

  let employerCookie = '';
  let studentCookie = '';
  let testJobId = '';
  let testApplicationId = '';

  // Test Step 1: Login as Employer
  try {
    const loginRes = await client.post('/auth/login', {
      email: employerEmail,
      password: 'Password123!',
    });
    employerCookie = loginRes.headers['set-cookie']?.join('; ') || '';
    logResult({
      name: 'Employer Login',
      success: true,
      message: 'Logged in successfully as employer',
    });
  } catch (error) {
    logResult({
      name: 'Employer Login',
      success: false,
      message: 'Failed to login',
      error,
    });
    process.exit(1);
  }

  // Test Step 2: Post a job listing (Active)
  try {
    const jobRes = await client.post(
      '/employers/jobs',
      {
        title: 'Full Stack Engineer Intern',
        description: 'Excellent intern position working with React, Node.js and MongoDB',
        requirements: ['Basic JS knowledge', 'React familiarity'],
        skillsRequired: ['React', 'Node.js'],
        location: 'Bengaluru',
        locationType: 'Hybrid',
        salaryRange: { min: 25000, max: 40000 },
        jobType: 'Internship',
        status: 'Active',
      },
      { headers: { Cookie: employerCookie } }
    );
    testJobId = jobRes.data.data._id;
    logResult({
      name: 'Create Job Listing',
      success: true,
      message: `Created active job posting. ID: ${testJobId}`,
    });
  } catch (error) {
    logResult({
      name: 'Create Job Listing',
      success: false,
      message: 'Failed to create job posting',
      error,
    });
    process.exit(1);
  }

  // Test Step 3: Login as Student
  try {
    const loginRes = await client.post('/auth/login', {
      email: studentEmail,
      password: 'Password123!',
    });
    studentCookie = loginRes.headers['set-cookie']?.join('; ') || '';
    logResult({
      name: 'Student Login',
      success: true,
      message: 'Logged in successfully as student',
    });
  } catch (error) {
    logResult({
      name: 'Student Login',
      success: false,
      message: 'Failed to login',
      error,
    });
    process.exit(1);
  }

  // Test Step 4: Get Jobs List as Student
  try {
    const jobsRes = await client.get('/students/jobs', {
      headers: { Cookie: studentCookie },
    });
    const foundJob = jobsRes.data.data.find((j: any) => j.id === testJobId);
    logResult({
      name: 'Browse Active Jobs as Student',
      success: !!foundJob,
      message: foundJob ? 'Found posted job in student listings list' : 'Job not found in student listings',
    });
  } catch (error) {
    logResult({
      name: 'Browse Active Jobs as Student',
      success: false,
      message: 'Failed to fetch jobs list',
      error,
    });
  }

  // Test Step 5: Apply for the job
  try {
    const applyRes = await client.post(
      `/students/jobs/${testJobId}/apply`,
      {
        resumeUrl: 'https://googledrive.com/file/my-test-resume',
        coverLetter: 'I am highly passionate about full stack web development!',
      },
      { headers: { Cookie: studentCookie } }
    );
    testApplicationId = applyRes.data.data._id;
    logResult({
      name: 'Submit Job Application',
      success: true,
      message: `Successfully applied to job. Application ID: ${testApplicationId}`,
    });
  } catch (error) {
    logResult({
      name: 'Submit Job Application',
      success: false,
      message: 'Failed to apply to job',
      error,
    });
  }

  // Test Step 6: Verify duplicate application block
  try {
    await client.post(
      `/students/jobs/${testJobId}/apply`,
      {
        resumeUrl: 'https://googledrive.com/file/my-test-resume-2',
      },
      { headers: { Cookie: studentCookie } }
    );
    logResult({
      name: 'Verify Duplicate Apply Block',
      success: false,
      message: 'Allowed duplicate application to the same job (Expected error)',
    });
  } catch (error: any) {
    const isConflict = error.response?.status === 409 || error.response?.status === 400;
    logResult({
      name: 'Verify Duplicate Apply Block',
      success: isConflict,
      message: isConflict ? 'Correctly blocked duplicate application (Status 409/400 Conflict)' : 'Failed with unexpected error code',
      error: isConflict ? undefined : error,
    });
  }

  // Test Step 7: Get Student's Submitted Applications
  try {
    const appsRes = await client.get('/students/applications', {
      headers: { Cookie: studentCookie },
    });
    const hasApp = appsRes.data.data.some((a: any) => a.id === testApplicationId);
    logResult({
      name: 'Track Applications as Student',
      success: hasApp,
      message: hasApp ? 'Successfully retrieved submitted application in list' : 'Application not found',
    });
  } catch (error) {
    logResult({
      name: 'Track Applications as Student',
      success: false,
      message: 'Failed to get student applications list',
      error,
    });
  }

  // Test Step 8: Get Employer Job Applications list
  try {
    const appsRes = await client.get('/employers/applications', {
      headers: { Cookie: employerCookie },
    });
    const foundApp = appsRes.data.data.find((a: any) => a.id === testApplicationId);
    logResult({
      name: 'Retrieve Applications as Employer',
      success: !!foundApp,
      message: foundApp ? `Found student application in employer dashboard pipeline list. Stage: ${foundApp.stage}` : 'Application not found in employer list',
    });
  } catch (error) {
    logResult({
      name: 'Retrieve Applications as Employer',
      success: false,
      message: 'Failed to retrieve applications as employer',
      error,
    });
  }

  // Test Step 9: Update candidate status as Employer
  try {
    const patchRes = await client.patch(
      `/employers/applications/${testApplicationId}/status`,
      { status: 'Shortlisted' },
      { headers: { Cookie: employerCookie } }
    );
    logResult({
      name: 'Update Application Status',
      success: patchRes.data.data.status === 'Shortlisted',
      message: `Status updated to: ${patchRes.data.data.status}`,
    });
  } catch (error) {
    logResult({
      name: 'Update Application Status',
      success: false,
      message: 'Failed to update application status',
      error,
    });
  }

  // Test Step 10: Confirm student sees updated status
  try {
    const appsRes = await client.get('/students/applications', {
      headers: { Cookie: studentCookie },
    });
    const appInfo = appsRes.data.data.find((a: any) => a.id === testApplicationId);
    const correctStatus = appInfo?.status === 'Shortlisted';
    logResult({
      name: 'Verify Status Sync to Student',
      success: correctStatus,
      message: correctStatus ? 'Student correctly sees updated status: Shortlisted' : `Student sees status: ${appInfo?.status}`,
    });
  } catch (error) {
    logResult({
      name: 'Verify Status Sync to Student',
      success: false,
      message: 'Failed to confirm status update sync',
      error,
    });
  }

  // Test Step 11: Verify Employer Dashboard KPIs and funnel aggregates
  try {
    const dashRes = await client.get('/employers/dashboard', {
      headers: { Cookie: employerCookie },
    });
    const dashboard = dashRes.data.data;
    const isDashboardCorrect = dashboard.kpis.applicationsReceived === 1 && dashboard.kpis.candidatesShortlisted === 1;
    logResult({
      name: 'Verify Employer Dashboard KPIs Sync',
      success: isDashboardCorrect,
      message: isDashboardCorrect ? 'Employer dashboard correctly aggregates 1 applicant and 1 shortlist' : 'KPI data counts mismatch',
    });
  } catch (error) {
    logResult({
      name: 'Verify Employer Dashboard KPIs Sync',
      success: false,
      message: 'Failed to confirm dashboard updates',
      error,
    });
  }

  // Cleanup Database Objects
  console.log('🧹 Cleaning up database test records...');
  await mongoose.connect(mongoUri);
  await User.deleteMany({ email: { $in: [employerEmail, studentEmail] } });
  await EmployerProfile.deleteOne({ userId: employerUser._id });
  await StudentProfile.deleteOne({ userId: studentUser._id });
  await JobPosting.deleteOne({ _id: testJobId });
  await JobApplication.deleteMany({ jobId: testJobId });
  await mongoose.disconnect();
  console.log('✅ Cleanup completed successfully');

  // Summary
  const allPassed = results.every(r => r.success);
  console.log('\n📊 Summary:');
  console.log(allPassed ? '🎉 ALL TESTS PASSED SUCCESSFULLY!' : '⚠️ SOME TESTS FAILED.');
  if (!allPassed) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Unhandled script error:', err);
  process.exit(1);
});
