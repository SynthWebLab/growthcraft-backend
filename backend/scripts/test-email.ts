import * as dotenv from 'dotenv';
import * as path from 'path';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testEmailConfiguration() {
  console.log('\n🔍 Testing Email Configuration...\n');

  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

  console.log('Configuration:');
  console.log(`  SMTP Host: ${SMTP_HOST}`);
  console.log(`  SMTP Port: ${SMTP_PORT}`);
  console.log(`  SMTP User: ${SMTP_USER}`);
  console.log(`  SMTP Pass: ${SMTP_PASS ? '***' + SMTP_PASS.slice(-4) : 'Not set'}`);
  console.log(`  Frontend URL: ${FRONTEND_URL}\n`);

  // Get arguments - check if first arg is an email or --send flag
  const args = process.argv.slice(2);
  let testEmail: string | undefined;

  if (args.length > 0) {
    // If first arg is --send, use second arg as email
    if (args[0] === '--send' && args[1]) {
      testEmail = args[1];
    }
    // If first arg looks like an email, use it directly
    else if (args[0].includes('@')) {
      testEmail = args[0];
    }
  }

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log('❌ Missing SMTP configuration in .env file\n');
    console.log('Required variables:');
    console.log('  - SMTP_HOST');
    console.log('  - SMTP_PORT');
    console.log('  - SMTP_USER');
    console.log('  - SMTP_PASS\n');
    console.log('See backend/docs/PERSONAL_SMTP_SETUP.md for setup instructions\n');
    process.exit(1);
  }

  try {
    console.log('Testing SMTP connection...');

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.verify();
    console.log('✅ Email service connected successfully!\n');

    // Optionally send a test email
    if (testEmail) {
      console.log(`Sending test email to: ${testEmail}...`);

      const verificationUrl = `${FRONTEND_URL}/verify-email?token=test-token-123456789`;

      await transporter.sendMail({
        from: `"GrowthCraft" <${SMTP_USER}>`,
        to: testEmail,
        subject: 'Test Email - GrowthCraft Email Verification',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
              .content { padding: 30px; background-color: #f9fafb; }
              .button { display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Test Email - GrowthCraft</h1>
              </div>
              <div class="content">
                <h2>✅ Email Configuration Working!</h2>
                <p>This is a test email from your GrowthCraft backend.</p>
                <p>If you're seeing this, your SMTP configuration is working correctly!</p>
                <div style="text-align: center;">
                  <a href="${verificationUrl}" class="button">Test Verification Link</a>
                </div>
                <p><strong>Configuration Details:</strong></p>
                <ul>
                  <li>SMTP Host: ${SMTP_HOST}</li>
                  <li>SMTP Port: ${SMTP_PORT}</li>
                  <li>SMTP User: ${SMTP_USER}</li>
                </ul>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} GrowthCraft. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Test Email - GrowthCraft
          
          ✅ Email Configuration Working!
          
          This is a test email from your GrowthCraft backend.
          If you're seeing this, your SMTP configuration is working correctly!
          
          Configuration Details:
          - SMTP Host: ${SMTP_HOST}
          - SMTP Port: ${SMTP_PORT}
          - SMTP User: ${SMTP_USER}
        `,
      });

      console.log('✅ Test email sent successfully!');
      console.log('📧 Check your inbox (and spam folder)\n');
    } else {
      console.log('💡 To send a test email, run:');
      console.log('   npm run test:email -- your-email@example.com\n');
    }
  } catch (error: any) {
    console.error('❌ Error testing email configuration:', error.message);
    console.log('\nCommon issues:');
    console.log('  • Invalid credentials - Check SMTP_USER and SMTP_PASS');
    console.log('  • Gmail: Need App Password with 2FA enabled');
    console.log('  • Connection timeout - Check SMTP_HOST and SMTP_PORT');
    console.log('  • Firewall blocking - Allow outbound SMTP connections\n');
    console.log('See backend/docs/PERSONAL_SMTP_SETUP.md for detailed help\n');
    process.exit(1);
  }
}

testEmailConfiguration();
