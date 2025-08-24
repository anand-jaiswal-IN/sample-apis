import { config } from 'dotenv';
import { describe, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, teardownTestEnvironment } from './setup';

// Load environment variables from .env.test
config({ path: '.env.test' });

// Set up global test environment
beforeAll(async () => {
  await setupTestEnvironment();
});

// Clean up after all tests
afterAll(async () => {
  await teardownTestEnvironment();
});

// Reset database before each test
beforeEach(async () => {
  // In a real implementation, you would clean up specific tables
  // For now, we'll just reset the database
});

// Clean up after each test
afterEach(async () => {
  // In a real implementation, you would clean up specific tables
  // For now, we'll just reset the database
});

// Configure test environment
export const testConfig = {
  port: process.env.PORT || 3001,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'test-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'test-refresh-secret',
  googleClientId: process.env.GOOGLE_CLIENT_ID || 'test-google-client-id',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || 'test-google-client-secret',
  resendApiKey: process.env.RESEND_API_KEY || 'test-resend-api-key',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || 'test-cloudinary-api-key',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || 'test-cloudinary-api-secret',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || 'test-cloudinary-cloud-name',
};

// Mock external services
export const mockServices = {
  // Mock Resend email service
  resend: {
    emails: {
      send: vi.fn().mockResolvedValue({
        id: 'test-email-id',
        from: 'test@example.com',
        to: ['test@example.com'],
        subject: 'Test Email',
        html: '<p>Test HTML</p>',
      }),
    },
  },

  // Mock Cloudinary service
  cloudinary: {
    uploader: {
      upload_stream: vi.fn().mockImplementation((options, callback) => {
        const stream = new (require('stream').Writable)();
        stream._write = (chunk, encoding, next) => {
          callback(null, {
            public_id: 'test-public-id',
            version: '1234567890',
            signature: 'test-signature',
            width: 300,
            height: 300,
            format: 'webp',
            resource_type: 'image',
            created_at: '2023-01-01T00:00:00Z',
            tags: ['test-tag'],
            bytes: 1024,
            type: 'upload',
            etag: 'test-etag',
            placeholder: false,
            url: 'https://res.cloudinary.com/test-cloud/image/upload/v1234567890/test-public-id.webp',
            secure_url:
              'https://res.cloudinary.com/test-cloud/image/upload/v1234567890/test-public-id.webp',
            access_mode: 'public',
            original_filename: 'test-filename',
          });
          next();
        };
        return stream;
      }),
      destroy: vi.fn().mockResolvedValue({ result: 'ok' }),
    },
    url: vi
      .fn()
      .mockReturnValue('https://res.cloudinary.com/test-cloud/image/upload/test-public-id.webp'),
  },

  // Mock Google OAuth service
  google: {
    OAuth2: vi.fn().mockImplementation(() => ({
      get: vi.fn().mockResolvedValue({
        tokens: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          token_type: 'Bearer',
          expiry_date: Date.now() + 3600000,
        },
      }),
    })),
  },
};

// Mock environment variables
export const mockEnv = {
  ...testConfig,
  NODE_ENV: 'test',
  AUTH_RATE_LIMIT_WINDOW: '900000',
  AUTH_RATE_LIMIT_MAX: '5',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX_REQUESTS: '100',
  FRONTEND_URL: 'http://localhost:3000',
  FROM_EMAIL: 'noreply@example.com',
  BCRYPT_ROUNDS: '12',
  CORS_ORIGIN: 'http://localhost:3000',
  MAX_FILE_SIZE: '5242880',
  ALLOWED_FILE_TYPES: 'image/jpeg,image/png,image/gif,image/webp',
  SESSION_SECRET: 'test-session-secret',
  SESSION_MAX_AGE: '86400000',
  EMAIL_VERIFICATION_EXPIRES_IN: '24h',
  PASSWORD_RESET_EXPIRES_IN: '1h',
  SSL_ENABLED: 'false',
  LOG_LEVEL: 'info',
  ANALYTICS_ENABLED: 'false',
  MONITORING_ENABLED: 'false',
  CACHE_ENABLED: 'false',
  DB_POOL_MIN: '2',
  DB_POOL_MAX: '10',
  DB_POOL_ACQUIRE: '30000',
  DB_POOL_IDLE: '10000',
  TRUST_PROXY: 'true',
};

// Apply mocks before each test
beforeEach(() => {
  // Mock environment variables
  process.env = { ...process.env, ...mockEnv };

  // Mock external services
  vi.mock('resend', () => ({
    Resend: vi.fn().mockImplementation(() => mockServices.resend),
  }));

  vi.mock('cloudinary', () => ({
    v2: {
      config: vi.fn(),
      uploader: mockServices.cloudinary.uploader,
      url: mockServices.cloudinary.url,
    },
  }));

  vi.mock('google-auth-library', () => ({
    OAuth2: mockServices.google.OAuth2,
  }));
});

// Restore mocks after each test
afterEach(() => {
  vi.restoreAllMocks();
});
