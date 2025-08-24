import { eq, isNull, or } from 'drizzle-orm';
import { db } from '../config/database.js';
import { users, profiles } from '../db/migrations/001_initial_schema.js';

// Soft delete a user
export async function softDeleteUser(userId: string) {
  return await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, userId));
}

// Restore a soft-deleted user
export async function restoreUser(userId: string) {
  return await db.update(users).set({ deletedAt: null }).where(eq(users.id, userId));
}

// Permanently delete a user (and their profile due to cascade)
export async function hardDeleteUser(userId: string) {
  return await db.delete(users).where(eq(users.id, userId));
}

// Get all non-deleted users
export async function getNonDeletedUsers() {
  return await db.select().from(users).where(isNull(users.deletedAt));
}

// Get a user by ID, excluding soft-deleted users
export async function getUserById(userId: string) {
  return await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .where(isNull(users.deletedAt))
    .limit(1);
}

// Get a user by email, excluding soft-deleted users
export async function getUserByEmail(email: string) {
  return await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .where(isNull(users.deletedAt))
    .limit(1);
}

// Get a user by Google ID, excluding soft-deleted users
export async function getUserByGoogleId(googleId: string) {
  return await db
    .select()
    .from(users)
    .where(eq(users.googleId, googleId))
    .where(isNull(users.deletedAt))
    .limit(1);
}

// Get a user's profile by user ID
export async function getProfileByUserId(userId: string) {
  return await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
}

// Create a new user
export async function createUser(userData: typeof users.$inferInsert) {
  return await db.insert(users).values(userData).returning();
}

// Update a user
export async function updateUser(userId: string, userData: Partial<typeof users.$inferInsert>) {
  return await db
    .update(users)
    .set({ ...userData, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
}

// Create a new profile
export async function createProfile(profileData: typeof profiles.$inferInsert) {
  return await db.insert(profiles).values(profileData).returning();
}

// Update a profile
export async function updateProfile(
  profileId: string,
  profileData: Partial<typeof profiles.$inferInsert>
) {
  return await db
    .update(profiles)
    .set({ ...profileData, updatedAt: new Date() })
    .where(eq(profiles.id, profileId))
    .returning();
}

// Check if a user exists by email (excluding soft-deleted users)
export async function userExistsByEmail(email: string): Promise<boolean> {
  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .where(isNull(users.deletedAt))
    .limit(1);

  return result.length > 0;
}

// Check if a Google user exists by Google ID (excluding soft-deleted users)
export async function googleUserExists(googleId: string): Promise<boolean> {
  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.googleId, googleId))
    .where(isNull(users.deletedAt))
    .limit(1);

  return result.length > 0;
}
