import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5002}`;
const MONGODB_URI = process.env.MONGODB_URI;

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  response?: any;
  error?: any;
}

const results: TestResult[] = [];

// Helper function to log results
function logResult(result: TestResult) {
  results.push(result);
  const icon = result.success ? '✅' : '❌';
  console.log(`\n${icon} ${result.name}`);
  console.log(`   ${result.message}`);
  if (result.response) {
    console.log(`   Status: ${result.response.status}`);
  }
  if (result.error) {
    console.log(`   Error: ${result.error.message || result.error}`);
  }
}

// Main test function
async function testEnrollmentAPI() {
  console.log('🚀 Starting Enrollment API Tests\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`MongoDB: ${MONGODB_URI?.substring(0, 50)}...`);
  console.log('='.repeat(60));

  let adminToken: string = '';
  let studentId: string = '';
  let batchId: string = '';
  let enrollmentId: string = '';

  try {
    // Connect to MongoDB
    console.log('\n📦 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Step 1: Get a student from database
    console.log('\n📝 Step 1: Finding a student...');
    const student = await mongoose.connection.db.collection('users').findOne({ 
      $or: [{ role: 'Student' }, { role: 'student' }]
    });
    
    if (!student) {
      throw new Error('No student found in database. Please create a student first.');
    }
    
    studentId = student._id.toString();
    console.log(`✅ Found student: ${student.fullName} (${student.email})`);
    console.log(`   Student ID: ${studentId}`);

    // Step 2: Get an open batch from database
    console.log('\n📝 Step 2: Finding an open batch...');
    const batch = await mongoose.connection.db.collection('batches').findOne({ 
      status: { $in: ['Open', 'Filling'] },
      capacity: { $gt: 0 }
    });
    
    if (!batch) {
      throw new Error('No open batch found. Please create a batch with status "Open".');
    }
    
    batchId = batch._id.toString();
    console.log(`✅ Found batch: ${batch.code}`);
    console.log(`   Batch ID: ${batchId}`);
    console.log(`   Capacity: ${batch.enrolledCount}/${batch.capacity}`);
    console.log(`   Status: ${batch.status}`);

    // Step 3: Login as super admin
    console.log('\n📝 Step 3: Logging in as super admin...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        email: 'admin@growthcraft.com',
        password: 'Admin@123456'
      });

      // Extract access token from Set-Cookie header
      const cookies = loginResponse.headers['set-cookie'];
      if (cookies) {
        const accessTokenCookie = cookies.find((cookie: string) => cookie.startsWith('access_token='));
        if (accessTokenCookie) {
          // Extract token value from cookie string
          const match = accessTokenCookie.match(/access_token=([^;]+)/);
          if (match) {
            adminToken = match[1];
          }
        }
      }

      if (!adminToken) {
        throw new Error('No access token received from login');
      }

      console.log(`✅ Login successful`);
      if (adminToken) {
        console.log(`   Token: ${adminToken.substring(0, 50)}...`);
      }
      
      logResult({
        name: 'Admin Login',
        success: true,
        message: 'Successfully logged in as admin',
        response: { status: loginResponse.status }
      });
    } catch (error: any) {
      logResult({
        name: 'Admin Login',
        success: false,
        message: 'Failed to login as admin',
        error: error.response?.data || error.message
      });
      throw error;
    }

    // Step 4: Create enrollment (basic)
    console.log('\n📝 Step 4: Creating basic enrollment...');
    try {
      const enrollmentResponse = await axios.post(
        `${BASE_URL}/api/v1/admin/enrollments`,
        {
          studentUserId: studentId,
          batchId: batchId,
          feeQuoted: 15000.00
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );

      enrollmentId = enrollmentResponse.data.data.enrollment._id;
      console.log(`✅ Enrollment created successfully`);
      console.log(`   Enrollment ID: ${enrollmentId}`);
      console.log(`   Status: ${enrollmentResponse.data.data.enrollment.status}`);
      console.log(`   Fee Quoted: ${enrollmentResponse.data.data.enrollment.feeQuoted}`);
      console.log(`   Fee Collected: ${enrollmentResponse.data.data.enrollment.feeCollected}`);

      logResult({
        name: 'Create Basic Enrollment',
        success: true,
        message: `Created enrollment for student ${studentId} in batch ${batchId}`,
        response: { 
          status: enrollmentResponse.status,
          data: enrollmentResponse.data.data.enrollment
        }
      });
    } catch (error: any) {
      logResult({
        name: 'Create Basic Enrollment',
        success: false,
        message: 'Failed to create enrollment',
        error: error.response?.data || error.message
      });
      console.error('   Full error:', JSON.stringify(error.response?.data, null, 2));
      throw error;
    }

    // Step 5: Verify batch enrolledCount incremented
    console.log('\n📝 Step 5: Verifying batch enrolledCount...');
    const updatedBatch = await mongoose.connection.db.collection('batches').findOne({ 
      _id: new mongoose.Types.ObjectId(batchId)
    });
    
    if (updatedBatch && updatedBatch.enrolledCount === batch.enrolledCount + 1) {
      console.log(`✅ Batch enrolledCount incremented: ${batch.enrolledCount} → ${updatedBatch.enrolledCount}`);
      logResult({
        name: 'Batch enrolledCount Increment',
        success: true,
        message: `enrolledCount updated from ${batch.enrolledCount} to ${updatedBatch.enrolledCount}`
      });
    } else {
      console.log(`❌ Batch enrolledCount not incremented correctly`);
      logResult({
        name: 'Batch enrolledCount Increment',
        success: false,
        message: `Expected ${batch.enrolledCount + 1}, got ${updatedBatch?.enrolledCount}`
      });
    }

    // Step 6: Test duplicate enrollment (should fail)
    console.log('\n📝 Step 6: Testing duplicate enrollment...');
    try {
      await axios.post(
        `${BASE_URL}/api/v1/admin/enrollments`,
        {
          studentUserId: studentId,
          batchId: batchId,
          feeQuoted: 15000.00
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );

      // Should not reach here
      logResult({
        name: 'Duplicate Enrollment Prevention',
        success: false,
        message: 'Duplicate enrollment was allowed (should have been rejected)'
      });
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.error?.errors?.some((e: any) => 
        e.message.includes('already enrolled') || e.message.includes('duplicate')
      )) {
        console.log(`✅ Duplicate enrollment correctly rejected`);
        logResult({
          name: 'Duplicate Enrollment Prevention',
          success: true,
          message: 'Duplicate enrollment was correctly rejected with 400 error'
        });
      } else {
        console.log(`   Error response:`, JSON.stringify(error.response?.data, null, 2));
        logResult({
          name: 'Duplicate Enrollment Prevention',
          success: false,
          message: 'Unexpected error response',
          error: error.response?.data || error.message
        });
      }
    }

    // Step 7: Create enrollment with Razorpay
    console.log('\n📝 Step 7: Creating enrollment with Razorpay...');
    
    // Find another student
    const student2 = await mongoose.connection.db.collection('users').findOne({ 
      $or: [{ role: 'Student' }, { role: 'student' }],
      _id: { $ne: new mongoose.Types.ObjectId(studentId) }
    });

    if (student2) {
      try {
        const razorpayResponse = await axios.post(
          `${BASE_URL}/api/v1/admin/enrollments`,
          {
            studentUserId: student2._id.toString(),
            batchId: batchId,
            feeQuoted: 20000.00,
            paymentMethod: 'razorpay'
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`
            }
          }
        );

        if (razorpayResponse.data.data.paymentLink) {
          console.log(`✅ Enrollment with Razorpay payment link created`);
          console.log(`   Payment Link: ${razorpayResponse.data.data.paymentLink.url}`);
          console.log(`   Amount: ${razorpayResponse.data.data.paymentLink.amount}`);
          console.log(`   Currency: ${razorpayResponse.data.data.paymentLink.currency}`);
          
          logResult({
            name: 'Enrollment with Razorpay',
            success: true,
            message: 'Payment link generated successfully',
            response: {
              status: razorpayResponse.status,
              paymentLink: razorpayResponse.data.data.paymentLink
            }
          });
        } else {
          logResult({
            name: 'Enrollment with Razorpay',
            success: false,
            message: 'No payment link in response'
          });
        }
      } catch (error: any) {
        logResult({
          name: 'Enrollment with Razorpay',
          success: false,
          message: 'Failed to create enrollment with Razorpay',
          error: error.response?.data || error.message
        });
      }
    } else {
      console.log(`⚠️  Only one student in database, skipping Razorpay test`);
    }

    // Step 8: Test validation errors
    console.log('\n📝 Step 8: Testing validation errors...');

    // Test negative fee
    try {
      await axios.post(
        `${BASE_URL}/api/v1/admin/enrollments`,
        {
          studentUserId: studentId,
          batchId: batchId,
          feeQuoted: -100
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );
      logResult({
        name: 'Negative Fee Validation',
        success: false,
        message: 'Negative fee was accepted (should be rejected)'
      });
    } catch (error: any) {
      if (error.response?.status === 400) {
        console.log(`✅ Negative fee correctly rejected`);
        logResult({
          name: 'Negative Fee Validation',
          success: true,
          message: 'Negative fee was correctly rejected'
        });
      }
    }

    // Test invalid ObjectId
    try {
      await axios.post(
        `${BASE_URL}/api/v1/admin/enrollments`,
        {
          studentUserId: 'invalid-id',
          batchId: batchId,
          feeQuoted: 15000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );
      logResult({
        name: 'Invalid ObjectId Validation',
        success: false,
        message: 'Invalid ObjectId was accepted (should be rejected)'
      });
    } catch (error: any) {
      if (error.response?.status === 400) {
        console.log(`✅ Invalid ObjectId correctly rejected`);
        logResult({
          name: 'Invalid ObjectId Validation',
          success: true,
          message: 'Invalid ObjectId was correctly rejected'
        });
      }
    }

    // Step 9: Test unauthorized access
    console.log('\n📝 Step 9: Testing unauthorized access...');
    try {
      await axios.post(
        `${BASE_URL}/api/v1/admin/enrollments`,
        {
          studentUserId: studentId,
          batchId: batchId,
          feeQuoted: 15000.00
        },
        {
          headers: {
            'Content-Type': 'application/json'
            // No Authorization header
          }
        }
      );
      logResult({
        name: 'Unauthorized Access Prevention',
        success: false,
        message: 'Request without token was allowed (should be rejected)'
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log(`✅ Unauthorized access correctly rejected`);
        logResult({
          name: 'Unauthorized Access Prevention',
          success: true,
          message: 'Request without token was correctly rejected with 401'
        });
      }
    }

  } catch (error: any) {
    console.error('\n❌ Test execution failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n📦 MongoDB connection closed');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;
  
  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  console.log('\n' + '='.repeat(60));
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
testEnrollmentAPI().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
