import { Resend } from 'resend';
import { env } from './env.js';
import { ApiResponse } from './apiResponse.js';

// Initialize Resend
const resend = new Resend(env.RESEND_API_KEY);

// Email verification template
export const emailVerificationTemplate = (verificationLink: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    h1 {
      color: #2c3e50;
    }
    .button {
      display: inline-block;
      background-color: #3498db;
      color: white;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 20px;
      font-size: 12px;
      color: #7f8c8d;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Email Verification</h1>
    <p>Thank you for registering! Please click the button below to verify your email address.</p>
    <a href="${verificationLink}" class="button">Verify Email</a>
    <p>If you didn't create an account, no further action is needed.</p>
    <div class="footer">
      This link will expire in 24 hours for security reasons.
    </div>
  </div>
</body>
</html>
`;

// Password reset template
export const passwordResetTemplate = (resetLink: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    h1 {
      color: #e74c3c;
    }
    .button {
      display: inline-block;
      background-color: #e74c3c;
      color: white;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 20px;
      font-size: 12px;
      color: #7f8c8d;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Password Reset Request</h1>
    <p>We received a request to reset your password. Click the button below to create a new password.</p>
    <a href="${resetLink}" class="button">Reset Password</a>
    <p>If you didn't request a password reset, please ignore this email.</p>
    <div class="footer">
      This link will expire in 1 hour for security reasons.
    </div>
  </div>
</body>
</html>
`;

// Send email verification
export async function sendEmailVerification(
  email: string,
  verificationToken: string,
  verificationLink: string
): Promise<ApiResponse> {
  try {
    const { data, error } = await resend.emails.send({
      from: env.FROM_EMAIL,
      to: email,
      subject: 'Verify Your Email Address',
      html: emailVerificationTemplate(verificationLink),
    });

    if (error) {
      return {
        success: false,
        message: 'Failed to send verification email',
        errors: [error.message],
      };
    }

    return {
      success: true,
      message: 'Verification email sent successfully',
      data,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to send verification email',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

// Send password reset email
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  resetLink: string
): Promise<ApiResponse> {
  try {
    const { data, error } = await resend.emails.send({
      from: env.FROM_EMAIL,
      to: email,
      subject: 'Reset Your Password',
      html: passwordResetTemplate(resetLink),
    });

    if (error) {
      return {
        success: false,
        message: 'Failed to send password reset email',
        errors: [error.message],
      };
    }

    return {
      success: true,
      message: 'Password reset email sent successfully',
      data,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to send password reset email',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

// Generate verification token with expiration
export function generateVerificationToken(): { token: string; expiresAt: Date } {
  const token =
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiration

  return { token, expiresAt };
}

// Generate password reset token with expiration
export function generatePasswordResetToken(): { token: string; expiresAt: Date } {
  const token =
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

  return { token, expiresAt };
}

// Check if token is expired
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}
