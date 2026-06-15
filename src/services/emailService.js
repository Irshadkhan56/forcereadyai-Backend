import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

// Configure nodemailer transporter
const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  let pass = process.env.EMAIL_PASSWORD;

  if (!user || !pass || user.includes('your_') || pass.includes('your_')) {
    logger.warn('EMAIL_USER or EMAIL_PASSWORD environment variables are unset or using placeholder values. SMTP mailer is running in STUB/LOGGING mode.');
    return {
      sendMail: async (options) => {
        logger.info(`[SMTP STUB] Sending Email:
          To: ${options.to}
          Subject: ${options.subject}
          Body: ${options.text}
        `);
        return { messageId: 'stub-message-id' };
      }
    };
  }

  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const isGmail = host.includes('gmail') || user.includes('gmail.com');
  const sanitizedPass = pass.replace(/\s+/g, '');

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass: sanitizedPass,
      },
    });
  }

  return nodemailer.createTransport({
    host: host,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user,
      pass: sanitizedPass,
    },
  });
};

/**
 * Send reset password email to user
 * @param {string} recipientEmail 
 * @param {string} resetToken 
 */
export const sendResetPasswordEmail = async (recipientEmail, resetToken) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://forcereadyai-frontend-evtcslqfh-irshadkhan56s-projects.vercel.app';
  const resetLink = `${frontendUrl}/reset-password/${resetToken}`;
  const sender = process.env.EMAIL_FROM || 'ForceReady AI <noreply@forceready.ai>';

  const mailOptions = {
    from: sender,
    to: recipientEmail,
    subject: 'Reset Your ForceReady AI Password',
    text: `Hello,

We received a request to reset your password.

Click the link below:

${resetLink}

This link expires in 15 minutes.

If you did not request this, ignore this email.

ForceReady AI Team`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #e53e3e; text-align: center;">ForceReady AI</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password.</p>
        <p>Click the link below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Your Password</a>
        </div>
        <p>This link expires in 15 minutes.</p>
        <p>If you did not request this, ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777; text-align: center;">ForceReady AI Team</p>
      </div>
    `,
  };

  const transporter = getTransporter();
  const info = await transporter.sendMail(mailOptions);
  logger.info(`Reset email sent to ${recipientEmail}. Message ID: ${info.messageId}`);
  return info;
};

/**
 * Send OTP password reset code to user
 * @param {string} recipientEmail 
 * @param {string} otp 
 */
export const sendOTPEmail = async (recipientEmail, otp) => {
  const sender = process.env.EMAIL_FROM || 'ForceReady AI <noreply@forceready.ai>';

  const mailOptions = {
    from: sender,
    to: recipientEmail,
    subject: 'Your ForceReady AI Password Reset OTP',
    text: `Hello,

We received a request to reset your password.

Your One-Time Password (OTP) code is: ${otp}

This code is valid for 15 minutes.

If you did not request this, ignore this email.

ForceReady AI Team`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #e53e3e; text-align: center;">ForceReady AI</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password.</p>
        <p style="font-size: 14px;">Your One-Time Password (OTP) verification code is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #e53e3e; padding: 10px 20px; border: 2px dashed #e53e3e; border-radius: 8px; display: inline-block;">${otp}</span>
        </div>
        <p>This code is valid for 15 minutes.</p>
        <p>If you did not request this, ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777; text-align: center;">ForceReady AI Team</p>
      </div>
    `,
  };

  const transporter = getTransporter();
  const info = await transporter.sendMail(mailOptions);
  logger.info(`OTP reset email sent to ${recipientEmail}. Message ID: ${info.messageId}`);
  return info;
};
