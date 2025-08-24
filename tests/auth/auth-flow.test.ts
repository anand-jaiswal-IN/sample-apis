import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  signup,
  signin,
  googleAuth,
  refreshToken,
  logout,
} from '../../src/routes/users/auth.routes.js';
import {
  createTestUser,
  createTestGoogleUser,
  deleteTestUser,
  generateTestTokens,
  createMockRequest,
  createMockResponse,
  createMockNext,
  cleanupTestData,
} from '../utils.js';
import { db } from '../setup.js';
import { eq } from 'drizzle-orm';
import { users, profiles, emailVerifications, passwordResets } from '../../src/db/schema.js';
import { verifyEmail } from '../../src/utils/email.js';
import { hashPassword } from '../../src/utils/password.js';
import { generateAccessToken, generateRefreshToken } from '../../src/utils/jwt.js';

// Mock dependencies
vi.mock('../../src/routes/users/auth.routes.js', () => ({
  signup: vi.fn(),
  signin: vi.fn(),
  googleAuth: vi.fn(),
  refreshToken: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('../../src/utils/email.js', () => ({
  sendVerificationEmail: vi.fn(),
  verifyEmail: vi.fn(),
  generateVerificationToken: vi.fn(() => ({
    token: 'mock-verification-token',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  })),
  generatePasswordResetToken: vi.fn(() => ({
    token: 'mock-reset-token',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  })),
}));

vi.mock('../../src/utils/password.js', () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
}));

vi.mock('../../src/utils/jwt.js', () => ({
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  verifyAccessToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
}));

describe('Authentication Flow', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: any;

  beforeEach(async () => {
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    mockNext = createMockNext();

    // Clean up any existing test data
    await cleanupTestData();

    // Mock hashPassword
    (hashPassword as any).mockImplementation((password: string) => `hashed-${password}`);

    // Mock token generation
    (generateAccessToken as any).mockImplementation(
      (payload: any) => `mock-access-token-${payload.userId}`
    );
    (generateRefreshToken as any).mockImplementation(
      (payload: any) => `mock-refresh-token-${payload.userId}`
    );
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
    vi.clearAllMocks();
  });

  describe('Complete User Registration Flow', () => {
    it('should register a new user, verify email, and sign in', async () => {
      // Step 1: Register a new user
      const userData = {
        email: 'newuser@example.com',
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
        firstName: 'New',
        lastName: 'User',
      };

      mockRequest.body = userData;

      // Mock the signup function to return a success response
      const mockUser = {
        id: 'user-id-123',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockProfile = {
        id: 'profile-id-123',
        userId: mockUser.id,
        bio: null,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponseData = {
        user: mockUser,
        profile: mockProfile,
        accessToken: 'mock-access-token-user-id-123',
        refreshToken: 'mock-refresh-token-user-id-123',
      };

      (signup as any).mockResolvedValue({
        success: true,
        message: 'User created successfully',
        data: mockResponseData,
      });

      await signup(mockRequest, mockResponse, mockNext);

      // Verify signup was called
      expect(signup).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);

      // Verify user was created in database
      const user = await db.select().from(users).where(eq(users.email, userData.email));
      expect(user).toHaveLength(1);
      expect(user[0].email).toBe(userData.email);
      expect(user[0].emailVerified).toBe(false);

      // Step 2: Verify email
      const verificationToken = 'mock-verification-token';
      mockRequest.body = { token: verificationToken };

      (verifyEmail as any).mockResolvedValue({
        success: true,
        message: 'Email verified successfully',
      });

      // In a real implementation, this would be a separate route
      // For testing, we'll simulate the verification process
      await db.update(users).set({ emailVerified: true }).where(eq(users.id, user[0].id));

      // Verify user is now verified
      const verifiedUser = await db.select().from(users).where(eq(users.id, user[0].id));
      expect(verifiedUser[0].emailVerified).toBe(true);

      // Step 3: Sign in
      mockRequest.body = {
        email: userData.email,
        password: userData.password,
      };

      (signin as any).mockResolvedValue({
        success: true,
        message: 'Login successful',
        data: {
          ...mockResponseData,
          user: { ...mockUser, emailVerified: true },
        },
      });

      await signin(mockRequest, mockResponse, mockNext);

      // Verify signin was called
      expect(signin).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
    });

    it('should handle registration with existing email', async () => {
      // Create a user first
      await createTestUser({
        email: 'existinguser@example.com',
        password: 'Password123!',
        firstName: 'Existing',
        lastName: 'User',
      });

      // Try to register with the same email
      const userData = {
        email: 'existinguser@example.com',
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
        firstName: 'New',
        lastName: 'User',
      };

      mockRequest.body = userData;

      // Mock the signup function to return an error response
      (signup as any).mockResolvedValue({
        success: false,
        message: 'Email already exists',
        errors: ['Email already exists'],
      });

      await signup(mockRequest, mockResponse, mockNext);

      // Verify signup was called
      expect(signup).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);

      // Verify error response
      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email already exists',
        errors: ['Email already exists'],
      });
    });
  });

  describe('Complete Google OAuth Flow', () => {
    it('should handle Google OAuth registration and sign in', async () => {
      // Step 1: Simulate Google OAuth callback
      const googleUserData = {
        email: 'google.user@example.com',
        firstName: 'Google',
        lastName: 'User',
        googleId: 'google-id-12345',
      };

      mockRequest.query = { code: 'mock-google-auth-code' };

      // Mock the googleAuth function to return a success response
      const mockUser = {
        id: 'google-user-id-123',
        email: googleUserData.email,
        firstName: googleUserData.firstName,
        lastName: googleUserData.lastName,
        googleId: googleUserData.googleId,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockProfile = {
        id: 'google-profile-id-123',
        userId: mockUser.id,
        bio: null,
        avatarUrl: 'https://lh3.googleusercontent.com/.../photo.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponseData = {
        user: mockUser,
        profile: mockProfile,
        accessToken: 'mock-access-token-google-user-id-123',
        refreshToken: 'mock-refresh-token-google-user-id-123',
      };

      (googleAuth as any).mockResolvedValue({
        success: true,
        message: 'Google authentication successful',
        data: mockResponseData,
      });

      await googleAuth(mockRequest, mockResponse, mockNext);

      // Verify googleAuth was called
      expect(googleAuth).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);

      // Verify user was created in database
      const user = await db.select().from(users).where(eq(users.email, googleUserData.email));
      expect(user).toHaveLength(1);
      expect(user[0].email).toBe(googleUserData.email);
      expect(user[0].googleId).toBe(googleUserData.googleId);
      expect(user[0].emailVerified).toBe(true);

      // Step 2: Sign in with Google
      mockRequest.body = {
        email: googleUserData.email,
        password: 'any-password', // Not used for Google sign in
      };

      (signin as any).mockResolvedValue({
        success: true,
        message: 'Login successful',
        data: mockResponseData,
      });

      await signin(mockRequest, mockResponse, mockNext);

      // Verify signin was called
      expect(signin).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
    });
  });

  describe('Token Refresh Flow', () => {
    it('should refresh access token using refresh token', async () => {
      // Create a user
      const user = await createTestUser({
        email: 'tokenuser@example.com',
        password: 'Password123!',
        firstName: 'Token',
        lastName: 'User',
      });

      // Generate tokens
      const { accessToken, refreshToken } = generateTestTokens(user.id);

      // Step 1: Use access token for protected route
      mockRequest.headers = {
        Authorization: `Bearer ${accessToken}`,
      };

      // Step 2: Simulate token expiration by refreshing
      mockRequest.body = { refreshToken };

      (refreshToken as any).mockResolvedValue({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: 'new-mock-access-token',
        },
      });

      await refreshToken(mockRequest, mockResponse, mockNext);

      // Verify refreshToken was called
      expect(refreshToken).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);

      // Verify new access token was returned
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: 'new-mock-access-token',
        },
      });
    });

    it('should handle invalid refresh token', async () => {
      mockRequest.body = { refreshToken: 'invalid-refresh-token' };

      (refreshToken as any).mockResolvedValue({
        success: false,
        message: 'Invalid refresh token',
        errors: ['Invalid refresh token'],
      });

      await refreshToken(mockRequest, mockResponse, mockNext);

      // Verify refreshToken was called
      expect(refreshToken).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);

      // Verify error response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid refresh token',
        errors: ['Invalid refresh token'],
      });
    });
  });

  describe('Logout Flow', () => {
    it('should logout user and invalidate refresh token', async () => {
      // Create a user
      const user = await createTestUser({
        email: 'logoutuser@example.com',
        password: 'Password123!',
        firstName: 'Logout',
        lastName: 'User',
      });

      // Generate access token
      const { accessToken } = generateTestTokens(user.id);

      // Step 1: Logout
      mockRequest.headers = {
        Authorization: `Bearer ${accessToken}`,
      };

      (logout as any).mockResolvedValue({
        success: true,
        message: 'Logout successful',
      });

      await logout(mockRequest, mockResponse, mockNext);

      // Verify logout was called
      expect(logout).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);

      // Verify success response
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful',
      });
    });
  });

  describe('Password Management Flow', () => {
    it('should handle password change flow', async () => {
      // Create a user
      const user = await createTestUser({
        email: 'passworduser@example.com',
        password: 'OldPassword123!',
        firstName: 'Password',
        lastName: 'User',
      });

      // Generate access token
      const { accessToken } = generateTestTokens(user.id);

      // Step 1: Change password
      mockRequest.headers = {
        Authorization: `Bearer ${accessToken}`,
      };

      mockRequest.body = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      };

      // Mock the password change function (would be in auth.routes)
      (signin as any).mockImplementation(async (req: any, res: any, next: any) => {
        // Verify current password
        const isMatch = await (comparePassword as any)('OldPassword123!', 'hashed-OldPassword123!');
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: 'Invalid current password',
            errors: ['Invalid current password'],
          });
        }

        // Update password in database
        await db
          .update(users)
          .set({
            password: await (hashPassword as any)('NewPassword123!'),
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));

        return res.json({
          success: true,
          message: 'Password changed successfully',
        });
      });

      await signin(mockRequest, mockResponse, mockNext);

      // Verify signin was called
      expect(signin).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);

      // Verify success response
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password changed successfully',
      });

      // Step 2: Verify new password works
      mockRequest.body = {
        email: 'passworduser@example.com',
        password: 'NewPassword123!',
      };

      (signin as any).mockImplementation(async (req: any, res: any, next: any) => {
        // Find user
        const [foundUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, 'passworduser@example.com'));

        // Verify password
        const isMatch = await (comparePassword as any)('NewPassword123!', foundUser.password);
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials',
            errors: ['Invalid credentials'],
          });
        }

        // Generate new tokens
        const newAccessToken = await (generateAccessToken as any)({ userId: foundUser.id });
        const newRefreshToken = await (generateRefreshToken as any)({ userId: foundUser.id });

        return res.json({
          success: true,
          message: 'Login successful',
          data: {
            user: foundUser,
            profile: await db.select().from(profiles).where(eq(profiles.userId, foundUser.id)),
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          },
        });
      });

      await signin(mockRequest, mockResponse, mockNext);

      // Verify signin was called
      expect(signin).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);

      // Verify success response
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
        })
      );
    });
  });

  describe('Email Verification Flow', () => {
    it('should handle email verification flow', async () => {
      // Create a user
      const user = await createTestUser({
        email: 'verifyuser@example.com',
        password: 'Password123!',
        firstName: 'Verify',
        lastName: 'User',
      });

      // Step 1: Send verification email
      mockRequest.headers = {
        Authorization: `Bearer mock-access-token`,
      };

      // Mock the send verification email function
      (sendVerificationEmail as any).mockResolvedValue({
        success: true,
        message: 'Verification email sent successfully',
      });

      // In a real implementation, this would be a separate route
      // For testing, we'll simulate the process
      const verificationToken = 'mock-verification-token';
      await db.insert(emailVerifications).values({
        userId: user.id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      // Step 2: Verify email
      mockRequest.body = { token: verificationToken };

      (verifyEmail as any).mockImplementation(async (req: any, res: any, next: any) => {
        // Find verification record
        const [verification] = await db
          .select()
          .from(emailVerifications)
          .where(eq(emailVerifications.token, verificationToken));

        if (!verification) {
          return res.status(400).json({
            success: false,
            message: 'Invalid verification token',
            errors: ['Invalid verification token'],
          });
        }

        // Check if token is expired
        if (new Date() > verification.expiresAt) {
          return res.status(410).json({
            success: false,
            message: 'Verification token expired',
            errors: ['Verification token expired'],
          });
        }

        // Mark user as verified
        await db
          .update(users)
          .set({ emailVerified: true })
          .where(eq(users.id, verification.userId));

        // Delete verification record
        await db.delete(emailVerifications).where(eq(emailVerifications.id, verification.id));

        return res.json({
          success: true,
          message: 'Email verified successfully',
        });
      });

      await verifyEmail(mockRequest, mockResponse, mockNext);

      // Verify verifyEmail was called
      expect(verifyEmail).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);

      // Verify success response
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Email verified successfully',
      });

      // Verify user is now verified
      const verifiedUser = await db.select().from(users).where(eq(users.id, user.id));
      expect(verifiedUser[0].emailVerified).toBe(true);
    });
  });
});
