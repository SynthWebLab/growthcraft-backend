import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 5002;
const BASE_URL = `http://localhost:${PORT}`;

async function getAdminToken() {
  console.log('\n🔐 Getting Admin Token...\n');
  console.log('='.repeat(60));

  try {
    // First, try to login with admin credentials
    console.log('\n1️ Attempting login with admin credentials...');
    
    const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'admin@growthcraft.com',
      password: 'Admin@123456',
    });

    const { accessToken, refreshToken, user } = loginResponse.data.data;

    console.log('✅ Login successful!\n');
    console.log('👤 User Details:');
    console.log('   Name:', user.fullName);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('\n🎟️  Access Token (expires in 15 minutes):');
    console.log('   ', accessToken);
    console.log('\n🔄 Refresh Token (expires in 7 days):');
    console.log('   ', refreshToken);

    // Test the token with a batch list request
    console.log('\n2️⃣ Testing token with batch list endpoint...');
    
    try {
      const batchResponse = await axios.get(`${BASE_URL}/api/v1/admin/batches`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log('✅ Token works! Found', batchResponse.data.data.batches.length, 'batches');
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.log('⚠️  Token valid but user lacks admin permissions');
        console.log('   Current role:', user.role);
        console.log('   Required roles: SuperAdmin or Ops');
      } else {
        console.log('⚠️  Token test failed:', error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📋 Copy this for Postman/HTTP requests:');
    console.log('\nAuthorization: Bearer', accessToken);
    console.log('\n💡 Or set as environment variable:');
    console.log('jwt_token =', accessToken);
    console.log('\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data?.message || 'Unknown error');
      
      if (error.response.status === 401) {
        console.log('\n💡 Hint: Admin user may not exist or credentials are wrong');
        console.log('   Run: npm run create-admin');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Hint: Server is not running');
      console.error('   Start server: npm run dev');
    }
  }
}

getAdminToken().catch(console.error);
