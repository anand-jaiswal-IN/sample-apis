import { db } from './setup';
import { users, profiles, emailVerifications, passwordResets } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../src/utils/password.js';
import { generateVerificationToken, generatePasswordResetToken } from '../src/utils/email.js';
import { generateAccessToken, generateRefreshToken } from '../src/utils/jwt.js';

// Test user data
export const testUser = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
  bio: 'This is a test user',
};

// Test user with Google OAuth
export const testGoogleUser = {
  email: 'google.test@example.com',
  firstName: 'Google',
  lastName: 'User',
  googleId: 'google-test-id-12345',
};

// Create a test user in the database
export async function createTestUser(userData = testUser) {
  const hashedPassword = await hashPassword(userData.password);

  const [user] = await db
    .insert(users)
    .values({
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      emailVerified: true,
    })
    .returning();

  const [profile] = await db
    .insert(profiles)
    .values({
      userId: user.id,
      bio: userData.bio,
    })
    .returning();

  return { ...user, profile };
}

// Create a test Google user in the database
export async function createTestGoogleUser(userData = testGoogleUser) {
  const [user] = await db
    .insert(users)
    .values({
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      googleId: userData.googleId,
      emailVerified: true,
    })
    .returning();

  const [profile] = await db
    .insert(profiles)
    .values({
      userId: user.id,
    })
    .returning();

  return { ...user, profile };
}

// Delete a test user from the database
export async function deleteTestUser(userId: string) {
  await db.delete(profiles).where(eq(profiles.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}

// Create an email verification record
export async function createEmailVerification(userId: string) {
  const { token, expiresAt } = generateVerificationToken();

  const [verification] = await db
    .insert(emailVerifications)
    .values({
      userId,
      token,
      expiresAt,
    })
    .returning();

  return verification;
}

// Create a password reset record
export async function createPasswordReset(userId: string) {
  const { token, expiresAt } = generatePasswordResetToken();

  const [reset] = await db
    .insert(passwordResets)
    .values({
      userId,
      token,
      expiresAt,
    })
    .returning();

  return reset;
}

// Generate test tokens
export function generateTestTokens(userId: string) {
  const accessToken = generateAccessToken({ userId });
  const refreshToken = generateRefreshToken({ userId });

  return { accessToken, refreshToken };
}

// Mock request object
export function createMockRequest(body: any = {}, params: any = {}, query: any = {}) {
  return {
    body,
    params,
    query,
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'test-agent',
      'content-type': 'application/json',
    },
  };
}

// Mock response object
export function createMockResponse() {
  const res: any = {};

  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.set = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);

  return res;
}

// Mock next function
export function createMockNext() {
  return vi.fn();
}

// Generate random email
export function generateRandomEmail() {
  return `test.${Math.random().toString(36).substring(2, 15)}@example.com`;
}

// Generate random password
export function generateRandomPassword() {
  return `TestPassword${Math.floor(Math.random() * 10000)}!`;
}

// Generate random name
export function generateRandomName() {
  const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];

  return {
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
  };
}

// Generate random bio
export function generateRandomBio() {
  const bios = [
    'I love coding and technology.',
    'Passionate about creating amazing user experiences.',
    'Always learning new things.',
    'Coffee enthusiast and book lover.',
    'Traveling the world one country at a time.',
  ];

  return bios[Math.floor(Math.random() * bios.length)];
}

// Create a random test user
export async function createRandomTestUser() {
  const { firstName, lastName } = generateRandomName();
  const email = generateRandomEmail();
  const password = generateRandomPassword();
  const bio = generateRandomBio();

  return await createTestUser({
    email,
    password,
    firstName,
    lastName,
    bio,
  });
}

// Clean up test data
export async function cleanupTestData() {
  // Delete all test records
  await db.delete(emailVerifications);
  await db.delete(passwordResets);
  await db.delete(profiles);
  await db.delete(users);
}

// Wait for a specified amount of time
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Generate a random string
export function generateRandomString(length = 10) {
  return Math.random()
    .toString(36)
    .substring(2, length + 2);
}

// Generate a random number
export function generateRandomNumber(min = 1, max = 100) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a random boolean
export function generateRandomBoolean() {
  return Math.random() > 0.5;
}

// Generate a random date
export function generateRandomDate(start = new Date(2020, 0, 1), end = new Date()) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
