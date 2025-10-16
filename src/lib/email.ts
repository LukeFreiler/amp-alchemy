/**
 * Email utilities using Resend
 *
 * Provides functions for sending transactional emails including
 * welcome messages and password reset emails.
 */

import { Resend } from 'resend';
import { logger } from '@/lib/logger';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Centercode Alchemy <onboarding@resend.dev>'; // Update with your verified domain
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export interface SendWelcomeEmailParams {
  to: string;
  name: string;
}

export interface SendPasswordResetEmailParams {
  to: string;
  name: string;
  resetToken: string;
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail({ to, name }: SendWelcomeEmailParams): Promise<boolean> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Welcome to Centercode Alchemy',
      html: getWelcomeEmailHtml(name),
    });

    logger.info('Welcome email sent', { to });
    return true;
  } catch (error) {
    logger.error('Failed to send welcome email', { error, to });
    return false;
  }
}

/**
 * Send password reset email with token
 */
export async function sendPasswordResetEmail({
  to,
  name,
  resetToken,
}: SendPasswordResetEmailParams): Promise<boolean> {
  try {
    const resetUrl = `${APP_URL}/auth/reset-password/${resetToken}`;

    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Reset Your Password - Centercode Alchemy',
      html: getPasswordResetEmailHtml(name, resetUrl),
    });

    logger.info('Password reset email sent', { to });
    return true;
  } catch (error) {
    logger.error('Failed to send password reset email', { error, to });
    return false;
  }
}

/**
 * Welcome email HTML template
 */
function getWelcomeEmailHtml(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Centercode Alchemy</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    h1 {
      color: #111827;
      margin: 0;
      font-size: 28px;
    }
    .content {
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #3b82f6;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Centercode Alchemy</h1>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      <p>Thank you for signing up! We're excited to have you on board.</p>
      <p>Centercode Alchemy helps you transform raw inputs into polished deliverables with AI-powered workflows.</p>
      <p>Ready to get started?</p>
      <a href="${APP_URL}/sessions" class="button">Go to Dashboard</a>
    </div>
    <div class="footer">
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>&copy; ${new Date().getFullYear()} Centercode Alchemy. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Password reset email HTML template
 */
function getPasswordResetEmailHtml(name: string, resetUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    h1 {
      color: #111827;
      margin: 0;
      font-size: 28px;
    }
    .content {
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #3b82f6;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 20px 0;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 30px;
    }
    .code {
      background-color: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reset Your Password</h1>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      <p>We received a request to reset your password for your Centercode Alchemy account.</p>
      <p>Click the button below to reset your password. This link will expire in 24 hours.</p>
      <a href="${resetUrl}" class="button">Reset Password</a>
      <div class="warning">
        <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
      </div>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p class="code">${resetUrl}</p>
    </div>
    <div class="footer">
      <p>This link will expire in 24 hours for your security.</p>
      <p>&copy; ${new Date().getFullYear()} Centercode Alchemy. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
