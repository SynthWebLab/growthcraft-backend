import nodemailer from 'nodemailer';
import { config } from '@/config';
import { logger } from '@/common/utils/logger.util';

const smtpUser = (config as any).SMTP_USER || '';
const frontendUrl = config.FRONTEND_URL;

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: config.SMTP_PASS,
      },
    });
  }

  /**
   * Send email verification OTP to user
   */
  async sendVerificationOTP(email: string, otp: string, fullName: string): Promise<void> {
    if (config.NODE_ENV === 'development') {
      logger.info(`
============================================================
[DEVELOPMENT] Email Verification OTP
Recipient: ${email} (${fullName})
Verification Code (OTP): ${otp}
============================================================
      `);
    }

    const mailOptions = {
      from: '"GrowthCraft" <' + smtpUser + '>',
      to: email,
      subject: 'Verify Your Email - GrowthCraft',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f9fafb; }
            .otp-box { 
              background: white; 
              border: 2px dashed #4F46E5; 
              padding: 20px; 
              text-align: center; 
              margin: 20px 0;
              border-radius: 8px;
            }
            .otp-code { 
              font-size: 32px; 
              font-weight: bold; 
              color: #4F46E5; 
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .warning { background: #FEF3C7; padding: 15px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to GrowthCraft!</h1>
            </div>
            <div class="content">
              <h2>Hi ${fullName},</h2>
              <p>Thank you for registering with GrowthCraft. To complete your registration, please use the verification code below:</p>
              
              <div class="otp-box">
                <p style="margin: 0; font-size: 14px; color: #666;">Your Verification Code</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Valid for 10 minutes</p>
              </div>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Never share this code with anyone</li>
                  <li>GrowthCraft will never ask for this code</li>
                  <li>This code expires in 10 minutes</li>
                  <li>You have 5 attempts to enter the correct code</li>
                </ul>
              </div>

              <p>If you didn't create an account with GrowthCraft, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} GrowthCraft. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to GrowthCraft, ${fullName}!
        
        Your email verification code is: ${otp}
        
        This code will expire in 10 minutes.
        
        Security Notice:
        - Never share this code with anyone
        - GrowthCraft will never ask for this code
        - You have 5 attempts to enter the correct code
        
        If you didn't create an account, please ignore this email.
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`Verification OTP sent to: ${email}`);
    } catch (error: any) {
      logger.error('Email sending failed (SMTP login rejected):', error?.message || error);
      if (config.NODE_ENV === 'development' || !config.SMTP_USER || (config.SMTP_PASS || '').includes('placeholder')) {
        logger.warn(`[DEVELOPMENT FALLBACK] Verification OTP for ${email} is: ${otp}`);
        return;
      }
      logger.warn(`[OTP FALLBACK] Verification OTP for ${email} is: ${otp}`);
    }
  }

  /**
   * Send password reset email with OTP
   */
  async sendPasswordResetEmail(email: string, otp: string, fullName: string): Promise<void> {
    if (config.NODE_ENV === 'development') {
      logger.info(`
============================================================
[DEVELOPMENT] Password Reset Email OTP
Recipient: ${email} (${fullName})
Verification OTP Code: ${otp}
============================================================
      `);
    }

    const mailOptions = {
      from: '"GrowthCraft" <' + smtpUser + '>',
      to: email,
      subject: 'Password Reset Verification Code - GrowthCraft',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f9fafb; }
            .otp-box { background-color: #f3f4f6; border: 2px dashed #dc2626; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #dc2626; text-align: center; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Verification Code</h1>
            </div>
            <div class="content">
              <h2>Hi ${fullName},</h2>
              <p>We received a request to reset your password. Use the following verification code to reset your password:</p>
              <div class="otp-box">${otp}</div>
              <p><strong>This code will expire in 15 minutes.</strong></p>
              <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} GrowthCraft. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to: ${email}`);
    } catch (error: any) {
      logger.error('Password reset email sending failed (SMTP login rejected):', error?.message || error);
      if (config.NODE_ENV === 'development' || !config.SMTP_USER || (config.SMTP_PASS || '').includes('placeholder')) {
        logger.warn(`[DEVELOPMENT FALLBACK] Password Reset OTP for ${email} is: ${otp}`);
        return;
      }
      logger.warn(`[OTP FALLBACK] Password Reset OTP for ${email} is: ${otp}`);
    }
  }

  /**
   * Send welcome email after successful verification
   */
  async sendWelcomeEmail(email: string, fullName: string): Promise<void> {
    const dashboardUrl = `${frontendUrl}/dashboard`;

    if (config.NODE_ENV === 'development') {
      logger.info(`
============================================================
[DEVELOPMENT] Welcome Email
Recipient: ${email} (${fullName})
============================================================
      `);
    }

    const mailOptions = {
      from: '"GrowthCraft" <' + smtpUser + '>',
      to: email,
      subject: 'Welcome to GrowthCraft! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f9fafb; }
            .button { display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .feature { margin: 15px 0; padding: 10px; background: white; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to GrowthCraft!</h1>
            </div>
            <div class="content">
              <h2>Hi ${fullName},</h2>
              <p>Your email has been successfully verified! You're all set to start your journey with GrowthCraft.</p>
              
              <div style="text-align: center;">
                <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
              </div>

              <h3>What's Next?</h3>
              <div class="feature">
                <strong>📝 Complete Your Profile</strong><br>
                Add more details to help us personalize your experience
              </div>
              <div class="feature">
                <strong>🎯 Explore Features</strong><br>
                Discover all the tools available to help you grow
              </div>
              <div class="feature">
                <strong>🤝 Connect with Others</strong><br>
                Join our community and start networking
              </div>

              <p>If you have any questions, feel free to reach out to our support team.</p>
              <p>Happy growing! 🌱</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} GrowthCraft. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to GrowthCraft, ${fullName}!
        
        Your email has been successfully verified! You're all set to start your journey with GrowthCraft.
        
        Visit your dashboard: ${dashboardUrl}
        
        What's Next?
        - Complete Your Profile
        - Explore Features
        - Connect with Others
        
        If you have any questions, feel free to reach out to our support team.
        
        Happy growing!
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to: ${email}`);
    } catch (error) {
      logger.error('Welcome email sending failed:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  /**
   * Send invite email to referred student
   */
  async sendInviteEmail(email: string, inviteLink: string, senderName: string, programName?: string): Promise<void> {
    const programText = programName ? ` for the recommended program "${programName}"` : '';
    
    if (config.NODE_ENV === 'development') {
      logger.info(`
============================================================
[DEVELOPMENT] Student Ambassador Invite Email
Recipient: ${email}
Sender: ${senderName}
Program: ${programName || 'None'}
Link: ${inviteLink}
============================================================
      `);
    }

    const mailOptions = {
      from: '"GrowthCraft" <' + smtpUser + '>',
      to: email,
      subject: `${senderName} invited you to join GrowthCraft! 🌱`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .highlight { background: #EEF2FF; padding: 15px; border-radius: 6px; border-left: 4px solid #4F46E5; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>GrowthCraft Invitation</h1>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>Your friend <strong>${senderName}</strong> has invited you to join GrowthCraft${programText}.</p>
              
              <div class="highlight">
                <strong>Why GrowthCraft?</strong><br>
                GrowthCraft is an offline-first learning platform delivering premium, in-person cohort training on college campuses to accelerate your tech career.
              </div>

              <p>Click the button below to register and join your college cohort:</p>
              <div style="text-align: center;">
                <a href="${inviteLink}" class="button">Accept Invitation</a>
              </div>
              
              <p style="font-size: 12px; color: #666; word-break: break-all; text-align: center; margin-top: 20px;">
                Or copy and paste this URL into your browser:<br>
                <a href="${inviteLink}" style="color: #4F46E5;">${inviteLink}</a>
              </p>

              <p>See you in the cohort!<br>Team GrowthCraft</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} GrowthCraft. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hello!

Your friend ${senderName} has invited you to join GrowthCraft${programText}.

GrowthCraft is an offline-first learning platform delivering premium, in-person cohort training on college campuses to accelerate your tech career.

Accept your invitation by visiting the link below:
${inviteLink}

See you in the cohort!
Team GrowthCraft
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`Invite email sent successfully to: ${email}`);
    } catch (error) {
      logger.error('Invite email sending failed:', error);
      throw new Error('Failed to send invite email');
    }
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
