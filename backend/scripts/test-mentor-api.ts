import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 5002}`;

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  response?: any;
  error?: any;
}

const results: TestResult[] = [];

function logResult(result: TestResult) {
  results.push(result);
  const icon = result.success ? '✅' : '❌';
  console.log(`\n${icon} ${result.name}`);
  console.log(`   ${result.message}`);
  if (result.response) {
    console.log(`   Status: ${result.response.status}`);
    if (result.response.data) {
      console.log(`   Response JSON:`, JSON.stringify(result.response.data, null, 2).slice(0, 300) + '...');
    }
  }
  if (result.error) {
    console.log(`   Error:`, result.error.response?.data || result.error.message || result.error);
  }
}

async function testMentorAPIs() {
  console.log('🚀 Starting Mentor Dashboard API Tests\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('='.repeat(60));

  let cookieHeader: string = '';

  // Step 1: Login as Mentor
  try {
    console.log('\n🔐 Step 1: Logging in as mentor...');
    const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'mentor@growthcraft.com',
      password: 'Mentor@123456'
    }, {
      proxy: false
    });

    const cookies = loginResponse.headers['set-cookie'];
    if (cookies) {
      cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
      logResult({
        name: 'Login as Mentor',
        success: true,
        message: 'Successfully logged in and retrieved authentication cookies',
        response: { status: loginResponse.status, data: loginResponse.data }
      });
    } else {
      throw new Error('No authentication cookies returned');
    }
  } catch (error: any) {
    logResult({
      name: 'Login as Mentor',
      success: false,
      message: 'Failed to log in',
      error
    });
    process.exit(1);
  }

  const client = axios.create({
    baseURL: `${BASE_URL}/api/v1`,
    headers: {
      Cookie: cookieHeader
    },
    proxy: false
  });

  // Step 2: Get Mentor Dashboard Details
  try {
    console.log('\n📊 Step 2: Fetching mentor dashboard details...');
    const res = await client.get('/mentor/dashboard');
    logResult({
      name: 'Get Dashboard Summary',
      success: true,
      message: 'Successfully retrieved dashboard summary, today sessions, reviews, and trend data',
      response: { status: res.status, data: res.data }
    });
  } catch (error: any) {
    logResult({
      name: 'Get Dashboard Summary',
      success: false,
      message: 'Failed to retrieve dashboard details',
      error
    });
  }

  // Step 3: Get Mentor Profile
  try {
    console.log('\n👤 Step 3: Fetching mentor profile...');
    const res = await client.get('/mentor/profile');
    logResult({
      name: 'Get Mentor Profile',
      success: true,
      message: 'Successfully retrieved mentor profile details',
      response: { status: res.status, data: res.data }
    });
  } catch (error: any) {
    logResult({
      name: 'Get Mentor Profile',
      success: false,
      message: 'Failed to retrieve profile details',
      error
    });
  }

  // Step 4: Update Mentor Profile
  try {
    console.log('\n✏️ Step 4: Updating mentor profile...');
    const res = await client.put('/mentor/profile', {
      bio: 'Senior full-stack engineer and educator specializing in web architectures.',
      experienceYears: 9,
      areaOfExpertise: 'Web Development',
      currentOrganization: 'GrowthCraft Labs Core'
    });
    logResult({
      name: 'Update Mentor Profile',
      success: true,
      message: 'Successfully updated mentor profile info',
      response: { status: res.status, data: res.data }
    });
  } catch (error: any) {
    logResult({
      name: 'Update Mentor Profile',
      success: false,
      message: 'Failed to update profile info',
      error
    });
  }

  // Step 5: Get Mentor Availability
  try {
    console.log('\n📅 Step 5: Fetching availability...');
    const res = await client.get('/mentor/availability');
    logResult({
      name: 'Get Availability',
      success: true,
      message: 'Successfully retrieved mentor availability schedule and rate',
      response: { status: res.status, data: res.data }
    });
  } catch (error: any) {
    logResult({
      name: 'Get Availability',
      success: false,
      message: 'Failed to retrieve availability schedule',
      error
    });
  }

  // Step 6: Update Mentor Availability
  try {
    console.log('\n💾 Step 6: Updating availability...');
    const res = await client.put('/mentor/availability', {
      hourlyRate: 1600,
      availability: [
        {
          day: 'Monday',
          slots: [
            { startTime: '09:00 AM', endTime: '10:00 AM' },
            { startTime: '11:00 AM', endTime: '12:00 PM' }
          ]
        },
        {
          day: 'Wednesday',
          slots: [
            { startTime: '03:00 PM', endTime: '04:00 PM' }
          ]
        }
      ]
    });
    logResult({
      name: 'Update Availability',
      success: true,
      message: 'Successfully updated mentor availability schedule',
      response: { status: res.status, data: res.data }
    });
  } catch (error: any) {
    logResult({
      name: 'Update Availability',
      success: false,
      message: 'Failed to update availability schedule',
      error
    });
  }

  // Step 7: Get Mentored Students
  try {
    console.log('\n🧑‍🎓 Step 7: Fetching mentored students...');
    const res = await client.get('/mentor/students');
    logResult({
      name: 'Get Mentored Students',
      success: true,
      message: 'Successfully retrieved list of students assigned or scheduled with mentor',
      response: { status: res.status, data: res.data }
    });
  } catch (error: any) {
    logResult({
      name: 'Get Mentored Students',
      success: false,
      message: 'Failed to retrieve students list',
      error
    });
  }

  // Step 8: Get Mentor Earnings Breakdown
  try {
    console.log('\n💰 Step 8: Fetching earnings details...');
    const res = await client.get('/mentor/earnings');
    logResult({
      name: 'Get Earnings Breakdown',
      success: true,
      message: 'Successfully retrieved monthly breakdown and payout history',
      response: { status: res.status, data: res.data }
    });
  } catch (error: any) {
    logResult({
      name: 'Get Earnings Breakdown',
      success: false,
      message: 'Failed to retrieve earnings breakdown',
      error
    });
  }

  // Step 9: Get Mentor Sessions
  try {
    console.log('\n🎬 Step 9: Fetching mentor sessions...');
    const res = await client.get('/mentor/sessions');
    logResult({
      name: 'Get Mentor Sessions',
      success: true,
      message: 'Successfully retrieved list of all sessions',
      response: { status: res.status, data: res.data }
    });
  } catch (error: any) {
    logResult({
      name: 'Get Mentor Sessions',
      success: false,
      message: 'Failed to retrieve sessions list',
      error
    });
  }

  // Step 10: Submit Support Ticket
  try {
    console.log('\n✉️ Step 10: Submitting support ticket...');
    const res = await client.post('/mentor/support', {
      subject: 'Unable to update availability slots',
      message: 'I am trying to add slots for Friday evening but the UI freezes.'
    });
    logResult({
      name: 'Submit Support Ticket',
      success: true,
      message: 'Successfully created support ticket',
      response: { status: res.status, data: res.data }
    });
  } catch (error: any) {
    logResult({
      name: 'Submit Support Ticket',
      success: false,
      message: 'Failed to submit support ticket',
      error
    });
  }

  // Step 11: Get Support Tickets
  try {
    console.log('\n📬 Step 11: Fetching support tickets list...');
    const res = await client.get('/mentor/support');
    logResult({
      name: 'Get Support Tickets',
      success: true,
      message: 'Successfully retrieved mentor support tickets list',
      response: { status: res.status, data: res.data }
    });
  } catch (error: any) {
    logResult({
      name: 'Get Support Tickets',
      success: false,
      message: 'Failed to retrieve support tickets list',
      error
    });
  }

  // Step 12: Update Settings Account Details
  try {
    console.log('\n⚙️ Step 12: Updating account details via settings...');
    const res = await client.put('/mentor/settings/account', {
      fullName: 'Test Mentor Updated',
      phone: '+919999988888'
    });
    logResult({
      name: 'Update Account Settings',
      success: true,
      message: 'Successfully updated account settings details',
      response: { status: res.status, data: res.data }
    });
  } catch (error: any) {
    logResult({
      name: 'Update Account Settings',
      success: false,
      message: 'Failed to update account settings details',
      error
    });
  }

  // Step 13: Change Password
  try {
    console.log('\n🔒 Step 13: Changing password...');
    const res = await client.post('/mentor/settings/password', {
      currentPassword: 'Mentor@123456',
      newPassword: 'NewMentorPass@123',
      confirmPassword: 'NewMentorPass@123'
    });
    logResult({
      name: 'Change Password',
      success: true,
      message: 'Successfully changed password to new value',
      response: { status: res.status, data: res.data }
    });
  } catch (error: any) {
    logResult({
      name: 'Change Password',
      success: false,
      message: 'Failed to change password',
      error
    });
  }

  // Step 14: Change Password Back (for test repeatability)
  try {
    console.log('\n🔄 Step 14: Restoring original password for repeatability...');
    const res = await client.post('/mentor/settings/password', {
      currentPassword: 'NewMentorPass@123',
      newPassword: 'Mentor@123456',
      confirmPassword: 'Mentor@123456'
    });
    logResult({
      name: 'Restore Password',
      success: true,
      message: 'Successfully restored original password',
      response: { status: res.status, data: res.data }
    });
  } catch (error: any) {
    logResult({
      name: 'Restore Password',
      success: false,
      message: 'Failed to restore original password',
      error
    });
  }

  console.log('\n' + '='.repeat(60));
  const failed = results.filter(r => !r.success).length;
  console.log(`\n🏁 Test finished. Total: ${results.length}, Failed: ${failed}`);
  
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

testMentorAPIs();
