import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { signup } from '../../src/routes/users/auth.routes.js';
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
  createTestUser,
  cleanupTestData,
} from '../utils.js';
import { signupSchema } from '../../src/validations/auth.validation.js';
import { authRateLimiter } from '../../src/utils/rateLimiter.js';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '../../src/utils/apiResponse.js';

// Mock dependencies
vi.mock('../../src/routes/users/auth.routes.js', () => ({
  signup: vi.fn(),
}));

vi.mock('../../src/utils/rateLimiter.js', () => ({
  authRateLimiter: vi.fn((req, res, next) => next()),
}));

vi.mock('../../src/utils/apiResponse.js', () => ({
  successResponse: vi.fn(),
  errorResponse: vi.fn(),
  validationErrorResponse: vi.fn(),
}));

describe('Signup Route', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: any;

  beforeEach(async () => {
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    mockNext = createMockNext();

    // Clean up any existing test data
    await cleanupTestData();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
    vi.clearAllMocks();
  });

  it('should create a new user with valid data', async () => {
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
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    (signup as any).mockResolvedValue(
      successResponse('User created successfully', mockResponseData)
    );

    await signup(mockRequest, mockResponse, mockNext);

    expect(signup).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
    expect(successResponse).toHaveBeenCalledWith('User created successfully', mockResponseData);
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith(
      successResponse('User created successfully', mockResponseData)
    );
  });

  it('should return validation error for invalid email', async () => {
    const userData = {
      email: 'invalid-email',
      password: 'NewPassword123!',
      confirmPassword: 'NewPassword123!',
      firstName: 'New',
      lastName: 'User',
    };

    mockRequest.body = userData;

    await signup(mockRequest, mockResponse, mockNext);

    expect(validationErrorResponse).toHaveBeenCalledWith(
      expect.arrayContaining([expect.stringContaining('Invalid email')])
    );
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      validationErrorResponse(expect.arrayContaining([expect.stringContaining('Invalid email')]))
    );
  });

  it('should return validation error for weak password', async () => {
    const userData = {
      email: 'newuser@example.com',
      password: 'weak',
      confirmPassword: 'weak',
      firstName: 'New',
      lastName: 'User',
    };

    mockRequest.body = userData;

    await signup(mockRequest, mockResponse, mockNext);

    expect(validationErrorResponse).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.stringContaining('at least 8 characters'),
        expect.stringContaining('uppercase letter'),
        expect.stringContaining('lowercase letter'),
        expect.stringContaining('number'),
        expect.stringContaining('special character'),
      ])
    );
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      validationErrorResponse(
        expect.arrayContaining([
          expect.stringContaining('at least 8 characters'),
          expect.stringContaining('uppercase letter'),
          expect.stringContaining('lowercase letter'),
          expect.stringContaining('number'),
          expect.stringContaining('special character'),
        ])
      )
    );
  });

  it('should return validation error for mismatched passwords', async () => {
    const userData = {
      email: 'newuser@example.com',
      password: 'NewPassword123!',
      confirmPassword: 'DifferentPassword123!',
      firstName: 'New',
      lastName: 'User',
    };

    mockRequest.body = userData;

    await signup(mockRequest, mockResponse, mockNext);

    expect(validationErrorResponse).toHaveBeenCalledWith(["Passwords don't match"]);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      validationErrorResponse(["Passwords don't match"])
    );
  });

  it('should return validation error for short first name', async () => {
    const userData = {
      email: 'newuser@example.com',
      password: 'NewPassword123!',
      confirmPassword: 'NewPassword123!',
      firstName: 'A',
      lastName: 'User',
    };

    mockRequest.body = userData;

    await signup(mockRequest, mockResponse, mockNext);

    expect(validationErrorResponse).toHaveBeenCalledWith([
      expect.stringContaining('at least 2 characters'),
    ]);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      validationErrorResponse([expect.stringContaining('at least 2 characters')])
    );
  });

  it('should return validation error for short last name', async () => {
    const userData = {
      email: 'newuser@example.com',
      password: 'NewPassword123!',
      confirmPassword: 'NewPassword123!',
      firstName: 'New',
      lastName: 'U',
    };

    mockRequest.body = userData;

    await signup(mockRequest, mockResponse, mockNext);

    expect(validationErrorResponse).toHaveBeenCalledWith([
      expect.stringContaining('at least 2 characters'),
    ]);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      validationErrorResponse([expect.stringContaining('at least 2 characters')])
    );
  });

  it('should return error if email already exists', async () => {
    // Create a user with the same email
    const existingUser = await createTestUser({
      email: 'existinguser@example.com',
      password: 'Password123!',
      firstName: 'Existing',
      lastName: 'User',
    });

    const userData = {
      email: existingUser.email,
      password: 'NewPassword123!',
      confirmPassword: 'NewPassword123!',
      firstName: 'New',
      lastName: 'User',
    };

    mockRequest.body = userData;

    // Mock the signup function to return an error response
    (signup as any).mockResolvedValue(errorResponse('Email already exists'));

    await signup(mockRequest, mockResponse, mockNext);

    expect(errorResponse).toHaveBeenCalledWith('Email already exists');
    expect(mockResponse.status).toHaveBeenCalledWith(409);
    expect(mockResponse.json).toHaveBeenCalledWith(errorResponse('Email already exists'));
  });

  it('should handle rate limiting', async () => {
    // Mock the rate limiter to return an error
    (authRateLimiter as any).mockImplementation((req, res, next) => {
      res.status(429).json(errorResponse('Too many requests'));
      return;
    });

    const userData = {
      email: 'newuser@example.com',
      password: 'NewPassword123!',
      confirmPassword: 'NewPassword123!',
      firstName: 'New',
      lastName: 'User',
    };

    mockRequest.body = userData;

    await signup(mockRequest, mockResponse, mockNext);

    expect(authRateLimiter).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(429);
    expect(mockResponse.json).toHaveBeenCalledWith(errorResponse('Too many requests'));
  });

  it('should handle unexpected errors', async () => {
    // Mock the signup function to throw an error
    (signup as any).mockRejectedValue(new Error('Unexpected error'));

    const userData = {
      email: 'newuser@example.com',
      password: 'NewPassword123!',
      confirmPassword: 'NewPassword123!',
      firstName: 'New',
      lastName: 'User',
    };

    mockRequest.body = userData;

    await signup(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(errorResponse('Internal server error'));
  });
});
