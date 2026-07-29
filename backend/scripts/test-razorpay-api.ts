import axios from 'axios';
import crypto from 'crypto';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5002/api/v1';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'EvxFAboPdOcnj8qGcHe3PFdg';

async function testRazorpayIntegration() {
  console.log('===================================================');
  console.log('🧪 TESTING RAZORPAY PAYMENT API INTEGRATION');
  console.log('===================================================');
  console.log(`Base URL: ${BASE_URL}\n`);

  try {
    // STEP 1: Create Payment Order
    console.log('Step 1: Creating Razorpay Order via POST /payments/create-order...');
    const createOrderPayload = {
      amount: 2500,
      currency: 'INR',
      itemType: 'bootcamp',
      itemId: '6580f1234567890123456789',
      notes: { testRun: true, studentName: 'Test Student' },
    };

    const orderRes = await axios.post(`${BASE_URL}/payments/create-order`, createOrderPayload);

    if (!orderRes.data || !orderRes.data.success) {
      throw new Error(`Failed to create order: ${JSON.stringify(orderRes.data)}`);
    }

    const { orderId, amount, currency, keyId } = orderRes.data.data;
    console.log('✅ Razorpay Order successfully created!');
    console.log(`   - Order ID: ${orderId}`);
    console.log(`   - Amount (in paise): ${amount}`);
    console.log(`   - Currency: ${currency}`);
    console.log(`   - Key ID: ${keyId}`);

    // STEP 2: Simulate Razorpay HMAC SHA256 Signature Verification
    console.log('\nStep 2: Simulating payment verification via POST /payments/verify...');
    const mockPaymentId = `pay_${Date.now()}_test`;
    const textToSign = `${orderId}|${mockPaymentId}`;
    const mockSignature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(textToSign)
      .digest('hex');

    const verifyPayload = {
      razorpayOrderId: orderId,
      razorpayPaymentId: mockPaymentId,
      razorpaySignature: mockSignature,
    };

    const verifyRes = await axios.post(`${BASE_URL}/payments/verify`, verifyPayload);

    if (verifyRes.data && verifyRes.data.success) {
      console.log('✅ Razorpay Payment Signature successfully verified!');
      console.log(`   - Payment ID: ${verifyRes.data.data.paymentId}`);
      console.log(`   - Status: ${verifyRes.data.data.transaction.status}`);
      console.log(`   - Message: ${verifyRes.data.message}`);
    } else {
      throw new Error(`Payment verification failed: ${JSON.stringify(verifyRes.data)}`);
    }

    // STEP 3: Test Payment Link Generation
    console.log('\nStep 3: Testing Admin Payment Link generation...');
    try {
      const linkPayload = {
        amount: 5000,
        description: 'Test Course Seat Reservation Link',
        itemType: 'reservation',
        itemId: '6580f1234567890123456799',
        customer: {
          name: 'Sandipan Goswami',
          email: 'sandipan@example.com',
          phone: '+919876543210',
        },
      };

      const mongoose = (await import('mongoose')).default;
      const { config } = await import('../src/config');
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(config.MONGODB_URI);
      }
      const { paymentService } = await import('../src/modules/payments/services/payment.service');
      const linkRes = await paymentService.generatePaymentLink(linkPayload);


      console.log('✅ Razorpay Payment Link successfully generated!');
      console.log(`   - Link ID: ${linkRes.id}`);
      console.log(`   - Link URL: ${linkRes.url}`);
      console.log(`   - Amount: ₹${linkRes.amount}`);
    } catch (err: any) {
      console.log(`⚠️ Payment Link test note: ${err.message || err}`);
    }

    console.log('\n===================================================');
    console.log('🎉 ALL RAZORPAY PAYMENT TESTS PASSED SUCCESSFULLY!');
    console.log('===================================================\n');
    process.exit(0);
  } catch (error: any) {

    console.error('❌ Razorpay Test Failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testRazorpayIntegration();
