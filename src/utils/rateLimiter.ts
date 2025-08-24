import { env } from './env.js';
import { ApiResponse } from './apiResponse.js';

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit options
interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  keyGenerator?: (req: any) => string; // Function to generate unique key
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  message?: string; // Custom error message
}

// Default rate limit options
const defaultOptions: RateLimitOptions = {
  windowMs: parseInt(env.AUTH_RATE_LIMIT_WINDOW),
  max: parseInt(env.AUTH_RATE_LIMIT_MAX),
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  message: 'Too many requests, please try again later.',
};

// Create rate limit middleware
export function createRateLimiter(options: RateLimitOptions = defaultOptions) {
  const mergedOptions = { ...defaultOptions, ...options };

  return function rateLimiter(req: any, res: any, next: any) {
    const key = mergedOptions.keyGenerator ? mergedOptions.keyGenerator(req) : req.ip;
    const now = Date.now();

    // Check if the key exists in the store
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 1, resetTime: now + mergedOptions.windowMs });
      return next();
    }

    const record = rateLimitStore.get(key)!;

    // If the window has expired, reset the count
    if (now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + mergedOptions.windowMs });
      return next();
    }

    // Increment the count
    record.count++;

    // If the count exceeds the maximum, send an error response
    if (record.count > mergedOptions.max) {
      const timeRemaining = Math.ceil((record.resetTime - now) / 1000);
      return res.status(429).json({
        success: false,
        message: mergedOptions.message,
        errors: [`Please wait ${timeRemaining} seconds before trying again.`],
      });
    }

    // Store the updated record
    rateLimitStore.set(key, record);

    // Add rate limit headers
    res.set('X-RateLimit-Limit', mergedOptions.max.toString());
    res.set('X-RateLimit-Remaining', (mergedOptions.max - record.count).toString());
    res.set('X-RateLimit-Reset', record.resetTime.toString());

    next();
  };
}

// Auth-specific rate limiter
export const authRateLimiter = createRateLimiter({
  windowMs: parseInt(env.AUTH_RATE_LIMIT_WINDOW),
  max: parseInt(env.AUTH_RATE_LIMIT_MAX),
  keyGenerator: (req: any) => {
    // Use IP address and user agent for more accurate rate limiting
    return `${req.ip}-${req.headers['user-agent']}`;
  },
  message: 'Too many authentication attempts, please try again later.',
});

// Password reset rate limiter
export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Maximum 3 password reset requests per 15 minutes
  keyGenerator: (req: any) => {
    return `password-reset-${req.body.email}`;
  },
  message: 'Too many password reset requests, please try again later.',
});

// Email verification rate limiter
export const emailVerificationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Maximum 5 email verification requests per hour
  keyGenerator: (req: any) => {
    return `email-verification-${req.body.email}`;
  },
  message: 'Too many email verification requests, please try again later.',
});

// General API rate limiter
export const apiRateLimiter = createRateLimiter({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
  max: parseInt(env.RATE_LIMIT_MAX_REQUESTS),
  keyGenerator: (req: any) => {
    return `api-${req.ip}`;
  },
  message: 'Too many API requests, please try again later.',
});

// Check if a key is rate limited
export function isRateLimited(key: string): boolean {
  const record = rateLimitStore.get(key);
  if (!record) return false;

  return record.count > defaultOptions.max && Date.now() < record.resetTime;
}

// Get remaining requests for a key
export function getRemainingRequests(key: string): number {
  const record = rateLimitStore.get(key);
  if (!record) return defaultOptions.max;

  if (Date.now() > record.resetTime) {
    return defaultOptions.max;
  }

  return Math.max(0, defaultOptions.max - record.count);
}

// Reset rate limit for a key
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// Clean up expired rate limit records
export function cleanupExpiredRecords(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup periodically (in production, use a cron job)
setInterval(cleanupExpiredRecords, 60 * 1000); // Every minute

// Create a rate limit checker function
export function createRateLimitChecker(options: RateLimitOptions = defaultOptions) {
  const mergedOptions = { ...defaultOptions, ...options };

  return async function checkRateLimit(key: string): Promise<ApiResponse> {
    const now = Date.now();

    // Check if the key exists in the store
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 1, resetTime: now + mergedOptions.windowMs });
      return {
        success: true,
        message: 'Rate limit check passed',
      };
    }

    const record = rateLimitStore.get(key)!;

    // If the window has expired, reset the count
    if (now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + mergedOptions.windowMs });
      return {
        success: true,
        message: 'Rate limit check passed',
      };
    }

    // Increment the count
    record.count++;

    // If the count exceeds the maximum, send an error response
    if (record.count > mergedOptions.max) {
      const timeRemaining = Math.ceil((record.resetTime - now) / 1000);
      return {
        success: false,
        message: mergedOptions.message,
        errors: [`Please wait ${timeRemaining} seconds before trying again.`],
      };
    }

    // Store the updated record
    rateLimitStore.set(key, record);

    return {
      success: true,
      message: 'Rate limit check passed',
      data: {
        remaining: mergedOptions.max - record.count,
        resetTime: record.resetTime,
      },
    };
  };
}
