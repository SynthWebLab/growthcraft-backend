/**
 * Test script for college registration
 * Run with: node scripts/test-college-registration.js
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const testCollegeRegistration = async () => {
  console.log('🧪 Testing College Registration API\n');

  // Test 1: Complete college registration
  console.log('Test 1: Complete college registration with all fields');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      fullName: 'Dr. Sharma',
      email: `test.college.${Date.now()}@example.com`,
      phone: '+91-98765-12310',
      password: 'SecurePass123',
      role: 'college',
      collegeData: {
        institutionName: 'ABC Engineering College',
        contactPerson: 'Dr. Sharma',
        designation: 'HOD / TPO',
        officialEmail: `official.${Date.now()}@abcollege.edu`,
        phone: '+91-98765-12310',
        city: 'Guwahati',
        state: 'Assam',
        website: 'https://abcollege.edu',
      },
    });

    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n');
  } catch (error) {
    console.log('❌ Failed!');
    console.log('Error:', error.response?.data || error.message);
    console.log('\n');
  }

  // Test 2: College registration without optional website
  console.log('Test 2: College registration without optional website');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      fullName: 'Dr. Kumar',
      email: `test.college2.${Date.now()}@example.com`,
      phone: '+91-98765-54321',
      password: 'SecurePass456',
      role: 'college',
      collegeData: {
        institutionName: 'XYZ Technical Institute',
        contactPerson: 'Dr. Kumar',
        designation: 'Principal',
        officialEmail: `official2.${Date.now()}@xyztech.edu`,
        phone: '+91-98765-54321',
        city: 'Mumbai',
        state: 'Maharashtra',
      },
    });

    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n');
  } catch (error) {
    console.log('❌ Failed!');
    console.log('Error:', error.response?.data || error.message);
    console.log('\n');
  }

  // Test 3: Validation error - missing required fields
  console.log('Test 3: Validation error - missing required college fields');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      fullName: 'Dr. Patel',
      email: `test.college3.${Date.now()}@example.com`,
      phone: '+91-98765-11111',
      password: 'SecurePass789',
      role: 'college',
      collegeData: {
        institutionName: 'PQR College',
        contactPerson: 'Dr. Patel',
        // Missing: designation, officialEmail, phone, city, state
      },
    });

    console.log('✅ Unexpected success (should have failed)');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n');
  } catch (error) {
    console.log('✅ Expected validation error!');
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
    console.log('\n');
  }

  // Test 4: Student registration (for comparison - should not require collegeData)
  console.log('Test 4: Student registration (no collegeData required)');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      fullName: 'John Doe',
      email: `test.student.${Date.now()}@example.com`,
      phone: '+91-98765-99999',
      password: 'StudentPass123',
      role: 'student',
    });

    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n');
  } catch (error) {
    console.log('❌ Failed!');
    console.log('Error:', error.response?.data || error.message);
    console.log('\n');
  }

  console.log('🏁 Tests completed!');
};

// Run tests
testCollegeRegistration().catch((error) => {
  console.error('Test script error:', error);
  process.exit(1);
});
