import { Request, Response, NextFunction } from 'express';
import { db } from '../../../src/db/utils.js';
import { users, profiles, emailVerifications, passwordResets } from '../../../src/db/schema.js';
import { eq, and, or, isNull } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { authRateLimiter } from '../../../src/utils/rateLimiter.js';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '../../../src/utils/apiResponse.js';
import { sendVerificationEmail, generateVerificationToken } from '../../../src/utils/email.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../../src/utils/jwt.js';
import { comparePassword, hashPassword } from '../../../src/utils/password.js';
import {
  signupSchema,
  signinSchema,
  googleAuthSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../../../src/validations/auth.validation.js';

// Constants
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.FRONTEND_URL + '/auth/google/callback';

// Helper function to generate tokens
const generateTokens = async (userId: string) => {
  const accessToken = generateAccessToken({ userId }, JWT_SECRET, JWT_ACCESS_EXPIRES_IN);
  const refreshToken = generateRefreshToken({ userId }, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN);
  return { accessToken, refreshToken };
};

// Signup controller
export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Apply rate limiting
    authRateLimiter(req, res, (err?: any) => {
      if (err) return next(err);
    });

    // Validate request body
    const validatedData = signupSchema.parse(req.body);
    const { email, password, confirmPassword, firstName, lastName } = validatedData;

    // Check if passwords match
    if (password !== confirmPassword) {
      return validationErrorResponse(res, ["Passwords don't match"]);
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(or(eq(users.email, email), and(isNull(users.deletedAt), eq(users.email, email))));

    if (existingUser.length > 0) {
      return errorResponse(res, 'Email already exists', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        emailVerified: false,
      })
      .returning();

    // Create profile
    const [newProfile] = await db
      .insert(profiles)
      .values({
        userId: newUser.id,
      })
      .returning();

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(newUser.id);

    // Send verification email
    const { token, expiresAt } = generateVerificationToken();
    await db.insert(emailVerifications).values({
      userId: newUser.id,
      token,
      expiresAt,
    });

    // In production, you would send the email here
    // await sendVerificationEmail(newUser.email, token);

    // Return response
    return successResponse(
      res,
      'User created successfully',
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          emailVerified: newUser.emailVerified,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt,
        },
        profile: {
          id: newProfile.id,
          userId: newProfile.userId,
          bio: newProfile.bio,
          avatarUrl: newProfile.avatarUrl,
          createdAt: newProfile.createdAt,
          updatedAt: newProfile.updatedAt,
        },
        accessToken,
        refreshToken,
      },
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(
        res,
        error.errors.map((err) => err.message)
      );
    }
    next(error);
  }
};

// Signin controller
export const signin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Apply rate limiting
    authRateLimiter(req, res, (err?: any) => {
      if (err) return next(err);
    });

    // Validate request body
    const validatedData = signinSchema.parse(req.body);
    const { email, password } = validatedData;

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)));

    if (!user) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return errorResponse(res, 'Please verify your email address', 401);
    }

    // Get profile
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id));

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user.id);

    // Return response
    return successResponse(res, 'Login successful', {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      profile: {
        id: profile.id,
        userId: profile.userId,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(
        res,
        error.errors.map((err) => err.message)
      );
    }
    next(error);
  }
};

// Google OAuth controller
export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Apply rate limiting
    authRateLimiter(req, res, (err?: any) => {
      if (err) return next(err);
    });

    // Validate query parameters
    const validatedData = googleAuthSchema.parse(req.query);
    const { code } = validatedData;

    // In a real implementation, you would exchange the code for tokens
    // and get user info from Google
    // For now, we'll simulate the process

    // Mock Google user data
    const googleUser = {
      id: 'google-id-12345',
      email: 'google.user@example.com',
      name: 'Google User',
      picture: 'https://lh3.googleusercontent.com/.../photo.jpg',
    };

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(
        and(
          or(eq(users.email, googleUser.email), eq(users.googleId, googleUser.id)),
          isNull(users.deletedAt)
        )
      );

    let user;
    let profile;

    if (existingUser) {
      // Update user with Google info
      [user] = await db
        .update(users)
        .set({
          googleId: googleUser.id,
          emailVerified: true,
          firstName: googleUser.name.split(' ')[0] || 'Google',
          lastName: googleUser.name.split(' ')[1] || 'User',
        })
        .where(eq(users.id, existingUser.id))
        .returning();

      [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
    } else {
      // Create new user
      [user] = await db
        .insert(users)
        .values({
          email: googleUser.email,
          googleId: googleUser.id,
          firstName: googleUser.name.split(' ')[0] || 'Google',
          lastName: googleUser.name.split(' ')[1] || 'User',
          emailVerified: true,
        })
        .returning();

      [profile] = await db
        .insert(profiles)
        .values({
          userId: user.id,
          avatarUrl: googleUser.picture,
        })
        .returning();
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user.id);

    // Return response
    return successResponse(res, 'Google authentication successful', {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      profile: {
        id: profile.id,
        userId: profile.userId,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(
        res,
        error.errors.map((err) => err.message)
      );
    }
    next(error);
  }
};

// Refresh token controller
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = refreshTokenSchema.parse(req.body);
    const { refreshToken: refreshTokenToken } = validatedData;

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshTokenToken, JWT_REFRESH_SECRET);
    if (!decoded) {
      return errorResponse(res, 'Invalid refresh token', 401);
    }

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, decoded.userId), isNull(users.deletedAt)));

    if (!user) {
      return errorResponse(res, 'Invalid refresh token', 401);
    }

    // Generate new access token
    const accessToken = generateAccessToken({ userId: user.id }, JWT_SECRET, JWT_ACCESS_EXPIRES_IN);

    // Return response
    return successResponse(res, 'Token refreshed successfully', {
      accessToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(
        res,
        error.errors.map((err) => err.message)
      );
    }
    next(error);
  }
};

// Logout controller
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a real implementation, you would invalidate the refresh token
    // For now, we'll just return a success response

    // Return response
    return successResponse(res, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

// Send verification email controller
export const sendVerificationEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Apply rate limiting
    authRateLimiter(req, res, (err?: any) => {
      if (err) return next(err);
    });

    // Get user from request (set by auth middleware)
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    // Check if email is already verified
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)));

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (user.emailVerified) {
      return errorResponse(res, 'Email already verified', 400);
    }

    // Generate verification token
    const { token, expiresAt } = generateVerificationToken();

    // Save verification token
    await db.insert(emailVerifications).values({
      userId,
      token,
      expiresAt,
    });

    // Send verification email
    await sendVerificationEmail(user.email, token);

    // Return response
    return successResponse(res, 'Verification email sent successfully');
  } catch (error) {
    next(error);
  }
};

// Verify email controller
export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = z
      .object({
        token: z.string(),
      })
      .parse(req.body);

    const { token } = validatedData;

    // Find verification record
    const [verification] = await db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.token, token));

    if (!verification) {
      return validationErrorResponse(res, ['Invalid verification token']);
    }

    // Check if token is expired
    if (new Date() > verification.expiresAt) {
      return errorResponse(res, 'Verification token expired', 410);
    }

    // Mark user as verified
    await db.update(users).set({ emailVerified: true }).where(eq(users.id, verification.userId));

    // Delete verification record
    await db.delete(emailVerifications).where(eq(emailVerifications.id, verification.id));

    // Return response
    return successResponse(res, 'Email verified successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(
        res,
        error.errors.map((err) => err.message)
      );
    }
    next(error);
  }
};

// Forgot password controller
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Apply rate limiting
    authRateLimiter(req, res, (err?: any) => {
      if (err) return next(err);
    });

    // Validate request body
    const validatedData = forgotPasswordSchema.parse(req.body);
    const { email } = validatedData;

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)));

    if (!user) {
      // Don't reveal if user exists or not
      return successResponse(res, 'Password reset email sent successfully');
    }

    // Generate password reset token
    const { token, expiresAt } = generateVerificationToken();

    // Save password reset token
    await db.insert(passwordResets).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // Send password reset email
    // In production, you would send the email here
    // await sendPasswordResetEmail(user.email, token);

    // Return response
    return successResponse(res, 'Password reset email sent successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(
        res,
        error.errors.map((err) => err.message)
      );
    }
    next(error);
  }
};

// Reset password controller
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = resetPasswordSchema.parse(req.body);
    const { token, password, confirmPassword } = validatedData;

    // Check if passwords match
    if (password !== confirmPassword) {
      return validationErrorResponse(res, ["Passwords don't match"]);
    }

    // Find password reset record
    const [resetRecord] = await db
      .select()
      .from(passwordResets)
      .where(eq(passwordResets.token, token));

    if (!resetRecord) {
      return validationErrorResponse(res, ['Invalid reset token']);
    }

    // Check if token is expired
    if (new Date() > resetRecord.expiresAt) {
      return errorResponse(res, 'Reset token expired', 410);
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, resetRecord.userId));

    // Delete password reset record
    await db.delete(passwordResets).where(eq(passwordResets.id, resetRecord.id));

    // Return response
    return successResponse(res, 'Password reset successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(
        res,
        error.errors.map((err) => err.message)
      );
    }
    next(error);
  }
};

// Change password controller
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = changePasswordSchema.parse(req.body);
    const { currentPassword, newPassword, confirmPassword } = validatedData;

    // Get user from request (set by auth middleware)
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)));

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Check current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return validationErrorResponse(res, ['Invalid current password']);
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return validationErrorResponse(res, ["Passwords don't match"]);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));

    // Return response
    return successResponse(res, 'Password changed successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(
        res,
        error.errors.map((err) => err.message)
      );
    }
    next(error);
  }
};
